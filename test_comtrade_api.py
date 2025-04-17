import pandas as pd
import comtradeapicall

# Use comtradeapicall to get USA-China trade data for 2022
# USA reporterCode: 842, China partnerCode: 156, annual data (freqCode: 'A'), all commodities (cmdCode: 'TOTAL')

mydf = comtradeapicall.previewFinalData(
    typeCode='C',
    freqCode='A',
    clCode='HS',
    period='2022',
    reporterCode='842',
    partnerCode='156',
    partner2Code=None,
    customsCode=None,
    motCode=None,
    cmdCode='TOTAL',
    flowCode=None,  # can specify 'M' for imports, 'X' for exports, or None for all
    maxRecords=500,
    format_output='JSON',
    aggregateBy=None,
    breakdownMode='classic',
    countOnly=None,
    includeDesc=True
)

print("First 5 records:")
print(mydf.head())
