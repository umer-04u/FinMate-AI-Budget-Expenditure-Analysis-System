import os
import pickle
from typing import List, Optional

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("Warning: google-generativeai not found. Chat features will be disabled.")
except AttributeError:
    # Handle the specific 'packages_distributions' error on Python < 3.10
    HAS_GEMINI = False
    print("Warning: google-generativeai failed to load (Python version incompatibility). Chat features disabled.")
import numpy as np
import pandas as pd
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Budget Analysis AI API")

# --- CORS Configuration ---
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Models ---
# Ideally these should be loaded once at startup
MODELS = {}
CHAT_MODEL = None

# --- Environment & Gemini ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# Static files mount moved to the end


def load_models():
    model_dir = "../models"
    try:
        with open(f"{model_dir}/anomaly_model.pkl", "rb") as f:
            MODELS["anomaly"] = pickle.load(f)
        with open(f"{model_dir}/spending_forecaster.pkl", "rb") as f:
            MODELS["forecast"] = pickle.load(f)
        with open(f"{model_dir}/merchant_categorizer.pkl", "rb") as f:
            MODELS["categorizer"] = pickle.load(f)
        with open(f"{model_dir}/merchant_vectorizer.pkl", "rb") as f:
            MODELS["vectorizer"] = pickle.load(f)
        with open(f"{model_dir}/category_encoder.pkl", "rb") as f:
            MODELS["encoder"] = pickle.load(f)
        print("All models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")
        # In production this might be fatal, but for dev we continue
        pass


def build_spend_snapshot():
    """
    Load recent transactions and build a short summary of top spending categories.
    Returns a string to be injected into the chat prompt, or None on failure.
    """
    data_path = "../data/processed/cleaned_transactions.csv"
    if not os.path.exists(data_path):
        return None
    try:
        df = pd.read_csv(data_path)
        if df.empty or "Category" not in df.columns or "Amount" not in df.columns:
            return None

        # Prefer expense rows if the flag exists
        if "Is_Expense" in df.columns:
            df = df[df["Is_Expense"] == True]

        # Guard against bad data
        df = df.replace([np.inf, -np.inf], np.nan).dropna(subset=["Amount", "Category"])

        top = (
            df.groupby("Category")["Amount"]
            .sum()
            .sort_values(ascending=False)
            .head(3)
        )
        if top.empty:
            return None

        lines = [f"{cat}: {amt:,.0f}" for cat, amt in top.items()]
        total = df["Amount"].sum()
        return (
            "Recent spending summary from your transactions:\n"
            f"- Total spend (all recorded): {total:,.0f}\n"
            f"- Top categories:\n  - " + "\n  - ".join(lines)
        )
    except Exception as e:
        print(f"Failed to build spend snapshot: {e}")
        return None


def init_chat_model():
    """
    Initialize the Gemini model if an API key is available.
    """
    global CHAT_MODEL
    if not HAS_GEMINI:
        print("Skipping Gemini init: Library not loaded.")
        return
        
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set; chat endpoint will return 503.")
        return
    try:
        genai.configure(api_key=GEMINI_API_KEY)

        def list_available_models():
            models = [
                m.name for m in genai.list_models()
                if "generateContent" in getattr(m, "supported_generation_methods", [])
            ]
            print(f"Gemini models available for generateContent: {models}")
            return models

        def normalize(name: str) -> str:
            return name if name.startswith("models/") else f"models/{name}"

        available = list_available_models()

        # Allow explicit override; only use if present in available.
        env_model = os.getenv("GEMINI_MODEL")
        if env_model:
            candidate = normalize(env_model)
            if candidate in available:
                try:
                    CHAT_MODEL = genai.GenerativeModel(candidate)
                    print(f"Gemini chat model initialized (env override): {candidate}")
                    return
                except Exception as e:
                    print(f"Env override model failed: {candidate} -> {e}. Falling back to auto-select.")
            else:
                print(f"Env override model not available to this key: {candidate}. Falling back to auto-select.")

        # Auto-detect supported models (generateContent)
        preferred = [
            # Stable GA models (Higher limits)
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-001",
            "models/gemini-1.5-flash-002",
            "models/gemini-1.5-pro",
            "models/gemini-1.5-pro-001",
            "models/gemini-1.5-pro-002",
            "models/gemini-pro", 
            "models/gemini-1.0-pro",
            # Newer previews (might have stricter limits)
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            # Backward-compatible fallbacks
            "models/gemini-flash-latest",
            "models/gemini-pro-latest",
        ]
        chosen = None
        for pref in preferred:
            if pref in available:
                chosen = pref
                break
        if not chosen and available:
            chosen = available[0]

        if not chosen:
            print("No Gemini models with generateContent available for this API key.")
            CHAT_MODEL = None
            return

        CHAT_MODEL = genai.GenerativeModel(chosen)
        print(f"Gemini chat model initialized: {chosen}")
    except Exception as e:
        print(f"Failed to initialize Gemini model: {e}")
        CHAT_MODEL = None

