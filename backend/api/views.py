from django.http import JsonResponse
from rest_framework.decorators import api_view
from rdkit import Chem
from .models import PredictionHistory
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionHistorySerializer 
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
    load_dataset,
    find_cas_in_dataset,
    find_smiles_in_dataset,
    cas_validation,
    find_iupac_in_dataset
)

def home(request):
    return JsonResponse({"message": "Welcome to the Django API!"})

@api_view(['GET'])
def get_prediction_history(request):
    user_id = request.headers.get('User-Id')  
    if not user_id:
        return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        history = PredictionHistory.objects.filter(user_id=user_id)
        serializer = PredictionHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Failed to fetch prediction history: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_prediction(request, prediction_id):
    user_id = request.headers.get('User-Id')  
    if not user_id:
        return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        prediction = PredictionHistory.objects.get(id=prediction_id, user_id=user_id)
        prediction.delete()
        return Response({"message": "Prediction deleted successfully"}, status=status.HTTP_200_OK)
    except PredictionHistory.DoesNotExist:
        return Response({"error": "Prediction not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Failed to delete prediction: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def resolve_iupac_from_smiles(smiles):
    iupac_name = smiles_to_iupac(smiles)
    if not iupac_name:
        df = load_dataset("data/DATASET.xlsx")
        iupac_name = find_iupac_in_dataset(smiles, df)
        if iupac_name == "N/A":
            return "N/A"
    return iupac_name

@api_view(['POST'])
def upload_dataset(request):
    try:
        smiles = request.data.get('smiles')
        cas = request.data.get('cas')
        inputType = request.data.get('inputType')
        user_id = request.headers.get('User-Id')

        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not inputType or inputType not in ['SMILES', 'CAS']:
            return Response({"error": "Invalid or missing inputType"}, status=status.HTTP_400_BAD_REQUEST)

        if inputType == 'CAS':
            if not cas:
                return Response({"error": "CAS code is required for CAS input"}, status=status.HTTP_400_BAD_REQUEST)
            if not cas_validation(cas):
                return Response({"error": "Invalid CAS number"}, status=status.HTTP_400_BAD_REQUEST)
            smiles = cas_to_smiles(cas)
            if not smiles or smiles == "N/A":
                try:
                    df = load_dataset("data/DATASET.xlsx")
                    smiles = find_smiles_in_dataset(cas, df)
                    if smiles == "N/A":
                        return Response({"error": "CAS not found in dataset"}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    return Response({"error": f"Failed to load dataset: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:  
            if not smiles:
                return Response({"error": "SMILES code is required for SMILES input"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                cas = cirpy.resolve(smiles, "cas") or "N/A"
                if cas == "N/A":
                    try:
                        df = load_dataset("data/DATASET.xlsx")
                        cas = find_cas_in_dataset(smiles, df)
                    except Exception as e:
                        cas = "N/A"
            except Exception as e:
                cas = "N/A"

        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return Response({"error": "Invalid SMILES string"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"SMILES parsing failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mol_alr2, prediction_alr2, descriptors_alr2, message_alr2, plot_top_alr2 = predict_svr(
                smiles, model_path="models/svr_model_alr2.pkl", train_data_path="data/x_train_data_alr2.csv"
            )
            if mol_alr2 is None:
                return Response({"error": message_alr2}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"ALR2 prediction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            mol_alr1, prediction_alr1, descriptors_alr1, message_alr1, plot_top_alr1 = predict_xgboost(
                smiles, model_path="models/xgb_model_alr1.pkl", train_data_path="data/x_train_data_alr1.csv"
            )
            if mol_alr1 is None:
                return Response({"error": message_alr1}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"ALR1 prediction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            info_alr2 = get_molecule_info("ALR2", mol_alr2, prediction_alr2)
            properties_alr2 = get_molecular_properties(mol_alr2)
            iupac_name = resolve_iupac_from_smiles(smiles) or "N/A"
            info_alr2["iupac_name"] = iupac_name

            info_alr1 = get_molecule_info("ALR1", mol_alr1, prediction_alr1)
            properties_alr1 = get_molecular_properties(mol_alr1)
            info_alr1["iupac_name"] = iupac_name
        except Exception as e:
            return Response({"error": f"Failed to gather molecule info: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            mol_image_base64 = visualize_molecule_withoutSmiles(mol)
        except Exception as e:
            return Response({"error": f"Failed to visualize molecule: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            PredictionHistory.objects.create(
                user_id=user_id,
                smiles=smiles,
                cas=cas,
                model_name="ALR2",
                prediction=float(prediction_alr2),
                efficiency=info_alr1.get('efficiency', 'N/A'),
                molecule_image=mol_image_base64,
                formula=info_alr2.get('formula', 'N/A'),
                iupac_name=info_alr2.get('iupac_name', 'N/A'),
                properties=properties_alr2,
                descriptors=descriptors_alr2,
                shap_plot=plot_top_alr2 or ""
            )

            PredictionHistory.objects.create(
                user_id=user_id,
                smiles=smiles,
                cas=cas,
                model_name="ALR1",
                prediction=float(prediction_alr1),
                efficiency=info_alr1.get('efficiency', 'N/A'),
                molecule_image=mol_image_base64,
                formula=info_alr1.get('formula', 'N/A'),
                iupac_name=info_alr1.get('iupac_name', 'N/A'),
                properties=properties_alr1,
                descriptors=descriptors_alr1,
                shap_plot=plot_top_alr1 or ""
            )
        except Exception as e:
            return Response({"error": f"Failed to save prediction history: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "ALR2": {
                "molecule_image": mol_image_base64,
                "smiles": smiles,
                "cas": cas,
                "inputType": inputType,
                "prediction": str(prediction_alr2),
                "info": info_alr2,
                "descriptors": descriptors_alr2,
                "properties": properties_alr2,
                "shap_plot": plot_top_alr2
            },
            "ALR1": {
                "molecule_image": mol_image_base64,
                "smiles": smiles,
                "cas": cas,
                "inputType": inputType,
                "prediction": str(prediction_alr1),
                "info": info_alr1,
                "descriptors": descriptors_alr1,
                "properties": properties_alr1,
                "shap_plot": plot_top_alr1
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    firebase_uid = request.data.get('firebase_uid')

    if not email or not password or not firebase_uid:
        return Response({"error": "Email, password, and Firebase UID are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            id=firebase_uid  
        )
        user.save()
        return Response({
            "id": user.id,
            "email": user.email,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    