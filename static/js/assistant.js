/**
 * AI Trade Assistant Module
 * Powered by Google Gemma-2b via HuggingFace
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the assistant interface
  initAssistantUI();
});

/**
 * Initialize the assistant UI and event handlers
 */
function initAssistantUI() {
  // DOM elements
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const quickQuestionBtns = document.querySelectorAll('.quick-question-btn');
  
  // HS Code explanation
  const hsCodeInput = document.getElementById('hs-code-input');
  const explainHsBtn = document.getElementById('explain-hs-btn');
  
  // Recommendation elements
  const recommendationCountry = document.getElementById('recommendation-country');
  const recommendationProduct = document.getElementById('recommendation-product');
  const getRecommendationBtn = document.getElementById('get-recommendation-btn');
  
  // Store chat history
  let chatHistory = [];
  
  // Populate country dropdown for recommendations
  if (recommendationCountry && typeof COUNTRY_CODES !== 'undefined') {
    COUNTRY_CODES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name + ' (' + c.code + ')';
      recommendationCountry.appendChild(opt);
    });
  }
  
  // Initialize event listeners
  if (chatInput && chatSendBtn) {
    // Send message on button click
    chatSendBtn.addEventListener('click', () => sendMessage());
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Set up quick question buttons
  if (quickQuestionBtns) {
    quickQuestionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.textContent;
        
        // Set the question in the input field
        if (chatInput) {
          chatInput.value = question;
        }
        
        // Send the message
        sendMessage();
      });
    });
  }
  
  // Set up HS code explanation
  if (hsCodeInput && explainHsBtn) {
    explainHsBtn.addEventListener('click', () => {
      const hsCode = hsCodeInput.value.trim();
      
      if (hsCode) {
        explainHSCode(hsCode);
      }
    });
    
    hsCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const hsCode = hsCodeInput.value.trim();
        
        if (hsCode) {
          explainHSCode(hsCode);
        }
      }
    });
  }
  
  // Set up recommendation feature
  if (recommendationProduct && getRecommendationBtn) {
    getRecommendationBtn.addEventListener('click', () => {
      const country = recommendationCountry ? recommendationCountry.value : null;
      const product = recommendationProduct.value.trim();
      
      getTradeRecommendation(country, product);
    });
    
    recommendationProduct.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const country = recommendationCountry ? recommendationCountry.value : null;
        const product = recommendationProduct.value.trim();
        
        getTradeRecommendation(country, product);
      }
    });
  }
  
  /**
   * Send a message to the AI assistant
   */
  async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Clear the input field
    chatInput.value = '';
    
    // Add user message to the chat
    addMessage('user', message);
    
    // Show loading indicator
    const loadingId = showLoadingIndicator();
    
    try {
      // Call the API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: message,
          chat_history: chatHistory
        })
      });
      
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check if the response was successful
      if (data.success) {
        // Add the assistant's response to the chat
        addMessage('assistant', data.response);
        
        // Update chat history
        chatHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: data.response }
        );
        
        // Keep chat history limited to last 10 messages for context window management
        if (chatHistory.length > 10) {
          chatHistory = chatHistory.slice(chatHistory.length - 10);
        }
      } else {
        // Show error message
        addMessage('assistant', `I'm sorry, I encountered an error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      console.error('Error sending message:', error);
      
      // Show error message
      addMessage('assistant', "I'm sorry, I'm having trouble connecting to the server. Please try again later.");
    }
  }
  
  /**
   * Explain a specific HS code
   */
  async function explainHSCode(code) {
    // Add user message to the chat
    addMessage('user', `What does HS code ${code} represent?`);
    
    // Show loading indicator
    const loadingId = showLoadingIndicator();
    
    try {
      // Call the API
      const response = await fetch('/api/explain_hs_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check if the response was successful
      if (data.success) {
        // Add the assistant's response to the chat
        addMessage('assistant', data.response);
        
        // Update chat history
        chatHistory.push(
          { role: 'user', content: `What does HS code ${code} represent?` },
          { role: 'assistant', content: data.response }
        );
        
        // Keep chat history limited
        if (chatHistory.length > 10) {
          chatHistory = chatHistory.slice(chatHistory.length - 10);
        }
      } else {
        // Show error message
        addMessage('assistant', `I'm sorry, I encountered an error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      console.error('Error explaining HS code:', error);
      
      // Show error message
      addMessage('assistant', "I'm sorry, I'm having trouble connecting to the server. Please try again later.");
    }
  }
  
  /**
   * Get trade recommendations
   */
  async function getTradeRecommendation(country = null, product = null) {
    // Build the query message
    let queryMessage = "Please recommend interesting trade patterns";
    
    if (country && country !== '') {
      queryMessage += ` for ${country}`;
    }
    
    if (product && product !== '') {
      queryMessage += ` related to ${product}`;
    }
    
    // Add user message to the chat
    addMessage('user', queryMessage);
    
    // Show loading indicator
    const loadingId = showLoadingIndicator();
    
    try {
      // Call the API
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          country: country !== '' ? country : null,
          product: product !== '' ? product : null
        })
      });
      
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check if the response was successful
      if (data.success) {
        // Add the assistant's response to the chat
        addMessage('assistant', data.response);
        
        // Update chat history
        chatHistory.push(
          { role: 'user', content: queryMessage },
          { role: 'assistant', content: data.response }
        );
        
        // Keep chat history limited
        if (chatHistory.length > 10) {
          chatHistory = chatHistory.slice(chatHistory.length - 10);
        }
      } else {
        // Show error message
        addMessage('assistant', `I'm sorry, I encountered an error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      // Hide loading indicator
      hideLoadingIndicator(loadingId);
      
      console.error('Error getting recommendation:', error);
      
      // Show error message
      addMessage('assistant', "I'm sorry, I'm having trouble connecting to the server. Please try again later.");
    }
  }
  
  /**
   * Add a message to the chat interface
   */
  function addMessage(role, content) {
    if (!chatMessages) return;
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    // Add appropriate class based on role
    if (role === 'user') {
      messageDiv.classList.add('message-user');
    } else if (role === 'assistant') {
      messageDiv.classList.add('message-assistant');
    }
    
    // Format the content with Markdown
    const formattedContent = formatMarkdown(content);
    
    // Set the content
    messageDiv.innerHTML = formattedContent;
    
    // Add to chat messages
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * Show loading indicator
   */
  function showLoadingIndicator() {
    if (!chatMessages) return null;
    
    // Create loading element
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'message-loading', 'message-assistant');
    
    // Create loading dots
    const loadingDots = document.createElement('div');
    loadingDots.classList.add('loading-dots');
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      loadingDots.appendChild(dot);
    }
    
    // Add to loading div
    loadingDiv.appendChild(loadingDots);
    
    // Add to chat messages
    chatMessages.appendChild(loadingDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Return the loading div for later removal
    return loadingDiv;
  }
  
  /**
   * Hide loading indicator
   */
  function hideLoadingIndicator(loadingDiv) {
    if (!loadingDiv || !chatMessages) return;
    
    // Remove the loading div
    try {
      chatMessages.removeChild(loadingDiv);
    } catch (e) {
      console.warn('Loading indicator already removed', e);
    }
  }
  
  /**
   * Format text as markdown
   * Simple implementation for basic markdown
   */
  function formatMarkdown(text) {
    // Safety check
    if (!text) return '';
    
    // Handle code blocks
    text = text.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle lists
    text = text.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Handle paragraphs
    text = text.replace(/^(.+)$/gm, function(match) {
      // Ignore if already HTML
      if (match.startsWith('<')) return match;
      return '<p>' + match + '</p>';
    });
    
    // Cleanup possible paragraph wrapping of HTML elements
    text = text.replace(/<p>(<\/?(?:ul|ol|li|h\d|pre|code|table|tr|td)[^>]*>)<\/p>/g, '$1');
    
    return text;
  }
}
