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
    predict_classifier,
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

AKR_MODELS = {
    "AKR1C1": {
        "model_path": "models/rf_model_akr1c1.pkl",
        "train_data_path": "data/x_train_data_akr1c1.csv",
        "required_features": [
            'qed', 'FpDensityMorgan1', 'BCUT2D_MRLOW', 'PEOE_VSA1', 'PEOE_VSA10',
            'PEOE_VSA11', 'PEOE_VSA12', 'PEOE_VSA13', 'PEOE_VSA14', 'PEOE_VSA2',
            'PEOE_VSA4', 'PEOE_VSA8', 'SMR_VSA10', 'SMR_VSA7', 'SMR_VSA9',
            'SlogP_VSA10', 'SlogP_VSA2', 'SlogP_VSA8', 'VSA_EState1', 'VSA_EState2',
            'VSA_EState5', 'NumAromaticHeterocycles', 'NumHeterocycles', 'MolLogP',
            'fr_Al_COO', 'fr_ArN', 'fr_Ar_COO', 'fr_Ar_OH', 'fr_COO', 'fr_C_O',
            'fr_NH0', 'fr_NH1', 'fr_halogen', 'fr_nitro', 'fr_sulfone'
        ]
    },
    "AKR1C2": {
        "model_path": "models/rf_model_akr1c2.pkl",
        "train_data_path": "data/x_train_data_akr1c2.csv",
        "required_features": [
            'MaxAbsEStateIndex', 'FpDensityMorgan1', 'BCUT2D_MWLOW', 'BCUT2D_CHGLO',
            'AvgIpc', 'Kappa2', 'PEOE_VSA10', 'PEOE_VSA11', 'PEOE_VSA13', 'PEOE_VSA7',
            'SMR_VSA10', 'SMR_VSA3', 'SMR_VSA7', 'SlogP_VSA10', 'SlogP_VSA2',
            'SlogP_VSA3', 'SlogP_VSA5', 'SlogP_VSA8', 'EState_VSA6', 'NHOHCount',
            'NumAliphaticHeterocycles', 'NumAromaticRings', 'MolLogP', 'fr_Al_COO',
            'fr_Ar_COO', 'fr_COO', 'fr_C_O_noCOO', 'fr_NH1', 'fr_allylic_oxid',
            'fr_aniline', 'fr_bicyclic', 'fr_ester', 'fr_ketone', 'fr_nitro',
            'fr_para_hydroxylation'
        ]
    },
    "AKR1C3": {
        "model_path": "models/xgboost_model_akr1c3.pkl",
        "train_data_path": "data/x_train_data_akr1c3.csv",
        "required_features": [
            'FpDensityMorgan1', 'BCUT2D_MWHI', 'BCUT2D_MWLOW', 'BCUT2D_LOGPLOW',
            'AvgIpc', 'PEOE_VSA1', 'PEOE_VSA10', 'PEOE_VSA12', 'PEOE_VSA2', 'PEOE_VSA7',
            'SMR_VSA3', 'SMR_VSA7', 'SlogP_VSA10', 'SlogP_VSA2', 'SlogP_VSA3',
            'SlogP_VSA4', 'SlogP_VSA5', 'SlogP_VSA7', 'SlogP_VSA8', 'EState_VSA6',
            'VSA_EState9', 'NHOHCount', 'NumAliphaticHeterocycles', 'NumAromaticRings',
            'NumHeteroatoms', 'RingCount', 'MolLogP', 'fr_Al_COO', 'fr_Ar_COO', 'fr_COO',
            'fr_NH1', 'fr_allylic_oxid', 'fr_aniline', 'fr_bicyclic', 'fr_para_hydroxylation'
        ]
    }
}

SELECTIVITY_THRESHOLD = 0.3
INHIBITION_THRESHOLD = 0.65   
OFF_TARGET_THRESHOLD = 0.35   
NON_INHIBITOR_THRESHOLD = 0.6    
PAN_INHIBITOR_MIN = 0.6     
SELECTIVITY_CLASS_THRESHOLD = 0.3


