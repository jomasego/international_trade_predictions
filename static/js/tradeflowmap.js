/**
 * Modern Trade Flow Map - Visualizes international trade flows with animated lines
 * For International Trade Flow Predictor
 * Based on AnyChart's flow map concept
 */

class TradeFlowMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      width: options.width || '100%',
      height: options.height || 350,
      backgroundColor: options.backgroundColor || '#ffffff',
      oceanColor: options.oceanColor || '#ffffff',
      landColor: options.landColor || '#f0f0f0',  // Lighter gray for lands
      countryStrokeColor: options.countryStrokeColor || '#e0e0e0', // Subtle borders
      selectedCountryColor: options.selectedCountryColor || '#d1e5f8', // Subtle highlight
      flowLineColor: options.flowLineColor || 'rgba(0, 103, 223, 0.7)', // More visible flows
      flowLineWidth: options.flowLineWidth || 2,
      flowMarkerColor: options.flowMarkerColor || '#0067df',
      animationSpeed: options.animationSpeed || 1.5,
      ...options
    };
    
    this.container = document.getElementById(containerId);
    this.flows = [];
    this.countries = {};
    this.selectedCountries = new Set();
    this.svg = null;
    this.defs = null;
    this.worldGroup = null;
    this.flowsGroup = null;
    this.markersGroup = null;
    this.initialized = false;
    
    // Country coordinates for major trading countries
    this.countryCoordinates = {
      '840': { name: 'United States', lat: 37.0902, lng: -95.7129 },
      '156': { name: 'China', lat: 35.8617, lng: 104.1954 },
      '276': { name: 'Germany', lat: 51.1657, lng: 10.4515 },
      '392': { name: 'Japan', lat: 36.2048, lng: 138.2529 },
      '826': { name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
      '124': { name: 'Canada', lat: 56.1304, lng: -106.3468 },
      '484': { name: 'Mexico', lat: 23.6345, lng: -102.5528 },
      '410': { name: 'South Korea', lat: 35.9078, lng: 127.7669 },
      '356': { name: 'India', lat: 20.5937, lng: 78.9629 },
      '250': { name: 'France', lat: 46.6034, lng: 1.8883 },
      '380': { name: 'Italy', lat: 41.8719, lng: 12.5674 },
      '076': { name: 'Brazil', lat: -14.2350, lng: -51.9253 },
      '036': { name: 'Australia', lat: -25.2744, lng: 133.7751 },
      '528': { name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
      '756': { name: 'Switzerland', lat: 46.8182, lng: 8.2275 },
      '842': { name: 'United States', lat: 37.0902, lng: -95.7129 }, // Duplicate for compatibility
    };
  }
  
  async initialize() {
    if (this.initialized) return;
    
    // Create map container
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.width = this.options.width;
    this.container.style.height = `${this.options.height}px`;
    this.container.style.backgroundColor = this.options.oceanColor;
    this.container.style.borderRadius = '8px';
    this.container.style.overflow = 'hidden';
    
    // Loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.color = '#999';
    loadingIndicator.style.fontSize = '14px';
    loadingIndicator.textContent = 'Loading map data...';
    this.container.appendChild(loadingIndicator);
    
    // Create SVG container for the map
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.style.position = 'absolute';
    this.container.appendChild(this.svg);
    
    // Add defs section for gradients and markers
    this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    this.svg.appendChild(this.defs);
    
    // Create subtle arrow marker for flow lines - more like the Google Pay reference
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', `arrow-${this.containerId}`);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '5');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '3');
    marker.setAttribute('markerHeight', '3');
    marker.setAttribute('orient', 'auto');
    
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrow.setAttribute('fill', this.options.flowMarkerColor);
    marker.appendChild(arrow);
    this.defs.appendChild(marker);
    
    // Create more subtle flow line gradient
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', `flow-gradient-${this.containerId}`);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    
    // More subtle gradient with less contrast
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', this.options.flowLineColor);
    stop1.setAttribute('stop-opacity', '0.4');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', this.options.flowLineColor);
    stop2.setAttribute('stop-opacity', '0.6');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    this.defs.appendChild(gradient);
    
    // Add a pulse effect gradient for animated markers
    const pulseGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    pulseGradient.setAttribute('id', `pulse-gradient-${this.containerId}`);
    pulseGradient.setAttribute('gradientUnits', 'objectBoundingBox');
    pulseGradient.setAttribute('cx', '0.5');
    pulseGradient.setAttribute('cy', '0.5');
    pulseGradient.setAttribute('r', '0.5');
    
    const pulseStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    pulseStop1.setAttribute('offset', '0%');
    pulseStop1.setAttribute('stop-color', this.options.flowMarkerColor);
    pulseStop1.setAttribute('stop-opacity', '0.9');
    
    const pulseStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    pulseStop2.setAttribute('offset', '100%');
    pulseStop2.setAttribute('stop-color', this.options.flowMarkerColor);
    pulseStop2.setAttribute('stop-opacity', '0.1');
    
    pulseGradient.appendChild(pulseStop1);
    pulseGradient.appendChild(pulseStop2);
    this.defs.appendChild(pulseGradient);
    
    // Create layer groups
    this.worldGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.worldGroup.setAttribute('class', 'world-map');
    
    this.flowsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.flowsGroup.setAttribute('class', 'trade-flows');
    
    this.markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.markersGroup.setAttribute('class', 'country-markers');
    
    this.svg.appendChild(this.worldGroup);
    this.svg.appendChild(this.flowsGroup);
    this.svg.appendChild(this.markersGroup);
    
    // Draw the world map
    await this.drawModernWorldMap();
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    this.initialized = true;
    return this;
  }
  
  async drawModernWorldMap() {
    // Create a simplified world map with major continents and countries
    // Using simplified vector paths similar to Google Pay world map
    const worldMapData = {
      // Define continents as clean path data with subtle curves
      continents: [
        // North America - with more natural coastlines
        { 
          path: 'M 55,100 C 90,85 130,85 160,100 L 180,120 C 190,140 195,160 185,185 C 170,200 150,210 125,215 C 90,210 70,195 55,180 C 45,160 40,130 55,100 Z', 
          name: 'North America' 
        },
        // South America - with curved coastlines
        { 
          path: 'M 130,230 C 160,225 175,230 185,250 C 190,280 195,310 185,340 C 170,360 150,370 130,375 C 110,365 100,345 95,325 C 100,280 110,250 130,230 Z', 
          name: 'South America' 
        },
        // Europe - more detailed with peninsulas
        { 
          path: 'M 270,110 C 290,100 320,95 345,100 C 360,115 370,130 365,150 C 355,165 340,175 315,180 C 290,175 275,165 265,150 C 260,135 260,120 270,110 Z', 
          name: 'Europe' 
        },
        // Africa - more natural shape
        { 
          path: 'M 270,190 C 300,185 330,185 355,190 C 370,210 375,240 370,270 C 360,300 340,320 315,330 C 290,325 270,310 260,290 C 250,260 245,230 250,210 C 255,200 260,195 270,190 Z', 
          name: 'Africa' 
        },
        // Asia - larger and more detailed
        { 
          path: 'M 370,120 C 410,100 460,90 510,95 C 550,105 580,120 590,150 C 595,180 585,210 565,240 C 520,270 470,285 420,280 C 390,270 370,250 355,220 C 345,190 345,150 370,120 Z', 
          name: 'Asia' 
        },
        // Australia - more accurate shape
        { 
          path: 'M 580,280 C 600,275 620,275 635,285 C 645,300 645,320 635,335 C 620,345 600,345 585,340 C 570,330 565,310 570,295 C 570,290 575,285 580,280 Z', 
          name: 'Australia' 
        }
      ],
      
      // Major countries - cleaner outlines with subtle curves
      countries: [
        // USA - more detailed shape
        { 
          code: '840', 
          path: 'M 70,140 C 100,135 130,135 155,140 C 165,150 170,160 165,175 C 155,185 135,190 115,190 C 95,185 80,175 75,165 C 70,155 70,145 70,140 Z', 
          name: 'United States' 
        },
        // Canada - with northern territories
        { 
          code: '124', 
          path: 'M 70,100 C 100,90 140,90 170,100 C 175,110 175,120 170,130 C 165,135 160,138 155,140 C 125,135 95,135 70,140 C 65,130 65,115 70,100 Z', 
          name: 'Canada' 
        },
        // Mexico - improved shape
        { 
          code: '484', 
          path: 'M 80,170 C 90,175 100,180 110,180 C 115,190 115,200 110,205 C 100,208 90,208 80,205 C 75,195 75,180 80,170 Z', 
          name: 'Mexico' 
        },
        // Brazil - larger and more accurate
        { 
          code: '076', 
          path: 'M 140,260 C 155,255 170,255 180,260 C 185,275 190,290 185,310 C 175,325 160,335 145,335 C 130,330 120,320 115,305 C 120,285 125,270 140,260 Z', 
          name: 'Brazil' 
        },
        // UK - more defined island shape
        { 
          code: '826', 
          path: 'M 260,130 C 265,128 270,128 275,130 C 277,135 277,140 275,145 C 270,148 265,148 260,145 C 258,140 258,135 260,130 Z', 
          name: 'United Kingdom' 
        },
        // Germany - central Europe position
        { 
          code: '276', 
          path: 'M 300,140 C 307,138 314,138 320,140 C 322,145 322,150 320,155 C 315,158 305,158 300,155 C 298,150 298,145 300,140 Z', 
          name: 'Germany' 
        },
        // France - with recognizable hexagon shape
        { 
          code: '250', 
          path: 'M 280,150 C 287,148 294,148 300,150 C 302,155 302,160 300,165 C 295,168 285,168 280,165 C 278,160 278,155 280,150 Z', 
          name: 'France' 
        },
        // China - larger with more accurate borders
        { 
          code: '156', 
          path: 'M 450,150 C 470,145 495,145 520,150 C 525,165 525,180 520,195 C 505,205 475,210 455,205 C 445,195 440,175 450,150 Z', 
          name: 'China' 
        },
        // India - recognizable peninsula shape
        { 
          code: '356', 
          path: 'M 430,210 C 445,205 460,205 470,210 C 472,220 472,235 470,245 C 460,250 440,250 430,245 C 425,235 425,220 430,210 Z', 
          name: 'India' 
        },
        // Japan - archipelago suggestion
        { 
          code: '392', 
          path: 'M 550,160 C 555,158 560,158 565,160 C 567,165 567,170 565,175 C 560,177 550,177 545,175 C 543,170 545,165 550,160 Z', 
          name: 'Japan' 
        },
        // Australia - more detailed continent shape
        { 
          code: '036', 
          path: 'M 590,300 C 605,295 620,295 630,300 C 632,310 632,320 630,330 C 620,335 600,335 590,330 C 585,320 585,310 590,300 Z', 
          name: 'Australia' 
        }
      ]
    };
    
    // Draw continents as background
    worldMapData.continents.forEach(continent => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', continent.path);
      path.setAttribute('fill', this.options.landColor);
      path.setAttribute('stroke', this.options.countryStrokeColor);
      path.setAttribute('stroke-width', '0.5');
      path.setAttribute('data-name', continent.name);
      
      // Add title element for tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = continent.name;
      path.appendChild(title);
      
      this.worldGroup.appendChild(path);
    });
    
    // Draw countries with more detail
    worldMapData.countries.forEach(country => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', country.path);
      path.setAttribute('fill', this.options.landColor);
      path.setAttribute('stroke', this.options.countryStrokeColor);
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('data-code', country.code);
      path.setAttribute('data-name', country.name);
      
      // Add hover effect
      path.addEventListener('mouseover', () => {
        path.setAttribute('fill', this.options.selectedCountryColor);
      });
      
      path.addEventListener('mouseout', () => {
        if (!this.selectedCountries.has(country.code)) {
          path.setAttribute('fill', this.options.landColor);
        }
      });
      
      // Add title element for tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = country.name;
      path.appendChild(title);
      
      this.worldGroup.appendChild(path);
      
      // Store country reference for trade flows
      // Extract center point from path data for flow lines
      let coords = this.extractCenterFromPath(country.path);
      this.countries[country.code] = { 
        code: country.code,
        name: country.name,
        element: path,
        x: coords.x, 
        y: coords.y 
      };
    });
    
    // Add labels for major countries if showLabels is enabled
    if (this.options.showLabels) {
      Object.values(this.countries).forEach(country => {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', country.x);
        label.setAttribute('y', country.y - 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '9px');
        label.setAttribute('fill', '#555');
        label.textContent = country.name;
        this.markersGroup.appendChild(label);
      });
    }
  }
  
  // Helper function to extract center point from SVG path
  extractCenterFromPath(pathData) {
    // This is a simplified approach - in a real implementation, 
    // you would parse the path data more carefully
    const points = pathData.replace(/[A-Za-z]/g, ' ').trim().split(/\s+/).map(Number);
    
    // Calculate average of x and y coordinates
    let sumX = 0, sumY = 0, count = 0;
    for (let i = 0; i < points.length; i += 2) {
      if (i + 1 < points.length) {
        sumX += points[i];
        sumY += points[i + 1];
        count++;
      }
    }
    
    return { x: sumX / count, y: sumY / count };
  }
  
  // Converts longitude to X coordinate
  longitudeToX(lng) {
    // Map longitude (-180 to 180) to screen coordinates
    const width = this.container.clientWidth;
    return (lng + 180) * (width / 360);
  }
  
  // Converts latitude to Y coordinate
  latitudeToY(lat) {
    // Map latitude (-90 to 90) to screen coordinates
    const height = this.container.clientHeight;
    // Adjust for Mercator-like projection
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    return height / 2 - (height * mercN / (2 * Math.PI));
  }
  
  // Add a trade flow between two countries
  addFlow(fromCountryCode, toCountryCode, value = 1, options = {}) {
    if (!this.initialized) {
      console.error('Map not initialized. Call initialize() first.');
      return this;
    }
    
    const fromCountry = this.countries[fromCountryCode];
    const toCountry = this.countries[toCountryCode];
    
    if (!fromCountry || !toCountry) {
      console.warn(`Country not found: ${!fromCountry ? fromCountryCode : toCountryCode}`);
      return this;
    }
    
    // Scale the line width based on the trade value
    let scaledWidth = this.options.flowLineWidth;
    if (value > 0) {
      // Log scale for better visualization
      scaledWidth = this.options.flowLineWidth * (1 + 0.5 * Math.log10(1 + value / 1000));
    }
    
    // Highlight the selected countries
    this.selectedCountries.add(fromCountryCode);
    this.selectedCountries.add(toCountryCode);
    
    if (fromCountry.element) {
      fromCountry.element.setAttribute('fill', this.options.selectedCountryColor);
    }
    
    if (toCountry.element) {
      toCountry.element.setAttribute('fill', this.options.selectedCountryColor);
    }
    
    // Create a unique flow ID
    const flowId = `flow-${fromCountryCode}-${toCountryCode}`;
    
    // Create a group for this flow
    const flowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    flowGroup.setAttribute('class', 'flow-connection');
    flowGroup.setAttribute('data-flow-id', flowId);
    flowGroup.setAttribute('data-from', fromCountryCode);
    flowGroup.setAttribute('data-to', toCountryCode);
    
    // Calculate the curved path between countries
    // Use quadratic Bezier curve for smoother appearance
    const dx = toCountry.x - fromCountry.x;
    const dy = toCountry.y - fromCountry.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate curvature - higher for longer distances
    const curveAmount = distance * 0.2;
    
    // Calculate control point perpendicular to the line
    const midX = (fromCountry.x + toCountry.x) / 2;
    const midY = (fromCountry.y + toCountry.y) / 2;
    
    // Calculate perpendicular unit vector
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Position control point perpendicular to the midpoint
    const ctrlX = midX + perpX * curveAmount;
    const ctrlY = midY + perpY * curveAmount;
    
    // Create the flow path
    const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flowPath.setAttribute('class', 'flow-line');
    flowPath.setAttribute('d', `M ${fromCountry.x} ${fromCountry.y} Q ${ctrlX} ${ctrlY} ${toCountry.x} ${toCountry.y}`);
    flowPath.setAttribute('fill', 'none');
    flowPath.setAttribute('stroke', `url(#flow-gradient-${this.containerId})`);
    flowPath.setAttribute('stroke-width', options.width || scaledWidth);
    flowPath.setAttribute('stroke-linecap', 'round');
    flowPath.setAttribute('marker-end', `url(#arrow-${this.containerId})`);
    
    // Add to flow group
    flowGroup.appendChild(flowPath);
    
    // Add flow value label if requested
    if (options.showLabel !== false && value > 0) {
      const valueFormatted = value >= 1000000 ? 
        `$${(value/1000000).toFixed(1)}M` : 
        `$${(value/1000).toFixed(0)}K`;
      
      // Create label background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', ctrlX - 20);
      labelBg.setAttribute('y', ctrlY - 10);
      labelBg.setAttribute('width', 40);
      labelBg.setAttribute('height', 20);
      labelBg.setAttribute('rx', 3);
      labelBg.setAttribute('ry', 3);
      labelBg.setAttribute('fill', 'white');
      labelBg.setAttribute('opacity', '0.8');
      
      // Create label text
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', ctrlX);
      label.setAttribute('y', ctrlY + 4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '8px');
      label.setAttribute('fill', '#444');
      label.textContent = options.label || valueFormatted;
      
      // Add to flow group
      flowGroup.appendChild(labelBg);
      flowGroup.appendChild(label);
    }
    
    // Add flow group to the flows layer
    this.flowsGroup.appendChild(flowGroup);
    
    // Add animated marker
    if (options.animated !== false) {
      this.animateFlowPath(flowPath, fromCountry, toCountry);
    }
    
    // Store flow data
    this.flows.push({
      id: flowId,
      from: fromCountryCode,
      to: toCountryCode,
      value: value,
      element: flowGroup,
      path: flowPath
    });
    
    return this;
  }
  
  // Animate flow along a path with subtle elegant animation
  animateFlowPath(path, source, target) {
    // Create a group for the animated markers
    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markerGroup.setAttribute('class', 'flow-marker-group');
    this.flowsGroup.appendChild(markerGroup);
    
    // Create pulse effect marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('class', 'flow-marker');
    marker.setAttribute('r', 3);
    marker.setAttribute('fill', `url(#pulse-gradient-${this.containerId})`);
    marker.setAttribute('opacity', '0.8');
    markerGroup.appendChild(marker);
    
    // Create subtle glow effect
    const glowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowMarker.setAttribute('class', 'flow-marker-glow');
    glowMarker.setAttribute('r', 5);
    glowMarker.setAttribute('fill', `url(#pulse-gradient-${this.containerId})`);
    glowMarker.setAttribute('opacity', '0.3');
    markerGroup.appendChild(glowMarker);
    
    // Create animated motion
    const animate = () => {
      // Calculate the total length of the path for smoother animation
      const pathLength = path.getTotalLength();
      const duration = pathLength / 30 * (1 / this.options.animationSpeed);
      
      // Animation function with smoother easing
      const startTime = performance.now();
      
      const step = (timestamp) => {
        const elapsedTime = timestamp - startTime;
        let progress = Math.min(elapsedTime / (duration * 1000), 1);
        
        // Add slight easing for more elegant motion
        progress = easeInOutQuad(progress);
        
        // Get point at percentage along the path
        const point = path.getPointAtLength(progress * pathLength);
        
        // Update marker position
        marker.setAttribute('cx', point.x);
        marker.setAttribute('cy', point.y);
        glowMarker.setAttribute('cx', point.x);
        glowMarker.setAttribute('cy', point.y);
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // When animation completes, pause then restart
          markerGroup.setAttribute('opacity', '0');
          setTimeout(() => {
            markerGroup.setAttribute('opacity', '1');
            animate();
          }, 1200);
        }
      };
      
      requestAnimationFrame(step);
    };
    
    // Easing function for smoother animation
    const easeInOutQuad = (t) => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
    
    // Start the animation
    animate();
    
    return markerGroup;
  }
  
  // Clear all trade flows
  clearFlows() {
    // Remove flow elements
    while (this.flowsGroup.firstChild) {
      this.flowsGroup.removeChild(this.flowsGroup.firstChild);
    }
    
    // Reset country colors
    this.selectedCountries.clear();
    Object.values(this.countries).forEach(country => {
      if (country.element) {
        country.element.setAttribute('fill', this.options.landColor);
      }
    });
    
    this.flows = [];
    return this;
  }
  
  // Add demo trade flows to the map
  addDemoFlows() {
    // Clear existing flows
    this.clearFlows();
    
    // Add major trade flows with values (in millions USD)
    this.addFlow('840', '156', 500000, { label: '$500B' }); // US to China
    this.addFlow('840', '276', 180000, { label: '$180B' }); // US to Germany
    this.addFlow('156', '392', 320000, { label: '$320B' }); // China to Japan
    this.addFlow('156', '124', 110000, { label: '$110B' }); // China to Canada
    this.addFlow('276', '250', 230000, { label: '$230B' }); // Germany to France
    
    // Render all flows
    return this;
  }
  
  // Update the map with new data
  updateData(flows) {
    this.clearFlows();
    
    flows.forEach(flow => {
      this.addFlow(flow.from || flow.reporterCode, 
                flow.to || flow.partnerCode, 
                flow.value || flow.tradeValue, 
                flow.options || {});
    });
    
    return this;
  }
  
  // Resize the map
  resize(width, height) {
    if (width) this.container.style.width = width;
    if (height) this.container.style.height = `${height}px`;
    return this;
  }
}

// Initialize maps when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create a global object to store map instances
  window.tradeFlowMaps = {};
  
  // Initialize trade flow maps on the page
  const mapContainers = document.querySelectorAll('.trade-flow-map');
  
  mapContainers.forEach(container => {
    const containerId = container.id;
    if (!containerId) return;
    
    const options = {
      showLabels: container.dataset.showLabels === 'true',
      showFlowValues: container.dataset.showValues !== 'false',
      height: parseInt(container.dataset.height || 350, 10)
    };
    
    // Create a new map instance
    const map = new TradeFlowMap(containerId, options);
    map.initialize().then(() => {
      // Add demo flows if requested
      if (container.dataset.demo === 'true') {
        // Use our modern demo flows with proper styling
        map.addDemoFlows();
      }
    });
    
    // Store the map instance
    window.tradeFlowMaps[containerId] = map;
  });
});
