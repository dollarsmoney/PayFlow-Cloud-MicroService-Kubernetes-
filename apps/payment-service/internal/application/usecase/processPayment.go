package usecase

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/payflow/payment-service/internal/domain/entities"
	infradb "github.com/payflow/payment-service/internal/infrastructure/db"
	"github.com/payflow/payment-service/internal/infrastructure/kafka"
)

type ProcessPaymentInput struct {
	UserID   string
	Amount   float64
	Currency string
}

type ProcessPaymentOutput struct {
	Payment *entities.Payment
}

func ProcessPayment(input ProcessPaymentInput) (*ProcessPaymentOutput, error) {
	payment := &entities.Payment{
		ID:        uuid.New().String(),
		UserID:    input.UserID,
		Amount:    input.Amount,
		Currency:  input.Currency,
		Status:    "PENDING",
		CreatedAt: time.Now(),
	}

	// 1. Persist as PENDING
	if err := infradb.CreatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to save payment: %w", err)
	}

	// 2. Update to PROCESSING
	infradb.UpdatePaymentStatus(payment.ID, "PROCESSING", "", "")

	// 3. Call mock gateway (simulates 95% success rate)
	gatewayRef, gatewayErr := callMockGateway(payment)

	if gatewayErr != nil {
		// 4a. Gateway failure
		reason := gatewayErr.Error()
		infradb.UpdatePaymentStatus(payment.ID, "FAILED", "", reason)
		payment.Status = "FAILED"

		if err := kafka.PublishPaymentFailed(payment.ID, payment.UserID, payment.Currency, reason, payment.Amount); err != nil {
			log.Printf("[ProcessPayment] Failed to publish payment.failed: %v", err)
		}
		return &ProcessPaymentOutput{Payment: payment}, nil
	}

	// 4b. Gateway success
	infradb.UpdatePaymentStatus(payment.ID, "COMPLETED", gatewayRef, "")
	payment.Status = "COMPLETED"

	if err := kafka.PublishPaymentCompleted(payment.ID, payment.UserID, payment.Currency, gatewayRef, payment.Amount); err != nil {
		log.Printf("[ProcessPayment] Failed to publish payment.completed: %v", err)
	}

	return &ProcessPaymentOutput{Payment: payment}, nil
}

// callMockGateway simulates an external payment gateway with 95% success rate
func callMockGateway(p *entities.Payment) (string, error) {
	// Simulate network latency
	time.Sleep(time.Duration(50+rand.Intn(100)) * time.Millisecond)

	// 5% failure rate
	if rand.Float64() < 0.05 {
		return "", fmt.Errorf("gateway_declined: insufficient_funds")
	}

	gatewayRef := fmt.Sprintf("GW-%s-%d", p.ID[:8], time.Now().Unix())
	return gatewayRef, nil
}
