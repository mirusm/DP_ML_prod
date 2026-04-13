from django.urls import path
from .views import home, upload_dataset, upload_akr_dataset, akr_fragment_perturbation, get_prediction_history, delete_prediction, get_user_info, register_user

urlpatterns = [
    path('', home, name='home'),  # New homepage route
    path('upload/', upload_dataset, name='upload-dataset'),
    path('upload-akrc/', upload_akr_dataset, name='upload-akrc-dataset'),
    path('akrc-xsmiles/', akr_fragment_perturbation, name='akrc-xsmiles'),
    path('prediction-history/', get_prediction_history, name='prediction-history'),
    path('prediction/<int:prediction_id>/delete/', delete_prediction, name='delete-prediction'),
    path('get_user_info/', get_user_info, name='get_user_info'),
    path('register/', register_user, name='rregister'),
]
