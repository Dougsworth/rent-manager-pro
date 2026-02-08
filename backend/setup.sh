#!/bin/bash

# Setup script for RentManager Backend

echo "Setting up RentManager Backend..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p media
mkdir -p staticfiles
mkdir -p logs

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Setup development data
echo "Setting up development data..."
python manage.py setup_dev_data

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup complete! You can now run the server with:"
echo "python manage.py runserver"