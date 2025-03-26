import firebase_admin
from firebase_admin import credentials, auth
from django.http import JsonResponse

# Initialize Firebase Admin
cred = credentials.Certificate('path/to/your/serviceAccountKey.json')  # You'll need to download this from Firebase Console
firebase_admin.initialize_app(cred)

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return JsonResponse({'error': 'No authorization token provided'}, status=401)

        try:
            token = auth_header.split(' ')[1]
            decoded_token = auth.verify_id_token(token)
            request.user_id = decoded_token['uid']
        except Exception as e:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        return self.get_response(request) 