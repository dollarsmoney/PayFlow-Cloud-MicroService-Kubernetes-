package db

import (
	"fmt"
	"time"

	"github.com/payflow/payment-service/internal/domain/entities"
)

func CreatePayment(p *entities.Payment) error {
	_, err := DB.Exec(`
		INSERT INTO payments (id, user_id, amount, currency, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $6)`,
		p.ID, p.UserID, p.Amount, p.Currency, p.Status, p.CreatedAt,
	)
	return err
}

func UpdatePaymentStatus(id, status, gatewayRef, failReason string) error {
	_, err := DB.Exec(`
		UPDATE payments
		SET status = $1, gateway_ref = $2, fail_reason = $3, updated_at = $4
		WHERE id = $5`,
		status, gatewayRef, failReason, time.Now(), id,
	)
	return err
}

func GetPaymentByID(id string) (*entities.Payment, error) {
	row := DB.QueryRow(`
		SELECT id, user_id, amount, currency, status, created_at
		FROM payments WHERE id = $1`, id)

	p := &entities.Payment{}
	err := row.Scan(&p.ID, &p.UserID, &p.Amount, &p.Currency, &p.Status, &p.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}
	return p, nil
}

func GetPaymentsByUserID(userID string, page, limit int) ([]*entities.Payment, int, error) {
	offset := (page - 1) * limit
	rows, err := DB.Query(`
		SELECT id, user_id, amount, currency, status, created_at
		FROM payments WHERE user_id = $1
		ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var payments []*entities.Payment
	for rows.Next() {
		p := &entities.Payment{}
		if err := rows.Scan(&p.ID, &p.UserID, &p.Amount, &p.Currency, &p.Status, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		payments = append(payments, p)
	}

	var total int
	DB.QueryRow(`SELECT COUNT(*) FROM payments WHERE user_id = $1`, userID).Scan(&total)

	return payments, total, nil
}
