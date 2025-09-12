FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY math-engine/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the math engine source code
COPY math-engine/src ./math-engine/src
COPY math-engine/data ./math-engine/data
COPY math-engine/results ./math-engine/results

# Copy the web SDK source code
COPY web-sdk ./web-sdk

# Set the entry point for the application
CMD ["python", "-m", "math-engine.src.simulation.run_simulations"]