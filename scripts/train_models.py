import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import IsolationForest, RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, classification_report, accuracy_score
from sklearn.feature_extraction.text import TfidfVectorizer

def train_models():
    print("Loading data...")
    df = pd.read_csv('data/processed/cleaned_transactions.csv')
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Ensure models directory exists
    os.makedirs('models', exist_ok=True)

    # ==========================================
    # 1. Anomaly Detection (Isolation Forest)
    # ==========================================
    print("\nTraining Anomaly Detection Model...")
    # Features: Amount, Category_Encoded, DayOfWeek, IsWeekend
    # We filter for expenses only for anomaly detection
    df_expenses = df[df['Is_Expense'] == True].copy()
    
    features_anomaly = ['Amount', 'Category_Encoded', 'DayOfWeek', 'IsWeekend']
    X_anomaly = df_expenses[features_anomaly]
    
    # Isolation Forest is unsupervised, but we have labels to check performance
    iso_forest = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    iso_forest.fit(X_anomaly)
    
    # Predict (-1 is anomaly, 1 is normal)
    preds = iso_forest.predict(X_anomaly)
    # Map to 0 (normal) and 1 (anomaly) for comparison with our 'Is_Anomaly' ground truth
    preds_mapped = [1 if x == -1 else 0 for x in preds]
    
    print("Anomaly Detection Report:")
    print(classification_report(df_expenses['Is_Anomaly'], preds_mapped, target_names=['Normal', 'Anomaly']))
    
    # Save Model
    with open('models/anomaly_model.pkl', 'wb') as f:
        pickle.dump(iso_forest, f)

    # ==========================================
    # 2. Categorization Model (Random Forest Classifier)
    # ==========================================
    print("\nTraining Categorization Model...")
    # Goal: Predict 'Category_Encoded' from 'Merchant' name
    # We need a vectorizer for text
    
    vectorizer = TfidfVectorizer(max_features=100)
    X_text = vectorizer.fit_transform(df['Merchant']).toarray()
    y_cat = df['Category_Encoded']
    
    X_train_cat, X_test_cat, y_train_cat, y_test_cat = train_test_split(X_text, y_cat, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train_cat, y_train_cat)
    
    y_pred_cat = clf.predict(X_test_cat)
    print(f"Categorization Accuracy: {accuracy_score(y_test_cat, y_pred_cat):.4f}")
    
    # Save Model and Vectorizer
    with open('models/merchant_categorizer.pkl', 'wb') as f:
        pickle.dump(clf, f)
    with open('models/merchant_vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)

    # ==========================================
    # 3. Spending Prediction Model (Random Forest Regressor)
    # ==========================================
    print("\nTraining Spending Prediction Model...")
    # Goal: Predict next month's total spend based on previous months
    # We need to aggregate data by month first
    
    # Create simple features: Month index, and previous month's total
    monthly_data = df[df['Is_Expense'] == True].groupby('Month')['Amount'].sum().reset_index()
    monthly_data['MonthIndex'] = range(len(monthly_data))
    
    # Lag feature: Previous Month Spend
    monthly_data['PrevMonthSpend'] = monthly_data['Amount'].shift(1)
    monthly_data = monthly_data.dropna()
    
    X_reg = monthly_data[['MonthIndex', 'PrevMonthSpend']]
    y_reg = monthly_data['Amount']
    
    # If we have enough data, split. 
    if len(monthly_data) > 5:
        X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(X_reg, y_reg, test_size=0.2, shuffle=False)
        
        reg = RandomForestRegressor(n_estimators=100, random_state=42)
        reg.fit(X_train_reg, y_train_reg)
        
        y_pred_reg = reg.predict(X_test_reg)
        rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
        print(f"Spending Prediction RMSE: {rmse:.2f}")
        
        # Save Model
        with open('models/spending_forecaster.pkl', 'wb') as f:
            pickle.dump(reg, f)
    else:
        print("Not enough monthly data for robust regression training (need >5 months).")
        # Train on all available to have something
        reg = RandomForestRegressor(n_estimators=100, random_state=42)
        reg.fit(X_reg, y_reg)
        with open('models/spending_forecaster.pkl', 'wb') as f:
            pickle.dump(reg, f)

    print("\nAll models trained and saved to 'models/' directory.")

if __name__ == "__main__":
    train_models()
