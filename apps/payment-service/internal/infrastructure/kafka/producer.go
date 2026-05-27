package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

// singleton writer (producer)
var writer *kafka.Writer

func GetProducer() *kafka.Writer {
	if writer == nil {
		brokers := os.Getenv("KAFKA_BROKERS")
		if brokers == "" {
			brokers = "localhost:9092"
		}

		writer = &kafka.Writer{
			Addr:                   kafka.TCP(strings.Split(brokers, ",")...),
			AllowAutoTopicCreation: true,
			Balancer:               &kafka.LeastBytes{},
			WriteTimeout:           10 * time.Second,
			ReadTimeout:            10 * time.Second,
		}
		log.Println("[Kafka] Producer ready")
	}
	return writer
}

// ── Event payloads ───────────────────────────────────────────

type PaymentCompletedEvent struct {
	PaymentID  string  `json:"paymentId"`
	UserID     string  `json:"userId"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	GatewayRef string  `json:"gatewayRef,omitempty"`
	Timestamp  string  `json:"timestamp"`
}

type PaymentFailedEvent struct {
	PaymentID string  `json:"paymentId"`
	UserID    string  `json:"userId"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Reason    string  `json:"reason"`
	Timestamp string  `json:"timestamp"`
}

// ── Public helpers ───────────────────────────────────────────

func PublishPaymentCompleted(paymentID, userID, currency, gatewayRef string, amount float64) error {
	event := PaymentCompletedEvent{
		PaymentID:  paymentID,
		UserID:     userID,
		Amount:     amount,
		Currency:   currency,
		GatewayRef: gatewayRef,
		Timestamp:  time.Now().Format(time.RFC3339),
	}
	return publish("payment.completed", paymentID, event)
}

func PublishPaymentFailed(paymentID, userID, currency, reason string, amount float64) error {
	event := PaymentFailedEvent{
		PaymentID: paymentID,
		UserID:    userID,
		Amount:    amount,
		Currency:  currency,
		Reason:    reason,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	return publish("payment.failed", paymentID, event)
}

func publish(topic, key string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = GetProducer().WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: data,
	})
	if err != nil {
		return fmt.Errorf("kafka write [%s]: %w", topic, err)
	}

	log.Printf("[Kafka] Published to %s key=%s", topic, key)
	return nil
}

func Close() {
	if writer != nil {
		writer.Close()
	}
}
