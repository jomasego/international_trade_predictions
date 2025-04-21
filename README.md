# 🌍 International Trade Flow Predictor with AI Assistant 🚢📈🤖

Welcome to the **International Trade Flow Predictor**! 🎉

A fun, interactive web app to explore, analyze, and predict international trade flows using real data and machine learning. Now with AI-powered trade assistance! Built with Flask, vanilla JS, and a dash of data science magic. 🧙‍♂️✨

[![Hugging Face Space](https://img.shields.io/badge/🤗-Hugging%20Face%20Space-cyan.svg)](https://huggingface.co/spaces/jomasego/ai-trade-assistant)

---

## 🚀 Features

- **Tabbed UI Navigation** 🗂️
  - Basics: Quick trade lookups
  - Exports/Imports by Country 🌎
  - Exports/Imports by Product 📦
  - Rankings 🏆
  - Bilateral Trade ↔️
  - Data Download 💾
  - ML Prediction 🤖

- **Data Visualizations** 📊
  - Tables, charts, and downloadable CSVs everywhere!
  - Interactive country/product selection
  - All powered by UN COMTRADE, WTO, and World Bank data

- **Machine Learning Models** 🧠
  - Linear Regression
  - XGBoost
  - LSTM (Deep Learning)
  - Predict future trade flows and visualize both historical and predicted values!

- **Modern, Accessible UI**
  - Keyboard navigation, ARIA attributes, and a clean look
  - No frontend frameworks, just pure JS!

- **AI Trade Assistant** 🤖
  - Powered by Google Gemma-2b
  - Interactive chat interface for trade data queries
  - HS code explanation and interpretation
  - Trade pattern recommendations
  - Context-aware responses to help navigate the application

---

## 🛠️ Deployment Options

You have two options for deploying this application:

### Option 1: Full Web Application with Integrated AI Assistant

This option gives you the complete Trade Flow Predictor application with the AI Assistant directly integrated into the application interface.

1. **Clone the repo:**
   ```bash
   git clone https://github.com/jomasego/international_trade_predictions.git
   cd international_trade_predictions/comtrade_predictions
   ```

2. **Set up environment variable:**
   Create a `.env` file in the root directory with your Hugging Face API token:
   ```
   HUGGINGFACE_API_TOKEN=your_token_here
   ```
   This token is required to access the Google Gemma-2b model via Hugging Face Inference API.

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the app:**
   ```bash
   python app.py
   ```

5. **Open your browser:**
   - Go to [http://127.0.0.1:5000](http://127.0.0.1:5000)
   - Navigate to the AI Assistant tab to interact with the integrated assistant

### Option 2: Standalone AI Trade Assistant on Hugging Face Space

This option deploys just the AI Assistant component as a separate application on Hugging Face Spaces. This is useful if you only want to provide the AI Assistant functionality without the full application.

1. **Use our existing space:**
   - Visit [AI Trade Assistant](https://huggingface.co/spaces/jomasego/ai-trade-assistant) to use the pre-deployed version

2. **OR deploy your own space:**

   a. **Create a new Space** on Hugging Face with the Flask SDK

   b. **Upload the files from the `clean-space` directory:**
      - `app.py`
      - `requirements.txt`
      - `templates/index.html`

   c. **Set up environment variable:**
      - Add `HUGGINGFACE_API_TOKEN` to your space under Settings > Repository Secrets

   d. **Your space will automatically deploy** and be accessible through the provided URL

### Using the AI Assistant

Regardless of which deployment option you choose:

1. Navigate to the AI Assistant interface
2. Type your trade-related question in the chat input
3. Use specialized features:
   - HS Code Lookup: Get detailed explanations of HS codes
   - Trade Recommendations: Receive insights on trade patterns based on countries or product categories

---

## 🔍 Explore the Tabs

- **Basics:**
  - Quick lookups by country, year, commodity, and flow
- **Exports/Imports by Country:**
  - See trade values for all countries in a given year/commodity
- **Exports/Imports by Product:**
  - Explore top traded products for a country
- **Rankings:**
  - Who are the top exporters/importers? Find out!
- **Bilateral Trade:**
  - Analyze trade between any two countries
- **Data Download:**
  - Custom CSV downloads for power users
- **Prediction (ML):**
  - Select countries, commodity, and year, pick a model, and predict the future! See both historical and predicted values plotted together.

---

## ⚡ Tech Stack
- Python 3
- Flask
- Pandas, scikit-learn, XGBoost, Keras/TensorFlow
- HTML5, CSS3, JavaScript (vanilla!)

---

## 🤝 Contributing
PRs welcome! Open an issue, fork, or just say hi. 😊

---

## 📬 Contact
- [GitHub Issues](https://github.com/jomasego/international_trade_predictions/issues)

---

Enjoy exploring the world of trade! 🌐🚀
