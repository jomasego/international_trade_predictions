from flask import Flask, render_template, request, jsonify
import pandas as pd
import comtradeapicall
import ml_model
import llm_assistant
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

app = Flask(__name__)

# Home page with form
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to fetch trade data
@app.route('/api/trade', methods=['POST'])
def get_trade_data():
    data = request.json
    # Extract parameters with defaults
    reporter = data.get('reporterCode', '842')  # USA
    partner = data.get('partnerCode', '156')    # China
    period = data.get('period', '2022')
    cmd_code = data.get('cmdCode', 'TOTAL')
    flow_code = data.get('flowCode', None)
    try:
        df = comtradeapicall.previewFinalData(
            typeCode='C',
            freqCode='A',
            clCode='HS',
            period=period,
            reporterCode=reporter,
            partnerCode=partner,
            partner2Code=None,
            customsCode=None,
            motCode=None,
            cmdCode=cmd_code,
            flowCode=flow_code,
            maxRecords=500,
            format_output='JSON',
            aggregateBy=None,
            breakdownMode='classic',
            countOnly=None,
            includeDesc=True
        )
        import numpy as np
        df = df.replace([np.nan, np.inf, -np.inf], None)
        # Only send a preview (first 10 rows)
        return jsonify({
            'columns': list(df.columns),
            'rows': df.head(10).to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({'error': str(e)})

# API endpoint for ML prediction
@app.route('/api/predict', methods=['POST'])
def predict_trade():
    try:
        # Get request data with validation
        data = request.json
        if not data:
            return jsonify({
                'error': 'No JSON data received',
                'prediction': None,
                'historical': [],
                'model_type': None,
                'mse': None
            }), 400
        
        # Extract parameters with defaults
        reporter = data.get('reporterCode', '842')  # USA default
        partner = data.get('partnerCode', '156')    # China default
        cmd_code = data.get('cmdCode', 'TOTAL')     # All products default
        flow_code = data.get('flowCode', None)      # All flows default
        predict_year = int(data.get('period', 2023))
        model_type = data.get('modelType', 'linear')
        
        # Log the prediction request
        print(f"Prediction request: reporter={reporter}, partner={partner}, year={predict_year}, model={model_type}")
        
        # Input validation
        if not reporter or not partner:
            return jsonify({
                'error': 'Reporter and partner countries are required',
                'prediction': None,
                'historical': [],
                'model_type': model_type,
                'mse': None
            }), 400
            
        # Fetch historical data for training - with error handling
        import pandas as pd
        import numpy as np
        
        # Use 10 years of historical data
        years = [str(y) for y in range(predict_year-10, predict_year)]
        dfs = []
        
        for year in years:
            try:
                df_year = comtradeapicall.previewFinalData(
                    typeCode='C',
                    freqCode='A',
                    clCode='HS',
                    period=year,
                    reporterCode=reporter,
                    partnerCode=partner,
                    partner2Code=None,
                    customsCode=None,
                    motCode=None,
                    cmdCode=cmd_code,
                    flowCode=flow_code,
                    maxRecords=1000,
                    format_output='JSON',
                    aggregateBy=None,
                    breakdownMode='classic',
                    countOnly=None,
                    includeDesc=True
                )
                if not df_year.empty:
                    dfs.append(df_year)
            except Exception as year_err:
                print(f"Error fetching data for year {year}: {str(year_err)}")
                # Continue with other years
                
        # Check if we have any data
        if not dfs:
            return jsonify({
                'error': 'No historical data available for prediction',
                'prediction': None,
                'historical': [],
                'model_type': model_type,
                'prediction_year': predict_year,
                'mse': None
            }), 404
            
        # Combine historical data
        df = pd.concat(dfs, ignore_index=True)
        
        # Make prediction using machine learning model
        result = ml_model.train_and_predict(df, predict_year, partner, flow_code, model_type=model_type)
        
        # Ensure the result has the expected structure
        if isinstance(result, dict) and 'error' in result:
            return jsonify({
                'error': result['error'],
                'prediction': None,
                'historical': [],
                'model_type': model_type,
                'prediction_year': predict_year,
                'mse': None
            }), 400
            
        # Add prediction year to the result
        if isinstance(result, dict):
            result['prediction_year'] = predict_year
            
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"Prediction error: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            'error': str(e),
            'prediction': None,
            'historical': [],
            'model_type': None,
            'prediction_year': None,
            'mse': None
        }), 500

# Initialize the LLM assistant
trade_assistant = llm_assistant.TradeAssistant(api_token=os.environ.get("HUGGINGFACE_API_TOKEN"))

# API endpoint for LLM assistant
@app.route('/api/assistant', methods=['POST'])
def assistant_query():
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'response': '',
                'message': 'No data provided'
            }), 400
            
        # Get query and any chat history
        query = data.get('query', '')
        raw_chat_history = data.get('chat_history', [])
        
        if not query:
            return jsonify({
                'success': False,
                'response': '',
                'message': 'No query provided'
            }), 400
        
        # Enhance the query with additional context if needed
        enhanced_query = trade_assistant.enhance_query_with_context(query)
        
        # Format the chat history properly for the LLM API
        formatted_history = trade_assistant.format_chat_history(raw_chat_history)
        
        # Get response from the LLM assistant
        result = trade_assistant.query(enhanced_query, formatted_history)
        
        # Log successful queries for monitoring
        print(f"LLM Query: '{query}' => Success: {result.get('success', False)}")
        
        return jsonify(result)
        
    except Exception as e:
        import traceback
        print(f"Assistant error: {str(e)}")
        print(traceback.format_exc())
        
        # Provide a more user-friendly error message
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "token" in error_msg.lower():
            user_msg = "API key error: Please ensure your Hugging Face API token is correctly configured."
        elif "timeout" in error_msg.lower() or "connection" in error_msg.lower():
            user_msg = "Connection error: The LLM service is currently unavailable. Please try again later."
        else:
            user_msg = f"An error occurred: {str(e)}"
        
        return jsonify({
            'success': False,
            'response': '',
            'message': user_msg
        }), 500

# API endpoint for HS code explanation
@app.route('/api/explain_hs_code', methods=['POST'])
def explain_hs_code():
    try:
        data = request.json
        
        if not data or 'code' not in data:
            return jsonify({
                'success': False,
                'response': '',
                'message': 'No HS code provided'
            }), 400
            
        code = data.get('code', '')
        result = trade_assistant.explain_hs_code(code)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'response': '',
            'message': f"Error: {str(e)}"
        }), 500

# API endpoint for trade recommendations
@app.route('/api/recommend', methods=['POST'])
def get_recommendation():
    try:
        data = request.json
        
        country = data.get('country', None)
        product = data.get('product', None)
        year = data.get('year', None)
        
        result = trade_assistant.get_trade_recommendation(country, product, year)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'response': '',
            'message': f"Error: {str(e)}"
        }), 500
        
if __name__ == '__main__':
    app.run(debug=True)
