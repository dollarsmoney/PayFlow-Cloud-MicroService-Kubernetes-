FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o payment-api ./cmd/api

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/payment-api .
EXPOSE 8080
CMD ["./payment-api"]
