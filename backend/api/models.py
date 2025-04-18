from django.db import models

class PredictionHistory(models.Model):
    user_id = models.CharField(max_length=10000)  
    date = models.DateTimeField(auto_now_add=True,null=True)
    smiles = models.CharField(null=True,max_length=1000)
    model_name = models.CharField(max_length=100, null=True)
    cas = models.CharField(max_length=100, null=True, blank=True)
    prediction = models.FloatField(null=True)
    efficiency = models.CharField(max_length=100,null=True)
    molecule_image = models.TextField(null=True)
    formula = models.CharField(max_length=100, null=True)
    iupac_name = models.CharField(max_length=1000, null=True, blank=True)
    properties = models.JSONField(null=True)
    descriptors = models.JSONField(null=True)
    shap_plot = models.TextField(null=True, blank=True)
    class Meta:
        ordering = ['-date']
