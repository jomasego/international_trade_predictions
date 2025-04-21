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

# Import the primary app functionality
# This avoids having to duplicate all the code
from app import (get_countries, get_product_codes, query_comtrade, 
                clean_comtrade_data, predict_trade, export_data, 
                get_ml_models, train_ml_model, get_cached_data, 
                get_trade_rankings, get_top_trade_partners)

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
