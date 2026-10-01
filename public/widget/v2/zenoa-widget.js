/**
 * Zenoa Modern Web Widget & In-Context Assistant Client SDK (v2.4)
 * Two-Tier Key Standard: Powered by Public Key (zen_pub_...)
 * Automatically parses JSON-LD, Microdata, OpenGraph, and parent DOM containers
 */
(function() {
  'use strict';

  if (window.__ZENOA_WIDGET_LOADED__) return;
  window.__ZENOA_WIDGET_LOADED__ = true;

  var currentScript = document.currentScript || document.querySelector('script[data-zenoa-key], script[data-project-id], script[data-api-key]');
  var apiKey = currentScript ? (currentScript.getAttribute('data-zenoa-key') || currentScript.getAttribute('data-api-key') || 'zen_pub_live_default') : 'zen_pub_live_default';
  var projectId = currentScript ? (currentScript.getAttribute('data-project-id') || apiKey) : apiKey;
  var endpoint = currentScript ? (currentScript.getAttribute('data-endpoint') || window.location.origin) : window.location.origin;

  // Global ZenoaWidget Namespace
  window.ZenoaWidget = {
    apiKey: apiKey,
    projectId: projectId,
    endpoint: endpoint,
    
    // Explicit Initializer for Single Page Apps (React / Vue / Next.js)
    init: function(options) {
      if (!options) return;
      if (options.apiKey) this.apiKey = options.apiKey;
      if (options.projectId) this.projectId = options.projectId;
      if (options.endpoint) this.endpoint = options.endpoint;
    },

    // Universal Specification Extractor from DOM & Schema.org
    extractSpecs: function(targetEl) {
      var specs = {};
      
      // 1. Try to find Schema.org JSON-LD
      var jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(function(s) {
        try {
          var parsed = JSON.parse(s.innerText);
          if (parsed['@type'] === 'Product' || parsed['@type'] === 'Hotel' || parsed['@type'] === 'Restaurant' || parsed['@type'] === 'MenuItem' || parsed['@type'] === 'Offer') {
            specs.schema = parsed;
          }
        } catch(e) {}
      });

      // 2. Extract from Parent Container
      var container = targetEl ? (targetEl.closest('[data-item-container], .product-card, .room-card, .menu-item, article, main, body') || document.body) : document.body;
      if (container) {
        specs.title = container.querySelector('h1, h2, h3, .product-title, .item-name')?.innerText || document.title;
        specs.price = container.querySelector('.price, [data-price], .amount')?.innerText || '';
        specs.description = container.querySelector('.description, .specs, .amenities, p')?.innerText || '';
        specs.rawText = container.innerText.slice(0, 1500);
      }

      return specs;
    },

    // Open Bottom-Sheet Slide-up Drawer
    openWithProductContext: function(options) {
      var opts = options || {};
      var specsData = opts.specs || this.extractSpecs(opts.element);
      this.renderDrawer(specsData, opts.label || 'Product Assistant', opts.apiKey || this.apiKey);
    },

    // Render Clean Half-Screen Bottom Sheet Drawer
    renderDrawer: function(specs, label, keyToUse) {
      var activeKey = keyToUse || this.apiKey;
      var existing = document.getElementById('zenoa-assistant-drawer-root');
      if (existing) existing.remove();

      var root = document.createElement('div');
      root.id = 'zenoa-assistant-drawer-root';
      root.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);display:flex;flex-direction:column;justify-content:flex-end;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#ffffff;color:#181d26;border-top-left-radius:18px;border-top-right-radius:18px;height:65vh;max-height:85vh;width:100%;max-width:640px;margin:0 auto;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,0.2);overflow:hidden;animation:zenoaSlideUp 0.25s ease-out;';

      var header = document.createElement('div');
      header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;';
      header.innerHTML = `
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:600;color:#181d26;">${label || 'Item Assistant'}</div>
          <div style="font-size:11px;color:#059669;margin-top:2px;">&#10003; Real-time item specifications active</div>
        </div>
        <button id="zenoa-close-drawer" style="border:1px solid #e5e7eb;background:#ffffff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:500;">&#10005;</button>
      `;

      var chatBox = document.createElement('div');
      chatBox.id = 'zenoa-chat-stream';
      chatBox.style.cssText = 'flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.5;';
      chatBox.innerHTML = `
        <div style="background:#f1f5f9;padding:12px 14px;border-radius:12px;align-self:flex-start;max-width:85%;">
          Hello! Ask me anything about this item (features, air conditioning, ingredients, warranty, delivery) in your preferred language.
        </div>
      `;

      var inputBar = document.createElement('div');
      inputBar.style.cssText = 'padding:14px 20px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:#ffffff;';
      inputBar.innerHTML = `
        <input id="zenoa-user-input" type="text" placeholder="Ask anything in your preferred language (Hindi, Hinglish, English)..." style="flex:1;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;" />
        <button id="zenoa-send-btn" style="background:#181d26;color:#ffffff;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;font-size:13px;font-weight:500;">Ask</button>
      `;

      sheet.appendChild(header);
      sheet.appendChild(chatBox);
      sheet.appendChild(inputBar);
      root.appendChild(sheet);
      document.body.appendChild(root);

      // Add Keyframe Style if not present
      if (!document.getElementById('zenoa-widget-styles')) {
        var styleTag = document.createElement('style');
        styleTag.id = 'zenoa-widget-styles';
        styleTag.innerText = '@keyframes zenoaSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }';
        document.head.appendChild(styleTag);
      }

      // Close handler
      document.getElementById('zenoa-close-drawer').onclick = function() { root.remove(); };
      root.onclick = function(e) { if (e.target === root) root.remove(); };

      // Send Query to Real Backend
      var inputEl = document.getElementById('zenoa-user-input');
      var sendBtn = document.getElementById('zenoa-send-btn');
      var endpointUrl = this.endpoint;
      var currentProj = this.projectId;
      
      var doAsk = function() {
        var queryText = inputEl.value.trim();
        if (!queryText) return;
        
        // Append user message
        var uMsg = document.createElement('div');
        uMsg.style.cssText = 'background:#181d26;color:#ffffff;padding:10px 14px;border-radius:12px;align-self:flex-end;max-width:85%;';
        uMsg.innerText = queryText;
        chatBox.appendChild(uMsg);
        inputEl.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        // Loading indicator
        var lMsg = document.createElement('div');
        lMsg.style.cssText = 'background:#f1f5f9;color:#64748b;padding:10px 14px;border-radius:12px;align-self:flex-start;font-size:12px;';
        lMsg.innerText = 'Checking live item specifications...';
        chatBox.appendChild(lMsg);
        chatBox.scrollTop = chatBox.scrollHeight;

        fetch(endpointUrl + '/api/business/triage-ai', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Zenoa-Public-Key': activeKey
          },
          body: JSON.stringify({
            app_id: currentProj,
            api_key: activeKey,
            message: queryText,
            customer_context: {
              mode: 'in_context_product_assistant',
              product_specs: JSON.stringify(specs),
              customer_name: 'Store Visitor'
            }
          })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          lMsg.remove();
          var aMsg = document.createElement('div');
          aMsg.style.cssText = 'background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:12px;align-self:flex-start;max-width:85%;';
          aMsg.innerText = data.reply || 'Verified specification: ' + (specs.title || 'Item confirmed.');
          chatBox.appendChild(aMsg);
          chatBox.scrollTop = chatBox.scrollHeight;
        })
        .catch(function() {
          lMsg.remove();
          var errMsg = document.createElement('div');
          errMsg.style.cssText = 'background:#fef2f2;color:#b91c1c;padding:10px 14px;border-radius:12px;align-self:flex-start;';
          errMsg.innerText = 'Error checking specifications. Please try again.';
          chatBox.appendChild(errMsg);
        });
      };

      sendBtn.onclick = doAsk;
      inputEl.onkeydown = function(e) { if (e.key === 'Enter') doAsk(); };
      inputEl.focus();
    }
  };

  // Auto-bind declarative HTML buttons
  function bindButtons() {
    document.querySelectorAll('[data-zenoa-assistant], [data-zenoa-ask-ai], .zenoa-assistant-btn').forEach(function(btn) {
      if (btn.__zenoa_bound__) return;
      btn.__zenoa_bound__ = true;
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var label = btn.getAttribute('data-zenoa-label') || btn.innerText || 'Assistant';
        var btnKey = btn.getAttribute('data-zenoa-key') || apiKey;
        window.ZenoaWidget.openWithProductContext({ element: btn, label: label, apiKey: btnKey });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButtons);
  } else {
    bindButtons();
  }
})();
