module.exports = {
  defaultConfig: {
    enabled: true,
    apiUrl: '',
    apiKey: ''
  },
  
  defaultConfigDetails: {
    enabled: {
      label: 'Enable plugin',
      type: 'checkbox'
    },
    apiUrl: {
      label: 'Instance URL',
      type: 'text',
      placeholder: 'https://your-instance.com'
    },
    apiKey: {
      label: 'API Key',
      type: 'password',
      placeholder: 'Your API key'
    }
  },
  
  pluginName: 'SWGuilds',
  pluginDescription: 'Automatically sends JSON data to your instance.',
  
  init: function(proxy, config) {
    try {
      if (!proxy || !config || !config.Config || !config.Config.Plugins) {
        return;
      }
      
      const pluginName = 'SWGuilds';
      const pluginConfig = config.Config.Plugins[pluginName];
      
      if (!pluginConfig || !pluginConfig.enabled) {
        return;
      }
      
      // Show connection message
      try {
        if (pluginConfig.apiUrl && pluginConfig.apiUrl.trim() && proxy.log) {
          let baseUrl = pluginConfig.apiUrl.trim();
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          const apiPathIndex = baseUrl.indexOf('/api/');
          if (apiPathIndex !== -1) {
            baseUrl = baseUrl.substring(0, apiPathIndex);
          }
          proxy.log({
            type: 'success',
            source: 'plugin',
            name: pluginName,
            message: `Successfully connected to ${baseUrl}`
          });
        }
      } catch (e) {
        // Ignore
      }
      
      // Load modules
      let https, http, URL;
      try {
        https = require('https');
        http = require('http');
        URL = require('url').URL;
      } catch (e) {
        return;
      }
      
      // Send data function
      function sendData(data) {
        try {
          if (!pluginConfig || !pluginConfig.enabled || !pluginConfig.apiUrl || !pluginConfig.apiKey || !data) {
            return;
          }
          
          let fullUrl = pluginConfig.apiUrl.trim();
          if (fullUrl.endsWith('/')) {
            fullUrl = fullUrl.slice(0, -1);
          }
          if (!fullUrl.includes('/api/user/profile/upload-json-api')) {
            fullUrl = fullUrl + '/api/user/profile/upload-json-api';
          }
          
          const apiUrl = new URL(fullUrl);
          const jsonData = JSON.stringify(data);
          const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
          const CRLF = '\r\n';
          
          let multipartBody = '--' + boundary + CRLF;
          multipartBody += 'Content-Disposition: form-data; name="json"; filename="data.json"' + CRLF;
          multipartBody += 'Content-Type: application/json' + CRLF;
          multipartBody += CRLF;
          multipartBody += jsonData + CRLF;
          multipartBody += '--' + boundary + '--' + CRLF;
          
          const bodyBuffer = Buffer.from(multipartBody, 'utf8');
          const httpModule = apiUrl.protocol === 'https:' ? https : http;
          
          const req = httpModule.request({
            hostname: apiUrl.hostname,
            port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
            path: apiUrl.pathname + (apiUrl.search || ''),
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': bodyBuffer.length,
              'Authorization': `Bearer ${pluginConfig.apiKey}`
            },
            timeout: 30000
          });
          
          req.on('response', function(res) {
            let responseData = '';
            res.on('data', function(chunk) {
              responseData += chunk.toString();
            });
            res.on('end', function() {
              if (res.statusCode >= 200 && res.statusCode < 300 && proxy && proxy.log) {
                try {
                  let baseUrl = pluginConfig.apiUrl.trim();
                  if (baseUrl.endsWith('/')) {
                    baseUrl = baseUrl.slice(0, -1);
                  }
                  const apiPathIndex = baseUrl.indexOf('/api/');
                  if (apiPathIndex !== -1) {
                    baseUrl = baseUrl.substring(0, apiPathIndex);
                  }
                  proxy.log({
                    type: 'success',
                    source: 'plugin',
                    name: pluginName,
                    message: `Your JSON has been successfully updated on ${baseUrl}`
                  });
                } catch (e) {
                  // Ignore
                }
              }
            });
          });
          
          req.on('error', function() {
            // Ignore errors
          });
          
          req.on('timeout', function() {
            req.destroy();
          });
          
          req.write(bodyBuffer);
          req.end();
        } catch (e) {
          // Ignore all errors
        }
      }
      
      // Check data function
      function checkData(data) {
        try {
          return data && data.building_list;
        } catch (e) {
          return false;
        }
      }
      
      // Register event listeners
      if (proxy && typeof proxy.on === 'function') {
        try {
          proxy.on('HubUserLogin', function(req, resp) {
            try {
              if (pluginConfig && pluginConfig.enabled && resp && checkData(resp)) {
                const dataToSend = JSON.parse(JSON.stringify(resp));
                sendData(dataToSend);
              }
            } catch (e) {
              // Ignore
            }
          });
          
          proxy.on('GuestLogin', function(req, resp) {
            try {
              if (pluginConfig && pluginConfig.enabled && resp && checkData(resp)) {
                const dataToSend = JSON.parse(JSON.stringify(resp));
                sendData(dataToSend);
              }
            } catch (e) {
              // Ignore
            }
          });
        } catch (e) {
          // Ignore registration errors
        }
      }
    } catch (e) {
      // Completely silent - don't block anything
    }
  }
};
