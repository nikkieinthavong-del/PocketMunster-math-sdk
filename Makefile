PYTHON := python3
VENV_DIR := env
VENV_PY := $(VENV_DIR)/bin/python
TEST_NAMES = 0_0_cluster 0_0_scatter 0_0_lines 0_0_expwilds 0_0_ways

REQ := requirements.txt
REQ_DEV := requirements-dev.txt
LOCK := requirements.lock

ifeq ($(OS),Windows_NT)
	VENV_PY := $(VENV_DIR)\Scripts\python.exe
	ACTIVATE := $(VENV_DIR)\Scripts\activate.bat
else
	ACTIVATE := source $(VENV_DIR)/bin/activate
endif

makeVirtual:
	$(PYTHON) -m venv $(VENV_DIR)

pipInstall: makeVirtual
	$(VENV_PY) -m pip install --upgrade pip

# Install top-level deps (allows editable/VCS). Constraints are not used due to editable requirement.
pipPackages: pipInstall
	$(VENV_PY) -m pip install -r $(REQ)

pipDevPackages: pipPackages
	@if [ -f $(REQ_DEV) ]; then \
		$(VENV_PY) -m pip install -r $(REQ_DEV); \
	else \
		echo "$(REQ_DEV) not found, skipping dev dependencies"; \
	fi

# Optional: sync exactly to the lock file (and dev extras) using pip-tools
sync: pipInstall
	$(VENV_PY) -m pip install --upgrade pip-tools
	@if [ -f $(REQ_DEV) ]; then \
		$(VENV_PY) -m piptools sync $(LOCK) $(REQ_DEV); \
	else \
		$(VENV_PY) -m piptools sync $(LOCK); \
	fi

packInstall: pipPackages
	$(VENV_PY) -m pip install -e .

setup: packInstall
	@echo "Virtual environment ready."
	@echo "To activate it, run:"
	@echo "$(ACTIVATE)"

setup-dev: packInstall pipDevPackages
	@echo "Virtual environment (dev) ready."
	@echo "To activate it, run:"
	@echo "$(ACTIVATE)"

# lock generation (no hashes because of VCS/editable dep)
lock: pipInstall
	$(VENV_PY) -m pip install --upgrade pip-tools
	$(VENV_PY) -m piptools compile --output-file=$(LOCK) $(REQ)

run GAME:
	$(VENV_PY) games/$(GAME)/run.py
	@echo "Checking compression setting..."
	@if grep -q "compression = False" games/$(GAME)/run.py; then \
		echo "Compression is disabled, formatting books files..."; \
		$(VENV_PY) utils/format_books_json.py games/$(GAME) || echo "Warning: Failed to format books files"; \
	else \
		echo "Compression is enabled, skipping formatting."; \
	fi

test:
	cd $(CURDIR)
	$(VENV_PY) -m pytest tests/

test_run:
	@for f in $(TEST_NAMES); do \
		echo "processing $$f"; \
		$(VENV_PY) games/$$f/run.py; \
	done

clean:
	rm -rf env __pycache__ *.pyc