from flask import Flask, render_template, request, jsonify
import pandas as pd
import comtradeapicall
import ml_model

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
    data = request.json
    reporter = data.get('reporterCode', '842')
    partner = data.get('partnerCode', '156')
    cmd_code = data.get('cmdCode', 'TOTAL')
    flow_code = data.get('flowCode', None)
    predict_year = int(data.get('predictYear', 2023))
    model_type = data.get('modelType', 'linear')
    try:
        # Fetch historical data for training
        import pandas as pd
        years = [str(y) for y in range(predict_year-10, predict_year)]
        dfs = []
        for year in years:
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
            dfs.append(df_year)
        df = pd.concat(dfs, ignore_index=True)
        result = ml_model.train_and_predict(df, predict_year, partner, flow_code, model_type=model_type)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
