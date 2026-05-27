package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	infradb "github.com/payflow/payment-service/internal/infrastructure/db"
	"github.com/payflow/payment-service/internal/application/usecase"
)

type PaymentRequest struct {
	UserID   string  `json:"userId"   binding:"required"`
	Amount   float64 `json:"amount"   binding:"required,gt=0"`
	Currency string  `json:"currency" binding:"required"`
}

func ProcessPayment(c *gin.Context) {
	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := usecase.ProcessPayment(usecase.ProcessPaymentInput{
		UserID:   req.UserID,
		Amount:   req.Amount,
		Currency: req.Currency,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	statusCode := http.StatusAccepted
	if result.Payment.Status == "FAILED" {
		statusCode = http.StatusPaymentRequired
	}

	c.JSON(statusCode, gin.H{
		"message": "Payment processed",
		"payment": result.Payment,
	})
}

func GetPaymentStatus(c *gin.Context) {
	id := c.Param("id")
	payment, err := infradb.GetPaymentByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func GetUserPayments(c *gin.Context) {
	userID := c.Param("userId")
	page, _  := strconv.Atoi(c.DefaultQuery("page",  "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	payments, total, err := infradb.GetPaymentsByUserID(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"payments": payments,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}
