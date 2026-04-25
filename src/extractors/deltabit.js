const { USER_AGENT } = require('./common');
const { smartFetch } = require('../utils/cf_handler');

async function extractDeltaBit(url, refererBase = 'https://eurostreamings.help/') {
  try {
    let targetUrl = url;
    if (targetUrl.startsWith("//")) targetUrl = "https:" + targetUrl;

    // 1. Resolve redirectors (safego.cc, clicka.cc)
    if (targetUrl.includes('safego.cc') || targetUrl.includes('clicka.cc') || targetUrl.includes('clicka.cc/delta')) {
        const html = await smartFetch(targetUrl, 'clicka', {
            headers: { "User-Agent": USER_AGENT, "Referer": refererBase }
        });
        if (!html) return null;
        
        // Simple redirector resolution - look for the final deltabit link
        const deltabitMatch = html.match(/https?:\/\/deltabit\.(?:co|sx|bz|sx)\/[a-zA-Z0-9]+/);
        if (deltabitMatch) {
            targetUrl = deltabitMatch[0];
        } else {
            // Check for meta refresh
            const refreshMatch = html.match(/url=(https?:\/\/deltabit\.[^"']+)/i);
            if (refreshMatch) {
                targetUrl = refreshMatch[1];
            }
        }
    }

    // 2. GET the initial page
    const html = await smartFetch(targetUrl, 'deltabit', {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": refererBase
      }
    });
    if (!html) return null;

    // 3. Check for direct sources first
    const directMatch = html.match(/sources:\s*\["([^"]+)"/);
    if (directMatch) {
      return {
        url: directMatch[1],
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': targetUrl
        }
      };
    }

    // 4. Extract form data for POST (waiting logic)
    const opMatch = html.match(/name="op" value="([^"]+)"/);
    const idMatch = html.match(/name="id" value="([^"]+)"/);
    
    if (opMatch && idMatch) {
        const op = opMatch[1];
        const id = idMatch[1];
        
        // Prepare form data
        const formData = new URLSearchParams();
        const hiddenRegex = /<input type="hidden" name="([^"]+)" value="([^"]*)"/g;
        let match;
        const allFields = {};
        while ((match = hiddenRegex.exec(html)) !== null) {
            allFields[match[1]] = match[2];
        }
        
        // Ensure required fields are set
        allFields['op'] = allFields['op'] || op;
        allFields['id'] = allFields['id'] || id;
        allFields['imhuman'] = '';
        allFields['referer'] = targetUrl;

        for (const key in allFields) {
            formData.append(key, allFields[key]);
        }

        // 5. Check for numeric captcha
        const captchaMatch = html.match(/<img[^>]+src=["']([^"']*captcha[^"']*)["']/i);
        if (captchaMatch) {
            let captchaUrl = captchaMatch[1];
            if (captchaUrl.startsWith('/')) {
                const urlObj = new URL(targetUrl);
                captchaUrl = `${urlObj.origin}${captchaUrl}`;
            }
            
            try {
                // Fetch captcha image via smartFetch (responseType: arraybuffer)
                const imgData = await smartFetch(captchaUrl, 'deltabit', { 
                    headers: { "Referer": targetUrl },
                    responseType: 'arraybuffer'
                });
                const base64 = Buffer.from(imgData).toString('base64');
                
                // Call our server's OCR API
                // We use the same server URL we used for resolve
                const ocrApiUrl = 'https://easystreams.realbestia.com/ocr';
                const ocrResp = await fetch(ocrApiUrl, {
                    method: 'POST',
                    body: base64,
                    headers: { 'Content-Type': 'text/plain' }
                });
                const ocrData = await ocrResp.json();
                
                if (ocrData.result) {
                    console.log(`[DeltaBit] Captcha solved via server: ${ocrData.result}`);
                    formData.set('code', ocrData.result);
                }
            } catch (ocrErr) {
                console.error("[DeltaBit] OCR Integration failed:", ocrErr.message);
            }
        }

        // Wait for server validation (as seen in EasyProxy)
        await new Promise(resolve => setTimeout(resolve, 3500));

        // POST to get the final page
        const postHtml = await smartFetch(targetUrl, 'deltabit', {
            method: 'POST',
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": targetUrl,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });
        
        if (!postHtml) return null;
        
        const finalMatch = postHtml.match(/sources:\s*\["([^"]+)"/);
        if (finalMatch) {
            return {
                url: finalMatch[1],
                headers: {
                    'User-Agent': USER_AGENT,
                    'Referer': targetUrl
                }
            };
        }
    }

    return null;
  } catch (e) {
    console.error("[Extractors] DeltaBit extraction error:", e);
    return null;
  }
}

module.exports = { extractDeltaBit };
