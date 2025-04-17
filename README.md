# 🌍 International Trade Flow Predictor 🚢📈

Welcome to the **International Trade Flow Predictor**! 🎉

A fun, interactive web app to explore, analyze, and predict international trade flows using real data and machine learning. Built with Flask, vanilla JS, and a dash of data science magic. 🧙‍♂️✨

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

---

## 🛠️ How to Run the App

1. **Clone the repo:**
   ```bash
   git clone https://github.com/jomasego/international_trade_predictions.git
   cd international_trade_predictions/comtrade_predictions
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Launch the app:**
   ```bash
   python app.py
   ```
4. **Open your browser:**
   - Go to [http://127.0.0.1:5000](http://127.0.0.1:5000)

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
