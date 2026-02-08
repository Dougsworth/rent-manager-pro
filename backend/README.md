# RentManager Backend

Production-ready Django backend for the RentManager property management system.

## Features

- **Tenant Management**: Complete CRUD operations for tenant records
- **Invoice Management**: Automated invoice generation and tracking
- **Payment Processing**: Record and track rent payments
- **Authentication**: JWT-based authentication with role-based access control
- **API Documentation**: Auto-generated API docs with Swagger/ReDoc
- **Audit Logging**: Complete audit trail of all system actions
- **Email Notifications**: Automated payment reminders and notifications
- **Admin Dashboard**: Comprehensive Django admin interface

## Tech Stack

- Django 4.2+
- Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Celery for async tasks
- Redis for caching and task queue
- JWT for authentication

## Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL (for production)
- Redis (for production)

### Installation

1. Clone the repository and navigate to backend:
```bash
cd rent-manager-pro/backend
```

2. Run the setup script:
```bash
./setup.sh
```

3. Update the `.env` file with your configuration.

4. Run the development server:
```bash
source venv/bin/activate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/change-password/` - Change password

### Tenants
- `GET /api/tenants/` - List all tenants
- `POST /api/tenants/` - Create new tenant
- `GET /api/tenants/{id}/` - Get tenant details
- `PUT /api/tenants/{id}/` - Update tenant
- `DELETE /api/tenants/{id}/` - Delete tenant
- `POST /api/tenants/{id}/send_reminder/` - Send payment reminder

### Payments
- `GET /api/payments/` - List all payments
- `POST /api/payments/` - Record new payment
- `GET /api/payments/{id}/` - Get payment details
- `GET /api/payments/export/` - Export payments to CSV

### Invoices
- `GET /api/invoices/` - List all invoices
- `POST /api/invoices/` - Create new invoice
- `GET /api/invoices/{id}/` - Get invoice details
- `PUT /api/invoices/{id}/` - Update invoice
- `POST /api/invoices/bulk_create/` - Create monthly invoices for all tenants

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics
- `GET /api/dashboard/recent-payments/` - Get recent payments
- `GET /api/dashboard/overdue-tenants/` - Get overdue tenants

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Django settings
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rentmanager

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Settings
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
```

## Development

### Running Tests
```bash
python manage.py test
```

### Running with Docker
```bash
docker-compose up
```

### Making Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating a Superuser
```bash
python manage.py createsuperuser
```

## Production Deployment

### Using Gunicorn
```bash
gunicorn rentmanager.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker
```bash
docker build -t rentmanager-backend .
docker run -p 8000:8000 rentmanager-backend
```

### Static Files
```bash
python manage.py collectstatic --noinput
```

## API Documentation

- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`

## Security Features

- JWT authentication with refresh tokens
- Role-based access control (Admin, Manager, Staff, Accountant)
- Audit logging for all actions
- Rate limiting on API endpoints
- CORS configuration for frontend integration
- SQL injection protection
- XSS protection
- CSRF protection

## Monitoring

- Sentry integration for error tracking
- Django Debug Toolbar for development
- Comprehensive logging configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.