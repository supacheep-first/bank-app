package home

import (
	"encoding/json"
	"slices"
	"testing"
)

func TestVisibleFlags(t *testing.T) {
	for _, c := range []struct {
		name, typ string
		in, want  []string
	}{
		{"credit-loan keeps both in order", "credit-loan", []string{"Disbursement", "Overdue"}, []string{"Disbursement", "Overdue"}},
		{"credit-loan drops internal", "credit-loan", []string{"Flag3", "Overdue", "Flag4", "Flag5", "Disbursement"}, []string{"Overdue", "Disbursement"}},
		{"credit-loan only internal", "credit-loan", []string{"Flag4", "Flag5"}, nil},
		{"credit-loan none", "credit-loan", nil, nil},
		{"saving never", "saving-account", []string{"Disbursement", "Overdue"}, nil},
		{"goal never", "goal-saving-account", []string{"Overdue"}, nil},
	} {
		if got := visibleFlags(c.typ, c.in); !slices.Equal(got, c.want) {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

func TestToAccount(t *testing.T) {
	s := func(v string) *string { return &v }
	n := func(v string) *json.Number { x := json.Number(v); return &x }
	i := func(v int) *int { return &v }
	b := func(v bool) *bool { return &v }

	for _, c := range []struct {
		name string
		in   accountRow
		want string // the JSON that reaches the client
	}{
		{"saving: progress and flags dropped, false is sent",
			accountRow{Type: s("saving-account"), Amount: n("8837999.00"), Currency: s("THB"), Number: s("568-2-81741-7"),
				Issuer: s("TestLab"), Color: s("#15bbc7"), Main: b(false), Progress: i(42), Flags: []string{"Flag4", "Flag5"}},
			`{"type":"saving-account","amount":8837999.00,"currency":"THB","accountNumber":"568-2-81741-7","issuer":"TestLab","color":"#15bbc7","isMainAccount":false}`},
		{"goal: progress and name",
			accountRow{Type: s("goal-saving-account"), Amount: n("30000.00"), Name: s("Travel New York"), Progress: i(24), Main: b(false)},
			`{"type":"goal-saving-account","amount":30000.00,"name":"Travel New York","progress":24,"isMainAccount":false}`},
		{"credit-loan: public flags only",
			accountRow{Type: s("credit-loan"), Amount: n("300.10"), Flags: []string{"Flag3", "Disbursement", "Overdue"}, Progress: i(8)},
			`{"type":"credit-loan","amount":300.10,"flags":["Disbursement","Overdue"]}`},
		{"credit-loan: internal flags only means no flags key",
			accountRow{Type: s("credit-loan"), Flags: []string{"Flag5"}},
			`{"type":"credit-loan"}`},
		{"NULL type: nothing derived from it", accountRow{Flags: []string{"Overdue"}, Progress: i(24)}, `{}`},
	} {
		got, err := json.Marshal(toAccount(c.in))
		if err != nil || string(got) != c.want {
			t.Errorf("%s:\n got  %s (%v)\n want %s", c.name, got, err, c.want)
		}
	}
}
