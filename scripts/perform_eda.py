import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def perform_eda():
    # Load Data
    df = pd.read_csv('data/raw/transactions.csv')
    
    # Create directory for images if not exists
    os.makedirs('data/veda_images', exist_ok=True) # VEDA = Visual EDA
    
    # 1. Distribution of Categories
    plt.figure(figsize=(10, 6))
    spending_df = df[df['Is_Expense'] == True]
    sns.countplot(data=spending_df, y='Category', order=spending_df['Category'].value_counts().index)
    plt.title('Distribution of Transactions by Category')
    plt.savefig('data/veda_images/category_distribution.png')
    plt.close()
    
    # 2. Monthly Spending Trend
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.to_period('M')
    monthly_spend = df[df['Is_Expense'] == True].groupby('Month')['Amount'].sum()
    
    plt.figure(figsize=(12, 6))
    monthly_spend.plot(kind='bar', color='skyblue')
    plt.title('Total Occurred Spending per Month')
    plt.xlabel('Month')
    plt.ylabel('Total Spend ($)')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('data/veda_images/monthly_trend.png')
    plt.close()
    
    # 3. Anomalies Visualization
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=spending_df, x='Category', y='Amount', hue='Is_Anomaly', palette={False: 'blue', True: 'red'}, alpha=0.6)
    plt.title('Anomalies in Spending (Red dots are anomalies)')
    plt.savefig('data/veda_images/anomalies_scatter.png')
    plt.close()
    
    print("EDA completed. Images saved in 'data/veda_images/'.")

if __name__ == "__main__":
    perform_eda()
