from rest_framework import serializers
from .models import PredictionHistory

class PredictionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionHistory
        fields = [
            'id', 'user_id', 'date', 'smiles', 'cas', 'model_name', 'prediction',
            'efficiency', 'molecule_image', 'formula', 'iupac_name', 'properties',
            'descriptors', 'shap_plot'
        ]