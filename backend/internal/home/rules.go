package home

import (
	"encoding/json"
	"slices"
)

// account is the /api/accounts element. A nil pointer or empty slice is left
// out of the JSON.
type account struct {
	Type     *string      `json:"type,omitempty"`
	Amount   *json.Number `json:"amount,omitempty"`
	Currency *string      `json:"currency,omitempty"`
	Number   *string      `json:"accountNumber,omitempty"`
	Issuer   *string      `json:"issuer,omitempty"`
	Name     *string      `json:"name,omitempty"`
	Flags    []string     `json:"flags,omitempty"`
	Progress *int         `json:"progress,omitempty"`
	Color    *string      `json:"color,omitempty"`
	Main     *bool        `json:"isMainAccount,omitempty"` // *bool: false must still be sent
}

// visibleFlags keeps Disbursement and Overdue, credit-loan only. Every other
// flag_value (Flag3/4/5) is internal and never leaves Go.
func visibleFlags(accountType string, flags []string) []string {
	if accountType != "credit-loan" {
		return nil
	}
	return slices.DeleteFunc(flags, func(f string) bool { return f != "Disbursement" && f != "Overdue" })
}

// toAccount applies the data rules: flags only on credit-loan, progress only on
// goal-saving-account (the mock has values on saving accounts too, meaningless there).
func toAccount(r accountRow) account {
	a := account{Type: r.Type, Amount: r.Amount, Currency: r.Currency, Number: r.Number,
		Issuer: r.Issuer, Name: r.Name, Color: r.Color, Main: r.Main}
	if r.Type != nil {
		a.Flags = visibleFlags(*r.Type, r.Flags)
		if *r.Type == "goal-saving-account" {
			a.Progress = r.Progress
		}
	}
	return a
}
