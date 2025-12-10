# Architecture & Technology Stack Vision

## System Architecture Diagram (Conceptual)

```mermaid
graph TD
    User[User] -->|Interacts| Frontend[React Frontend (UI)]
    Frontend -->|HTTPS/JSON| Backend[FastAPI Backend]
    
    subgraph "Backend Services"
        Backend -->|Auth/Data| DB[(PostgreSQL/SQLite)]
        Backend -->|Inference| ML_Engine[ML Inference Engine]
    end
    
    subgraph "Data & ML Pipeline"
        RawData[Raw CSV/User Input] -->|Pandas| Preprocessing[Preprocessing Module]
        Preprocessing -->|Features| Training[Model Training (Scikit-Learn/Keras)]
        Training -->|Serialized Models| ModelRegistry[Model Store (.pkl)]
        ModelRegistry --> ML_Engine
    end
    
    ML_Engine -->|Predictions| Backend
    ML_Engine -->|Anomalies| Backend
```

## Technology Stack Selection

### 1. Frontend (The "Face")
- **Framework**: **React.js** (Vite) + Tailwind CSS.
    - *Why?* Allows for the "Premium," "Rich Aesthetic," and "Dynamic" feel requested. Streamlit is good for prototyping but often lacks the polish for a "WOW" final year project UI.
- **Charts**: **Recharts** or **Chart.js**.
- **State Management**: React Context or Zustand.

### 2. Backend (The "Brain")
- **Framework**: **FastAPI** (Python).
    - *Why?* High performance, native async support, excellent automated documentation (Swagger UI), and seamless integration with Python ML libraries.
- **Database**: **SQLite** (Dev) -> **PostgreSQL** (Prod recommended, but SQLite fine for local project).
    - *Why?* Relational data (Users, Transactions, Budgets) fits SQL perfectly.
- **ORM**: **SQLAlchemy** or **Prisma**.

### 3. Machine Learning (The "Intelligence")
- **Language**: **Python**.
- **Libraries**:
    - **Pandas/NumPy**: Data manipulation.
    - **Scikit-Learn**: Isolation Forest (Anomalies), Linear Regression (Simple Predictions), LabelEncoder (Categorization).
    - **TensorFlow/Keras** (Optional): LSTM if complex time-series prediction is needed (though often overkill for simple budgets, we will attempt it for the "Final Year Project" complexity points).

### 4. AI Chatbot
- **LP Framework**: **LangChain** (Simple) or custom rule-based + intent matching.
- **Model**: Integration with a light LLM API (Gemini/OpenAI) if allowed, or a pre-trained simple intents model if offline. *For this project, we will design basic intent-based responses first.*

## Deployment (Local/Concept)
- Docker containers for Backend and Frontend.
