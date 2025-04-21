"""
AI Trade Assistant - Hugging Face Space version
"""
from flask import Flask, render_template, request, jsonify
import os
import json
import requests
import time
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Print debugging information about environment variables
print(f"Environment variables: HUGGINGFACE_API_TOKEN exists: {'HUGGINGFACE_API_TOKEN' in os.environ}")
print(f"Environment variables available: {[k for k in os.environ.keys() if not k.startswith('_')]}")

app = Flask(__name__)

# AI Assistant class for Hugging Face Space
class TradeAssistant:
    """
    Assistant powered by Google Gemma-2b to help users with trade data analysis
    """
    
    def __init__(self, api_token=None):
        """Initialize the Trade Assistant with HuggingFace API token"""
        # Try to get token from explicitly passed parameter or environment variable
        self.api_token = api_token or os.environ.get("HUGGINGFACE_API_TOKEN")
        if self.api_token:
            # Safely log that we found a token without revealing it
            print("Found API token in environment variables")
        else:
            print("WARNING: No API token found")
        
        if not self.api_token:
            print("Warning: No HuggingFace API token provided. Please set HUGGINGFACE_API_TOKEN environment variable.")
        
        # Model ID for Google Gemma-2b - efficient with strong reasoning
        self.model_id = "google/gemma-2b-it"
        
        # API endpoint
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        
        # Headers for API requests
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        # System prompt defining the assistant's role
        self.system_prompt = """
        You are Trade Flow Assistant, an AI helper specializing in international trade data analysis.
        You assist users with:
        1. Finding and interpreting trade data
        2. Explaining economic trends and trade flows
        3. Helping users navigate the Trade Flow Predictor application
        4. Suggesting relevant visualizations and analysis approaches
        5. Explaining trade terminology and concepts
        
        Focus on providing clear, concise responses with actionable insights.
        When appropriate, suggest specific countries, commodities, or time periods to explore.
        Do not make up data - if you don't know something, say so.
        """
        
        # Context about the application
        self.app_context = """
        The Trade Flow Predictor application has the following features:
        - Data viewing and visualization for international trade (imports/exports)
        - Filtering by country, product code, year, and flow type
        - Machine learning prediction of future trade values
        - Various chart types (bar, pie, line, treemap)
        - Data download capabilities
        
        Available tabs:
        - Basics: Simple data lookup by country pairs
        - Exports by Country: View top export destinations 
        - Imports by Country: View top import sources
        - Exports by Product: View top exported products
        - Imports by Product: View top imported products
        - Rankings: Compare countries by trade volume
        - Bilateral Trade: Examine trade between specific country pairs
        - Data Download: Download custom datasets
        - Prediction: ML forecasting of future trade values
        - Data Cache: Manage previously retrieved data
        - AI Assistant: Get help with trade data analysis
        """
        
    def query_llm(self, messages):
        """Send messages to the Hugging Face Inference API with retry mechanism"""
        # Implement retry mechanism for model loading
        max_retries = 3
        retry_delay = 10  # seconds
        
        for attempt in range(max_retries):
            headers = {
                "Authorization": f"Bearer {self.api_token}"
            }
            
            payload = {
                "inputs": messages,
                "parameters": {
                    "max_new_tokens": 1024,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True
                }
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            # If request succeeded, process the response
            if response.status_code == 200:
                try:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get("generated_text", "")
                    else:
                        return None
                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    print(f"Error processing response: {str(e)}, Response: {response.text}")
                    return None
            
            # If model is loading, wait and retry
            if response.status_code == 503 and ("loading" in response.text.lower() or "currently loading" in response.text.lower()):
                print(f"Model is loading. Attempt {attempt+1}/{max_retries}.")
                if attempt < max_retries - 1:  # Don't sleep after the last attempt
                    print(f"Waiting {retry_delay} seconds before retry.")
                    time.sleep(retry_delay)
                    # Increase delay for next attempt
                    retry_delay *= 1.5
                continue
            
            # If we got here, it's another error
            print(f"API request failed with status code {response.status_code}: {response.text}")
            return None
            
        # If we exhausted all retries, use fallback system
        print("Exceeded maximum retries. Using fallback trade data system.")
        return self.get_fallback_response(messages)
        
    def get_fallback_response(self, messages):
        """Provide responses based on existing trade data when the model is initializing"""
        # Extract the user's question from the messages
        user_question = ""
        for message in messages:
            if message.get("role") == "user":
                user_question = message.get("content", "")
                
        # Convert to lowercase for easier matching
        question_lower = user_question.lower()
        
        # Common trade-related questions and answers
        if "hs code" in question_lower or "hscode" in question_lower:
            return "HS Codes (Harmonized System Codes) are standardized numerical codes developed by the World Customs Organization (WCO) to classify traded products. Each code represents a specific category of goods, with the first 2 digits identifying the chapter, the next 2 identifying the heading, and so on. For example, HS code 8471 represents 'Automatic data-processing machines and units thereof; magnetic or optical readers, machines for transcribing data onto data media in coded form and machines for processing such data'. You can look up specific HS codes using the Lookup feature in the application."
            
        elif "imports" in question_lower and "exports" in question_lower and ("difference" in question_lower or "vs" in question_lower):
            return "Imports represent goods and services purchased from other countries and brought into the reporting country. Exports represent goods and services produced domestically and sold to buyers in other countries. The difference between exports and imports is called the trade balance. A trade surplus occurs when exports exceed imports, while a trade deficit occurs when imports exceed exports."
            
        elif "recommend" in question_lower or "interesting" in question_lower or "pattern" in question_lower:
            return "While the AI model is initializing, here are some interesting trade patterns to explore:\n\n1. **China-US Trade Tensions**: Examine how trade flows between China and the US have changed since 2018\n\n2. **COVID-19 Impact**: Look at the dramatic shifts in medical supply trade in 2020-2021\n\n3. **Green Technology Trade**: Explore the growing exports of renewable energy equipment, particularly solar panels and wind turbines\n\n4. **Semiconductor Supply Chain**: Investigate the complex global trade network for microchips and electronic components\n\n5. **Changing Agricultural Patterns**: Review how climate change has affected agricultural trade flows globally\n\nYou can explore these patterns using the data visualization tools in the application."
            
        elif "interpret" in question_lower or "understand" in question_lower or "analyze" in question_lower:
            return "To interpret trade data effectively:\n\n1. **Consider Context**: Look at multiple years to identify trends vs. one-time anomalies\n\n2. **Compare Related Metrics**: Examine both value and volume to distinguish price effects from quantity changes\n\n3. **Check Seasonality**: Many products have seasonal trade patterns that repeat annually\n\n4. **Account for Re-exports**: Some countries serve as trade hubs, importing and then re-exporting goods\n\n5. **Use Visualization**: Charts and graphs can reveal patterns that aren't obvious in tables\n\nThe Trade Flow Predictor application provides multiple visualization options to help with this analysis."
            
        else:
            return "I'm sorry, but the AI model is still initializing. In the meantime, you can explore the trade data visualization tools in the application, or try one of these specific questions:\n\n- What are HS codes?\n- Explain the difference between imports and exports\n- Recommend interesting trade patterns to explore\n- How can I interpret trade data?\n\nYou can also try again in a few minutes when the AI model should be ready."

    def query(self, user_question, chat_history=None, include_app_context=True):
        """Send a query to the LLM and get a response"""
        if chat_history is None:
            chat_history = []
            
        # Construct the messages for the LLM
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add app context if requested
        if include_app_context:
            messages.append({"role": "system", "content": self.app_context})
            
        # Add chat history
        for message in chat_history:
            messages.append(message)
            
        # Add the current question
        messages.append({"role": "user", "content": user_question})
        
        try:
            # Send the request to the HuggingFace API
            response = self.query_llm(messages)
            
            # Check if the request was successful
            if response:
                # Extract the assistant's response
                generated_text = response
                
                # Format for return
                return {
                    "success": True,
                    "response": generated_text,
                    "message": "Successfully generated response"
                }
            else:
                return {
                    "success": False,
                    "response": "",
                    "message": "Failed to get a response from the model"
                }
                
        except Exception as e:
            return {
                "success": False,
                "response": "",
                "message": f"Error: {str(e)}"
            }
    
    def explain_hs_code(self, code):
        """Explain what a specific HS code represents"""
        # Construct a specific prompt about the HS code
        prompt = f"What does HS code {code} represent in international trade classification? Provide a detailed explanation."
        
        # Try to get from LLM first
        response = self.query(prompt, chat_history=[], include_app_context=False)
        
        # Check if we got a model initialization message
        if "model is still initializing" in response.get("response", ""):
            # Use fallback HS code explanations
            return self.get_fallback_hs_code_explanation(code)
        
        return response
        
    def get_fallback_hs_code_explanation(self, code):
        """Provide fallback explanations for common HS codes when model is initializing"""
        # Common HS codes dictionary
        hs_codes = {
            "01": {
                "code": "01",
                "description": "Live animals",
                "details": "This chapter covers all live animals except for fish, crustaceans, molluscs and other aquatic invertebrates."
            },
            "02": {
                "code": "02",
                "description": "Meat and edible meat offal",
                "details": "This chapter covers meat and edible offal from animals in Chapter 1, whether fresh, chilled, or frozen."
            },
            "84": {
                "code": "84",
                "description": "Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof",
                "details": "One of the largest chapters, covering all kinds of machinery from nuclear reactors to office machines."
            },
            "85": {
                "code": "85",
                "description": "Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles",
                "details": "Covers electrical goods from generators to consumer electronics."
            },
            "8471": {
                "code": "8471",
                "description": "Automatic data processing machines and units thereof; magnetic or optical readers, machines for transcribing data onto data media in coded form and machines for processing such data",
                "details": "This heading covers computers, computer systems, and computer peripherals like printers and scanners."
            },
            "2709": {
                "code": "2709",
                "description": "Petroleum oils and oils obtained from bituminous minerals, crude",
                "details": "This includes crude oil before refining. One of the most traded commodities globally."
            },
            "7108": {
                "code": "7108",
                "description": "Gold (including gold plated with platinum) unwrought or in semi-manufactured forms, or in powder form",
                "details": "Covers trade in gold bullion and other forms of gold not made into jewelry or final products."
            },
            "87": {
                "code": "87",
                "description": "Vehicles other than railway or tramway rolling stock, and parts and accessories thereof",
                "details": "Includes automobiles, trucks, motorcycles, and their components."
            }
        }
        
        # Try to match the exact code
        if code in hs_codes:
            info = hs_codes[code]
            return {
                "success": True,
                "response": f"**HS Code {info['code']}: {info['description']}**\n\n{info['details']}",
                "message": "Used fallback HS code database"
            }
        
        # Try to match the first 2 digits (chapter)
        chapter = code[:2] if len(code) >= 2 else code
        if chapter in hs_codes:
            info = hs_codes[chapter]
            return {
                "success": True,
                "response": f"**HS Chapter {info['code']}: {info['description']}**\n\nThe specific code {code} is a subcategory within this chapter.\n\n{info['details']}",
                "message": "Used fallback HS code database (chapter level)"
            }
        
        # Fallback for unknown codes
        return {
            "success": True,
            "response": f"The AI model is still initializing and cannot provide specific details about HS code {code} at this moment. HS codes are standardized numerical codes used worldwide for classifying traded products. Please try again in a few minutes when the AI model should be ready.",
            "message": "Model is initializing, no fallback data for this specific HS code"
        }
        
    def get_trade_recommendation(self, country=None, product=None, year=None):
        """Get a specific recommendation for trade data exploration"""
        # Construct a specific prompt for recommendations
        prompt = "Provide a recommendation for interesting trade data to explore"
        
        if country:
            prompt += f" related to trade with {country}"
        
        if product:
            prompt += f" involving {product} products"
            
        if year:
            prompt += f" in the year {year}"
            
        prompt += ". Include specific insights, patterns to look for, and visualization suggestions."
        
        # Send to the assistant without chat history to keep recommendation focused
        response = self.query(prompt, chat_history=[], include_app_context=True)
        
        # Check if we got a model initialization message
        if "model is still initializing" in response.get("response", ""):
            # Use fallback trade recommendations
            return self.get_fallback_trade_recommendation(country, product, year)
        
        return response
        
    def get_fallback_trade_recommendation(self, country=None, product=None, year=None):
        """Provide fallback trade recommendations when model is initializing"""
        # Common countries with specific recommendations
        country_recommendations = {
            "china": "China is the world's largest exporter. Key exports include electronics, machinery, and textiles. Consider examining China's trade patterns with the US, EU, and ASEAN countries. The trade surplus has been a subject of international economic discussions.",
            "usa": "The USA is the world's largest importer. Major imports include consumer goods, industrial supplies, and petroleum products. Consider exploring the trade deficit with China and the impact of recent trade policies on bilateral flows.",
            "germany": "Germany is Europe's largest economy with strong export performance. Key exports include vehicles, machinery, and pharmaceuticals. The country maintains trade surpluses with most partners and is a central node in European manufacturing supply chains.",
            "japan": "Japan has a strong export focus on high-value manufactured goods, particularly automobiles and electronics. Interesting patterns include its strategic trade relationships with ASEAN countries and its complex supply chain integration with China and South Korea.",
            "india": "India has emerged as a significant exporter of services, particularly in IT and business process outsourcing. In goods trade, pharmaceuticals, jewelry, and textiles are major exports, while petroleum and gold are key imports."
        }
        
        # Common product recommendations
        product_recommendations = {
            "electronics": "Electronics is one of the most traded product categories globally. Key exporters include China, South Korea, Vietnam, and Malaysia. Interesting patterns include the migration of manufacturing from China to Vietnam and other Southeast Asian countries in recent years.",
            "pharmaceutical": "Pharmaceutical trade has shown robust growth, especially during the pandemic. Major exporters include Germany, Switzerland, USA, and India. Patent protection and regulatory frameworks significantly influence trade patterns in this sector.",
            "agricultural": "Agricultural trade is highly influenced by seasonal patterns, climate conditions, and trade policies. Major exporters include USA, Brazil, and the Netherlands. Visualizing agricultural trade flows can reveal interesting patterns related to food security and climate impact.",
            "automotive": "The automotive sector features complex global value chains. Major exporters include Germany, Japan, and Mexico. Interesting aspects include the growth of electric vehicle exports and the impact of regional trade agreements on automotive supply chains.",
            "textile": "Textile trade shows significant patterns of labor cost arbitrage. Production has shifted from China to countries like Bangladesh, Vietnam, and Cambodia. Fast fashion trends have accelerated certain trade flows in this sector."
        }
        
        # Recommendations by time period
        year_recommendations = {
            "2020": "Trade in 2020 was dramatically affected by the COVID-19 pandemic. Medical supplies, electronics (driven by work-from-home), and food products saw increased trade, while luxury goods, travel-related items, and industrial supplies saw declines.",
            "2018": "2018 marked the beginning of significant trade tensions between the US and China, with new tariffs affecting global supply chains. Electronics, agricultural products, and steel were particularly impacted.",
            "2008": "The global financial crisis of 2008 led to a contraction in international trade, particularly in consumer durables and industrial goods. Trade finance constraints further impacted global commerce.",
            "2001": "China's accession to the WTO in 2001 marked a turning point in global trade patterns, accelerating China's integration into global supply chains and its emergence as the 'world's factory'."
        }
        
        # Build a personalized recommendation based on provided parameters
        response = "While the AI model is initializing, here's a trade data recommendation based on available information:\n\n"
        
        # Add country-specific recommendation if available
        if country:
            country_lower = country.lower()
            if country_lower in country_recommendations:
                response += f"**{country.title()} Trade Patterns**:\n{country_recommendations[country_lower]}\n\n"
            else:
                response += f"**{country.title()} Trade Data**:\nExplore {country.title()}'s top trading partners, major exports and imports, and how its trade patterns have evolved over time.\n\n"
        
        # Add product-specific recommendation if available
        if product:
            product_lower = product.lower()
            matched = False
            for key, value in product_recommendations.items():
                if key in product_lower:
                    response += f"**{product.title()} Trade Insights**:\n{value}\n\n"
                    matched = True
                    break
            
            if not matched:
                response += f"**{product.title()} Trade Analysis**:\nInvestigate major exporters and importers of {product} products, price trends, and seasonal patterns if applicable.\n\n"
        
        # Add year-specific recommendation if available
        if year:
            year_str = str(year)
            if year_str in year_recommendations:
                response += f"**{year} Trade Context**:\n{year_recommendations[year_str]}\n\n"
            else:
                response += f"**{year} Trade Data**:\nExamine how trade patterns in this year compare to previous and subsequent years, noting any major economic or geopolitical events that might have influenced global commerce.\n\n"
        
        # Add visualization recommendations
        response += "**Visualization Suggestions**:\n"
        response += "1. **Bar Charts**: Compare top trading partners by export/import values\n"
        response += "2. **Line Charts**: Track trade trends over time to identify growth or decline patterns\n"
        response += "3. **Treemaps**: Visualize product categories by trade value to understand relative importance\n"
        response += "4. **Choropleth Maps**: See geographical distribution of trade partners\n"
        
        return {
            "success": True,
            "response": response,
            "message": "Used fallback trade recommendation system"
        }

    def format_chat_history(self, chat_history_raw):
        """Format chat history to match the expected format for the LLM API"""
        formatted_history = []
        
        for message in chat_history_raw:
            role = message.get('role')
            content = message.get('content')
            
            if not role or not content:
                continue
                
            if role not in ['user', 'assistant']:
                continue
                
            formatted_history.append({
                "role": role,
                "content": content
            })
            
        return formatted_history
    
    def enhance_query_with_context(self, query):
        """Enhance a user query with additional context about trade data"""
        # Add context to HS code questions
        if "hs code" in query.lower() or "hscode" in query.lower() or "hs-code" in query.lower():
            return f"{query} Please explain in the context of international trade classification."
            
        # Add context to country questions
        if "country" in query.lower() or "countries" in query.lower():
            return f"{query} Focus on trade-related information and statistics if available."
            
        # Add context to trend questions
        if "trend" in query.lower() or "trends" in query.lower():
            return f"{query} Consider both recent trends and historical context where relevant."
            
        # Default case - return original query
        return query

# Initialize the LLM assistant
trade_assistant = TradeAssistant(api_token=os.environ.get("HUGGINGFACE_API_TOKEN"))

# Home page
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint for LLM assistant
@app.route('/api/assistant/query', methods=['POST'])
def assistant_query():
    data = request.json
    
    # Get the user question from request
    user_question = data.get('question', '')
    
    # Validate input - ensure question is provided
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
    
    # Validate input - ensure HS code is provided
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

if __name__ == '__main__':
    # Hugging Face Spaces uses port 7860 by default
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port)
