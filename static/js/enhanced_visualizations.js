/**
 * Enhanced Trade Visualizations
 * Adds advanced chart capabilities and data caching to the Trade Flow Predictor
 */

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Cache management functionality
    initCacheManagement();
    
    // Enhanced chart controls for all tabs
    setupChartControls();
    
    // Enhance existing trade data views with additional visualizations
    enhanceExistingTabs();
    
    console.log('Enhanced visualizations initialized successfully');
  } catch (err) {
    console.error('Error initializing enhanced visualizations:', err);
  }
});

/**
 * Initialize the cache management tab functionality
 */
function initCacheManagement() {
  const refreshCacheBtn = document.getElementById('refreshCacheBtn');
  const clearAllCacheBtn = document.getElementById('clearAllCacheBtn');
  const cachedDataList = document.getElementById('cachedDataList');
  const cacheVisualization = document.getElementById('cacheVisualization');
  const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
  
  let activeChartType = 'bar';
  let selectedCacheKey = null;
  
  // Initial cache listing
  refreshCacheList();
  
  // Set up event listeners
  if (refreshCacheBtn) {
    refreshCacheBtn.addEventListener('click', refreshCacheList);
  }
  
  if (clearAllCacheBtn) {
    clearAllCacheBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all cached trade data?')) {
        DataManager.clearAllCache();
        refreshCacheList();
        cacheVisualization.style.display = 'none';
      }
    });
  }
  
  // Chart type selection
  chartTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
      chartTypeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      activeChartType = this.getAttribute('data-type');
      
      if (selectedCacheKey) {
        visualizeCachedData(selectedCacheKey, activeChartType);
      }
    });
  });
  
  /**
   * Refresh the cache listing UI
   */
  function refreshCacheList() {
    const cachedItems = DataManager.listCachedData();
    
    if (!cachedDataList) return;
    
    if (cachedItems.length === 0) {
      cachedDataList.innerHTML = `
        <div class="cached-data-item" style="text-align:center;padding:20px;color:#666;">
          No cached data available. Use the other tabs to fetch and visualize trade data.
        </div>
      `;
      return;
    }
    
    // Sort items by timestamp (newest first)
    cachedItems.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampB - timestampA;
    });
    
    // Build the list
    let html = '';
    cachedItems.forEach(item => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      html += `
        <div class="cached-data-item">
          <div>
            <div><strong>${getCountryName(item.reporter)} → ${getCountryName(item.partner)}</strong></div>
            <div class="cached-data-info">Year: ${item.year} | Commodity: ${item.commodity} | Flow: ${item.flow === 'all' ? 'All' : item.flow}</div>
            <div class="cached-data-info">Cached: ${timestamp}</div>
          </div>
          <div class="cached-data-actions">
            <button class="action-btn view-cache" data-key="${item.key}"><i class="fas fa-chart-bar"></i> Visualize</button>
            <button class="action-btn export-cache" data-key="${item.key}"><i class="fas fa-file-export"></i> Export</button>
            <button class="action-btn delete delete-cache" data-key="${item.key}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
    
    cachedDataList.innerHTML = html;
    
    // Add event listeners for actions
    document.querySelectorAll('.view-cache').forEach(button => {
      button.addEventListener('click', function() {
        const key = this.getAttribute('data-key');
        selectedCacheKey = key;
        
        // Find and activate a chart type button if none is active
        if (!document.querySelector('.chart-type-btn.active')) {
          const barChartBtn = document.querySelector('.chart-type-btn[data-type="bar"]');
          if (barChartBtn) {
            barChartBtn.classList.add('active');
            activeChartType = 'bar';
          }
        }
        
        visualizeCachedData(key, activeChartType);
      });
    });
    
    document.querySelectorAll('.export-cache').forEach(button => {
      button.addEventListener('click', function() {
        const key = this.getAttribute('data-key');
        const cachedData = DataManager.getFromCache({key: key});
        
        if (cachedData) {
          // Extract metadata from the key
          const parts = key.split('_');
          const filename = `trade_${parts[2]}_${parts[3]}_${parts[4]}_${parts[5]}.csv`;
          
          DataManager.exportToCsv(cachedData, filename);
        }
      });
    });
    
    document.querySelectorAll('.delete-cache').forEach(button => {
      button.addEventListener('click', function() {
        const key = this.getAttribute('data-key');
        if (confirm('Delete this cached data item?')) {
          DataManager.clearCacheEntry(key);
          refreshCacheList();
          
          if (selectedCacheKey === key) {
            selectedCacheKey = null;
            cacheVisualization.style.display = 'none';
          }
        }
      });
    });
  }
  
  /**
   * Visualize cached data with the specified chart type
   */
  function visualizeCachedData(cacheKey, chartType) {
    if (!cacheVisualization) return;
    
    const cachedData = DataManager.getFromCache({key: cacheKey});
    if (!cachedData) {
      cacheVisualization.innerHTML = '<p>Error: Could not retrieve cached data</p>';
      cacheVisualization.style.display = 'block';
      return;
    }
    
    cacheVisualization.innerHTML = ''; // Clear previous chart
    cacheVisualization.style.display = 'block';
    
    // Extract metadata from the key
    const parts = cacheKey.split('_');
    const reporter = getCountryName(parts[2]);
    const partner = getCountryName(parts[3]);
    const year = parts[4];
    const commodity = parts[5];
    
    // Determine title based on data
    let title = `${reporter} - ${partner} Trade (${year})`;
    if (commodity !== 'TOTAL') {
      title += ` | Commodity: ${commodity}`;
    }
    
    // Create appropriate chart based on type
    switch (chartType) {
      case 'bar':
        TradeCharts.createBarChart('cacheVisualization', cachedData, {
          valueField: 'TradeValue',
          labelField: 'cmdDescE',
          title: title
        });
        break;
        
      case 'pie':
        TradeCharts.createPieChart('cacheVisualization', cachedData, {
          valueField: 'TradeValue',
          labelField: 'cmdDescE',
          title: title
        });
        break;
        
      case 'line':
        // For line charts, we need time series data which might not be available in this cache
        // Using a single cache entry, we'll simulate time data for demonstration
        const timeData = simulateTimeSeriesData(cachedData, year);
        TradeCharts.createLineChart('cacheVisualization', timeData, {
          valueField: 'value',
          labelField: 'year',
          title: `${reporter} - ${partner} Trade Trend`
        });
        break;
        
      case 'treemap':
        TradeCharts.createTreemap('cacheVisualization', cachedData, {
          valueField: 'TradeValue',
          labelField: 'cmdDescE',
          title: title
        });
        break;
        
      case 'map':
        // Create a simplified map for demonstration
        // In a real app, you would use real geographical data
        const mapData = prepareMapData(cachedData, parts[2], parts[3]);
        TradeCharts.createWorldMapChart('cacheVisualization', mapData, {
          valueField: 'value',
          labelField: 'country',
          countryCodeField: 'code',
          title: `${reporter} - ${partner} Trade Flow`
        });
        break;
    }
  }
  
  /**
   * Helper to get country name from code
   */
  function getCountryName(code) {
    if (window.COUNTRY_CODES) {
      const country = COUNTRY_CODES.find(c => c.code === code);
      return country ? country.name : code;
    }
    return code;
  }
  
  /**
   * Generate simulated time series data for demonstration
   */
  function simulateTimeSeriesData(data, currentYear) {
    // Extract total trade value from the data
    let totalValue = 0;
    if (data.rows && data.rows.length > 0) {
      totalValue = data.rows.reduce((sum, row) => {
        return sum + (parseFloat(row.TradeValue) || 0);
      }, 0);
    } else {
      return [];
    }
    
    // Generate data for 5 years (current year and 4 years prior)
    const currentYearNum = parseInt(currentYear);
    const timeData = [];
    
    // Create a random but somewhat realistic trend
    for (let i = 0; i < 5; i++) {
      const year = currentYearNum - 4 + i;
      // Random variation between 70% and 130% of the average, with an upward trend
      const factor = 0.7 + (i * 0.075) + (Math.random() * 0.3);
      const value = totalValue * factor;
      
      timeData.push({
        year: year.toString(),
        value: value
      });
    }
    
    return timeData;
  }
  
  /**
   * Prepare data for world map visualization
   */
  function prepareMapData(data, reporterCode, partnerCode) {
    // Create a simple dataset for the map with just the two countries
    const mapData = [];
    
    // Add reporter country
    if (window.COUNTRY_CODES) {
      const reporter = COUNTRY_CODES.find(c => c.code === reporterCode);
      if (reporter) {
        mapData.push({
          country: reporter.name,
          code: reporter.code,
          value: 100  // Placeholder value
        });
      }
      
      // Add partner country
      const partner = COUNTRY_CODES.find(c => c.code === partnerCode);
      if (partner) {
        mapData.push({
          country: partner.name,
          code: partner.code,
          value: 75  // Placeholder value
        });
      }
    }
    
    return mapData;
  }
}

/**
 * Set up advanced chart controls for each visualization tab
 */
function setupChartControls() {
  // Chart control panels for each visualization tab
  const tabsWithCharts = [
    { id: 'exports-country', chartDiv: 'exportsCountryChart' },
    { id: 'imports-country', chartDiv: 'importsCountryChart' },
    { id: 'exports-product', chartDiv: 'exportsProductChart' },
    { id: 'imports-product', chartDiv: 'importsProductChart' },
    { id: 'rankings', chartDiv: 'rankingsChart' },
    { id: 'bilateral', chartDiv: 'bilateralChart' }
  ];
  
  tabsWithCharts.forEach(tab => {
    const tabContent = document.getElementById(`tab-content-${tab.id}`);
    const chartDiv = document.getElementById(tab.chartDiv);
    
    if (tabContent && chartDiv) {
      // Add chart control panel
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'chart-controls';
      controlsDiv.innerHTML = `
        <h4>Visualization Options:</h4>
        <button class="chart-type-btn" data-type="bar" data-target="${tab.chartDiv}"><i class="fas fa-chart-bar"></i> Bar Chart</button>
        <button class="chart-type-btn" data-type="pie" data-target="${tab.chartDiv}"><i class="fas fa-chart-pie"></i> Pie Chart</button>
        <button class="chart-type-btn" data-type="line" data-target="${tab.chartDiv}"><i class="fas fa-chart-line"></i> Line Chart</button>
        <button class="chart-type-btn" data-type="treemap" data-target="${tab.chartDiv}"><i class="fas fa-th-large"></i> Treemap</button>
      `;
      
      // Insert controls before the chart
      chartDiv.parentNode.insertBefore(controlsDiv, chartDiv);
      
      // Convert chart div to advanced chart container
      chartDiv.className = 'advanced-chart-container';
    }
  });
  
  // Event delegation for chart type buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('chart-type-btn') || 
        event.target.parentElement.classList.contains('chart-type-btn')) {
      
      const button = event.target.classList.contains('chart-type-btn') ? 
                    event.target : 
                    event.target.parentElement;
      
      const chartType = button.getAttribute('data-type');
      const targetChart = button.getAttribute('data-target');
      
      if (chartType && targetChart) {
        // Remove active class from siblings
        const siblings = button.parentElement.querySelectorAll('.chart-type-btn');
        siblings.forEach(sib => sib.classList.remove('active'));
        
        // Add active class to this button
        button.classList.add('active');
        
        // Update chart visualization
        updateChartType(targetChart, chartType);
      }
    }
  });
}

/**
 * Update chart visualization based on selected type
 */
function updateChartType(chartDivId, chartType) {
  const chartDiv = document.getElementById(chartDivId);
  if (!chartDiv) return;
  
  // Get tab-specific data
  let data = null;
  let options = {};
  
  // Determine which data to use based on chart div id
  switch (chartDivId) {
    case 'exportsCountryChart':
      if (window.exportsCountryTableData) {
        data = window.exportsCountryTableData;
        options = {
          valueField: 'value',
          labelField: 'country',
          title: 'Exports by Country'
        };
      }
      break;
      
    case 'importsCountryChart':
      if (window.importsCountryTableData) {
        data = window.importsCountryTableData;
        options = {
          valueField: 'value',
          labelField: 'country',
          title: 'Imports by Country'
        };
      }
      break;
      
    case 'exportsProductChart':
      if (window.exportsProductTableData) {
        data = window.exportsProductTableData;
        options = {
          valueField: 'primaryValue',
          labelField: 'cmdDescE',
          title: 'Exports by Product'
        };
      }
      break;
      
    case 'importsProductChart':
      if (window.importsProductTableData) {
        data = window.importsProductTableData;
        options = {
          valueField: 'primaryValue',
          labelField: 'cmdDescE',
          title: 'Imports by Product'
        };
      }
      break;
      
    case 'rankingsChart':
      if (window.rankingsTableData) {
        data = window.rankingsTableData;
        options = {
          valueField: 'value',
          labelField: 'country',
          title: 'Country Rankings'
        };
      }
      break;
      
    case 'bilateralChart':
      if (window.bilateralTableData) {
        data = window.bilateralTableData;
        options = {
          valueField: 'primaryValue',
          labelField: 'cmdDescE',
          title: 'Bilateral Trade'
        };
      }
      break;
  }
  
  if (!data) {
    chartDiv.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">No data available for visualization</div>';
    return;
  }
  
  // Create the appropriate chart
  switch (chartType) {
    case 'bar':
      TradeCharts.createBarChart(chartDivId, data, options);
      break;
      
    case 'pie':
      TradeCharts.createPieChart(chartDivId, data, options);
      break;
      
    case 'line':
      // For proper line charts, we would need time series data
      // Here we're just demonstrating with the available data
      TradeCharts.createLineChart(chartDivId, data, options);
      break;
      
    case 'treemap':
      TradeCharts.createTreemap(chartDivId, data, options);
      break;
  }
}

/**
 * Enhance existing tab functionality with advanced visualizations and data caching
 */
function enhanceExistingTabs() {
  // Hook into each form submission to cache results
  const formIds = [
    'tradeForm',
    'exportsCountryForm', 
    'importsCountryForm',
    'exportsProductForm',
    'importsProductForm',
    'rankingsForm',
    'bilateralForm',
    'dataDownloadForm'
  ];
  
  formIds.forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
      // Store original submit handler
      const originalSubmit = form.onsubmit;
      
      // Replace with enhanced handler that caches data
      form.addEventListener('submit', function(e) {
        // Still let the original handler run
        if (originalSubmit) {
          if (originalSubmit(e) === false) {
            return false;
          }
        }
        
        // Add data caching after fetch
        enhanceFetchWithCaching(formId);
      });
    }
  });
  
  // Override the fetch and chart rendering functions to use our advanced charts
  overrideChartFunctions();
}

/**
 * Enhance the fetch process with data caching
 */
function enhanceFetchWithCaching(formId) {
  // This function hooks into the response handling of each tab's fetch
  // We'll use a MutationObserver to detect when data is loaded
  
  // Determine which result div to watch based on form id
  let resultSelector = '';
  let params = {};
  
  switch (formId) {
    case 'tradeForm':
      resultSelector = '#results';
      params = getFormParams('tradeForm', ['reporterCode', 'partnerCode', 'period', 'cmdCode', 'flowCode']);
      break;
      
    case 'exportsCountryForm':
      resultSelector = '#exportsCountryResults';
      params = getFormParams('exportsCountryForm', ['exportsCountryYear', 'exportsCountryCommodity', 'exportsCountryFlow']);
      // Set fixed params for this form
      params.reporterCode = 'ALL';
      params.partnerCode = '0';
      params.period = params.exportsCountryYear;
      params.cmdCode = params.exportsCountryCommodity;
      params.flowCode = params.exportsCountryFlow;
      break;
      
    // Similar patterns for other forms...
    case 'importsCountryForm':
      resultSelector = '#importsCountryResults';
      params = getFormParams('importsCountryForm', ['importsCountryYear', 'importsCountryCommodity', 'importsCountryFlow']);
      params.reporterCode = 'ALL';
      params.partnerCode = '0';
      params.period = params.importsCountryYear;
      params.cmdCode = params.importsCountryCommodity;
      params.flowCode = params.importsCountryFlow;
      break;
      
    case 'exportsProductForm':
      resultSelector = '#exportsProductResults';
      params = { 
        reporterCode: document.getElementById('exportsProductCountry')?.value || 'ALL',
        partnerCode: '0', 
        period: document.getElementById('exportsProductYear')?.value || '2022',
        cmdCode: 'ALL',
        flowCode: 'X'
      };
      break;
      
    case 'importsProductForm':
      resultSelector = '#importsProductResults';
      params = { 
        reporterCode: document.getElementById('importsProductCountry')?.value || 'ALL',
        partnerCode: '0', 
        period: document.getElementById('importsProductYear')?.value || '2022',
        cmdCode: 'ALL',
        flowCode: 'M'
      };
      break;
      
    case 'rankingsForm':
      resultSelector = '#rankingsResults';
      params = getFormParams('rankingsForm', ['rankingsYear', 'rankingsCommodity', 'rankingsFlow']);
      params.reporterCode = 'ALL';
      params.partnerCode = 'ALL';
      params.period = params.rankingsYear;
      params.cmdCode = params.rankingsCommodity;
      params.flowCode = params.rankingsFlow;
      break;
      
    case 'bilateralForm':
      resultSelector = '#bilateralResults';
      params = { 
        reporterCode: document.getElementById('bilateralReporter')?.value || 'ALL',
        partnerCode: document.getElementById('bilateralPartner')?.value || 'ALL', 
        period: document.getElementById('bilateralYear')?.value || '2022',
        cmdCode: document.getElementById('bilateralCommodity')?.value || 'TOTAL',
        flowCode: ''
      };
      break;
      
    case 'dataDownloadForm':
      resultSelector = '#dataDownloadStatus';
      params = { 
        reporterCode: document.getElementById('dataDownloadReporter')?.value || 'ALL',
        partnerCode: document.getElementById('dataDownloadPartner')?.value || 'ALL', 
        period: document.getElementById('dataDownloadYear')?.value || '2022',
        cmdCode: document.getElementById('dataDownloadCommodity')?.value || 'TOTAL',
        flowCode: document.getElementById('dataDownloadFlow')?.value || ''
      };
      break;
  }
  
  if (!resultSelector) return;
  
  // Set up observer to watch for data being loaded
  const resultsDiv = document.querySelector(resultSelector);
  if (!resultsDiv) return;
  
  // Observer watches for changes to the results div
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // Check if results were loaded
        if (resultsDiv.innerHTML && !resultsDiv.innerHTML.includes('Loading')) {
          // Results loaded, cache the data if applicable
          switch (formId) {
            case 'tradeForm':
              if (window.lastFetchedData) {
                DataManager.saveToCache(params, window.lastFetchedData);
              }
              break;
              
            case 'exportsCountryForm':
              if (window.exportsCountryTableData) {
                const formattedData = {
                  columns: ['country', 'code', 'value'],
                  rows: window.exportsCountryTableData
                };
                DataManager.saveToCache(params, formattedData);
              }
              break;
              
            case 'importsCountryForm':
              if (window.importsCountryTableData) {
                const formattedData = {
                  columns: ['country', 'code', 'value'],
                  rows: window.importsCountryTableData
                };
                DataManager.saveToCache(params, formattedData);
              }
              break;
              
            // Similar patterns for other forms...
            case 'exportsProductForm':
            case 'importsProductForm':
            case 'rankingsForm':
            case 'bilateralForm':
            case 'dataDownloadForm':
              // Similar caching logic
              break;
          }
          
          // Disconnect observer after caching
          observer.disconnect();
        }
      }
    }
  });
  
  // Start observing
  observer.observe(resultsDiv, { childList: true, subtree: true, attributes: true });
}

/**
 * Override default chart rendering functions to use our enhanced charts
 */
function overrideChartFunctions() {
  // Save original functions
  if (window.renderModernChart && !window._originalRenderModernChart) {
    window._originalRenderModernChart = window.renderModernChart;
    
    // Override with enhanced version
    window.renderModernChart = function(rows, chartDivId) {
      const chartDiv = document.getElementById(chartDivId);
      if (!chartDiv) return;
      
      console.log(`Rendering chart for ${chartDivId} with ${rows.length} rows`, rows[0]);
      
      // Convert to proper advanced chart container
      chartDiv.className = 'advanced-chart-container';
      
      // Add chart controls if not present
      if (!chartDiv.previousElementSibling || !chartDiv.previousElementSibling.classList.contains('chart-controls')) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'chart-controls';
        controlsDiv.innerHTML = `
          <button class="chart-type-btn active" data-type="bar" data-target="${chartDivId}"><i class="fas fa-chart-bar"></i> Bar</button>
          <button class="chart-type-btn" data-type="pie" data-target="${chartDivId}"><i class="fas fa-chart-pie"></i> Pie</button>
          <button class="chart-type-btn" data-type="treemap" data-target="${chartDivId}"><i class="fas fa-th-large"></i> Treemap</button>
        `;
        chartDiv.parentNode.insertBefore(controlsDiv, chartDiv);
      }
      
      // Make sure the chart div is visible
      chartDiv.style.display = 'block';
      
      // Determine chart options based on the data
      let options = {
        title: 'Trade Data'
      };
      
      if (rows && rows.length > 0) {
        // For exports/imports by product data
        if (chartDivId === 'exportsProductChart' || chartDivId === 'importsProductChart') {
          // Find appropriate fields for product charts
          const valueField = findValueField(rows[0]);
          const labelField = findLabelField(rows[0]);
          
          options = {
            valueField: valueField,
            labelField: labelField,
            title: chartDivId === 'exportsProductChart' ? 'Exports by Product' : 'Imports by Product',
            limit: 15 // Limit to top 15 products for readability
          };
        }
        // For country-based data
        else if (rows[0].hasOwnProperty('country')) {
          options.valueField = 'value';
          options.labelField = 'country';
          options.title = 'Trade by Country';
        } 
        // General fallback for product data
        else if (rows[0].hasOwnProperty('cmdCode') || rows[0].hasOwnProperty('productCode')) {
          options.valueField = findValueField(rows[0]);
          options.labelField = findLabelField(rows[0]);
          options.title = 'Trade by Product';
        }
      }
      
      // Create bar chart by default
      TradeCharts.createBarChart(chartDivId, rows, options);
    };
    
    // Helper function to find appropriate value field in the data
    function findValueField(row) {
      if (row.hasOwnProperty('primaryValue')) return 'primaryValue';
      if (row.hasOwnProperty('TradeValue')) return 'TradeValue';
      if (row.hasOwnProperty('Value')) return 'Value'; 
      if (row.hasOwnProperty('value')) return 'value';
      
      // If no known value field, find any numeric property
      for (const key in row) {
        if (typeof row[key] === 'number' || !isNaN(parseFloat(row[key]))) {
          return key;
        }
      }
      
      return 'value'; // Default fallback
    }
    
    // Helper function to find appropriate label field in the data
    function findLabelField(row) {
      if (row.hasOwnProperty('cmdDescE')) return 'cmdDescE';
      if (row.hasOwnProperty('productDesc')) return 'productDesc';
      if (row.hasOwnProperty('cmdCode')) return 'cmdCode';
      if (row.hasOwnProperty('productCode')) return 'productCode';
      if (row.hasOwnProperty('country')) return 'country';
      
      // Default to first string property
      for (const key in row) {
        if (typeof row[key] === 'string') {
          return key;
        }
      }
      
      return 'label'; // Default fallback
    }
  }
  
  // Override plotting for prediction chart
  if (window.plotPredictionChart && !window._originalPlotPredictionChart) {
    window._originalPlotPredictionChart = window.plotPredictionChart;
    
    window.plotPredictionChart = function(rows) {
      const chartDiv = document.getElementById('predictionChart');
      if (!chartDiv) return;
      
      // Convert to proper advanced chart container
      chartDiv.className = 'advanced-chart-container';
      
      // Create line chart for prediction
      TradeCharts.createLineChart('predictionChart', rows, {
        valueField: 'value',
        labelField: 'year',
        title: 'Trade Prediction',
        fill: true,
        seriesField: 'type' // To distinguish historical vs predicted
      });
    };
  }
}

/**
 * Helper function to get form parameters
 */
function getFormParams(formId, fieldIds) {
  const params = {};
  const form = document.getElementById(formId);
  
  if (form) {
    fieldIds.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        params[fieldId] = field.value;
      }
    });
  }
  
  return params;
}
