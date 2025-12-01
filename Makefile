.PHONY: help install install-be install-fe start start-be start-fe stop stop-be stop-fe restart restart-be restart-fe test test-be test-fe clean build build-fe migrate migrate-up migrate-down dev dev-be dev-fe

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Directories
BE_DIR := snake-game-be
FE_DIR := snake-game-fe
VENV_DIR := $(BE_DIR)/venv
VENV_BIN := $(VENV_DIR)/bin

# Ports
BE_PORT := 8000
FE_PORT := 5173

# Python and Node executables
PYTHON := python3
NODE := node
NPM := npm

help: ## Show this help message
	@echo "$(CYAN)Snake Game - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Installation:$(NC)"
	@echo "  make install      - Install dependencies for both frontend and backend"
	@echo "  make install-be   - Install backend dependencies (Python virtual environment)"
	@echo "  make install-fe   - Install frontend dependencies (npm packages)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev          - Start both frontend and backend servers"
	@echo "  make dev-be       - Start backend server only"
	@echo "  make dev-fe       - Start frontend server only"
	@echo ""
	@echo "$(GREEN)Server Management:$(NC)"
	@echo "  make start        - Start both servers (alias for dev)"
	@echo "  make start-be     - Start backend server"
	@echo "  make start-fe     - Start frontend server"
	@echo "  make stop         - Stop both servers"
	@echo "  make stop-be      - Stop backend server"
	@echo "  make stop-fe      - Stop frontend server"
	@echo "  make restart      - Restart both servers"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test         - Run tests for both frontend and backend"
	@echo "  make test-be      - Run backend tests"
	@echo "  make test-fe      - Run frontend tests"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make migrate      - Run database migrations (upgrade to head)"
	@echo "  make migrate-up   - Upgrade database to head"
	@echo "  make migrate-down - Downgrade database by one revision"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build        - Build frontend for production"
	@echo "  make clean        - Clean build artifacts and cache"

# Installation targets
install: install-be install-fe ## Install all dependencies

install-be: ## Install backend dependencies
	@echo "$(CYAN)Installing backend dependencies...$(NC)"
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "$(YELLOW)Creating virtual environment...$(NC)"; \
		cd $(BE_DIR) && $(PYTHON) -m venv venv; \
	fi
	@echo "$(YELLOW)Installing Python packages...$(NC)"
	@cd $(BE_DIR) && venv/bin/pip install --upgrade pip
	@cd $(BE_DIR) && venv/bin/pip install -r requirements.txt
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-fe: ## Install frontend dependencies
	@echo "$(CYAN)Installing frontend dependencies...$(NC)"
	@cd $(FE_DIR) && $(NPM) install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

# Development server targets
dev: start ## Start both servers (alias)

start: start-be start-fe ## Start both servers

start-be: ## Start backend server
	@echo "$(CYAN)Starting backend server on port $(BE_PORT)...$(NC)"
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "$(RED)Error: Virtual environment not found. Run 'make install-be' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(BE_DIR) && venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port $(BE_PORT) &

start-fe: ## Start frontend server
	@echo "$(CYAN)Starting frontend server on port $(FE_PORT)...$(NC)"
	@if [ ! -d "$(FE_DIR)/node_modules" ]; then \
		echo "$(RED)Error: Node modules not found. Run 'make install-fe' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(FE_DIR) && $(NPM) run dev &

dev-be: start-be ## Start backend server only

dev-fe: start-fe ## Start frontend server only

# Stop server targets
stop: stop-be stop-fe ## Stop both servers

stop-be: ## Stop backend server
	@echo "$(YELLOW)Stopping backend server...$(NC)"
	@-pkill -f "uvicorn app.main:app" || true
	@echo "$(GREEN)✓ Backend server stopped$(NC)"

stop-fe: ## Stop frontend server
	@echo "$(YELLOW)Stopping frontend server...$(NC)"
	@-pkill -f "vite" || true
	@echo "$(GREEN)✓ Frontend server stopped$(NC)"

# Restart targets
restart: stop start ## Restart both servers

restart-be: stop-be start-be ## Restart backend server

restart-fe: stop-fe start-fe ## Restart frontend server

# Testing targets
test: test-be test-fe ## Run all tests

test-be: ## Run backend tests
	@echo "$(CYAN)Running backend tests...$(NC)"
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "$(RED)Error: Virtual environment not found. Run 'make install-be' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(BE_DIR) && venv/bin/pytest

test-fe: ## Run frontend tests
	@echo "$(CYAN)Running frontend tests...$(NC)"
	@if [ ! -d "$(FE_DIR)/node_modules" ]; then \
		echo "$(RED)Error: Node modules not found. Run 'make install-fe' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(FE_DIR) && $(NPM) test -- --run

# Database migration targets
migrate: migrate-up ## Run database migrations

migrate-up: ## Upgrade database to head
	@echo "$(CYAN)Running database migrations...$(NC)"
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "$(RED)Error: Virtual environment not found. Run 'make install-be' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(BE_DIR) && venv/bin/alembic upgrade head
	@echo "$(GREEN)✓ Database migrations applied$(NC)"

migrate-down: ## Downgrade database by one revision
	@echo "$(YELLOW)Downgrading database...$(NC)"
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "$(RED)Error: Virtual environment not found. Run 'make install-be' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(BE_DIR) && venv/bin/alembic downgrade -1
	@echo "$(GREEN)✓ Database downgraded$(NC)"

# Build targets
build: build-fe ## Build for production

build-fe: ## Build frontend for production
	@echo "$(CYAN)Building frontend for production...$(NC)"
	@if [ ! -d "$(FE_DIR)/node_modules" ]; then \
		echo "$(RED)Error: Node modules not found. Run 'make install-fe' first.$(NC)"; \
		exit 1; \
	fi
	@cd $(FE_DIR) && $(NPM) run build
	@echo "$(GREEN)✓ Frontend build complete$(NC)"

# Clean targets
clean: ## Clean build artifacts and cache
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf $(FE_DIR)/dist
	@rm -rf $(FE_DIR)/node_modules/.vite
	@rm -rf $(BE_DIR)/__pycache__
	@rm -rf $(BE_DIR)/**/__pycache__
	@find $(BE_DIR) -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find $(BE_DIR) -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Clean complete$(NC)"
