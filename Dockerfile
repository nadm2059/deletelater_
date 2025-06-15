# Use official Python base image with a small footprint
FROM python:3.11-slim

# Install system dependencies (g++ compiler)
RUN apt-get update && apt-get install -y build-essential

# Set working directory inside the container
WORKDIR /app

# Copy the entire backend directory (Flask app + C++ file + requirements + json files)
COPY backend/ backend/

# Optionally copy json.hpp if it's outside backend/
# If json.hpp is already inside backend/, you can skip this


# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Change to backend dir to compile C++ engine
WORKDIR /app/backend

# Compile the C++ quiz engine
RUN g++ quiz_engine.cpp -o quiz_engine

# Expose Flask default port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]
