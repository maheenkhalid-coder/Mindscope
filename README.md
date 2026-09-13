# 🧠 Mindscope — Mental Health Score Prediction

> An end-to-end Machine Learning application that predicts a student's **Mental Health Score** based on social media usage, lifestyle habits, study time, sleep, physical activity, and stress level.

## 📌 About

**Mindscope** is a **Regression** project using student social media and lifestyle data to predict a continuous `Mental_Health_Score`.

**Dataset:** 5,000 students with demographic, social media, lifestyle, education, and stress-related features.

## 🔄 Machine Learning Workflow

```text
Data Understanding
      ↓
EDA & Data Cleaning
      ↓
Feature Engineering
      ↓
Preprocessing
      ↓
Model Training
      ↓
Model Evaluation
      ↓
FastAPI Backend
      ↓
Interactive Web Frontend
```

## 🤖 Model

Several regression models were evaluated:

* Linear Regression
* Random Forest Regressor
* Random Forest with Hyperparameter Tuning

### 🏆 Final Model: Random Forest Regressor

| Metric  |     Score |
| ------- | --------: |
| Test R² | **0.878** |
| MAE     | **0.347** |
| RMSE    | **0.463** |

The default Random Forest achieved the best test performance and was selected as the final model.

## 🛠️ Technologies

* **Python**
* **Pandas & NumPy**
* **Scikit-learn**
* **Matplotlib & Seaborn**
* **FastAPI & Uvicorn**
* **HTML, CSS & JavaScript**
* **Joblib**
* **Git & GitHub**

## 📁 Project Structure

```text
Mindscope/
│
├── README.md
├── student_mental_health.csv
├── mindscope_model.ipynb
├── mindscope_model.pkl
├── requirements.txt
│
├── backend/
│   └── main.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## ⚠️ Disclaimer

Mindscope is an **educational Machine Learning project** and is not a medical or psychological diagnostic tool.