@app.on_event("startup")
async def startup_event():
    load_models()
    init_chat_model()

# --- Pydantic Models for Input ---
class TransactionInput(BaseModel):
    amount: float
    category: str
    date: str # YYYY-MM-DD
    merchant: Optional[str] = None

class CategorizeInput(BaseModel):
    merchant: str

class ChatInput(BaseModel):
    query: str

# --- Endpoints ---


# --- Helpers ---
def clean_currency(val):
    if isinstance(val, str):
        cleaned = pd.Series(val).str.replace(r'[^\d.-]', '', regex=True).values[0]
        return cleaned
    return val

def is_mostly_numeric(series):
    clean = series.astype(str).str.replace(r'[^\d.-]', '', regex=True)
    numeric = pd.to_numeric(clean, errors='coerce')
    return numeric.notna().mean() > 0.5

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    try:
        data_path = "../data/processed/cleaned_transactions.csv"
        
        # Save temp
        temp_path = f"../data/processed/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        new_df = pd.read_csv(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Robust Logic
        required_cols = {"Date", "Merchant", "Amount"}
        
        # 1. Check strict columns
        if not required_cols.issubset(new_df.columns):
            # 2. Smart Swap Heuristic
            if "Amount" in new_df.columns and "Category" in new_df.columns:
                if not is_mostly_numeric(new_df["Amount"]) and is_mostly_numeric(new_df["Category"]):
                    new_df.rename(columns={'Amount': 'Temp', 'Category': 'Amount'}, inplace=True)
                    new_df.rename(columns={'Temp': 'Category'}, inplace=True)

        # 3. Currency Cleaning
        if "Amount" in new_df.columns:
            new_df["Amount"] = new_df["Amount"].apply(clean_currency)
            new_df["Amount"] = pd.to_numeric(new_df["Amount"], errors="coerce")

        # 4. Fill defaults
        if "Merchant" not in new_df.columns: new_df["Merchant"] = "Unknown"
        if "Category" not in new_df.columns: new_df["Category"] = "Uncategorized"
        
        new_df["Merchant"] = new_df["Merchant"].fillna("Unknown")
        new_df["Category"] = new_df["Category"].fillna("Uncategorized")
        new_df["Amount"] = new_df["Amount"].fillna(0)
        
        # 5. Date Parsing
        if "Date" in new_df.columns:
            new_df["Date"] = pd.to_datetime(new_df["Date"], dayfirst=True, errors="coerce")
            new_df.dropna(subset=["Date"], inplace=True)
            new_df["Month"] = new_df["Date"].dt.strftime("%Y-%m")
            new_df["Date"] = new_df["Date"].dt.strftime("%Y-%m-%d")
            
        new_df["Is_Expense"] = True
        new_df["Is_Anomaly"] = False # Default

        # Append
        if os.path.exists(data_path):
            existing = pd.read_csv(data_path)
            combined = pd.concat([existing, new_df], ignore_index=True)
            combined.to_csv(data_path, index=False)
        else:
            new_df.to_csv(data_path, index=False)
            
        return {"message": "CSV uploaded and merged successfully", "count": len(new_df)}

    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Budget Analysis AI API is running"}

