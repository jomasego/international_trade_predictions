/**
 * Advanced Chart Visualizations
 * Provides different chart types for international trade data visualization
 */

const TradeCharts = (function() {
  // Store chart instances to destroy when needed
  const chartInstances = {};
  
  // Color schemes for different chart types
  const colorSchemes = {
    default: [
      'rgba(25, 118, 210, 0.7)',   // Primary blue
      'rgba(229, 57, 53, 0.7)',    // Red
      'rgba(67, 160, 71, 0.7)',    // Green
      'rgba(251, 192, 45, 0.7)',   // Yellow
      'rgba(156, 39, 176, 0.7)',   // Purple
      'rgba(0, 188, 212, 0.7)',    // Cyan
      'rgba(255, 152, 0, 0.7)',    // Orange
      'rgba(121, 85, 72, 0.7)',    // Brown
      'rgba(96, 125, 139, 0.7)',   // Blue Grey
      'rgba(233, 30, 99, 0.7)'     // Pink
    ],
    borders: [
      'rgba(25, 118, 210, 1)',     // Primary blue
      'rgba(229, 57, 53, 1)',      // Red
      'rgba(67, 160, 71, 1)',      // Green
      'rgba(251, 192, 45, 1)',     // Yellow
      'rgba(156, 39, 176, 1)',     // Purple
      'rgba(0, 188, 212, 1)',      // Cyan
      'rgba(255, 152, 0, 1)',      // Orange
      'rgba(121, 85, 72, 1)',      // Brown
      'rgba(96, 125, 139, 1)',     // Blue Grey
      'rgba(233, 30, 99, 1)'       // Pink
    ],
    gradients: function(ctx) {
      return [
        createGradient(ctx, [25, 118, 210]),
        createGradient(ctx, [229, 57, 53]),
        createGradient(ctx, [67, 160, 71]),
        createGradient(ctx, [251, 192, 45]),
        createGradient(ctx, [156, 39, 176]),
        createGradient(ctx, [0, 188, 212]),
        createGradient(ctx, [255, 152, 0]),
        createGradient(ctx, [121, 85, 72]),
        createGradient(ctx, [96, 125, 139]),
        createGradient(ctx, [233, 30, 99])
      ];
    }
  };
  
  // Create a gradient color
  function createGradient(ctx, rgbColor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.8)`);
    gradient.addColorStop(1, `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.2)`);
    return gradient;
  }
  
  // Load Chart.js if not present
  function ensureChartJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.Chart) {
        resolve(window.Chart);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      script.onload = () => resolve(window.Chart);
      script.onerror = () => reject(new Error('Failed to load Chart.js'));
      document.body.appendChild(script);
    });
  }
  
  // Helper function to destroy existing chart
  function destroyChart(containerId) {
    if (chartInstances[containerId]) {
      chartInstances[containerId].destroy();
      delete chartInstances[containerId];
    }
  }
  
  // Helper to extract top N items
  function getTopItems(data, valueField, labelField, n = 10) {
    return [...data]
      .sort((a, b) => b[valueField] - a[valueField])
      .slice(0, n)
      .map(item => ({
        value: item[valueField],
        label: item[labelField]
      }));
  }
  
  // Create bar chart
  async function createBarChart(containerId, data, options = {}) {
    await ensureChartJsLoaded();
    
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Create or get canvas
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    
    destroyChart(containerId);
    
    // Default options
    const defaults = {
      valueField: 'value',
      labelField: 'country',
      title: 'Trade Data',
      horizontal: false,
      limit: 10,
      showLegend: false,
      animation: true
    };
    
    const chartOptions = { ...defaults, ...options };
    
    // Prepare data - limit to top N items and process data
    let chartData;
    if (Array.isArray(data.rows)) {
      chartData = getTopItems(
        data.rows, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else if (Array.isArray(data)) {
      chartData = getTopItems(
        data, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else {
      console.error('Invalid data format for bar chart');
      return null;
    }
    
    // Get context
    const ctx = canvas.getContext('2d');
    
    // Create chart
    chartInstances[containerId] = new Chart(ctx, {
      type: chartOptions.horizontal ? 'horizontalBar' : 'bar',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          label: chartOptions.title,
          data: chartData.map(item => item.value),
          backgroundColor: colorSchemes.default,
          borderColor: colorSchemes.borders,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: chartOptions.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartOptions.showLegend
          },
          title: {
            display: true,
            text: chartOptions.title,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat().format(
                    chartOptions.horizontal ? context.parsed.x : context.parsed.y
                  );
                }
                return label;
              }
            }
          }
        },
        animation: chartOptions.animation,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000000) {
                  return (value / 1000000000).toFixed(1) + 'B';
                } else if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'K';
                }
                return value;
              }
            }
          }
        }
      }
    });
    
    return chartInstances[containerId];
  }
  
  // Create pie chart
  async function createPieChart(containerId, data, options = {}) {
    await ensureChartJsLoaded();
    
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Create or get canvas
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    
    destroyChart(containerId);
    
    // Default options
    const defaults = {
      valueField: 'value',
      labelField: 'country',
      title: 'Trade Distribution',
      limit: 10,
      showLegend: true,
      animation: true,
      doughnut: false
    };
    
    const chartOptions = { ...defaults, ...options };
    
    // Prepare data - limit to top N items
    let chartData;
    if (Array.isArray(data.rows)) {
      chartData = getTopItems(
        data.rows, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else if (Array.isArray(data)) {
      chartData = getTopItems(
        data, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else {
      console.error('Invalid data format for pie chart');
      return null;
    }
    
    // Get context
    const ctx = canvas.getContext('2d');
    
    // Create chart
    chartInstances[containerId] = new Chart(ctx, {
      type: chartOptions.doughnut ? 'doughnut' : 'pie',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          data: chartData.map(item => item.value),
          backgroundColor: colorSchemes.default,
          borderColor: colorSchemes.borders,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartOptions.showLegend,
            position: 'right'
          },
          title: {
            display: true,
            text: chartOptions.title,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${new Intl.NumberFormat().format(value)} (${percentage}%)`;
              }
            }
          }
        },
        animation: chartOptions.animation
      }
    });
    
    return chartInstances[containerId];
  }
  
  // Create line chart
  async function createLineChart(containerId, data, options = {}) {
    await ensureChartJsLoaded();
    
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Create or get canvas
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    
    destroyChart(containerId);
    
    // Default options
    const defaults = {
      valueField: 'value',
      labelField: 'year',
      title: 'Trade Trends',
      showLegend: true,
      animation: true,
      fill: true,
      seriesField: null, // If provided, creates multiple series based on this field
      timeScale: false
    };
    
    const chartOptions = { ...defaults, ...options };
    
    // Get context
    const ctx = canvas.getContext('2d');
    
    // Prepare datasets
    let datasets = [];
    
    if (chartOptions.seriesField) {
      // Group data by series field
      const seriesData = {};
      const sourceData = Array.isArray(data.rows) ? data.rows : data;
      
      sourceData.forEach(item => {
        const seriesKey = item[chartOptions.seriesField];
        if (!seriesData[seriesKey]) {
          seriesData[seriesKey] = [];
        }
        seriesData[seriesKey].push({
          x: item[chartOptions.labelField],
          y: item[chartOptions.valueField]
        });
      });
      
      // Create a dataset for each series
      let colorIndex = 0;
      for (const seriesKey in seriesData) {
        datasets.push({
          label: seriesKey,
          data: seriesData[seriesKey],
          backgroundColor: chartOptions.fill ? colorSchemes.gradients(ctx)[colorIndex % 10] : colorSchemes.default[colorIndex % 10],
          borderColor: colorSchemes.borders[colorIndex % 10],
          borderWidth: 2,
          fill: chartOptions.fill,
          tension: 0.1
        });
        colorIndex++;
      }
    } else {
      // Single series
      const sourceData = Array.isArray(data.rows) ? data.rows : data;
      
      // Sort data by label (typically year)
      sourceData.sort((a, b) => {
        if (chartOptions.timeScale) {
          return new Date(a[chartOptions.labelField]) - new Date(b[chartOptions.labelField]);
        }
        return a[chartOptions.labelField] - b[chartOptions.labelField];
      });
      
      datasets.push({
        label: chartOptions.title,
        data: sourceData.map(item => ({
          x: item[chartOptions.labelField],
          y: item[chartOptions.valueField]
        })),
        backgroundColor: chartOptions.fill ? colorSchemes.gradients(ctx)[0] : colorSchemes.default[0],
        borderColor: colorSchemes.borders[0],
        borderWidth: 2,
        fill: chartOptions.fill,
        tension: 0.1
      });
    }
    
    // Create chart
    chartInstances[containerId] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartOptions.showLegend
          },
          title: {
            display: true,
            text: chartOptions.title,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat().format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        animation: chartOptions.animation,
        scales: {
          x: {
            type: chartOptions.timeScale ? 'time' : 'category',
            time: chartOptions.timeScale ? {
              unit: 'year',
              displayFormats: {
                year: 'yyyy'
              }
            } : undefined
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000000) {
                  return (value / 1000000000).toFixed(1) + 'B';
                } else if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'K';
                }
                return value;
              }
            }
          }
        }
      }
    });
    
    return chartInstances[containerId];
  }
  
  // Create treemap for product/country hierarchies
  async function createTreemap(containerId, data, options = {}) {
    // This is a simplified treemap using divs since Chart.js doesn't have built-in treemap
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Default options
    const defaults = {
      valueField: 'value',
      labelField: 'country',
      title: 'Trade Distribution',
      limit: 20
    };
    
    const chartOptions = { ...defaults, ...options };
    
    // Prepare data - limit to top N items
    let chartData;
    if (Array.isArray(data.rows)) {
      chartData = getTopItems(
        data.rows, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else if (Array.isArray(data)) {
      chartData = getTopItems(
        data, 
        chartOptions.valueField, 
        chartOptions.labelField, 
        chartOptions.limit
      );
    } else {
      console.error('Invalid data format for treemap');
      return null;
    }
    
    // Calculate total for percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    
    // Create treemap container
    container.innerHTML = `
      <div class="treemap-title">${chartOptions.title}</div>
      <div class="treemap-container"></div>
    `;
    
    const treemapContainer = container.querySelector('.treemap-container');
    treemapContainer.style.display = 'flex';
    treemapContainer.style.flexWrap = 'wrap';
    treemapContainer.style.height = '400px';
    treemapContainer.style.position = 'relative';
    
    // Create rectangles
    chartData.forEach((item, index) => {
      const percentage = (item.value / total * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'treemap-item';
      div.style.backgroundColor = colorSchemes.default[index % colorSchemes.default.length];
      div.style.color = '#fff';
      div.style.padding = '8px';
      div.style.boxSizing = 'border-box';
      div.style.overflow = 'hidden';
      div.style.fontSize = '12px';
      div.style.position = 'relative';
      div.style.flexGrow = item.value;
      
      // Size must be proportional to value
      div.style.width = `${Math.sqrt(percentage)}%`;
      div.style.height = `${Math.sqrt(percentage) * 2}%`;
      div.style.margin = '2px';
      
      // Text with truncation
      div.innerHTML = `
        <div style="font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${item.label}
        </div>
        <div>${percentage}%</div>
      `;
      
      // Tooltip on hover
      div.title = `${item.label}: ${new Intl.NumberFormat().format(item.value)} (${percentage}%)`;
      
      treemapContainer.appendChild(div);
    });
    
    return treemapContainer;
  }
  
  // Create a world map visualization
  async function createWorldMapChart(containerId, data, options = {}) {
    // Load leaflet script if not already loaded
    if (!window.L) {
      await new Promise((resolve, reject) => {
        // Load CSS
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(leafletCss);
        
        // Load script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Default options
    const defaults = {
      valueField: 'value',
      labelField: 'country',
      countryCodeField: 'code',
      title: 'World Trade Map',
      colorScale: ['#e6f7ff', '#0077be'],
      zoom: 2
    };
    
    const chartOptions = { ...defaults, ...options };
    
    // Set container height if not already set
    if (!container.style.height || container.style.height === 'auto') {
      container.style.height = '400px';
    }
    
    // Clear previous map
    container.innerHTML = '';
    
    // Create map
    const map = L.map(containerId).setView([20, 0], chartOptions.zoom);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Process data
    const sourceData = Array.isArray(data.rows) ? data.rows : data;
    
    // Find min/max for color scaling
    const values = sourceData.map(item => item[chartOptions.valueField]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Function to compute color based on value
    function getColor(value) {
      const ratio = (value - min) / (max - min || 1);
      
      // Linear interpolation between start and end colors
      const startColor = chartOptions.colorScale[0];
      const endColor = chartOptions.colorScale[1];
      
      // Parse hex colors
      const startRGB = {
        r: parseInt(startColor.slice(1, 3), 16),
        g: parseInt(startColor.slice(3, 5), 16),
        b: parseInt(startColor.slice(5, 7), 16)
      };
      
      const endRGB = {
        r: parseInt(endColor.slice(1, 3), 16),
        g: parseInt(endColor.slice(3, 5), 16),
        b: parseInt(endColor.slice(5, 7), 16)
      };
      
      // Interpolate
      const r = Math.round(startRGB.r + ratio * (endRGB.r - startRGB.r));
      const g = Math.round(startRGB.g + ratio * (endRGB.g - startRGB.g));
      const b = Math.round(startRGB.b + ratio * (endRGB.b - startRGB.b));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Add country polygons if country GeoJSON is available
    // For now we'll use circles at country coordinates as a simplified version
    
    // Find coordinates for countries (simplified - real app would use GeoJSON)
    const countryCoordinates = {
      // Sample coordinates for major countries
      '842': [37.0902, -95.7129],  // USA
      '156': [35.8617, 104.1954],  // China
      '276': [51.1657, 10.4515],   // Germany
      '392': [36.2048, 138.2529],  // Japan
      '826': [55.3781, -3.4360],   // UK
      '250': [46.2276, 2.2137],    // France
      '380': [41.8719, 12.5674],   // Italy
      '124': [56.1304, -106.3468], // Canada
      '410': [35.9078, 127.7669],  // South Korea
      '484': [23.6345, -102.5528], // Mexico
      
      // Default coordinates for unknown countries
      'default': [0, 0]
    };
    
    // Add circles for each country
    sourceData.forEach(item => {
      const code = item[chartOptions.countryCodeField];
      const value = item[chartOptions.valueField];
      const coords = countryCoordinates[code] || countryCoordinates.default;
      
      if (coords[0] !== 0 || coords[1] !== 0) {
        // Size circle based on value
        const radius = Math.max(5, Math.min(20, 5 + (value - min) / (max - min || 1) * 15));
        
        L.circleMarker(coords, {
          radius: radius,
          fillColor: getColor(value),
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        })
        .addTo(map)
        .bindPopup(`
          <strong>${item[chartOptions.labelField]}</strong><br>
          Value: ${new Intl.NumberFormat().format(value)}
        `);
      }
    });
    
    // Add legend
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      
      div.innerHTML = `
        <div style="font-weight:bold;margin-bottom:5px;">${chartOptions.title}</div>
        <div style="display:flex;align-items:center;margin-bottom:5px;">
          <div style="width:20px;height:20px;background:${chartOptions.colorScale[0]};margin-right:5px;"></div>
          <span>${new Intl.NumberFormat().format(min)}</span>
        </div>
        <div style="display:flex;align-items:center;">
          <div style="width:20px;height:20px;background:${chartOptions.colorScale[1]};margin-right:5px;"></div>
          <span>${new Intl.NumberFormat().format(max)}</span>
        </div>
      `;
      
      return div;
    };
    
    legend.addTo(map);
    
    return map;
  }

  // Public API
  return {
    createBarChart,
    createPieChart,
    createLineChart,
    createTreemap,
    createWorldMapChart,
    destroyChart
  };
})();
