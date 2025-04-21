"""
International Trade Flow Predictor - Full Application for Hugging Face Spaces
"""
from flask import Flask, render_template, request, jsonify
import os
import json
import requests
import pandas as pd
import numpy as np
import time
from dotenv import load_dotenv
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file if it exists
load_dotenv()

# Log environment for debugging
logger.info(f"Environment variables: HUGGINGFACE_API_TOKEN exists: {'HUGGINGFACE_API_TOKEN' in os.environ}")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")

# Initialize Flask app
app = Flask(__name__)

# Import the llm_assistant module
try:
    from llm_assistant import TradeAssistant
    logger.info("Successfully imported TradeAssistant")
except Exception as e:
    logger.error(f"Error importing TradeAssistant: {str(e)}")
    
    # Create a fallback class if import fails
    class TradeAssistant:
        def __init__(self, api_token=None):
            self.api_token = api_token
            
        def query(self, user_question, chat_history=None, include_app_context=True):
            return {
                "success": False,
                "response": "The AI assistant is temporarily unavailable. Please check the application logs for details.",
                "message": "Import error"
            }
            
        def format_chat_history(self, chat_history_raw):
            return []
            
        def enhance_query_with_context(self, query):
            return query
            
        def explain_hs_code(self, code):
            return {
                "success": False,
                "response": "HS code explanation is temporarily unavailable.",
                "message": "Import error"
            }
            
        def get_trade_recommendation(self, country=None, product=None, year=None):
            return {
                "success": False,
                "response": "Trade recommendations are temporarily unavailable.",
                "message": "Import error"
            }

# Initialize the AI Assistant
trade_assistant = TradeAssistant(api_token=os.environ.get("HUGGINGFACE_API_TOKEN"))

# Import comtradeapicall module for data access
try:
    import comtradeapicall
    logger.info("Successfully imported comtradeapicall module")
    data_api_available = True
except Exception as e:
    logger.error(f"Error importing comtradeapicall module: {str(e)}")
    data_api_available = False

# Set up API access functions with proper error handling
def get_countries():
    """Get list of countries for the UI"""
    try:
        if data_api_available:
            return comtradeapicall.get_country_list()
        else:
            # Fallback data if API module is not available
            return [
                {"code": "842", "name": "United States"},
                {"code": "156", "name": "China"},
                {"code": "276", "name": "Germany"},
                {"code": "392", "name": "Japan"},
                {"code": "250", "name": "France"}
            ]
    except Exception as e:
        logger.error(f"Error getting country list: {str(e)}")
        return [{"code": "842", "name": "United States"}]  # Minimal fallback

def get_product_codes():
    """Get list of product codes for the UI"""
    try:
        if data_api_available:
            return comtradeapicall.get_commodity_list()
        else:
            # Fallback data if API module is not available
            return [
                {"code": "TOTAL", "description": "All Commodities"},
                {"code": "01", "description": "Live animals"}, 
                {"code": "85", "description": "Electrical machinery and equipment"}
            ]
    except Exception as e:
        logger.error(f"Error getting product codes: {str(e)}")
        return [{"code": "TOTAL", "description": "All Commodities"}]  # Minimal fallback

def query_comtrade(params):
    """Query the COMTRADE API with the given parameters"""
    try:
        if not data_api_available:
            logger.warning("COMTRADE API module not available, using fallback data")
            return {"data": [], "status": "error", "message": "COMTRADE API module not available"}
            
        # Extract parameters
        period = params.get('period', '2022')
        reporter_code = params.get('reporter', '842')  # Default to USA
        partner_code = params.get('partner', '156')    # Default to China
        cmd_code = params.get('commodity', 'TOTAL')    # Default to all commodities
        flow_code = params.get('flow')                 # Can be 'X', 'M', or None for both
        
        # Query the API
        logger.info(f"Querying COMTRADE API with params: {params}")
        df = comtradeapicall.previewFinalData(
            typeCode='C',
            freqCode='A',
            clCode='HS',
            period=period,
            reporterCode=reporter_code,
            partnerCode=partner_code,
            cmdCode=cmd_code,
            flowCode=flow_code,
            maxRecords=500,
            format_output='JSON',
            includeDesc=True
        )
        
        # Check if we got valid data
        if 'message' in df.columns and df.shape[0] > 0 and 'error' in df.iloc[0]['message'].lower():
            logger.warning(f"COMTRADE API returned an error: {df.iloc[0]['message']}")
            return {"data": [], "status": "error", "message": df.iloc[0]['message']}
            
        # Process the data
        return {"data": df.to_dict('records'), "status": "success"}
    except Exception as e:
        logger.error(f"Error querying COMTRADE API: {str(e)}")
        return {"data": [], "status": "error", "message": str(e)}

