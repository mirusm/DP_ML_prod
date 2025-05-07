# settings.py

from corsheaders.defaults import default_headers

INSTALLED_APPS = [
    'corsheaders',  # Ensure this is included
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # This should be first
    'django.middleware.common.CommonMiddleware',
    ...
]

# Allow all origins (for development purposes only)
CORS_ALLOW_ALL_ORIGINS = True

# Alternatively, specify allowed origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Adjust this to your frontend URL
    "http://localhost:3000",  
    "http://127.0.0.1:5173",
    "http://49.13.213.187:3000",
    "https://49.13.213.187:3000",
    "http://192.168.0.235:3000",    
]

# Allow specific headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'User-Id',  # Ensure this is included
]
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]