import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

def prepare_features(df):
    df = df.copy()
    df['year'] = df['refYear'].astype(int)
    df['flowCode'] = df['flowCode'].map({'M': 0, 'X': 1}).fillna(-1)
    df['partnerCode'] = df['partnerCode'].astype(int)
    df = df[df['primaryValue'].notnull()]
    X = df[['year', 'flowCode', 'partnerCode']]
    y = df['primaryValue']
    return X, y

def train_and_predict(df, predict_year, partner_code, flow_code, model_type='linear'):
    X, y = prepare_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    flow_map = {'M': 0, 'X': 1}
    pred_X = np.array([[predict_year, flow_map.get(flow_code, -1), int(partner_code)]]).reshape(1, -1)

    if model_type == 'linear':
        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        pred_value = model.predict(pred_X)[0]
    elif model_type == 'xgboost':
        try:
            from xgboost import XGBRegressor
        except ImportError:
            return {'error': 'xgboost is not installed. Please install it to use this model.'}
        model = XGBRegressor(objective='reg:squarederror', n_estimators=100)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        pred_value = model.predict(pred_X)[0]
    elif model_type == 'lstm':
        try:
            import tensorflow as tf
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense
            from sklearn.preprocessing import MinMaxScaler
        except ImportError:
            return {'error': 'tensorflow is not installed. Please install it to use this model.'}
        # Only use year as feature for LSTM time series
        scaler = MinMaxScaler()
        X_lstm = scaler.fit_transform(X[['year']])
        y_lstm = y.values.reshape(-1, 1)
        y_lstm = scaler.fit_transform(y_lstm)
        # Reshape for LSTM [samples, time steps, features]
        X_lstm = X_lstm.reshape((X_lstm.shape[0], 1, 1))
        X_train_lstm, X_test_lstm, y_train_lstm, y_test_lstm = train_test_split(X_lstm, y_lstm, test_size=0.2, random_state=42)
        model = Sequential([
            LSTM(16, input_shape=(1, 1)),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train_lstm, y_train_lstm, epochs=50, batch_size=8, verbose=0)
        y_pred = model.predict(X_test_lstm)
        mse = mean_squared_error(y_test_lstm, y_pred)
        # Predict for the input year
        pred_X_lstm = scaler.transform(np.array([[predict_year]])).reshape((1, 1, 1))
        pred_value = model.predict(pred_X_lstm)[0][0]
        # Inverse scale prediction
        pred_value = scaler.inverse_transform([[pred_value]])[0][0]
        mse = float(mse)
    else:
        return {'error': f'Unknown model_type: {model_type}'}
    return {
        'mse': float(mse),
        'prediction': float(pred_value),
        'model_type': model_type
    }
