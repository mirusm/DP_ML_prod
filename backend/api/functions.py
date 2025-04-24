import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen
import shap
from rdkit.Chem import Draw
import base64
from io import BytesIO
from rdkit.Chem.rdMolDescriptors import CalcMolFormula
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib
import requests
import re

def load_dataset(file_path):
    try:
        df = pd.read_excel(file_path)
        return df
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None
    
def find_cas_in_dataset(smiles, df):
    if df is None:
        return "N/A"
    match = df[df['SMILES'] == smiles]
    if not match.empty:
        return match['CAS'].iloc[0]
    else:
        return "N/A"
    
def find_smiles_in_dataset(cas, df):
    if df is None:
        return "N/A"
    match = df[df['CAS'] == cas]
    if not match.empty:
        return match['SMILES'].iloc[0]
    else:
        return "N/A"

def find_iupac_in_dataset(smiles, df):
    if df is None:
        return "N/A"
    match = df[df['SMILES'] == smiles]
    if not match.empty:
        return match['IUPAC'].iloc[0]
    else:
        return "N/A"
    
def smiles_to_iupac(smiles):
    CACTUS = "https://cactus.nci.nih.gov/chemical/structure/{0}/{1}"
    rep = "iupac_name"
    url = CACTUS.format(smiles, rep)
    try:
        response = requests.get(url)
        if response.status_code == 200:
            try:
                return response.json()
            except requests.exceptions.JSONDecodeError:
                return response.text.strip()  
        else:
            print(f"Error: Received status code {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

# Extract molecular descriptors for a single molecule
def get_descriptors(mol):
    descriptor_names_funcs = Descriptors._descList
    descriptor_names = [name for name, _ in descriptor_names_funcs]
    
    if mol:
        descriptor_values = {name: func(mol) for name, func in descriptor_names_funcs}
    else:
        descriptor_values = {name: None for name in descriptor_names}
    
    return pd.DataFrame([descriptor_values])

def generate_shap_waterfall_plot(shap_values, expected_value, data, feature_names, max_display=10):
    try:
        plt.switch_backend('Agg')
        plt.figure(figsize=(10, 6))
        shap.waterfall_plot(
            shap.Explanation(
                values=shap_values,
                base_values=expected_value,
                data=data,
                feature_names=feature_names
            ),
            max_display=max_display
        )
        buffered = BytesIO()
        plt.savefig(buffered, format="PNG", dpi=300, bbox_inches='tight', facecolor='white')
        plt.close('all')          
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    except Exception as e:
        return None
    
# Visualize a molecule from a SMILES string
def visualize_molecule(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        return None  
    img = Draw.MolToImage(mol, size=(800, 800))  
    buffered = BytesIO()
    img.save(buffered, format="PNG")  
    return base64.b64encode(buffered.getvalue()).decode("utf-8")  

def getDescriptorsP(df, missing_value=0):
    """
    Get all descriptors from the whole df and return a pandas DataFrame.
    """
    descriptor_data = []
    for _, row in df.iterrows():
        smiles = row["SMILES"]
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES string: {smiles}")

        descriptor_list = {}
        for name, func in Descriptors._descList:
            try:
                desc = func(mol)
            except Exception as e:
                desc = missing_value
                print(f"Warning: Failed to compute descriptor {name}: {e}")
            descriptor_list[name] = desc

        descriptor_data.append(descriptor_list)

    return pd.DataFrame(descriptor_data)

def predict_xgboost(smiles, model_path, train_data_path):
    REQUIRED_FEATURES = [
        'MaxAbsEStateIndex', 'MinEStateIndex', 'SPS', 'MolWt', 'BCUT2D_MWHI',
        'HallKierAlpha', 'Ipc', 'PEOE_VSA1', 'PEOE_VSA10', 'PEOE_VSA11',
        'PEOE_VSA12', 'PEOE_VSA13', 'PEOE_VSA14', 'PEOE_VSA2', 'PEOE_VSA3',
        'PEOE_VSA4', 'PEOE_VSA5', 'PEOE_VSA6', 'PEOE_VSA7', 'PEOE_VSA8',
        'PEOE_VSA9', 'SMR_VSA1', 'SMR_VSA2', 'SMR_VSA3', 'SMR_VSA4', 'SMR_VSA5',
        'SMR_VSA6', 'SMR_VSA7', 'SMR_VSA9', 'SlogP_VSA1', 'SlogP_VSA2',
        'SlogP_VSA3', 'SlogP_VSA4', 'SlogP_VSA5', 'SlogP_VSA7', 'TPSA',
        'EState_VSA2', 'EState_VSA3', 'EState_VSA4', 'EState_VSA5',
        'EState_VSA6', 'EState_VSA7', 'EState_VSA8', 'EState_VSA9',
        'VSA_EState3', 'VSA_EState4', 'VSA_EState5', 'VSA_EState7',
        'VSA_EState8', 'VSA_EState9', 'NHOHCount', 'NumAmideBonds', 'MolLogP',
        'fr_Al_COO', 'fr_Ar_OH', 'fr_C_O', 'fr_NH1', 'fr_aniline',
        'fr_aryl_methyl', 'fr_bicyclic', 'fr_ketone', 'fr_para_hydroxylation'
    ]

    try:
        df = pd.DataFrame({"SMILES": [smiles]})
        desc_df = getDescriptorsP(df, missing_value=0)
        
        missing_features = [f for f in REQUIRED_FEATURES if f not in desc_df.columns]
        if missing_features:
            return None, None, None, f"Missing features: {missing_features}", None, None

        desc_df = desc_df[REQUIRED_FEATURES]
        model = joblib.load(model_path)
        train_data = pd.read_csv(train_data_path)[REQUIRED_FEATURES]

        pred_value = int(model.predict(desc_df.values)[0])  # Class label (0 or 1)
        explainer = shap.TreeExplainer(model, data=train_data, model_output="probability")
        shap_values = explainer.shap_values(desc_df.values)
        matplotlib.use('Agg')
        importance = np.abs(shap_values).mean(axis=0)
        feature_importance = pd.DataFrame({
            "Feature": REQUIRED_FEATURES,
            "Importance": importance
        }).sort_values(by="Importance", ascending=False)
        top_10_features = feature_importance['Feature'].head(10).tolist()
        
        top_10_indices = [REQUIRED_FEATURES.index(f) for f in top_10_features]
        encoded_top_10 = generate_shap_waterfall_plot(
            shap_values=shap_values[0][top_10_indices],
            expected_value=explainer.expected_value,
            data=desc_df.iloc[0][top_10_features],
            feature_names=top_10_features,
            max_display=10
        )
        if encoded_top_10 is None:
            return None, None, None, "Failed to generate SHAP plot", None, None

        important_descriptors = {
            feature: {
                'value': float(desc_df[feature].iloc[0]),
                'importance': float(feature_importance[feature_importance['Feature'] == feature]['Importance'].iloc[0])
            }
            for feature in top_10_features
        }
        
        mol = Chem.MolFromSmiles(smiles)
        return (mol, pred_value, important_descriptors, "Prediction successful", encoded_top_10)

    except Exception as e:
        return None, None, None, f"Prediction failed: {str(e)}", None, None

def predict_svr(smiles, model_path, train_data_path):
    REQUIRED_FEATURES = ['MaxAbsEStateIndex', 'MinEStateIndex', 'SPS', 'MolWt', 'BCUT2D_MWHI',
       'HallKierAlpha', 'PEOE_VSA1', 'PEOE_VSA10', 'PEOE_VSA11', 'PEOE_VSA12',
       'PEOE_VSA13', 'PEOE_VSA2', 'PEOE_VSA3', 'PEOE_VSA4', 'PEOE_VSA5',
       'PEOE_VSA6', 'PEOE_VSA8', 'SMR_VSA1', 'SMR_VSA2', 'SMR_VSA3',
       'SMR_VSA4', 'SMR_VSA5', 'SMR_VSA6', 'SMR_VSA7', 'SMR_VSA9',
       'SlogP_VSA1', 'SlogP_VSA2', 'SlogP_VSA3', 'SlogP_VSA4', 'SlogP_VSA5',
       'SlogP_VSA7', 'SlogP_VSA8', 'TPSA', 'EState_VSA2', 'EState_VSA3',
       'EState_VSA4', 'EState_VSA5', 'EState_VSA6', 'EState_VSA7',
       'EState_VSA8', 'EState_VSA9', 'VSA_EState2', 'VSA_EState3',
       'VSA_EState4', 'VSA_EState5', 'VSA_EState7', 'VSA_EState9', 'NHOHCount',
       'NumAmideBonds', 'fr_NH1', 'fr_alkyl_halide', 'fr_aryl_methyl',
       'fr_ketone', 'fr_para_hydroxylation']

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None, None, None, "Invalid SMILES", None, None
    
    descriptors = get_descriptors(mol)
    model_input = descriptors[REQUIRED_FEATURES]
    
    model = joblib.load(model_path)
    
    if train_data_path:
        train_data = pd.read_csv(train_data_path)[REQUIRED_FEATURES]
    else:
        return None, None, None, "Training data not provided", None, None  
                            
    pred_value = model.predict(model_input)[0]
    
    # SHAP explanation
    explainer = shap.KernelExplainer(model.predict, train_data)
    shap_values = explainer.shap_values(model_input)
    matplotlib.use('Agg')
    
    # Calculate feature importance and get top 10
    importance = np.abs(shap_values[0])
    feature_importance = pd.DataFrame({
        "Feature": REQUIRED_FEATURES,
        "Importance": importance
    }).sort_values(by="Importance", ascending=False)
    top_10_features = feature_importance['Feature'].head(10).tolist()
    top_10_indices = [REQUIRED_FEATURES.index(f) for f in top_10_features]

    encoded_top_10 = generate_shap_waterfall_plot(
        shap_values=shap_values[0][top_10_indices],
        expected_value=explainer.expected_value,
        data=model_input.iloc[0][top_10_features],
        feature_names=top_10_features,
        max_display=10
    )

    if encoded_top_10 is None:
        return None, None, None, "Failed to generate SHAP plot", None, None

    # Prepare important descriptors dictionary
    important_descriptors = {
        feature: {
            'value': float(model_input[feature].iloc[0]),
            'importance': float(feature_importance[feature_importance['Feature'] == feature]['Importance'].iloc[0])
        }
        for feature in top_10_features
    }
    
    return (mol, pred_value, important_descriptors, "Prediction successful", encoded_top_10)

# Visualize a molecule without the SMILES string
def visualize_molecule_withoutSmiles(mol):
    if not mol:
        return None  

    img = Draw.MolToImage(mol, size=(800, 800))  
    buffered = BytesIO()
    img.save(buffered, format="PNG")  
    return base64.b64encode(buffered.getvalue()).decode("utf-8")  

# Validate CAS number https://github.com/simonengelke/CAS_Validation
def cas_validation(cas):
	try:
		cas_match = re.search(r'(\d+)-(\d\d)-(\d)',cas)
		cas_string = cas_match.group(1) + cas_match.group(2) + cas_match.group(3)
		increment = 0
		sum_cas = 0
		for number in reversed(cas_string):
			if increment == 0:
				validate = int(number)
				increment+=1
			else:
				sum_cas = sum_cas + (int(number) * increment)
				increment+=1

		if validate == sum_cas % 10:
			return True
		else: 
			return False
	except:
		return False


# function converting CAS to SMILES
def cas_to_smiles(cas):
    if not cas_validation(cas):
        return None  

    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{cas}/property/IsomericSMILES/JSON"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  
        data = response.json()
        smiles = data['PropertyTable']['Properties'][0]['IsomericSMILES']
        return smiles
    except requests.exceptions.RequestException as e:
        print(f"Warning: Could not fetch SMILES for CAS {cas}. Error: {e}")
        return None
    except (KeyError, IndexError):
        print(f"Warning: CAS number {cas} not found or SMILES not available in PubChem")
        return None

     
def get_molecular_properties(mol):
    properties = {
            "molecular_weight": round(Descriptors.MolWt(mol), 2),
            "tpsa": round(Descriptors.TPSA(mol), 2),
            "num_heavy_atoms": Chem.Lipinski.HeavyAtomCount(mol),
            "num_aromatic_atoms": sum(1 for atom in mol.GetAtoms() if atom.GetIsAromatic()),
            "num_rotatable_bonds": Descriptors.NumRotatableBonds(mol),
            "num_hbond_acceptors": Descriptors.NumHAcceptors(mol),
            "num_hbond_donors": Descriptors.NumHDonors(mol),
            "molar_refractivity": round(Descriptors.MolMR(mol), 2),
            "logp_crippen": round(Crippen.MolLogP(mol), 2)
        }
    return properties


def get_molecule_info(ALR_type, mol, prediction):
    formula = CalcMolFormula(mol)
    canonized_smiles = Chem.MolToSmiles(mol, canonical=True)
    inchi = Chem.MolToInchi(mol)

    if ALR_type == "ALR1": 
        efficiency = "Effective" if round(prediction) == 1 else "Not Effective"
    if ALR_type == "ALR2": 
        efficiency = determine_efficiency(prediction,100)

    info = {
        "formula": formula,
        "canonical_smiles": canonized_smiles,
        "prediction": str(prediction),
        "efficiency": efficiency,
        "inchi": inchi
    }
    return info

def determine_efficiency(prediction, threshold):
    if prediction >= threshold:
        return "Not Effective"
    else:
        return "Effective"
    