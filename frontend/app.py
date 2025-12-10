import streamlit as st
import requests
import pandas as pd
import plotly.express as px

# Configuration
API_URL = "http://localhost:8000"

st.set_page_config(
    page_title="Budget Analysis AI",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for "Premium" feel
st.markdown("""
<style>
    .reportview-container {
        background: #0e1117;
        color: #ffffff;
    }
    .main {
        background-color: #0e1117;
    }
    h1, h2, h3 {
        color: #38bdf8 !important;
    }
    .stButton>button {
        background-color: #38bdf8;
        color: white;
        border-radius: 8px;
        border: none;
    }
</style>
""", unsafe_allow_html=True)

st.title("💰 AI-Powered Budget Master")
st.markdown("### Intelligent Financial Tracking & Analysis")

# Sidebar
st.sidebar.header("Actions")
currency = st.sidebar.selectbox("Select Currency", ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)"])
currency_symbol = currency.split("(")[1].replace(")", "")
conversion_rates = {"INR (₹)": 1, "USD ($)": 0.012, "EUR (€)": 0.011, "GBP (£)": 0.0095} # Approx rates from INR
rate = conversion_rates[currency]

page = st.sidebar.radio("Navigate", ["Dashboard", "Add Transaction", "Predict Future", "AI Chatbot"])

if page == "Dashboard":
    st.header(f"Financial Dashboard ({currency_symbol})")
    
    # In a real app, we'd fetch this from the backend database
    # For now, let's load the CSV we generated to show stats
    try:
        # We'll read the processed file directly for demo purposes
        # Ideally, the API serves this data
        df = pd.read_csv("data/processed/cleaned_transactions.csv")
        
        # Key Metrics
        total_spend = df[df['Is_Expense'] == True]['Amount'].sum() * rate
        avg_monthly = (total_spend / df['Month'].nunique()) 
        
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Lifetime Spend", f"{currency_symbol}{total_spend:,.2f}")
        col2.metric("Avg Monthly Spend", f"{currency_symbol}{avg_monthly:,.2f}")
        col3.metric("Total Transactions", len(df))
        
        # Charts
        col_c1, col_c2 = st.columns(2)
        
        with col_c1:
            st.subheader("Spending by Category")
            fig_cat = px.pie(df[df['Is_Expense']==True], values='Amount', names='Category', hole=0.4,
                             color_discrete_sequence=px.colors.sequential.RdBu)
            st.plotly_chart(fig_cat, use_container_width=True)
            
        with col_c2:
            st.subheader("Monthly Trend")
            df['Date'] = pd.to_datetime(df['Date'])
            monthly_data = df.groupby(df['Date'].dt.to_period("M").astype(str))['Amount'].sum().reset_index()
            monthly_data.columns = ['Month', 'Amount']
            fig_bar = px.bar(monthly_data, x='Month', y='Amount', color='Amount')
            st.plotly_chart(fig_bar, use_container_width=True)
            
    except Exception as e:
        st.error(f"Could not load data: {e}")

elif page == "Add Transaction":
    st.header("Add New Transaction")
    
    with st.form("transaction_form"):
        merchant = st.text_input("Merchant Name", placeholder="e.g. Starbucks")
        amount_input = st.number_input(f"Amount ({currency_symbol})", min_value=0.01, format="%.2f")
        date = st.date_input("Date")
        
        # We want to send the amount in INR to the backend if the model expects INR
        # Or we act as if the backend is unit-agnostic. 
        # Models are trained on INR. So if user enters USD, we should convert to INR for backend check?
        # For simplicity, let's assume user enters value in INR if INR is selected, or we convert back.
        amount_inr = amount_input / rate

        # Auto-Category Check
        if st.form_submit_button("Analyze & Add"):
            if merchant and amount_input:
                # 1. Get Category
                try:
                    cat_res = requests.post(f"{API_URL}/categorize", json={"merchant": merchant})
                    category = cat_res.json().get("category", "Uncategorized")
                    st.info(f"Auto-Categorized as: **{category}**")
                    
                    # 2. Check Anomaly (Send INR amount to model)
                    anom_payload = {
                        "amount": amount_inr,
                        "category": category,
                        "date": str(date),
                        "merchant": merchant
                    }
                    anom_res = requests.post(f"{API_URL}/analyze/anomaly", json=anom_payload)
                    is_anomaly = anom_res.json().get("is_anomaly", False)
                    
                    if is_anomaly:
                        st.error("⚠️ ALERT: This transaction is flagged as an ANOMALY based on your history!")
                    else:
                        st.success("Transaction looks normal.")
                        
                    st.toast("Transaction Added! (Simulated)")
                except Exception as e:
                    st.error(f"API Connection Error: {e}")
            else:
                st.warning("Please fill details.")

elif page == "Predict Future":
    st.header("🔮 AI Spending Forecast")
    
    st.markdown("Predict your total spending for next month based on recent trends.")
    
    prev_spend_input = st.number_input(f"Enter Last Month's Spend ({currency_symbol})", value=20000.00 if rate == 1 else 250.00)
    prev_spend_inr = prev_spend_input / rate

    if st.button("Generate Prediction"):
        try:
            res = requests.post(f"{API_URL}/predict/spending", params={"prev_month_spend": prev_spend_inr})
            val_inr = res.json().get("predicted_spend")
            if val_inr:
                val_converted = val_inr * rate
                st.success(f"📉 Predicted Spend for Next Month: **{currency_symbol}{val_converted:,.2f}**")
            else:
                st.error("Could not get prediction.")
        except Exception as e:
            st.error(f"Error: {e}")

elif page == "AI Chatbot":
    st.header("💬 Financial Assistant")
    
    user_query = st.text_input("Ask me anything about your finances...")
    if user_query:
        st.write("🤖 AI: That's a great question! (Chatbot logic placeholder)")
