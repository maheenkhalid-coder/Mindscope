# import joblib to load the trained machine learning model
import joblib

# import pandas to create the input DataFrame
import pandas as pd

# import FastAPI to create the API
from fastapi import FastAPI

# import Pydantic for input validation
from pydantic import BaseModel, Field

# import Literal to restrict input values to specific categories
from typing import Literal

# import CORS middleware to allow requests from different origins
from fastapi.middleware.cors import CORSMiddleware


# load the trained model pipeline saved from Google Colab
# the pipeline already contains preprocessing + Random Forest
model = joblib.load('Mindscope_model.pkl')


# create the FastAPI application
app = FastAPI()


# enable CORS so the API can receive requests from different applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # allow requests from any origin
    allow_methods=["*"],    # allow all HTTP methods
    allow_headers=["*"],    # allow all HTTP headers
)


# define the structure and validation rules for input data
class StudentData(BaseModel):

    # age must be between 10 and 100
    age: int = Field(..., ge=10, le=100)

    # gender can only be Male or Female
    gender: Literal['Male', 'Female']

    # country can be any country name
    country: str

    # academic level must be one of these categories
    academic_level: Literal['Undergraduate', 'Graduate', 'High School']

    # platform must match one of the categories used in the dataset
    most_used_platform: Literal[
        'Facebook', 'LinkedIn', 'Instagram', 'Snapchat',
        'Twitter', 'YouTube', 'TikTok', 'LINE',
        'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat'
    ]

    # purpose of use must match one of the training categories
    purpose_of_use: Literal[
        'Networking', 'Education', 'Entertainment', 'News'
    ]

    # daily usage must be between 0 and 24 hours
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)

    # number of daily unlocks cannot be negative
    daily_unlocks: int = Field(..., ge=0)

    # study hours must be between 0 and 24
    study_hours: float = Field(..., ge=0, le=24)

    # physical activity hours must be between 0 and 24
    physical_activity_hours: float = Field(..., ge=0, le=24)

    # sleep hours must be between 0 and 24
    sleep_hours_per_night: float = Field(..., ge=0, le=24)

    # stress level must match the categories used during training
    stress_level: Literal['Medium', 'Low', 'Very High', 'High']


# define the structure of the prediction returned by the API
class PredictionResponse(BaseModel):

    # predicted Mental Health Score returned as a number
    predicted_mental_health_score: float


# same country grouping used during model training
# top 10 countries are kept, all other countries become "Other"
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

# create a POST endpoint for making predictions
@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):

    # perform the same country grouping used during training
    country_group = data.country if data.country in top_countries else "Other"

    # create a DataFrame with the same feature structure used during training
    input_row = pd.DataFrame([{

        # numerical and categorical features
        'Age': data.age,
        'Gender': data.gender,
        'Country': data.country,
        'Academic_Level': data.academic_level,
        'Most_Used_Platform': data.most_used_platform,
        'Purpose_Of_Use': data.purpose_of_use,
        'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
        'Daily_Unlocks': data.daily_unlocks,
        'Study_Hours': data.study_hours,
        'Physical_Activity_Hours': data.physical_activity_hours,
        'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
        'Stress_Level': data.stress_level,

        # grouped country feature created during training
        'Grouped_country': country_group
    }])

    # send the input data through the saved ML pipeline
    # preprocessing is automatically applied inside the pipeline
    prediction = model.predict(input_row)[0]

    # return the predicted Mental Health Score
    # round the result to 2 decimal places
    return PredictionResponse(
        predicted_mental_health_score=round(float(prediction), 2)
    )


# Short Note

# In main.py file we creates a FastAPI backend for our trained Mental Health prediction model.

# Load the saved Mental_Health_Model.pkl
# Validate user input using Pydantic
# Convert the input into the same structure used during training
# Perform required feature engineering such as Grouped_country
# Send the input to the saved Random Forest pipeline
# Return the predicted Mental Health Score through the /predict API endpoint

# Simple flow:

# User Input → Validation → DataFrame → ML Pipeline → Prediction → API Response