def _classify_selectivity(p1, p2, p3, sel_map):
    eps = 1e-6

    non_inhibitor_prob = (1 - p1) * (1 - p2) * (1 - p3)
    pan_inhibitor_prob = p1 * p2 * p3

    top_target = max(sel_map, key=sel_map.get)
    top_prob = sel_map[top_target]

    p_map = {"AKR1C1": p1, "AKR1C2": p2, "AKR1C3": p3}
    p_target = p_map[top_target]

    off_targets = ["AKR1C1", "AKR1C2", "AKR1C3"]
    off_targets.remove(top_target)
    p_off1 = p_map[off_targets[0]]
    p_off2 = p_map[off_targets[1]]

    max_off = max(p_off1, p_off2)

    ratio = p_target / (max_off + eps)

    if non_inhibitor_prob > NON_INHIBITOR_THRESHOLD:
        compound_class = "non-inhibitor"

    elif min(p1, p2, p3) > PAN_INHIBITOR_MIN:
        compound_class = "pan-inhibitor"

    elif (
        top_prob > SELECTIVITY_CLASS_THRESHOLD
        and p_target > INHIBITION_THRESHOLD
    ):
        compound_class = f"selective_{top_target}"

    else:
        compound_class = "uncertain"

    if (
        ratio > 10
        and p_target > 0.75
        and max_off < 0.25
    ):
        label = "highly selective"

    elif (
        ratio > 5
        and p_target > INHIBITION_THRESHOLD
        and max_off < OFF_TARGET_THRESHOLD
    ):
        label = "moderately selective"

    elif (
        ratio > 2
        and p_target > 0.5
    ):
        label = "weakly selective"

    else:
        label = "non-selective"

    return {
        "compound_class": compound_class,
        "selectivity_label": label,
        "top_selective_target": top_target,
        "top_selective_probability": round(float(top_prob), 5),
        "multi_target_prob_all_3": round(float(pan_inhibitor_prob), 5),
        "non_inhibitor_prob": round(float(non_inhibitor_prob), 5),
        "selectivity_ratio": round(float(ratio), 5),   # 👈 NOVÉ
    }


def _build_selectivity_payload(smiles, cas, input_type, iupac_name, model_results):
    p1 = float(model_results.get("AKR1C1", {}).get("prediction", 0.0))
    p2 = float(model_results.get("AKR1C2", {}).get("prediction", 0.0))
    p3 = float(model_results.get("AKR1C3", {}).get("prediction", 0.0))

    sel_prob_akr1c1 = p1 * (1 - p2) * (1 - p3)
    sel_prob_akr1c2 = p2 * (1 - p1) * (1 - p3)
    sel_prob_akr1c3 = p3 * (1 - p1) * (1 - p2)

    sel_map = {
        "AKR1C1": sel_prob_akr1c1,
        "AKR1C2": sel_prob_akr1c2,
        "AKR1C3": sel_prob_akr1c3,
    }

    summary = _classify_selectivity(p1, p2, p3, sel_map)
    top_target = summary["top_selective_target"]
    inhibition_map = {
        "AKR1C1": p1,
        "AKR1C2": p2,
        "AKR1C3": p3,
    }
    off_targets = [name for name in inhibition_map.keys() if name != top_target]
    strongest_off_target = max(off_targets, key=lambda name: inhibition_map[name])

    verdict = (
        f"This compound is selective for {top_target}"
        if summary["selectivity_label"] != "non-selective"
        else "This compound is non-selective across AKR1C enzymes"
    )

    enzyme_rows = [
        {
            "enzyme": "AKR1C1",
            "inhibition_probability": round(p1, 5),
            "selectivity_probability": round(sel_prob_akr1c1, 5),
        },
        {
            "enzyme": "AKR1C2",
            "inhibition_probability": round(p2, 5),
            "selectivity_probability": round(sel_prob_akr1c2, 5),
        },
        {
            "enzyme": "AKR1C3",
            "inhibition_probability": round(p3, 5),
            "selectivity_probability": round(sel_prob_akr1c3, 5),
        },
    ]

    return {
        "smiles": smiles,
        "cas": cas,
        "inputType": input_type,
        "info": {
            "iupac_name": iupac_name,
            "verdict": verdict,
            "confidence_score": summary["top_selective_probability"],
            "selectivity_label": summary["selectivity_label"],
            "compound_class": summary["compound_class"],
            "top_selective_target": top_target,
            "strongest_off_target": strongest_off_target,
            "top_selective_probability": summary["top_selective_probability"],
            "multi_target_prob_all_3": summary["multi_target_prob_all_3"],
            "non_inhibitor_prob": summary["non_inhibitor_prob"],
            "selectivity_ratio": summary.get("selectivity_ratio"),
        },
        "enzymes": enzyme_rows,
    }

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
                efficiency=info_alr2.get('efficiency', 'N/A'),
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

