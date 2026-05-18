package entities

import "time"

type Payment struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Amount    float64   `json:"amount"`
	Currency  string    `json:"currency"`
	Status    string    `json:"status"` // PENDING, PROCESSING, COMPLETED, FAILED
	CreatedAt time.Time `json:"createdAt"`
}
