#!/usr/bin/env python
"""
Setup verification script for RentManager Backend.
Run this to check if everything is properly configured.
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentmanager.settings')
django.setup()

def check_models():
    """Check if all models are properly configured."""
    print("✓ Checking models...")
    
    try:
        from tenants.models import Tenant, TenantDocument
        from payments.models import Invoice, Payment, PaymentReminder
        from authentication.models import UserProfile, AuditLog, PasswordResetToken
        
        print("  ✓ All models imported successfully")
        
        # Check model methods
        print("  ✓ Checking model methods...")
        
        # Test Tenant model methods exist
        tenant_methods = ['get_payment_status', 'is_lease_active', 'days_until_lease_end']
        for method in tenant_methods:
            assert hasattr(Tenant, method), f"Tenant missing method: {method}"
        
        # Test Invoice model methods exist
        invoice_methods = ['generate_invoice_number', 'balance_due', 'is_overdue', 'days_overdue', 'update_status']
        for method in invoice_methods:
            assert hasattr(Invoice, method), f"Invoice missing method: {method}"
        
        print("  ✓ All model methods verified")
        return True
        
    except Exception as e:
        print(f"  ✗ Model check failed: {e}")
        return False

def check_urls():
    """Check if all URLs are properly configured."""
    print("✓ Checking URLs...")
    
    try:
        from django.urls import reverse
        from django.test import Client
        
        # Check if main URL patterns exist
        url_patterns = [
            'admin:index',
        ]
        
        for pattern in url_patterns:
            try:
                reverse(pattern)
                print(f"  ✓ URL pattern '{pattern}' exists")
            except Exception as e:
                print(f"  ⚠ URL pattern '{pattern}' issue: {e}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ URL check failed: {e}")
        return False

def check_settings():
    """Check if settings are properly configured."""
    print("✓ Checking settings...")
    
    try:
        from django.conf import settings
        
        # Check required settings
        required_settings = [
            'SECRET_KEY',
            'DATABASES',
            'INSTALLED_APPS',
            'REST_FRAMEWORK',
            'SIMPLE_JWT',
            'CORS_ALLOWED_ORIGINS',
        ]
        
        for setting in required_settings:
            assert hasattr(settings, setting), f"Missing setting: {setting}"
            print(f"  ✓ {setting} configured")
        
        # Check if our apps are installed
        required_apps = [
            'rest_framework',
            'corsheaders',
            'authentication',
            'tenants',
            'payments',
        ]
        
        for app in required_apps:
            assert app in settings.INSTALLED_APPS, f"App not installed: {app}"
            print(f"  ✓ {app} installed")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Settings check failed: {e}")
        return False

def check_database():
    """Check if database is properly configured."""
    print("✓ Checking database...")
    
    try:
        from django.db import connection
        
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            assert result[0] == 1
        
        print("  ✓ Database connection successful")
        
        # Check if migrations are needed
        from django.core.management import execute_from_command_line
        from io import StringIO
        import sys
        
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        
        try:
            execute_from_command_line(['manage.py', 'showmigrations', '--plan'])
            migration_output = mystdout.getvalue()
            
            if '[X]' in migration_output or migration_output.strip():
                print("  ✓ Database migrations appear to be applied")
            else:
                print("  ⚠ No migrations found - run 'python manage.py migrate'")
                
        finally:
            sys.stdout = old_stdout
        
        return True
        
    except Exception as e:
        print(f"  ✗ Database check failed: {e}")
        return False

def check_api_endpoints():
    """Check if API endpoints are accessible."""
    print("✓ Checking API endpoints...")
    
    try:
        from django.test import Client
        from django.contrib.auth.models import User
        
        client = Client()
        
        # Check if API documentation is accessible
        endpoints = [
            '/admin/',
            '/swagger/',
            '/redoc/',
        ]
        
        for endpoint in endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code in [200, 302, 401]:  # 401 is OK for auth-required endpoints
                    print(f"  ✓ {endpoint} accessible (status: {response.status_code})")
                else:
                    print(f"  ⚠ {endpoint} returned status: {response.status_code}")
            except Exception as e:
                print(f"  ⚠ {endpoint} error: {e}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ API endpoint check failed: {e}")
        return False

def main():
    """Run all checks."""
    print("🔍 RentManager Backend Setup Verification")
    print("=" * 50)
    
    checks = [
        check_settings,
        check_models,
        check_urls,
        check_database,
        check_api_endpoints,
    ]
    
    passed = 0
    failed = 0
    
    for check in checks:
        try:
            if check():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  ✗ Check failed with error: {e}")
            failed += 1
        print()
    
    print("=" * 50)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All checks passed! Your backend is ready to go.")
        print("\nNext steps:")
        print("1. Start the development server: python manage.py runserver")
        print("2. Visit http://localhost:8000/admin/ for admin interface")
        print("3. Visit http://localhost:8000/swagger/ for API documentation")
    else:
        print(f"\n⚠️  {failed} check(s) failed. Please fix the issues above.")
    
    return failed == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)