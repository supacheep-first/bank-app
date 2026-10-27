package home

import (
	"encoding/json"
	"slices"
	"strings"
	"unicode"
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

// debitCard is the /api/debit-cards element. A nil pointer is left out of the
// JSON. Number is already masked: debitCardRow, which holds the full number,
// is never serialised.
type debitCard struct {
	Name        *string `json:"name,omitempty"`
	Status      *string `json:"status,omitempty"`
	Issuer      *string `json:"issuer,omitempty"`
	Color       *string `json:"color,omitempty"`
	BorderColor *string `json:"borderColor,omitempty"`
	Number      *string `json:"number,omitempty"`
}

// maskCardNumber replaces digits with • (U+2022) and keeps every other
// character where it is. More than 10 digits: the first 6 and last 4 stay.
// 10 or fewer: only the last 4 stay (6+4 would hide nothing).
func maskCardNumber(s string) string {
	total := 0
	for _, r := range s {
		if unicode.IsDigit(r) {
			total++
		}
	}
	head := 6
	if total <= 10 {
		head = 0
	}
	n := 0 // digits seen so far
	return strings.Map(func(r rune) rune {
		if !unicode.IsDigit(r) {
			return r
		}
		n++
		if n > head && n <= total-4 {
			return '•'
		}
		return r
	}, s)
}

// toDebitCard is the only way a card number leaves Go: masked, NULL stays nil.
func toDebitCard(r debitCardRow) debitCard {
	c := debitCard{Name: r.Name, Status: r.Status, Issuer: r.Issuer, Color: r.Color, BorderColor: r.BorderColor}
	if r.Number != nil {
		m := maskCardNumber(*r.Number)
		c.Number = &m
	}
	return c
}
