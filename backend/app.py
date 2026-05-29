from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
from textblob import TextBlob
from scipy.sparse import hstack

# =========================
# INIT APP
# =========================
app = FastAPI()

# CORS FIX (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD MODELS
# =========================
svm = joblib.load("svm_model.pkl")
rf = joblib.load("rf_model.pkl")
vectorizer = joblib.load("tfidf.pkl")

suicide_terms = [
    "suicide","kill","die","hopeless",
    "worthless","end","pain","depressed"
]

# =========================
# REQUEST FORMAT
# =========================
class Message(BaseModel):
    text: str

# =========================
# PREPROCESS FUNCTION
# =========================
def preprocess(text):
    X_tfidf = vectorizer.transform([text])
    sentiment = TextBlob(text).sentiment.polarity
    lexicon_count = sum([text.lower().count(t) for t in suicide_terms])
    X_extra = np.array([[sentiment, lexicon_count]])
    return hstack([X_tfidf, X_extra])

# =========================
# HOME
# =========================
@app.get("/")
def home():
    return {"status": "API running"}

# =========================
# PREDICT
# =========================
@app.post("/predict")
def predict(msg: Message):
    X = preprocess(msg.text)

    svm_prob = svm.predict_proba(X)[:,1][0]
    rf_prob = rf.predict_proba(X)[:,1][0]
    final_prob = (svm_prob + rf_prob) / 2

    if final_prob > 0.5:
        label = "SUICIDE RISK"
    else:
        label = "NON-RISK"

    return {
        "prediction": label,
        "confidence": float(final_prob)
    }