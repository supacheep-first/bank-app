// Stress test: raise the request rate step by step until the service breaks.
// Two scenarios, one after the other:
//   login  profile + PIN per iteration (bcrypt bound)
//   main   the 5 main page endpoints in parallel per iteration, like a browser
// Run: docker compose run --rm k6
// The table at the end (also results/summary.txt) shows each step;
// results/report.html has the graphs.
import http from 'k6/http';
import exec from 'k6/execution';
import { SharedArray } from 'k6/data';

const BASE = 'http://frontend';
const STEP_SECONDS = 30;
const P95_MS = 500;
const MAX_ERROR_RATE = 0.01;
// share of the target rate that must complete: a full service makes k6 drop the rest
const MIN_DONE = 0.95;
const PIN = '135795';

// Iterations per second for each step, ending one step past the first failure.
const PLAN = {
  login: [20, 40, 60, 80, 100, 120],
  main: [50, 100, 200, 400, 800, 1600, 2400, 3200, 4000],
};

const MAIN_PATHS = ['/api/user', '/api/accounts', '/api/transactions/recent', '/api/debit-cards', '/api/banners'];
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

const users = new SharedArray('users', () => open('./users.txt').trim().split('\n'));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Jump to each rate in 1 s, then hold it for the rest of the step.
const steps = (rates) => rates.flatMap((r) => [
  { target: r, duration: '1s' },
  { target: r, duration: `${STEP_SECONDS - 1}s` },
]);

const scenario = (name, startTime) => ({
  executor: 'ramping-arrival-rate',
  exec: name,
  startTime,
  startRate: PLAN[name][0],
  timeUnit: '1s',
  // Far more than any passing step needs. A broken step stops at the cap and
  // k6 reports the iterations it could not start.
  preAllocatedVUs: 50,
  maxVUs: 300,
  stages: steps(PLAN[name]),
  gracefulStop: '10s',
});

// Thresholds that always pass: they only make k6 keep per-step numbers for
// handleSummary. Pass/fail per step is decided there, so a broken step (the
// point of a stress test) does not turn into a failed exit code.
const perStep = Object.entries(PLAN).flatMap(([s, rates]) => [
  [`dropped_iterations{scenario:${s}}`, ['count>=0']],
  ...rates.flatMap((r) => [
    [`http_req_duration{scenario:${s},step:${r}}`, ['max>=0']],
    [`http_req_failed{scenario:${s},step:${r}}`, ['rate>=0']],
    [`iterations{scenario:${s},step:${r}}`, ['count>=0']],
  ]),
]);

export const options = {
  scenarios: {
    login: scenario('login', '0s'),
    // gracefulStop + 10 s for in-flight requests to drain before main starts.
    main: scenario('main', `${PLAN.login.length * STEP_SECONDS + 20}s`),
  },
  thresholds: Object.fromEntries(perStep),
  summaryTrendStats: ['med', 'p(95)', 'max'],
  setupTimeout: '120s',
};

// One session per user for the main scenario. 1,000 bcrypt checks, ~15 s.
export function setup() {
  const res = http.batch(users.map((id) => ['POST', `${BASE}/api/auth/pin`, JSON.stringify({ userId: id, pin: PIN }), JSON_HEADERS]));
  const sessions = res.filter((r) => r.status === 204).map((r) => r.cookies.session[0].value);
  if (sessions.length === 0) exec.test.abort('setup: no user could log in (stack up?)');
  return { sessions };
}

// Tag everything this iteration records with the rate of the current step.
function tagStep(name) {
  const rates = PLAN[name];
  const i = Math.floor((Date.now() - exec.scenario.startTime) / (STEP_SECONDS * 1000));
  exec.vu.metrics.tags.step = String(rates[Math.min(i, rates.length - 1)]);
}

export function login() {
  tagStep('login');
  const id = pick(users);
  http.get(`${BASE}/api/auth/profile?userId=${id}`);
  http.post(`${BASE}/api/auth/pin`, JSON.stringify({ userId: id, pin: PIN }), JSON_HEADERS);
}

export function main(data) {
  tagStep('main');
  const params = { headers: { Cookie: `session=${pick(data.sessions)}` } };
  http.batch(MAIN_PATHS.map((p) => ['GET', BASE + p, null, params]));
}

export function handleSummary(data) {
  const value = (metric, stat) => data.metrics[metric]?.values[stat];
  let out = `\nStress test - pass: p95 < ${P95_MS} ms, errors < ${MAX_ERROR_RATE * 100}% and done >= ${MIN_DONE * 100}% of target\n`;
  for (const [name, rates] of Object.entries(PLAN)) {
    out += `\n${name}\n  target/s   done/s   req/s   p95 ms    errors  result\n`;
    let lastPass = null;
    let broken = false;
    for (const r of rates) {
      const tag = `{scenario:${name},step:${r}}`;
      const done = (value(`iterations${tag}`, 'count') ?? 0) / STEP_SECONDS;
      const reqs = (value(`http_req_failed${tag}`, 'passes') ?? 0) + (value(`http_req_failed${tag}`, 'fails') ?? 0);
      const p95 = value(`http_req_duration${tag}`, 'p(95)') ?? NaN;
      const err = value(`http_req_failed${tag}`, 'rate') ?? NaN;
      const pass = p95 < P95_MS && err < MAX_ERROR_RATE && done >= r * MIN_DONE;
      if (!pass) broken = true;
      if (pass && !broken) lastPass = r;
      out += `  ${String(r).padStart(8)} ${done.toFixed(1).padStart(8)} ${(reqs / STEP_SECONDS).toFixed(0).padStart(7)} ${p95.toFixed(1).padStart(8)} ${(err * 100).toFixed(2).padStart(8)}%  ${pass ? 'pass' : 'FAIL'}\n`;
    }
    const dropped = value(`dropped_iterations{scenario:${name}}`, 'count') ?? 0;
    out += `  highest passing step: ${lastPass ?? 'none'}/s - iterations k6 could not start (no free VU): ${dropped}\n`;
  }
  return { stdout: out, 'results/summary.txt': out };
}