@app.post("/analyze/anomaly")
def check_anomaly(transaction: TransactionInput):
    """
    Checks if a single transaction is an anomaly.
    """
    if "anomaly" not in MODELS:
        raise HTTPException(status_code=503, detail="Anomaly model not loaded")
    
    # Preprocess Input
    # We need to match features trained on: Amount, Category_Encoded, DayOfWeek, IsWeekend
    try:
        # Encode Category
        if "encoder" in MODELS:
            try:
                cat_encoded = MODELS["encoder"].transform([transaction.category])[0]
            except:
                cat_encoded = -1 # Unknown category
        else:
            cat_encoded = 0
            
        dt = pd.to_datetime(transaction.date)
        day_of_week = dt.dayofweek
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Prepare Feature Vector
        features = [[transaction.amount, cat_encoded, day_of_week, is_weekend]]
        
        # Predict
        prediction = MODELS["anomaly"].predict(features)[0]
        # -1 is anomaly, 1 is normal
        is_anomaly = True if prediction == -1 else False
        
        return {
            "is_anomaly": is_anomaly,
            "confidence": "High" # Isolation forest decision function could vary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/spending")
def predict_spending(prev_month_spend: float):
    """
    Predicts next month's spending based on previous month.
    """
    if "forecast" not in MODELS:
        raise HTTPException(status_code=503, detail="Forecast model not loaded")
    
    try:
        # Our simple model trained on MonthIndex and PrevMonthSpend
        # For this API, let's just use a dummy MonthIndex (e.g., 12) or try to adapt
        # Ideally we'd pass the full history. 
        # Since we trained on MonthIndex + Prev, let's assume next month is index 25 (arbitrary future)
        # In a real app we'd track time.
        
        features = [[25, prev_month_spend]] 
        prediction = MODELS["forecast"].predict(features)[0]
        
        return {"predicted_spend": round(prediction, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/categorize")
def categorize_merchant(input_data: CategorizeInput):
    """
    Predicts category for a given merchant name.
    """
    try:
        text = (input_data.merchant or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="merchant is required")

        # --- Rule-based overrides for free-form inputs (non-merchant names) ---
        # Normalize
        lower = text.lower()
        keyword_rules = [
            (["medicine", "medicin", "pharmacy", "chemist", "drug", "tablet", "capsule", "hospital", "clinic"], "Health"),
            (["egg", "grocery", "supermarket", "market", "mart", "vegetable", "fruit"], "Groceries"),
            (["fine", "penalty", "challan", "ticket"], "Fees & Fines"),
            (["fuel", "petrol", "diesel", "gas station", "pump"], "Transport"),
            (["uber", "ola", "lyft", "cab", "taxi"], "Transport"),
        ]
        for keywords, cat in keyword_rules:
            if any(k in lower for k in keywords):
                return {"merchant": input_data.merchant, "category": cat, "source": "rule"}

        # --- ML fallback ---
        if "categorizer" not in MODELS or "vectorizer" not in MODELS:
            raise HTTPException(status_code=503, detail="Categorization model not loaded")

        vectorized_text = MODELS["vectorizer"].transform([text]).toarray()
        pred_encoded = MODELS["categorizer"].predict(vectorized_text)[0]
        pred_label = MODELS["encoder"].inverse_transform([pred_encoded])[0]
        
        return {"merchant": input_data.merchant, "category": pred_label, "source": "model"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
def get_transactions():
    """
    Returns transaction history for the dashboard.
    """
    try:
        # Load from the processed CSV used by the original app
        # Adjust path as needed relative to backend/main.py
        data_path = "../data/processed/cleaned_transactions.csv"
        if os.path.exists(data_path):
            df = pd.read_csv(data_path)
            
            # Simple, robust way to handle NaN/Inf for JSON compliance:
            # Convert to dict first, then recursively clean.
            records = df.to_dict(orient="records")
            
            def clean_nan(obj):
                if isinstance(obj, float):
                    if np.isnan(obj) or np.isinf(obj):
                        return None
                elif isinstance(obj, dict):
                    return {k: clean_nan(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [clean_nan(i) for i in obj]
                return obj
                
            cleaned_records = [clean_nan(record) for record in records]
            return cleaned_records
        else:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transactions")
def add_transaction(transaction: TransactionInput):
    """
    Adds a new transaction to the CSV file.
    """
    try:
        data_path = "../data/processed/cleaned_transactions.csv"
        
        # Create a new record
        new_record = {
            "Date": transaction.date,
            "Description": transaction.merchant if transaction.merchant else "Unknown",
            "Amount": transaction.amount,
            "Category": transaction.category,
            "Is_Expense": True,
            "Month": pd.to_datetime(transaction.date).strftime("%Y-%m"),
            "Is_Anomaly": False # Default
        }
        
        # Append to CSV
        if os.path.exists(data_path):
            df = pd.read_csv(data_path)
            new_df = pd.DataFrame([new_record])
            df = pd.concat([df, new_df], ignore_index=True)
            df.to_csv(data_path, index=False)
            return {"message": "Transaction added successfully"}
        else:
             # Create new if doesn't exist
            df = pd.DataFrame([new_record])
            df.to_csv(data_path, index=False)
            return {"message": "Transaction file created and transaction added"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
@app.post("/chat")
def chat_endpoint(input_data: ChatInput):
    """
    Chat with the AI financial advisor.
    """
    if not CHAT_MODEL:
        raise HTTPException(status_code=503, detail="Chat model not initialized")

    try:
        # Build Context
        context = build_spend_snapshot() or "No recent transaction data available."
        
        system_prompt = (
            "You are FinMate, a helpful and friendly financial assistant. "
            "You have access to the user's recent spending summary below. "
            "Use this context to answer questions if relevant. "
            "If the user asks about something else, just answer normally. "
            "Keep answers concise and practical.\n\n"
            f"CONTEXT:\n{context}\n\n"
            f"USER QUERY: {input_data.query}"
        )
        
        response = CHAT_MODEL.generate_content(system_prompt)
        
        # Safety check
        if response.candidates and response.candidates[0].content.parts:
             return {"response": response.text}
        else:
             return {"response": "I'm sorry, I couldn't generate a response for that query due to safety settings."}

    except Exception as e:
        print(f"Chat generation failed: {e}")
        # Return a friendly error instead of 500
        return {"response": "I'm having trouble thinking right now. Please try again."}

# --- Serve built frontend if present (for single-container deploys) ---
# MOUNTED LAST to avoid intercepting API routes
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend-react", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    print("Frontend dist not found; API-only mode.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