@api_view(['POST'])
def upload_akr_dataset(request):
    try:
        smiles = request.data.get('smiles')
        cas = request.data.get('cas')
        inputType = request.data.get('inputType')
        model_name = (request.data.get('model_name') or '').upper()
        user_id = request.headers.get('User-Id')

        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not inputType or inputType not in ['SMILES', 'CAS']:
            return Response({"error": "Invalid or missing inputType"}, status=status.HTTP_400_BAD_REQUEST)

        if model_name not in AKR_MODELS and model_name != "ALL":
            return Response({"error": f"Model {model_name} is not configured"}, status=status.HTTP_400_BAD_REQUEST)

        if model_name == "ALL":
            target_models = list(AKR_MODELS.keys())
        else:
            target_models = [model_name]

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
                    except Exception:
                        cas = "N/A"
            except Exception:
                cas = "N/A"

        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return Response({"error": "Invalid SMILES string"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"SMILES parsing failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mol_image_base64 = visualize_molecule_withoutSmiles(mol)
        except Exception as e:
            return Response({"error": f"Failed to visualize molecule: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            iupac_name = resolve_iupac_from_smiles(smiles) or "N/A"
        except Exception as e:
            return Response({"error": f"Failed to resolve IUPAC name: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_payload = {}
        model_level_results = {}
        history_entries = []

        for current_model_name in target_models:
            model_config = AKR_MODELS[current_model_name]
            try:
                pred_mol, prediction, descriptors, message, shap_plot = predict_classifier(
                    smiles,
                    model_path=model_config["model_path"],
                    train_data_path=model_config["train_data_path"],
                    required_features=model_config["required_features"],
                )
                if pred_mol is None:
                    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": f"{current_model_name} prediction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                info = get_molecule_info(current_model_name, pred_mol, prediction)
                properties = get_molecular_properties(pred_mol)
                info["iupac_name"] = iupac_name
            except Exception as e:
                return Response({"error": f"Failed to gather molecule info for {current_model_name}: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            response_payload[current_model_name] = {
                "molecule_image": mol_image_base64,
                "smiles": smiles,
                "cas": cas,
                "inputType": inputType,
                "prediction": str(prediction),
                "info": info,
                "descriptors": descriptors,
                "properties": properties,
                "shap_plot": shap_plot,
            }
            model_level_results[current_model_name] = {
                "prediction": float(prediction),
            }
            history_entries.append({
                "user_id": user_id,
                "smiles": smiles,
                "cas": cas,
                "model_name": current_model_name,
                "prediction": float(prediction),
                "efficiency": info.get('efficiency', 'N/A'),
                "molecule_image": mol_image_base64,
                "formula": info.get('formula', 'N/A'),
                "iupac_name": info.get('iupac_name', 'N/A'),
                "properties": properties,
                "descriptors": descriptors,
                "shap_plot": shap_plot or ""
            })

        try:
            for history_entry in history_entries:
                PredictionHistory.objects.create(**history_entry)
        except Exception as e:
            return Response({"error": f"Failed to save prediction history: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if model_name == "ALL":
            response_payload["SELECTIVITY"] = _build_selectivity_payload(
                smiles=smiles,
                cas=cas,
                input_type=inputType,
                iupac_name=iupac_name,
                model_results=model_level_results,
            )

        return Response(response_payload, status=status.HTTP_200_OK)

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
    