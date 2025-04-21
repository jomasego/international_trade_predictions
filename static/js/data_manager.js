/**
 * Data Manager Module
 * Handles caching and retrieval of trade data to reduce API calls
 */

const DataManager = (function() {
  // In-memory cache
  const memoryCache = {};
  
  // Check if localStorage is available
  const storageAvailable = function() {
    try {
      const storage = window.localStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch(e) {
      return false;
    }
  };
  
  // Generate a cache key from request parameters
  const generateCacheKey = function(params) {
    return `trade_data_${params.reporterCode}_${params.partnerCode}_${params.period}_${params.cmdCode}_${params.flowCode || 'all'}`;
  };
  
  // Save data to localStorage and memory cache
  const saveToCache = function(params, data) {
    const key = generateCacheKey(params);
    
    // Save to memory cache
    memoryCache[key] = {
      timestamp: Date.now(),
      data: data
    };
    
    // Save to localStorage if available
    if (storageAvailable()) {
      try {
        localStorage.setItem(key, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } catch(e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }
  };
  
  // Get data from cache
  const getFromCache = function(params) {
    const key = generateCacheKey(params);
    
    // Try memory cache first
    if (memoryCache[key]) {
      return memoryCache[key].data;
    }
    
    // Try localStorage
    if (storageAvailable()) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // Refresh memory cache with this data
          memoryCache[key] = parsed;
          return parsed.data;
        }
      } catch(e) {
        console.warn('Failed to retrieve from localStorage:', e);
      }
    }
    
    return null;
  };
  
  // Check if data is cached
  const isDataCached = function(params) {
    return getFromCache(params) !== null;
  };
  
  // Export CSV from data
  const exportToCsv = function(data, filename = 'trade_data.csv') {
    if (!data || !data.columns || !data.rows || data.rows.length === 0) {
      console.error('Invalid data for CSV export');
      return false;
    }
    
    // Create CSV header row
    let csv = data.columns.join(',') + '\n';
    
    // Add data rows
    data.rows.forEach(row => {
      const rowValues = data.columns.map(col => {
        // Handle value that might contain commas
        const value = row[col] !== undefined ? row[col] : '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += rowValues.join(',') + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  };
  
  // List all cached data sets
  const listCachedData = function() {
    const cachedData = [];
    
    // List from memory cache
    for (const key in memoryCache) {
      if (key.startsWith('trade_data_')) {
        const parts = key.split('_');
        cachedData.push({
          key: key,
          reporter: parts[2],
          partner: parts[3],
          year: parts[4],
          commodity: parts[5],
          flow: parts[6],
          timestamp: new Date(memoryCache[key].timestamp).toLocaleString()
        });
      }
    }
    
    // Combine with any localStorage data not in memory
    if (storageAvailable()) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('trade_data_') && !memoryCache[key]) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const parts = key.split('_');
            cachedData.push({
              key: key,
              reporter: parts[2],
              partner: parts[3],
              year: parts[4],
              commodity: parts[5],
              flow: parts[6],
              timestamp: new Date(data.timestamp).toLocaleString()
            });
          } catch(e) {
            console.warn('Failed to parse localStorage item:', key);
          }
        }
      }
    }
    
    return cachedData;
  };
  
  // Clear specific cache entry
  const clearCacheEntry = function(key) {
    // Clear from memory
    if (memoryCache[key]) {
      delete memoryCache[key];
    }
    
    // Clear from localStorage
    if (storageAvailable()) {
      localStorage.removeItem(key);
    }
  };
  
  // Clear all cache
  const clearAllCache = function() {
    // Clear memory cache
    for (const key in memoryCache) {
      if (key.startsWith('trade_data_')) {
        delete memoryCache[key];
      }
    }
    
    // Clear localStorage
    if (storageAvailable()) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('trade_data_')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove items separately to avoid index issues
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };
  
  // Public API
  return {
    saveToCache,
    getFromCache,
    isDataCached,
    exportToCsv,
    listCachedData,
    clearCacheEntry,
    clearAllCache
  };
})();
