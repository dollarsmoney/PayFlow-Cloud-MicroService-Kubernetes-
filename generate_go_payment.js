const fs = require('fs');
const path = require('path');

const write = (relPath, content) => {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('apps/payment-service/go.mod', `
module github.com/payflow/payment-service

go 1.21

require (
	github.com/confluentinc/confluent-kafka-go v1.9.2
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.3.1
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9
)
`);

write('apps/payment-service/cmd/api/main.go', `
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/payflow/payment-service/internal/interfaces/http"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	router := gin.Default()

	// Setup routes
	api := router.Group("/api/v1/payments")
	{
		api.POST("/process", http.ProcessPayment)
		api.GET("/:id/status", http.GetPaymentStatus)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Payment Service running on port %s", port)
	router.Run(":" + port)
}
`);

write('apps/payment-service/internal/domain/entities/payment.go', `
package entities

import "time"

type Payment struct {
	ID        string    \`json:"id"\`
	UserID    string    \`json:"userId"\`
	Amount    float64   \`json:"amount"\`
	Currency  string    \`json:"currency"\`
	Status    string    \`json:"status"\` // PENDING, PROCESSING, COMPLETED, FAILED
	CreatedAt time.Time \`json:"createdAt"\`
}
`);

write('apps/payment-service/internal/interfaces/http/handlers.go', `
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/payflow/payment-service/internal/domain/entities"
)

type PaymentRequest struct {
	UserID   string  \`json:"userId" binding:"required"\`
	Amount   float64 \`json:"amount" binding:"required"\`
	Currency string  \`json:"currency" binding:"required"\`
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
`);

write('apps/payment-service/Dockerfile', `
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o payment-api ./cmd/api

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/payment-api .
EXPOSE 8080
CMD ["./payment-api"]
`);

console.log('Go payment service generated.');
