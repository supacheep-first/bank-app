#!/usr/bin/env bash
# Latency of the 5 home endpoints as clare, one request at a time, plus the
# EXPLAIN rows of scripts/explain.sql. Measures whatever state the DB is in;
# changes nothing. Needs the stack up (docker compose up -d --wait).
# bash, curl, sort, awk only (+ docker compose, mktemp, dirname).
set -euo pipefail
export LC_ALL=C
cd "$(dirname "$0")/.."

BASE=http://localhost:8080
WARMUP=3
RUNS=20
JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT

code=$(curl -s -c "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/auth/pin" \
  -H 'Content-Type: application/json' -d '{"userId":"clare","pin":"135795"}') || true
[ "$code" = 204 ] || { echo "login failed: HTTP $code (stack up? PIN locked?)" >&2; exit 1; }

# One GET with the session cookie. Prints time_total in seconds; a non-200
# answer (timeout, 401) stops the run instead of becoming a number.
hit() {
  local c t
  read -r c t < <(curl -s -b "$JAR" -o /dev/null -w '%{http_code} %{time_total}\n' "$BASE$1")
  [ "$c" = 200 ] || { echo "$1: HTTP $c after ${t}s - no number to report" >&2; exit 1; }
  echo "$t"
}

# stdin: seconds, one per line -> "median p95" in ms. Median = mean of the
# middle pair when n is even. p95 = nearest rank, ceil(0.95 * n)th smallest
# (19th of 20).
stats() {
  sort -n | awk '{ a[NR] = $1 * 1000 }
    END { m = (NR % 2) ? a[(NR + 1) / 2] : (a[NR / 2] + a[NR / 2 + 1]) / 2
          printf "%.1f %.1f", m, a[int((95 * NR + 99) / 100)] }'
}

# rows <table>: the `rows` column (10th) of the EXPLAIN line for that table.
rows() { awk -F'\t' -v t="$1" '$3 == t { print $10 }' <<<"$EXPLAIN"; }

stat_of=""
for path in /api/user /api/accounts /api/transactions/recent /api/debit-cards /api/banners; do
  echo "$path ..." >&2
  for ((i = 0; i < WARMUP; i++)); do hit "$path" >/dev/null; done
  samples=""
  for ((i = 0; i < RUNS; i++)); do samples="$samples$(hit "$path")"$'\n'; done
  stat_of="$stat_of$path $(printf '%s' "$samples" | stats)"$'\n'
done

EXPLAIN=$(docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -N -u"$MYSQL_USER"' < scripts/explain.sql)

printf '%-26s %-20s %10s %10s\n' endpoint rows median_ms p95_ms
printf '%s' "$stat_of" | while read -r path median p95; do
  case $path in
    /api/user)                r=$(rows users) ;;
    /api/accounts)            r="$(rows accounts) / $(rows account_flags)" ;;
    /api/transactions/recent) r=$(rows transactions) ;;
    /api/debit-cards)         r=$(rows debit_cards) ;;
    /api/banners)             r=$(rows banners) ;;
  esac
  printf '%-26s %-20s %10s %10s\n' "$path" "$r" "$median" "$p95"
done
echo "rows = EXPLAIN estimate for the WHERE (/api/accounts: accounts / account_flags, the flags lookup runs once per account); $RUNS runs after $WARMUP warm-up, sequential"
