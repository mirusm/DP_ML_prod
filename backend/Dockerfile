# Use an official Python runtime as the base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for RDKit and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libboost-python-dev \
    libboost-system-dev \
    libboost-thread-dev \
    libxrender1 \
    libxext6 \
    libfontconfig1 \
    libcairo2 \
    cmake \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install RDKit
RUN pip install --no-cache-dir rdkit

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port Gunicorn will run on
EXPOSE 8000

# Run Django migrations and start Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --workers 3 backend.wsgi:application"]