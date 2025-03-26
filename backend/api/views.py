from django.http import JsonResponse
from rest_framework.decorators import api_view
from rdkit import Chem
from rdkit.Chem import Draw
from django.http import JsonResponse
from sklearn.model_selection import train_test_split, GridSearchCV, RepeatedKFold
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_regression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, explained_variance_score
from rdkit.Chem.rdMolDescriptors import CalcMolFormula
from .models import PredictionHistory
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
import cirpy
import os
from .functions import (  
    visualize_molecule_withoutSmiles,
    predict_xgboost,
    predict_svr,
    cas_to_smiles,
    get_molecular_properties,
    get_molecule_info,
    smiles_to_iupac,
    prepare_xsmiles_data
)

def home(request):
    return JsonResponse({"message": "Welcome to the Django API!"})

@api_view(['GET'])
def get_prediction_history(request):
    user_id = request.headers.get('User-Id')  
    if not user_id:
        return JsonResponse({"error": "User ID is required"}, status=400)
        
    history = PredictionHistory.objects.filter(user_id=user_id)
    data = [{
        'id': item.id,
        'user_id': user_id,
        'date': item.date,
        'smiles': item.smiles,
        'cas': item.cas,
        'model_name': item.model_name,
        'prediction': item.prediction,
        'efficiency': item.efficiency,
        'molecule_image': item.molecule_image,
        'formula': item.formula,
        'iupac_name': item.iupac_name,
        'properties': item.properties,
        'descriptors': item.descriptors,
        'shap_plot': item.shap_plot,
        'plot_all': item.plot_all,
        'user_id': item.user_id,
        'xsmiles_data': item.xsmiles_data 

    } for item in history]
    return JsonResponse(data, safe=False)

@api_view(['DELETE'])
def delete_prediction(request, prediction_id):
    user_id = request.headers.get('User-Id')  
    if not user_id:
        return JsonResponse({"error": "User ID is required"}, status=400)
    try:
        prediction = PredictionHistory.objects.get(id=prediction_id, user_id=user_id)
        prediction.delete()
        return JsonResponse({"message": "Prediction deleted successfully"}, status=200)
    except PredictionHistory.DoesNotExist:
        return JsonResponse({"error": "Prediction not found or unauthorized"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def upload_dataset(request):
    smiles = request.data.get('smiles')
    cas = request.data.get('cas')
    inputType = request.data.get('inputType')
    model_name = request.data.get('model', 'ALR2')  # Default to 'ALR2' if not provided
    user_id = request.headers.get('User-Id')  # Get user_id from request headers
    
    if not user_id:
        return JsonResponse({"error": "User ID is required"}, status=400)
        
    print(f"CAS/SMILES: {inputType}")
    print(f"Selected model: {model_name}")
    print(f"SMILES: {smiles}")
    
    if inputType == 'CAS':
        smiles = cas_to_smiles(cas)
        if smiles.startswith("Error"):
            return JsonResponse({
                "error": smiles
            }, status=400)
    if inputType == 'SMILES':
        smiles = smiles
        try:
            cas = cirpy.resolve(smiles, "cas")
            if not cas:
                cas = "N/A"
        except Exception as e:
            cas = "N/A"

    # Convert SMILES to molecular structure
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return JsonResponse({
            "error": "Invalid SMILES string"
        }, status=400)

    # Generate molecular descriptors and prediction
    if model_name == 'ALR2':
        mol, prediction, descriptors, message, plot_all, plot_top, shap_values = predict_svr(smiles, model_path="models/svr_model_alr2.pkl", train_data_path="data/x_train_data.csv")
    if model_name == 'ALR1':
        mol, prediction, descriptors, message, plot_all, plot_top = predict_xgboost(smiles, model_path=f"models/xgboost_model_{model_name.lower()}.json", train_data_path="data/x_train_data.csv")
    if mol is None:
        return JsonResponse({
            "error": message
        }, status=400)


    # Extract atom and token scores
    num_atoms = mol.GetNumAtoms()
    atom_scores = shap_values[0][:num_atoms].tolist() if shap_values[0].size >= num_atoms else [0.0] * num_atoms
    token_scores = shap_values[0][:len(smiles)].tolist() if shap_values[0].size >= len(smiles) else [0.0] * len(smiles)

    info = get_molecule_info(mol,prediction)
    properties = get_molecular_properties(mol)
    iupac_name = smiles_to_iupac(smiles)
    print("IUPAC name",iupac_name)
    info["iupac_name"] = iupac_name
    print(info)
    print(properties)
    print(descriptors)
    #print(shap_results)

    mol_image_base64 = visualize_molecule_withoutSmiles(mol)
    prediction_temp = PredictionHistory(
        user_id=user_id,
        smiles=smiles,
        cas=cas,
        model_name=model_name,
        prediction=float(prediction),
        efficiency=info['efficiency'],
        molecule_image=mol_image_base64,
        formula=info['formula'],
        iupac_name=info.get('iupac_name'),
        properties=properties,
        descriptors=descriptors,
        shap_plot=plot_top,
        plot_all=plot_all,
        atom_scores=atom_scores,
        token_scores=token_scores,
    )
    xsmiles_data = prepare_xsmiles_data(prediction_temp)
    print(xsmiles_data)
    # Save to PredictionHistory
    PredictionHistory.objects.create(
        user_id=user_id,
        smiles=smiles,
        cas=cas,
        model_name=model_name,
        prediction=float(prediction),
        efficiency=info['efficiency'],
        molecule_image=mol_image_base64,
        formula=info['formula'],
        iupac_name=info.get('iupac_name'),
        properties=properties,
        descriptors=descriptors,
        shap_plot=plot_top,
        plot_all=plot_all,
        atom_scores=atom_scores,
        token_scores=token_scores,
        xsmiles_data=xsmiles_data
    )
    os.remove('shap_waterfall_all.png')
    os.remove('shap_waterfall_top10.png')
    return JsonResponse({
        "molecule_image": mol_image_base64,
        "smiles": smiles,
        "cas": cas,
        "inputType": inputType,
        "prediction": str(prediction),
        "info": info,
        "descriptors": descriptors,
        "properties": properties,
        "shap_plot": plot_top,
        "xsmiles_data": xsmiles_data
    })

@api_view(['GET'])
def get_user_info(request):
    email = request.headers.get('Email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        return Response({
            "id": user.id,
            "email": user.email,
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def register_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=email, email=email, password=password)
        user.save()
        
        return Response({
            "id": user.id, 
            "email": user.email,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)