import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def preprocess_data():
    # Load raw data
    input_path = 'data/raw/transactions.csv'
    df = pd.read_csv(input_path)
    df['Date'] = pd.to_datetime(df['Date'])
    
    # 1. Handle Missing Values (Synthetic data shouldn't have any, but for robustness)
    df = df.dropna()

    # 2. Date Features
    df['DayOfWeek'] = df['Date'].dt.dayofweek
    df['DayOfMonth'] = df['Date'].dt.day
    df['Month'] = df['Date'].dt.month
    df['IsWeekend'] = df['DayOfWeek'].apply(lambda x: 1 if x >= 5 else 0)
    
    # 3. Encoding Categorical Variables
    # We need to save the encoder to use it during prediction/app phase
    le_category = LabelEncoder()
    df['Category_Encoded'] = le_category.fit_transform(df['Category'])
    
    # Save Label Encoder
    os.makedirs('models', exist_ok=True)
    with open('models/category_encoder.pkl', 'wb') as f:
        pickle.dump(le_category, f)
        
    # 4. Feature Engineering for Time Series / Anomaly Detection
    # Rolling Average of last 7 days for that category to detect spikes
    # For simplicity in this script, we'll just do rolling avg on 'Amount' irrespective of category for now
    # But for a real model, we might want per-category rolling windows.
    
    # Let's do a per-category rolling average
    df = df.sort_values(by=['Category', 'Date'])
    df['Category_Rolling_Mean_7d'] = df.groupby('Category')['Amount'].transform(lambda x: x.rolling(window=7, min_periods=1).mean())
    df['Category_Rolling_Std_7d'] = df.groupby('Category')['Amount'].transform(lambda x: x.rolling(window=7, min_periods=1).std().fillna(0))
    
    # Sort back by date
    df = df.sort_values('Date').reset_index(drop=True)
    
    # Save Processed Data
    os.makedirs('data/processed', exist_ok=True)
    output_path = 'data/processed/cleaned_transactions.csv'
    df.to_csv(output_path, index=False)
    
    print(f"Data preprocessing complete. Saved to {output_path}")
    print(df.head())

if __name__ == "__main__":
    preprocess_data()
