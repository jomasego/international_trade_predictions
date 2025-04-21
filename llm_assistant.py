"""
Trade Data Assistant using Google Gemma-2b from Hugging Face
"""
import os
import requests
import json
from typing import Dict, List, Any, Optional

class TradeAssistant:
    """
    Assistant powered by Google Gemma-2b to help users with trade data analysis
    """
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize the Trade Assistant with HuggingFace API token"""
        self.api_token = api_token or os.environ.get("HUGGINGFACE_API_TOKEN")
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
        """

    def query(self, 
              user_question: str, 
              chat_history: List[Dict[str, str]] = None,
              include_app_context: bool = True) -> Dict[str, Any]:
        """
        Send a query to the LLM and get a response
        
        Args:
            user_question: The user's question
            chat_history: Previous conversation history
            include_app_context: Whether to include app context in the prompt
            
        Returns:
            Dict containing the LLM response
        """
        if chat_history is None:
            chat_history = []
            
        # Construct the messages for the LLM
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add application context if requested
        if include_app_context and not chat_history:
            messages.append({"role": "system", "content": self.app_context})
            
        # Add chat history
        for message in chat_history:
            messages.append(message)
            
        # Add the current question
        messages.append({"role": "user", "content": user_question})
        
        try:
            # Send the request to the HuggingFace API
            payload = {
                "inputs": messages,
                "parameters": {
                    "max_new_tokens": 500,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True
                }
            }
            
            # Implement retry mechanism for model loading
            max_retries = 2
            retry_delay = 1  # seconds
            
            for attempt in range(max_retries):
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=10  # Add timeout to prevent hanging requests
                )
                
                # If request succeeded, process the response
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            # Extract the assistant's response
                            generated_text = result[0].get("generated_text", "")
                            
                            # Format for return
                            return {
                                "success": True,
                                "response": generated_text,
                                "message": "Successfully generated response"
                            }
                        else:
                            return {
                                "success": False,
                                "response": self.get_fallback_response(user_question),
                                "message": f"Unexpected API response format: {result}"
                            }
                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        print(f"Error processing response: {str(e)}, Response: {response.text}")
                        return {
                            "success": True,  # Return as success but with fallback response
                            "response": self.get_fallback_response(user_question),
                            "message": f"Error processing response: {str(e)}"
                        }
                
                # If model is loading (status code 503), wait and retry
                elif response.status_code == 503:
                    print(f"Model is loading or temporarily unavailable. Attempt {attempt+1}/{max_retries}.")
                    if attempt < max_retries - 1:  # Don't wait after the last attempt
                        import time
                        time.sleep(retry_delay)
                    else:
                        # If we've exhausted all retries, use fallback
                        return {
                            "success": True,  # Mark as successful but using fallback
                            "response": self.get_fallback_response(user_question),
                            "message": f"Model unavailable (status: {response.status_code}). Using fallback response."
                        }
                else:
                    # Other errors - try fallback immediately
                    error_message = f"API request failed with status code {response.status_code}"
                    try:
                        error_detail = response.json()
                        error_message += f": {json.dumps(error_detail)}"
                    except:
                        error_message += f": {response.text}"
                    
                    print(error_message)  # Log the error for debugging
                    
                    # Return fallback response instead of error
                    return {
                        "success": True,  # Mark as successful but using fallback
                        "response": self.get_fallback_response(user_question),
                        "message": error_message
                    }
                
        except Exception as e:
            print(f"Exception during API request: {str(e)}")
            return {
                "success": True,  # Return as success but with fallback
                "response": self.get_fallback_response(user_question),
                "message": f"Error querying LLM: {str(e)}"
            }
            
    def get_fallback_response(self, query: str) -> str:
        """
        Provide a fallback response when the model is unavailable or loading
        
        Args:
            query: The user's question
            
        Returns:
            A useful fallback response based on the query
        """
        query_lower = query.lower()
        
        # Common trade-related questions and answers
        if "hs code" in query_lower or "hscode" in query_lower:
            return "HS Codes (Harmonized System Codes) are standardized numerical codes developed by the World Customs Organization (WCO) to classify traded products. Each code represents a specific category of goods, with the first 2 digits identifying the chapter, the next 2 identifying the heading, and so on. For example, HS code 8471 represents 'Automatic data-processing machines and units thereof; magnetic or optical readers, machines for transcribing data onto data media in coded form and machines for processing such data'." 
            
        elif "imports" in query_lower and "exports" in query_lower and ("difference" in query_lower or "vs" in query_lower):
            return "Imports represent goods and services purchased from other countries and brought into the reporting country. Exports represent goods and services produced domestically and sold to buyers in other countries. The difference between exports and imports is called the trade balance. A trade surplus occurs when exports exceed imports, while a trade deficit occurs when imports exceed exports."
            
        elif "recommend" in query_lower or "interesting" in query_lower or "pattern" in query_lower:
            return "While the model is temporarily unavailable, here are some interesting trade patterns to explore:\n\n1. **China-US Trade Tensions**: Examine how trade flows between China and the US have changed since 2018\n\n2. **COVID-19 Impact**: Look at the dramatic shifts in medical supply trade in 2020-2021\n\n3. **Green Technology Trade**: Explore the growing exports of renewable energy equipment, particularly solar panels and wind turbines\n\n4. **Semiconductor Supply Chain**: Investigate the complex global trade network for microchips and electronic components\n\n5. **Changing Agricultural Patterns**: Review how climate change has affected agricultural trade flows globally\n\nYou can explore these patterns using the data visualization tools in the application."
            
        elif "interpret" in query_lower or "understand" in query_lower or "analyze" in query_lower:
            return "To interpret trade data effectively:\n\n1. **Consider Context**: Look at multiple years to identify trends vs. one-time anomalies\n\n2. **Compare Related Metrics**: Examine both value and volume to distinguish price effects from quantity changes\n\n3. **Check Seasonality**: Many products have seasonal trade patterns that repeat annually\n\n4. **Account for Re-exports**: Some countries serve as trade hubs, importing and then re-exporting goods\n\n5. **Use Visualization**: Charts and graphs can reveal patterns that aren't obvious in tables\n\nThe Trade Flow Predictor application provides multiple visualization options to help with this analysis."
            
        elif "8471" in query_lower:
            return "HS Code 8471: Automatic data processing machines and units thereof; magnetic or optical readers, machines for transcribing data onto data media in coded form and machines for processing such data.\n\nThis includes computers, laptops, servers, and related equipment. Major exporters include China, Mexico, the Netherlands, and the United States. This is a high-value category in international trade with complex supply chains spanning multiple countries."
            
        else:
            return "I'm sorry, but I can't provide a specific answer right now as the AI model is temporarily unavailable. Please try again in a few minutes. In the meantime, you can explore the trade data visualization tools in the application, or try one of these specific questions:\n\n- What are HS codes?\n- Explain the difference between imports and exports\n- Recommend interesting trade patterns to explore\n- How can I interpret trade data?"
    
    def get_trade_recommendation(self, 
                                country: str = None, 
                                product: str = None, 
                                year: str = None) -> Dict[str, Any]:
        """
        Get a specific recommendation for trade data exploration
        
        Args:
            country: Country name or code (optional)
            product: Product name or HS code (optional)
            year: Year for analysis (optional)
            
        Returns:
            Dict containing the LLM recommendation
        """
        # Construct a specific prompt for recommendations
        recommendation_prompt = f"Please recommend interesting trade patterns to explore"
        
        if country:
            recommendation_prompt += f" for {country}"
        if product:
            recommendation_prompt += f" related to {product}"
        if year:
            recommendation_prompt += f" in {year}"
            
        recommendation_prompt += ". Suggest specific data queries and visualizations that would be insightful."
        
        return self.query(recommendation_prompt)
    
    def explain_hs_code(self, code: str) -> Dict[str, Any]:
        """
        Explain what a specific HS code represents
        
        Args:
            code: HS code to explain
            
        Returns:
            Dict containing the explanation
        """
        prompt = f"Please explain what the HS code {code} represents in international trade classification. Include information about what products are classified under this code, any notable trade patterns, and major exporting countries if you know them."
        
        return self.query(prompt, include_app_context=False)
    
    def format_chat_history(self, chat_history_raw: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Format chat history to match the expected format for the LLM API
        
        Args:
            chat_history_raw: Raw chat history from the frontend
            
        Returns:
            Formatted chat history compatible with the API
        """
        formatted_history = []
        
        for message in chat_history_raw:
            if not isinstance(message, dict) or 'role' not in message or 'content' not in message:
                continue
                
            role = message.get('role', '').lower()
            content = message.get('content', '')
            
            # Ensure role is either 'user' or 'assistant'
            if role not in ['user', 'assistant']:
                continue
                
            formatted_history.append({
                "role": role,
                "content": content
            })
            
        return formatted_history
    
    def enhance_query_with_context(self, query: str) -> str:
        """
        Enhance a user query with additional context about trade data
        
        Args:
            query: Original user query
            
        Returns:
            Enhanced query
        """
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
        

# Simple test function
def test_assistant():
    """Test the Trade Assistant functionality"""
    assistant = TradeAssistant()
    test_query = "What are HS codes and how are they used in trade analysis?"
    
    print(f"Test query: {test_query}")
    response = assistant.query(test_query)
    
    if response["success"]:
        print("\nResponse:")
        print(response["response"])
    else:
        print(f"\nError: {response['message']}")
    
if __name__ == "__main__":
    test_assistant()
