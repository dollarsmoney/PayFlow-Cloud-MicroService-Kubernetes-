package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/payflow/payment-service/internal/domain/entities"
)

type PaymentRequest struct {
	UserID   string  `json:"userId" binding:"required"`
	Amount   float64 `json:"amount" binding:"required"`
	Currency string  `json:"currency" binding:"required"`
}

func ProcessPayment(c *gin.Context) {
	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Mocking payment processing
	payment := entities.Payment{
		ID:       uuid.New().String(),
		UserID:   req.UserID,
		Amount:   req.Amount,
		Currency: req.Currency,
		Status:   "PROCESSING", // Would be async
	}

	// TODO: Publish to Kafka, Store in DB, Call external gateway

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Payment processing started",
		"payment": payment,
	})
}

func GetPaymentStatus(c *gin.Context) {
	id := c.Param("id")
	// Mock DB lookup
	c.JSON(http.StatusOK, gin.H{
		"id":     id,
		"status": "COMPLETED",
	})
}
