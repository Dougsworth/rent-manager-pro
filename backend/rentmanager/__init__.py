# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
# Only import celery in production to avoid Redis dependency in development
import os

if os.environ.get('DJANGO_SETTINGS_MODULE') == 'rentmanager.settings.production':
    from .celery import app as celery_app
    __all__ = ('celery_app',)
else:
    __all__ = ()