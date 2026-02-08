from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.management import call_command
import os


class Command(BaseCommand):
    help = 'Set up development data for the application'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-fixtures',
            action='store_true',
            help='Skip loading fixtures',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Setting up development data...')
        )
        
        # Create superuser if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            self.stdout.write('Creating superuser...')
            User.objects.create_superuser(
                username='admin',
                email='admin@rentmanager.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(
                self.style.SUCCESS('Superuser created: admin/admin123')
            )
        else:
            self.stdout.write('Superuser already exists')
        
        # Load sample data
        if not options['skip_fixtures']:
            self.stdout.write('Loading sample data...')
            fixture_path = os.path.join('fixtures', 'sample_data.json')
            if os.path.exists(fixture_path):
                try:
                    call_command('loaddata', fixture_path)
                    self.stdout.write(
                        self.style.SUCCESS('Sample data loaded successfully')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to load sample data: {e}')
                    )
            else:
                self.stdout.write(
                    self.style.WARNING('Sample data fixture not found')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Development setup complete!')
        )