#!/bin/bash

# Run the Django development server with virtual environment activated
echo "🚀 Starting RentManager Backend..."
echo "📁 Virtual environment: $(pwd)/venv"
echo "🌐 Server will be available at: http://localhost:8000"
echo "👨‍💼 Admin panel: http://localhost:8000/admin/"
echo "📚 API documentation: http://localhost:8000/swagger/"
echo ""

# Activate virtual environment and run server
source venv/bin/activate && python manage.py runserver