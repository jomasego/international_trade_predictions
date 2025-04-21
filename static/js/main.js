document.addEventListener('DOMContentLoaded', function() {
    // --- Exports by Country Tab Logic ---
    // --- Imports by Country Tab Logic ---
    // --- Exports by Product Tab Logic ---
    // --- Imports by Product Tab Logic ---
    // --- Rankings Tab Logic ---
    // --- Bilateral Trade Tab Logic ---
    // --- Data Download Tab Logic ---
    const dataDownloadForm = document.getElementById('dataDownloadForm');
    const dataDownloadStatus = document.getElementById('dataDownloadStatus');
    const dataDownloadChartDiv = document.createElement('div');
    dataDownloadChartDiv.id = 'dataDownloadChart';
    dataDownloadChartDiv.style.marginTop = '2em';
    dataDownloadStatus && dataDownloadStatus.parentNode.insertBefore(dataDownloadChartDiv, dataDownloadStatus.nextSibling);
    let dataDownloadChartData = null;
    if (dataDownloadForm) {
      dataDownloadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        dataDownloadStatus.innerHTML = '';
        dataDownloadChartDiv.innerHTML = '';
        // ...existing fetch logic...
        // After successful data fetch:
        // dataDownloadChartData = fetchedData;
        // renderDataDownloadChart(fetchedData);
      });
    }
    // Render chart for Data Download tab (all rows)
    // Generalized chart rendering for any tab
    function renderModernChart(rows, chartDivId) {
      const chartDiv = document.getElementById(chartDivId);
      if (!chartDiv || !Array.isArray(rows) || rows.length === 0) return;
      chartDiv.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(900, window.innerWidth * 0.96);
      canvas.height = 340;
      canvas.style.background = '#fff';
      canvas.style.borderRadius = '10px';
      canvas.style.boxShadow = '0 2px 10px rgba(25,118,210,0.07)';
      chartDiv.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      // Try to find year and value columns
      let years = [], values = [];
      if (rows[0].year !== undefined && rows[0].value !== undefined) {
        years = rows.map(r => +r.year);
        values = rows.map(r => +r.value);
      } else if (rows[0].hasOwnProperty('country') && rows[0].hasOwnProperty('value')) {
        // For country rankings
        years = rows.map((_, i) => i+1); // Rank as x-axis
        values = rows.map(r => +r.value);
      } else if (rows[0].hasOwnProperty('cmdCode') && rows[0].hasOwnProperty('value')) {
        // For product by code
        years = rows.map((_, i) => i+1);
        values = rows.map(r => +r.value);
      } else {
        return;
      }
      const minYear = Math.min(...years), maxYear = Math.max(...years);
      const minVal = Math.min(...values), maxVal = Math.max(...values);
      // Draw grid
      ctx.strokeStyle = '#e3e9f6';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; ++i) {
        let y = 40 + i * (260 / 5);
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(canvas.width - 30, y);
        ctx.stroke();
      }
      // Axes
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 40);
      ctx.lineTo(60, 300);
      ctx.lineTo(canvas.width - 30, 300);
      ctx.stroke();
      // Y labels
      ctx.fillStyle = '#34495e';
      ctx.font = '13px Segoe UI, Arial, sans-serif';
      for (let i = 0; i <= 5; ++i) {
        let v = minVal + (maxVal - minVal) * i / 5;
        let y = 300 - (v - minVal) / (maxVal - minVal) * 260;
        ctx.fillText(v.toFixed(0), 10, y + 4);
      }
      // X labels
      for (let i = 0; i < years.length; ++i) {
        let x = 60 + (years[i] - minYear) / (maxYear - minYear || 1) * (canvas.width - 90);
        let label = (rows[0].country && rows[i].country) ? rows[i].country : (rows[0].cmdCode && rows[i].cmdCode ? rows[i].cmdCode : years[i]);
        ctx.fillText(label, x - 12, 320);
      }
      // Draw line
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < years.length; ++i) {
        let x = 60 + (years[i] - minYear) / (maxYear - minYear || 1) * (canvas.width - 90);
        let y = 300 - (values[i] - minVal) / (maxVal - minVal || 1) * 260;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Draw points
      for (let i = 0; i < years.length; ++i) {
        let x = 60 + (years[i] - minYear) / (maxYear - minYear || 1) * (canvas.width - 90);
        let y = 300 - (values[i] - minVal) / (maxVal - minVal || 1) * 260;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#1976d2';
        ctx.fill();
      }
      // Tooltip (simple hover)
      canvas.onmousemove = function(ev) {
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
        let found = -1;
        for (let i = 0; i < years.length; ++i) {
          let x = 60 + (years[i] - minYear) / (maxYear - minYear || 1) * (canvas.width - 90);
          let y = 300 - (values[i] - minVal) / (maxVal - minVal || 1) * 260;
          if (Math.abs(mx - x) < 8 && Math.abs(my - y) < 8) { found = i; break; }
        }
        chartDiv.querySelectorAll('.chart-tooltip').forEach(e => e.remove());
        if (found !== -1) {
          const tip = document.createElement('div');
          tip.className = 'chart-tooltip';
          tip.style.position = 'absolute';
          tip.style.left = (mx + 10) + 'px';
          tip.style.top = (my + 10) + 'px';
          tip.style.background = '#fff';
          tip.style.border = '1px solid #1976d2';
          tip.style.borderRadius = '6px';
          tip.style.padding = '6px 12px';
          tip.style.boxShadow = '0 2px 8px rgba(25,118,210,0.15)';
          tip.style.pointerEvents = 'none';
          tip.style.fontSize = '13px';
          tip.style.zIndex = 1000;
          tip.innerHTML = `<b>${(rows[found].country || rows[found].cmdCode || 'Year')}:</b> ${years[found]}<br><b>Value:</b> ${values[found]}`;
          chartDiv.appendChild(tip);
        }
      };
      canvas.onmouseleave = function() {
        chartDiv.querySelectorAll('.chart-tooltip').forEach(e => e.remove());
      };
    }
    // Backward compat: keep for Data Download tab
    function renderDataDownloadChart(rows) {
      renderModernChart(rows, 'dataDownloadChart');
    }

    const predictionForm = document.getElementById('predictionForm');
    const predictionReporter = document.getElementById('predictionReporter');
    const predictionPartner = document.getElementById('predictionPartner');
    const predictionResults = document.getElementById('predictionResults');
    const predictionChart = document.getElementById('predictionChart');
    const predictionDownloadBtn = document.getElementById('predictionDownloadBtn');
    let predictionTableData = null;
    // Populate country dropdowns
    if (predictionReporter && predictionPartner && typeof COUNTRY_CODES !== 'undefined') {
      predictionReporter.innerHTML = '';
      predictionPartner.innerHTML = '';
      COUNTRY_CODES.forEach(c => {
        const opt1 = document.createElement('option');
        opt1.value = c.code;
        opt1.textContent = c.name + ' (' + c.code + ')';
        predictionReporter.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = c.code;
        opt2.textContent = c.name + ' (' + c.code + ')';
        predictionPartner.appendChild(opt2);
      });
    }
    if (predictionForm) {
      predictionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        predictionResults.innerHTML = '';
        predictionDownloadBtn.style.display = 'none';
        if (predictionChart) predictionChart.style.display = 'none';
        const reporterCode = predictionReporter.value;
        const partnerCode = predictionPartner.value;
        const year = document.getElementById('predictionYear').value;
        const cmdCode = document.getElementById('predictionCommodity').value;
        const modelType = document.getElementById('predictionModel').value;
        const payload = {
          reporterCode: reporterCode,
          partnerCode: partnerCode,
          period: year,
          cmdCode: cmdCode,
          flowCode: '',
          modelType: modelType
        };
        predictionResults.innerHTML = '<div>Predicting...</div>';
        showSpinner();
        try {
          const resp = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (data && data.historical && data.prediction) {
            // Prepare table data
            let rows = [];
            data.historical.forEach(row => {
              rows.push({ year: row.year, value: row.value, type: 'historical' });
            });
            rows.push({ year: data.prediction.year, value: data.prediction.value, type: 'predicted' });
            predictionTableData = rows;
            // Render table
            let html = '<div style="overflow-x:auto;"><table><thead><tr><th>Year</th><th>Value</th><th>Type</th></tr></thead><tbody>';
            rows.forEach(row => {
              html += `<tr><td>${row.year}</td><td>${row.value}</td><td>${row.type}</td></tr>`;
            });
            html += '</tbody></table></div>';
            predictionResults.innerHTML = html;
            predictionDownloadBtn.style.display = 'inline-block';
            // Plot chart (vanilla JS, use Canvas API)
            plotPredictionChart(rows);
          } else {
            predictionResults.innerHTML = '<div>No prediction data returned.</div>';
          }
        } catch (err) {
          predictionResults.innerHTML = '<div>Error fetching prediction.</div>';
        } finally {
          hideSpinner();
        }
      });
      predictionDownloadBtn.addEventListener('click', function() {
        if (!predictionTableData) return;
        let csv = 'Year,Value,Type\n';
        predictionTableData.forEach(row => {
          csv += `${row.year},${row.value},${row.type}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trade_prediction.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }
    // Simple chart plotting function (vanilla JS, Canvas API)
    function plotPredictionChart(rows) {
      if (!predictionChart) return;
      const width = 600, height = 320, pad = 50;
      predictionChart.width = width;
      predictionChart.height = height;
      const ctx = predictionChart.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      // Prepare data
      const years = rows.map(r => +r.year);
      const values = rows.map(r => +r.value);
      const minYear = Math.min(...years), maxYear = Math.max(...years);
      const minVal = Math.min(...values), maxVal = Math.max(...values);
      // Axes
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, pad);
      ctx.lineTo(pad, height-pad);
      ctx.lineTo(width-pad, height-pad);
      ctx.stroke();
      // Y labels
      ctx.fillStyle = '#444';
      ctx.font = '13px sans-serif';
      for (let i=0; i<=4; ++i) {
        let v = minVal + (maxVal-minVal)*i/4;
        let y = height-pad - (v-minVal)/(maxVal-minVal)*(height-2*pad);
        ctx.fillText(v.toFixed(0), 6, y+4);
      }
      // X labels
      for (let i=0; i<years.length; ++i) {
        let x = pad + (years[i]-minYear)/(maxYear-minYear)*(width-2*pad);
        ctx.fillText(years[i], x-10, height-pad+18);
      }
      // Plot historical
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i=0; i<rows.length; ++i) {
        if (rows[i].type !== 'historical') continue;
        let x = pad + (rows[i].year-minYear)/(maxYear-minYear)*(width-2*pad);
        let y = height-pad - (rows[i].value-minVal)/(maxVal-minVal)*(height-2*pad);
        if (i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Plot predicted
      let pred = rows.find(r => r.type==='predicted');
      if (pred) {
        let x = pad + (pred.year-minYear)/(maxYear-minYear)*(width-2*pad);
        let y = height-pad - (pred.value-minVal)/(maxVal-minVal)*(height-2*pad);
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2*Math.PI);
        ctx.fill();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Prediction', x+10, y-10);
      }
      predictionChart.style.display = 'block';
    }

    // Already declared at the top:
    // const dataDownloadForm = document.getElementById('dataDownloadForm');
    const dataDownloadReporter = document.getElementById('dataDownloadReporter');
    const dataDownloadPartner = document.getElementById('dataDownloadPartner');
    // const dataDownloadStatus = document.getElementById('dataDownloadStatus');
    if (dataDownloadReporter && typeof COUNTRY_CODES !== 'undefined') {
      dataDownloadReporter.innerHTML = '<option value="">All</option>';
      COUNTRY_CODES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name + ' (' + c.code + ')';
        dataDownloadReporter.appendChild(opt);
      });
    }
    if (dataDownloadPartner && typeof COUNTRY_CODES !== 'undefined') {
      dataDownloadPartner.innerHTML = '<option value="">All</option>';
      COUNTRY_CODES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name + ' (' + c.code + ')';
        dataDownloadPartner.appendChild(opt);
      });
    }
    if (dataDownloadForm) {
      dataDownloadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        dataDownloadStatus.innerHTML = '';
        const reporterCode = dataDownloadReporter.value;
        const partnerCode = dataDownloadPartner.value;
        const year = document.getElementById('dataDownloadYear').value;
        const cmdCode = document.getElementById('dataDownloadCommodity').value;
        const flowCode = document.getElementById('dataDownloadFlow').value;
        // Determine all reporter/partner combos
        let reporterList = reporterCode ? [reporterCode] : COUNTRY_CODES.map(c => c.code);
        let partnerList = partnerCode ? [partnerCode] : COUNTRY_CODES.map(c => c.code);
        // Prevent massive downloads (limit combos)
        if (reporterList.length * partnerList.length > 200) {
          dataDownloadStatus.innerHTML = '<div style="color:red;">Too many combinations selected! Please narrow your selection.</div>';
          return;
        }
        dataDownloadStatus.innerHTML = '<div>Fetching data...</div>';
        let allRows = [];
        let columnsSet = new Set();
        for (let r of reporterList) {
          for (let p of partnerList) {
            if (r === p) continue; // skip self-pairs
            const payload = {
              reporterCode: r,
              partnerCode: p,
              period: year,
              cmdCode: cmdCode,
              flowCode: flowCode
            };
            try {
              const resp = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await resp.json();
              if (data && data.rows && data.rows.length > 0) {
                data.rows.forEach(row => {
                  allRows.push(row);
                });
                data.columns.forEach(col => columnsSet.add(col));
              }
            } catch (err) {
              // skip errors
            }
          }
        }
        if (allRows.length === 0) {
          dataDownloadStatus.innerHTML = '<div>No data found for your selection.</div>';
          return;
        }
        // Build CSV
        const columns = Array.from(columnsSet);
        let csv = columns.join(',') + '\n';
        allRows.forEach(row => {
          csv += columns.map(col => row[col] !== undefined ? row[col] : '').join(',') + '\n';
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_trade_data.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        dataDownloadStatus.innerHTML = '<div>Download started.</div>';
      });
    }

    const bilateralForm = document.getElementById('bilateralForm');
    const bilateralReporter = document.getElementById('bilateralReporter');
    const bilateralPartner = document.getElementById('bilateralPartner');
    const bilateralResults = document.getElementById('bilateralResults');
    const bilateralDownloadBtn = document.getElementById('bilateralDownloadBtn');
    let bilateralTableData = null;
    // Populate both country dropdowns
    if (bilateralReporter && bilateralPartner && typeof COUNTRY_CODES !== 'undefined') {
      bilateralReporter.innerHTML = '';
      bilateralPartner.innerHTML = '';
      COUNTRY_CODES.forEach(c => {
        const opt1 = document.createElement('option');
        opt1.value = c.code;
        opt1.textContent = c.name + ' (' + c.code + ')';
        bilateralReporter.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = c.code;
        opt2.textContent = c.name + ' (' + c.code + ')';
        bilateralPartner.appendChild(opt2);
      });
    }
    if (bilateralForm) {
      bilateralForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        bilateralResults.innerHTML = '';
        bilateralDownloadBtn.style.display = 'none';
        const reporterCode = bilateralReporter.value;
        const partnerCode = bilateralPartner.value;
        const year = document.getElementById('bilateralYear').value;
        const cmdCode = document.getElementById('bilateralCommodity').value;
        const payload = {
          reporterCode: reporterCode,
          partnerCode: partnerCode,
          period: year,
          cmdCode: cmdCode,
          flowCode: '' // Show all flows
        };
        bilateralResults.innerHTML = '<div>Loading bilateral trade data...</div>';
        try {
          const resp = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (data && data.rows && data.rows.length > 0) {
            // Find value and flow columns
            const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
            const flowCol = data.columns.includes('flowCode') ? 'flowCode' : (data.columns.includes('TradeFlow') ? 'TradeFlow' : null);
            if (!valueCol) {
              bilateralResults.innerHTML = '<div>No value column found.</div>';
              return;
            }
            bilateralTableData = data.rows;
            // Render table
            let html = '<div style="overflow-x:auto;"><table><thead><tr>';
            if (flowCol) html += '<th>Flow</th>';
            html += '<th>Value</th></tr></thead><tbody>';
            data.rows.forEach(row => {
              html += '<tr>';
              if (flowCol) html += `<td>${row[flowCol]}</td>`;
              html += `<td>${row[valueCol]}</td></tr>`;
            });
            html += '</tbody></table></div>';
            bilateralResults.innerHTML = html;
            if (data.rows.length > 0) bilateralDownloadBtn.style.display = 'inline-block';
            else bilateralDownloadBtn.style.display = 'none';
            // Modern chart for Bilateral
            renderModernChart(data.rows, 'bilateralChart');
          } else {
            bilateralResults.innerHTML = '<div>No data found for this country pair/year.</div>';
            bilateralDownloadBtn.style.display = 'none';
          }
        } catch (err) {
          bilateralResults.innerHTML = '<div>Error fetching data.</div>';
        } finally {
          hideSpinner();
        }
      });
      bilateralDownloadBtn.addEventListener('click', function() {
        if (!bilateralTableData) return;
        let csv = 'Flow,Value\n';
        bilateralTableData.forEach(row => {
          csv += `${row.flowCode || row.TradeFlow || ''},${row.primaryValue || row.TradeValue || row.Value || ''}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bilateral_trade.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }

    const rankingsForm = document.getElementById('rankingsForm');
    const rankingsResults = document.getElementById('rankingsResults');
    const rankingsDownloadBtn = document.getElementById('rankingsDownloadBtn');
    let rankingsTableData = null;
    if (rankingsForm) {
      rankingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        rankingsResults.innerHTML = '';
        rankingsDownloadBtn.style.display = 'none';
        const year = document.getElementById('rankingsYear').value;
        const cmdCode = document.getElementById('rankingsCommodity').value;
        const flowCode = document.getElementById('rankingsFlow').value;
        // Fetch for all countries: iterate COUNTRY_CODES
        const allPromises = COUNTRY_CODES.map(async country => {
          const payload = {
            reporterCode: country.code,
            partnerCode: '0', // World
            period: year,
            cmdCode: cmdCode,
            flowCode: flowCode
          };
          try {
            const resp = await fetch('/api/trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data && data.rows && data.rows.length > 0) {
              // Find the value column (primaryValue or TradeValue or Value)
              const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
              const val = valueCol ? data.rows[0][valueCol] : null;
              return {
                country: country.name,
                code: country.code,
                value: val
              };
            } else {
              return {
                country: country.name,
                code: country.code,
                value: null
              };
            }
          } catch (err) {
            return {
              country: country.name,
              code: country.code,
              value: null
            };
          }
        });
        rankingsResults.innerHTML = '<div>Loading data for all countries...</div>';
        showSpinner();
        const allResults = await Promise.all(allPromises);
        hideSpinner();
        // Filter for non-null values and sort descending
        const filtered = allResults.filter(r => r.value !== null && r.value !== undefined).sort((a, b) => b.value - a.value);
        rankingsTableData = filtered;
        // Render table
        let html = '<div style="overflow-x:auto;"><table><thead><tr><th>Country</th><th>Code</th><th>Value</th></tr></thead><tbody>';
        filtered.forEach(row => {
          html += `<tr><td>${row.country}</td><td>${row.code}</td><td>${row.value}</td></tr>`;
        });
        html += '</tbody></table></div>';
        rankingsResults.innerHTML = html;
        if (filtered.length > 0) rankingsDownloadBtn.style.display = 'inline-block';
        else rankingsDownloadBtn.style.display = 'none';
        // Modern chart for Rankings
        renderModernChart(filtered, 'rankingsChart');
      });
      rankingsDownloadBtn.addEventListener('click', function() {
        if (!rankingsTableData) return;
        let csv = 'Country,Code,Value\n';
        rankingsTableData.forEach(row => {
          csv += `${row.country},${row.code},${row.value}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rankings.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }

    const importsProductForm = document.getElementById('importsProductForm');
    const importsProductCountry = document.getElementById('importsProductCountry');
    const importsProductResults = document.getElementById('importsProductResults');
    const importsProductDownloadBtn = document.getElementById('importsProductDownloadBtn');
    let importsProductTableData = null;
    // Populate country dropdown
    if (importsProductCountry && typeof COUNTRY_CODES !== 'undefined') {
      importsProductCountry.innerHTML = '';
      COUNTRY_CODES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name + ' (' + c.code + ')';
        importsProductCountry.appendChild(opt);
      });
    }
    if (importsProductForm) {
      importsProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        importsProductResults.innerHTML = '';
        importsProductDownloadBtn.style.display = 'none';
        const reporterCode = importsProductCountry.value;
        const year = document.getElementById('importsProductYear').value;
        // Fetch for all products (HS codes) for this country/year
        const payload = {
          reporterCode: reporterCode,
          partnerCode: '0', // World
          period: year,
          cmdCode: 'ALL', // Get all products
          flowCode: 'M'
        };
        importsProductResults.innerHTML = '<div>Loading data for all products...</div>';
        showSpinner();
        try {
          const resp = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (data && data.rows && data.rows.length > 0) {
            // Find the product/HS code column
            const hsCol = data.columns.includes('cmdCode') ? 'cmdCode' : (data.columns.includes('productCode') ? 'productCode' : null);
            const descCol = data.columns.includes('cmdDescE') ? 'cmdDescE' : (data.columns.includes('productDesc') ? 'productDesc' : null);
            const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
            if (!hsCol || !valueCol) {
              importsProductResults.innerHTML = '<div>No product/value columns found.</div>';
              return;
            }
            // Sort by value descending
            const sorted = data.rows.slice().sort((a, b) => b[valueCol] - a[valueCol]);
            importsProductTableData = sorted;
            // Render table
            let html = '<div style="overflow-x:auto;"><table><thead><tr><th>HS Code</th>';
            if (descCol) html += '<th>Description</th>';
            html += '<th>Value</th></tr></thead><tbody>';
            sorted.forEach(row => {
              html += `<tr><td>${row[hsCol]}</td>`;
              if (descCol) html += `<td>${row[descCol]}</td>`;
              html += `<td>${row[valueCol]}</td></tr>`;
            });
            html += '</tbody></table></div>';
            importsProductResults.innerHTML = html;
        // Modern chart for Imports by Product
        renderModernChart(sorted, 'importsProductChart');
            if (sorted.length > 0) importsProductDownloadBtn.style.display = 'inline-block';
            else importsProductDownloadBtn.style.display = 'none';
          } else {
            importsProductResults.innerHTML = '<div>No data found for this country/year.</div>';
            importsProductDownloadBtn.style.display = 'none';
          }
        } catch (err) {
          importsProductResults.innerHTML = '<div>Error fetching data.</div>';
        } finally {
          hideSpinner();
        }
      });
      importsProductDownloadBtn.addEventListener('click', function() {
        if (!importsProductTableData) return;
        let csv = 'HS Code,Description,Value\n';
        importsProductTableData.forEach(row => {
          csv += `${row.cmdCode || row.productCode || ''},${row.cmdDescE || row.productDesc || ''},${row.primaryValue || row.TradeValue || row.Value || ''}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'imports_by_product.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }

    const exportsProductForm = document.getElementById('exportsProductForm');
    const exportsProductCountry = document.getElementById('exportsProductCountry');
    const exportsProductResults = document.getElementById('exportsProductResults');
    const exportsProductDownloadBtn = document.getElementById('exportsProductDownloadBtn');
    let exportsProductTableData = null;
    // Populate country dropdown
    if (exportsProductCountry && typeof COUNTRY_CODES !== 'undefined') {
      exportsProductCountry.innerHTML = '';
      COUNTRY_CODES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name + ' (' + c.code + ')';
        exportsProductCountry.appendChild(opt);
      });
    }
    if (exportsProductForm) {
      exportsProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        exportsProductResults.innerHTML = '';
        exportsProductDownloadBtn.style.display = 'none';
        const reporterCode = exportsProductCountry.value;
        const year = document.getElementById('exportsProductYear').value;
        // Fetch for all products (HS codes) for this country/year
        const payload = {
          reporterCode: reporterCode,
          partnerCode: '0', // World
          period: year,
          cmdCode: 'ALL', // Get all products
          flowCode: 'X'
        };
        exportsProductResults.innerHTML = '<div>Loading data for all products...</div>';
        showSpinner();
        try {
          const resp = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (data && data.rows && data.rows.length > 0) {
            // Find the product/HS code column
            const hsCol = data.columns.includes('cmdCode') ? 'cmdCode' : (data.columns.includes('productCode') ? 'productCode' : null);
            const descCol = data.columns.includes('cmdDescE') ? 'cmdDescE' : (data.columns.includes('productDesc') ? 'productDesc' : null);
            const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
            if (!hsCol || !valueCol) {
              exportsProductResults.innerHTML = '<div>No product/value columns found.</div>';
              return;
            }
            // Sort by value descending
            const sorted = data.rows.slice().sort((a, b) => b[valueCol] - a[valueCol]);
            exportsProductTableData = sorted;
            // Render table
            let html = '<div style="overflow-x:auto;"><table><thead><tr><th>HS Code</th>';
            if (descCol) html += '<th>Description</th>';
            html += '<th>Value</th></tr></thead><tbody>';
            sorted.forEach(row => {
              html += `<tr><td>${row[hsCol]}</td>`;
              if (descCol) html += `<td>${row[descCol]}</td>`;
              html += `<td>${row[valueCol]}</td></tr>`;
            });
            html += '</tbody></table></div>';
            exportsProductResults.innerHTML = html;
        // Modern chart for Exports by Product
        renderModernChart(sorted, 'exportsProductChart');
            if (sorted.length > 0) exportsProductDownloadBtn.style.display = 'inline-block';
            else exportsProductDownloadBtn.style.display = 'none';
          } else {
            exportsProductResults.innerHTML = '<div>No data found for this country/year.</div>';
            exportsProductDownloadBtn.style.display = 'none';
          }
        } catch (err) {
          exportsProductResults.innerHTML = '<div>Error fetching data.</div>';
        } finally {
          hideSpinner();
        }
      });
      exportsProductDownloadBtn.addEventListener('click', function() {
        if (!exportsProductTableData) return;
        let csv = 'HS Code,Description,Value\n';
        exportsProductTableData.forEach(row => {
          csv += `${row.cmdCode || row.productCode || ''},${row.cmdDescE || row.productDesc || ''},${row.primaryValue || row.TradeValue || row.Value || ''}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exports_by_product.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }

    const importsCountryForm = document.getElementById('importsCountryForm');
    const importsCountryResults = document.getElementById('importsCountryResults');
    const importsCountryDownloadBtn = document.getElementById('importsCountryDownloadBtn');
    let importsCountryTableData = null;
    if (importsCountryForm) {
      importsCountryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        importsCountryResults.innerHTML = '';
        importsCountryDownloadBtn.style.display = 'none';
        const year = document.getElementById('importsCountryYear').value;
        const cmdCode = document.getElementById('importsCountryCommodity').value;
        const flowCode = document.getElementById('importsCountryFlow').value;
        // Fetch for all countries: iterate COUNTRY_CODES
        const allPromises = COUNTRY_CODES.map(async country => {
          const payload = {
            reporterCode: country.code,
            partnerCode: '0', // World
            period: year,
            cmdCode: cmdCode,
            flowCode: flowCode
          };
          try {
            const resp = await fetch('/api/trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data && data.rows && data.rows.length > 0) {
              // Find the value column (primaryValue or TradeValue or Value)
              const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
              const val = valueCol ? data.rows[0][valueCol] : null;
              return {
                country: country.name,
                code: country.code,
                value: val
              };
            } else {
              return {
                country: country.name,
                code: country.code,
                value: null
              };
            }
          } catch (err) {
            return {
              country: country.name,
              code: country.code,
              value: null
            };
          }
        });
        importsCountryResults.innerHTML = '<div>Loading data for all countries...</div>';
        const allResults = await Promise.all(allPromises);
        // Filter for non-null values and sort descending
        const filtered = allResults.filter(r => r.value !== null && r.value !== undefined).sort((a, b) => b.value - a.value);
        importsCountryTableData = filtered;
        // Render table
        let html = '<div style="overflow-x:auto;"><table><thead><tr><th>Country</th><th>Code</th><th>Value</th></tr></thead><tbody>';
        filtered.forEach(row => {
          html += `<tr><td>${row.country}</td><td>${row.code}</td><td>${row.value}</td></tr>`;
        });
        html += '</tbody></table></div>';
        importsCountryResults.innerHTML = html;
        if (filtered.length > 0) importsCountryDownloadBtn.style.display = 'inline-block';
        else importsCountryDownloadBtn.style.display = 'none';
        // Modern chart for Imports by Country
        renderModernChart(filtered, 'importsCountryChart');
      });
      importsCountryDownloadBtn.addEventListener('click', function() {
        if (!importsCountryTableData) return;
        let csv = 'Country,Code,Value\n';
        importsCountryTableData.forEach(row => {
          csv += `${row.country},${row.code},${row.value}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'imports_by_country.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }

    const exportsCountryForm = document.getElementById('exportsCountryForm');
    const exportsCountryResults = document.getElementById('exportsCountryResults');
    const exportsCountryDownloadBtn = document.getElementById('exportsCountryDownloadBtn');
    let exportsCountryTableData = null;
    if (exportsCountryForm) {
      exportsCountryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        exportsCountryResults.innerHTML = '';
        exportsCountryDownloadBtn.style.display = 'none';
        const year = document.getElementById('exportsCountryYear').value;
        const cmdCode = document.getElementById('exportsCountryCommodity').value;
        const flowCode = document.getElementById('exportsCountryFlow').value;
        // Fetch for all countries: iterate COUNTRY_CODES
        const allPromises = COUNTRY_CODES.map(async country => {
          const payload = {
            reporterCode: country.code,
            partnerCode: '0', // World
            period: year,
            cmdCode: cmdCode,
            flowCode: flowCode
          };
          try {
            const resp = await fetch('/api/trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (data && data.rows && data.rows.length > 0) {
              // Find the value column (primaryValue or TradeValue or Value)
              const valueCol = data.columns.includes('primaryValue') ? 'primaryValue' : (data.columns.includes('TradeValue') ? 'TradeValue' : (data.columns.includes('Value') ? 'Value' : null));
              const val = valueCol ? data.rows[0][valueCol] : null;
              return {
                country: country.name,
                code: country.code,
                value: val
              };
            } else {
              return {
                country: country.name,
                code: country.code,
                value: null
              };
            }
          } catch (err) {
            return {
              country: country.name,
              code: country.code,
              value: null
            };
          }
        });
        exportsCountryResults.innerHTML = '<div>Loading data for all countries...</div>';
        const allResults = await Promise.all(allPromises);
        // Filter for non-null values and sort descending
        const filtered = allResults.filter(r => r.value !== null && r.value !== undefined).sort((a, b) => b.value - a.value);
        exportsCountryTableData = filtered;
        // Render table
        let html = '<div style="overflow-x:auto;"><table><thead><tr><th>Country</th><th>Code</th><th>Value</th></tr></thead><tbody>';
        filtered.forEach(row => {
          html += `<tr><td>${row.country}</td><td>${row.code}</td><td>${row.value}</td></tr>`;
        });
        html += '</tbody></table></div>';
        exportsCountryResults.innerHTML = html;
        if (filtered.length > 0) exportsCountryDownloadBtn.style.display = 'inline-block';
        else exportsCountryDownloadBtn.style.display = 'none';
        // Modern chart for Exports by Country
        renderModernChart(filtered, 'exportsCountryChart');
      });
      exportsCountryDownloadBtn.addEventListener('click', function() {
        if (!exportsCountryTableData) return;
        let csv = 'Country,Code,Value\n';
        exportsCountryTableData.forEach(row => {
          csv += `${row.country},${row.code},${row.value}\n`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exports_by_country.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      });
    }


    const form = document.getElementById('tradeForm');
    const resultsDiv = document.getElementById('results');
    const predictForm = document.getElementById('predictForm');
    const predictionResult = document.getElementById('predictionResult');
    const alertDiv = document.getElementById('alert');
    const spinner = document.getElementById('spinner');
    const tradeChart = document.getElementById('tradeChart');
    let chartInstance = null;

    function showAlert(msg, type='danger') {
        alertDiv.style.display = 'block';
        alertDiv.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger');
        alertDiv.textContent = msg;
    }
    function clearAlert() {
        alertDiv.style.display = 'none';
        alertDiv.textContent = '';
    }
    function showSpinner() { spinner.style.display = 'block'; }
    function hideSpinner() { spinner.style.display = 'none'; }
    function renderTable(columns, rows) {
        let html = '<div style="overflow-x:auto;"><table><thead><tr>';
        columns.forEach(col => html += `<th>${col}</th>`);
        html += '</tr></thead><tbody>';
        rows.forEach(row => {
            html += '<tr>';
            columns.forEach(col => html += `<td>${row[col]}</td>`);
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }
    function renderChart(columns, rows) {
        if (!tradeChart) return;
        // Try to plot year vs primaryValue
        const yearCol = columns.includes('year') ? 'year' : (columns.includes('refYear') ? 'refYear' : null);
        const valueCol = columns.includes('primaryValue') ? 'primaryValue' : null;
        if (!yearCol || !valueCol) { tradeChart.style.display = 'none'; return; }
        const dataByYear = {};
        rows.forEach(row => {
            const y = row[yearCol] || row['refYear'];
            const v = row[valueCol];
            if (y && v) dataByYear[y] = v;
        });
        const years = Object.keys(dataByYear).sort();
        const values = years.map(y => dataByYear[y]);
        if (chartInstance) chartInstance.destroy();
        chartInstance = new window.Chart(tradeChart.getContext('2d'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Trade Value',
                    data: values,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52,152,219,0.2)',
                    fill: true
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
        tradeChart.style.display = 'block';
    }

    // Initialize select2 on country dropdowns (after country list loads)

    // --- World map visualization ---
    let map = null;
    let reporterMarker = null;
    let partnerMarker = null;
    let countryLatLng = {
        '842': [38.0, -97.0], // USA
        '156': [35.0, 103.0], // China
        '392': [36.2, 138.2], // Japan
        '826': [54.0, -2.0], // UK
        '124': [56.1, -106.3], // Canada
        '250': [46.6, 2.2], // France
        '276': [51.2, 10.4], // Germany
        '380': [41.9, 12.5], // Italy
        '484': [23.6, -102.5], // Mexico
        '356': [20.6, 78.9], // India
        '643': [61.5, 105.3], // Russia
        '710': [-30.6, 22.9], // South Africa
        '036': [-25.3, 133.8], // Australia
        '410': [36.5, 127.9], // South Korea
        '704': [14.1, 108.3], // Vietnam
        '458': [4.2, 101.9], // Malaysia
        '554': [-40.9, 174.9], // New Zealand
        '764': [15.8, 100.9], // Thailand
        '344': [22.3, 114.2], // Hong Kong
    };
    function updateMap() {
        if (!window.L || !document.getElementById('worldMap')) return;
        if (!map) {
            map = L.map('worldMap').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap contributors'
            }).addTo(map);
        }
        // Remove old markers
        if (reporterMarker) { map.removeLayer(reporterMarker); reporterMarker = null; }
        if (partnerMarker) { map.removeLayer(partnerMarker); partnerMarker = null; }
        // Add new markers
        const reporterCode = document.getElementById('reporterCode').value;
        const partnerCode = document.getElementById('partnerCode').value;
        if (countryLatLng[reporterCode]) {
            reporterMarker = L.marker(countryLatLng[reporterCode], {icon: L.icon({iconUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',shadowSize:[41,41]})}).addTo(map).bindPopup('Reporter Country');
        }
        if (countryLatLng[partnerCode]) {
            partnerMarker = L.marker(countryLatLng[partnerCode], {icon: L.icon({iconUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-red.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowUrl:'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',shadowSize:[41,41]})}).addTo(map).bindPopup('Partner Country');
        }
    }
    document.getElementById('reporterCode').addEventListener('change', updateMap);
    document.getElementById('partnerCode').addEventListener('change', updateMap);
    setTimeout(updateMap, 1000); // Initial update after map loads

    // Placeholder for extra visualizations
    function showExtraVisualizations(data) {
        const div = document.getElementById('extraVisualizations');
        div.innerHTML = '<h3>Additional Visualizations (coming soon)</h3>';
    }

    clearAlert();
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAlert();
        resultsDiv.innerHTML = '';
        tradeChart.style.display = 'none';
        showSpinner();
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (value !== '') data[key] = value;
        });
        try {
            const response = await fetch('/api/trade', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const json = await response.json();
            hideSpinner();
            if (json.error) {
                showAlert('Error: ' + json.error, 'danger');
                resultsDiv.innerHTML = '';
            } else if (!json.rows || json.rows.length === 0) {
                showAlert('No data returned for these parameters.', 'danger');
                resultsDiv.innerHTML = '';
            } else {
                showAlert('Data loaded successfully!', 'success');
                resultsDiv.innerHTML = renderTable(json.columns, json.rows);
                renderChart(json.columns, json.rows);
            }
        } catch (err) {
            showAlert('Request failed: ' + err, 'danger');
            resultsDiv.innerHTML = '';
        } finally {
            hideSpinner();
        }
    });

    predictForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAlert();
        predictionResult.innerHTML = '<p>Predicting...</p>';
        // Gather parameters from both forms
        const formData = new FormData(form);
        const predictData = new FormData(predictForm);
        const data = {};
        formData.forEach((value, key) => { if (value !== '') data[key] = value; });
        predictData.forEach((value, key) => { if (value !== '') data[key] = value; });
        showSpinner();
        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const json = await response.json();
            
            if (json.error) {
                showAlert('Prediction error: ' + json.error, 'danger');
                predictionResult.innerHTML = '';
            } else if (json.prediction !== undefined) {
                showAlert('Prediction successful! Model: ' + (json.model_type || 'N/A'), 'success');
                
                // Format the prediction result
                let predictionValue = typeof json.prediction === 'number' ? 
                    json.prediction.toLocaleString(undefined, {maximumFractionDigits:2}) : 
                    json.prediction;
                    
                // Get MSE value safely
                let mseValue = json.mse !== undefined ? 
                    (typeof json.mse === 'number' ? json.mse.toLocaleString(undefined, {maximumFractionDigits:2}) : json.mse) : 
                    'N/A';
                    
                predictionResult.innerHTML = `<p><strong>Predicted Trade Value:</strong> ${predictionValue}<br><small>(Model: ${json.model_type || ''} | MSE: ${mseValue})</small></p>`;
                
                // If we have historical data, plot a chart
                if (json.historical && Array.isArray(json.historical)) {
                    // Prepare table data for chart
                    let rows = [];
                    json.historical.forEach(row => {
                        rows.push({ year: row.year, value: row.value, type: 'historical' });
                    });
                    rows.push({ year: json.prediction_year || predict_year, value: json.prediction, type: 'predicted' });
                    
                    // Save for export
                    predictionTableData = rows;
                    
                    // Display the download button
                    predictionDownloadBtn.style.display = 'inline-block';
                    
                    // Plot the chart
                    plotPredictionChart(rows);
                }
            } else {
                showAlert('No prediction data returned', 'danger');
                predictionResult.innerHTML = '<div>No prediction data returned.</div>';
            }
        } catch (err) {
            showAlert('Prediction failed: ' + err, 'danger');
            predictionResult.innerHTML = '';
        } finally {
            hideSpinner();
        }
      });

    // Load Chart.js dynamically if not present
    if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.body.appendChild(script);
    }

    // ---- Tab Navigation Logic ----
    const tabs = document.querySelectorAll('#main-tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', function() {
        // Hide all spinners in all tab panels
        document.querySelectorAll('.spinner').forEach(spinner => spinner.style.display = 'none');
        hideSpinner(); // Also hide main spinner for good measure
        tabs.forEach((t, i) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const tabName = tab.getAttribute('data-tab');
        tabContents.forEach(panel => {
          if (panel.id === 'tab-content-' + tabName) {
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
          }
        });
        tab.focus();
      });
      tab.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          tabs[(idx + 1) % tabs.length].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          tabs[(idx - 1 + tabs.length) % tabs.length].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });
  });
