PYTHON := python3
VENV_DIR := env
VENV_PY := $(VENV_DIR)/bin/python
TEST_NAMES = 0_0_cluster 0_0_scatter 0_0_lines 0_0_expwilds 0_0_ways
FRONTEND_DIR := frontend

ifeq ($(OS),Windows_NT)
	VENV_PY := $(VENV_DIR)\Scripts\python.exe
	ACTIVATE := $(VENV_DIR)\Scripts\activate.bat
	NPM := npm.cmd
else
	ACTIVATE := source $(VENV_DIR)/bin/activate
	NPM := npm
endif

makeVirtual:
	$(PYTHON) -m venv $(VENV_DIR)

pipInstall: makeVirtual
	$(VENV_PY) -m pip install --upgrade pip

pipPackages: pipInstall
	$(VENV_PY) -m pip install -r requirements.txt

packInstall: pipPackages
	$(VENV_PY) -m pip install -e .

# Frontend setup commands
frontend-install:
	cd $(FRONTEND_DIR) && $(NPM) install

frontend-build: frontend-install
	cd $(FRONTEND_DIR) && $(NPM) run build

frontend-dev: frontend-install
	cd $(FRONTEND_DIR) && $(NPM) run dev

frontend-test: frontend-install
	cd $(FRONTEND_DIR) && $(NPM) test

# Combined setup for both workspaces
setup: packInstall frontend-install
	@echo "Virtual environment and frontend dependencies ready."
	@echo "To activate Python environment, run:"
	@echo "$(ACTIVATE)"
	@echo "To start frontend development server, run:"
	@echo "make frontend-dev"

# Full workspace build
build: setup frontend-build
	@echo "Full workspace build complete."


run GAME:
	$(VENV_PY) games/$(GAME)/run.py
	@echo "Checking compression setting..."
	@if grep -q "compression = False" games/$(GAME)/run.py; then \
		echo "Compression is disabled, formatting books files..."; \
		$(VENV_PY) utils/format_books_json.py games/$(GAME) || echo "Warning: Failed to format books files"; \
	else \
		echo "Compression is enabled, skipping formatting."; \
	fi
	@echo "Generating frontend integration files..."
	@$(VENV_PY) -c "from src.write_data.write_frontend_integration import write_frontend_integration; from games.$(GAME).game_config import GameConfig; write_frontend_integration('games/$(GAME)', GameConfig())" || echo "Warning: Failed to generate frontend integration files"

test:
	cd $(CURDIR)
	pytest tests/

# Combined test for both workspaces  
test-all: test frontend-test
	@echo "All tests completed."

test_run:
	@for f in $(TEST_NAMES); do \
		echo "processing $$f"; \
		$(VENV_PY) games/$$f/run.py; \
	done

# Development commands
dev:
	@echo "Starting development environment..."
	@echo "Math engine available via Python virtual environment"
	@echo "Frontend development server: make frontend-dev"

clean:
	rm -rf env __pycache__ *.pyc
	cd $(FRONTEND_DIR) && rm -rf node_modules dist

clean-frontend:
	cd $(FRONTEND_DIR) && rm -rf node_modules dist