def clean_comtrade_data(data):
    """Clean and process data from the COMTRADE API"""
    try:
        if isinstance(data, dict) and "data" in data:
            df = pd.DataFrame(data["data"])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = pd.DataFrame(data)
            
        # Handle empty data
        if df.empty:
            return df
            
        # Standardize column names
        cols_to_keep = [
            'rtCode', 'rtTitle', 'ptCode', 'ptTitle', 'yr', 'rgCode', 'rgDesc',
            'cmdCode', 'cmdDesc', 'TradeValue', 'NetWeight', 'Quantity'
        ]
        
        # Keep only columns that exist in the data
        existing_cols = [col for col in cols_to_keep if col in df.columns]
        df = df[existing_cols]
        
        return df
    except Exception as e:
        logger.error(f"Error cleaning COMTRADE data: {str(e)}")
        return pd.DataFrame()  # Return empty DataFrame on error

def predict_trade(data, model_type):
    return {"predictions": [], "status": "placeholder"}

def export_data(data, format_type):
    return "placeholder_data"

def get_ml_models():
    return ["Linear Regression", "Random Forest"]

def train_ml_model(data, model_type):
    return {"status": "success", "message": "Model trained successfully"}

def get_cached_data():
    return {"status": "success", "data": {}}

def get_trade_rankings():
    return {"status": "success", "rankings": []}

def get_top_trade_partners(country_code):
    return {"status": "success", "partners": []}

# Home page
@app.route('/')
def index():
    return render_template('index.html')

# AI Assistant endpoints
@app.route('/api/assistant/query', methods=['POST'])
def assistant_query():
    data = request.json
    
    # Get the user question from request
    user_question = data.get('question', '')
    
    # Validate input
    if not user_question:
        return jsonify({
            'success': False,
            'response': '',
            'message': 'No question provided'
        })
        
    # Get chat history if provided
    chat_history_raw = data.get('chatHistory', [])
    
    # Format chat history for the LLM
    chat_history = trade_assistant.format_chat_history(chat_history_raw)
    
    # Enhance query with additional context if applicable
    enhanced_question = trade_assistant.enhance_query_with_context(user_question)
    
    # Send query to the LLM
    response = trade_assistant.query(enhanced_question, chat_history)
    
    # Return the response
    return jsonify(response)

# API endpoint for HS code explanation
@app.route('/api/assistant/explain-hs-code', methods=['POST'])
def explain_hs_code():
    data = request.json
    
    # Get the HS code from request
    hs_code = data.get('code', '')
    
    # Validate input
    if not hs_code:
        return jsonify({
            'success': False,
            'response': '',
            'message': 'No HS code provided'
        })
        
    # Send to specific HS code explanation function
    response = trade_assistant.explain_hs_code(hs_code)
    
    # Return the response
    return jsonify(response)

# API endpoint for trade recommendations
@app.route('/api/assistant/get-recommendation', methods=['POST'])
def get_recommendation():
    data = request.json
    
    # Get parameters
    country = data.get('country', None)
    product = data.get('product', None)
    year = data.get('year', None)
    
    # At least one parameter should be provided
    if not country and not product and not year:
        return jsonify({
            'success': False,
            'response': '',
            'message': 'Please provide at least one parameter (country, product, or year)'
        })
        
    # Get recommendation
    response = trade_assistant.get_trade_recommendation(country, product, year)
    
    # Return the response
    return jsonify(response)

if __name__ == "__main__":
    # Hugging Face Spaces uses port 7860 by default
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port)
