.PHONY: dev build test up down

up:
	docker-compose up -d

down:
	docker-compose down

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test
