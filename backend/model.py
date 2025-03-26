import xgboost as xgb

model_path = "models/xgboost_model_alr2.json"
model = xgb.Booster()
model.load_model(model_path) 