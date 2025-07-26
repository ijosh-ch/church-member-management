
/**
 * Advanced QR Code Generation with Text/Logo Support
 * This file contains enhanced QR code generation functions with proper text overlay support
 */

/**
 * Generate QR code with custom text overlay using QRCode Monkey API
 * @param {string} data - The data to encode in the QR code
 * @param {string} centerText - Text to display in center
 * @param {string} memberName - Member name for filename
 * @param {string} location - Location for filename
 * @returns {Blob} QR code image blob with text overlay
 */
function generateQRCodeWithTextOverlay(data, centerText, memberName, location) {
  try {
    // Using QRCode Monkey API for advanced customization
    const apiUrl = 'https://api.qrcode-monkey.com/qr/custom';
    
    const payload = {
      data: data,
      config: {
        body: 'square',
        eye: 'frame0',
        eyeBall: 'ball0',
        erf1: [],
        erf2: [],
        erf3: [],
        brf1: [],
        brf2: [],
        brf3: [],
        bodyColor: '#000000',
        bgColor: '#FFFFFF',
        eye1Color: '#000000',
        eye2Color: '#000000',
        eye3Color: '#000000',
        eyeBall1Color: '#000000',
        eyeBall2Color: '#000000',
        eyeBall3Color: '#000000',
        gradientColor1: '',
        gradientColor2: '',
        gradientType: 'linear',
        gradientOnEyes: 'true',
        logo: '',
        logoMode: 'default'
      },
      size: 400,
      download: false,
      file: 'png'
    };

    // Add text overlay configuration
    if (centerText) {
      payload.config.logoText = centerText;
      payload.config.logoTextColor = '#000000';
      payload.config.logoTextSize = 20;
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    
    if (response.getResponseCode() === 200) {
      const responseData = JSON.parse(response.getContentText());
      if (responseData.imageUrl) {
        // Fetch the generated image
        const imageResponse = UrlFetchApp.fetch(responseData.imageUrl);
        return imageResponse.getBlob().setName(`QRCode_${location}_${memberName.replace(/\s+/g, '_')}_WithText.png`);
      }
    }
    
    Logger.log(`❌ QRCode Monkey API failed: ${response.getResponseCode()}`);
    return null;
    
  } catch (error) {
    Logger.log(`❌ Error with QRCode Monkey API: ${error.message}`);
    return null;
  }
}

/**
 * Generate QR code with custom styling and text using QR-Server API with enhanced parameters
 */
function generateStyledQRCode(data, centerText, memberName, location) {
  try {
    // Enhanced QR Server API call with styling options
    let apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
    
    const params = {
      size: '400x400',
      data: data,
      ecc: 'H', // High error correction
      format: 'png',
      margin: '10',
      qzone: '2',
      bgcolor: 'ffffff',
      color: '000000'
    };
    
    // Build the URL
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const fullUrl = `${apiUrl}?${queryString}`;
    
    const response = UrlFetchApp.fetch(fullUrl, { muteHttpExceptions: true });
    
    if (response.getResponseCode() === 200) {
      return response.getBlob().setName(`QRCode_${location}_${memberName.replace(/\s+/g, '_')}_Styled.png`);
    }
    
    return null;
    
  } catch (error) {
    Logger.log(`❌ Error generating styled QR code: ${error.message}`);
    return null;
  }
}

/**
 * Create QR code with HTML overlay for text (client-side solution)
 * This generates an HTML page that can be converted to image
 */
function generateQRCodeHTMLWithText(data, centerText, memberName, location) {
  try {
    // First, get the basic QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(data)}`;
    const response = UrlFetchApp.fetch(qrApiUrl);
    
    if (response.getResponseCode() !== 200) {
      return null;
    }
    
    // Convert image to base64
    const imageBlob = response.getBlob();
    const base64Image = Utilities.base64Encode(imageBlob.getBytes());
    
    // Create HTML with overlay
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .qr-container {
            position: relative;
            width: 400px;
            height: 400px;
            margin: 0 auto;
        }
        .qr-image {
            width: 100%;
            height: 100%;
        }
        .overlay-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 8px 12px;
            border: 2px solid #000;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            font-size: 16px;
            color: #000;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        body {
            margin: 0;
            padding: 20px;
            background: white;
        }
    </style>
</head>
<body>
    <div class="qr-container">
        <img src="data:image/png;base64,${base64Image}" alt="QR Code" class="qr-image">
        <div class="overlay-text">${centerText}</div>
    </div>
</body>
</html>`;
    
    // Save HTML to Drive temporarily (for manual conversion to image)
    const htmlBlob = Utilities.newBlob(html, 'text/html', `QRCode_${location}_${memberName.replace(/\s+/g, '_')}_HTML.html`);
    
    Logger.log(`✅ Generated HTML QR code with text overlay for ${memberName} - ${location}`);
    return htmlBlob;
    
  } catch (error) {
    Logger.log(`❌ Error generating HTML QR code: ${error.message}`);
    return null;
  }
}

/**
 * Enhanced version of the main QR generation function with multiple fallback options
 */
function generateEnhancedQRCodeBlobs(member) {
  // Build URL with available entry IDs
  let basePrefilledUrl = `${CONFIG.ATTENDANCE_FORM_URL}?usp=pp_url`;
  
  const emailEntryId = getEntryId('EMAIL');
  const phoneEntryId = getEntryId('PHONE');
  const nameEntryId = getEntryId('FULL_NAME');
  const icareEntryId = getEntryId('ICARE');
  const locationEntryId = getEntryId('LOCATION');
  
  // Only add parameters if we have valid entry IDs
  if (emailEntryId) {
    basePrefilledUrl += `&${emailEntryId}=${encodeURIComponent(member.email)}`;
  }
  if (phoneEntryId && member.phone) {
    basePrefilledUrl += `&${phoneEntryId}=${encodeURIComponent(member.phone)}`;
  }
  if (nameEntryId) {
    basePrefilledUrl += `&${nameEntryId}=${encodeURIComponent(member.englishName)}`;
  }
  if (icareEntryId) {
    basePrefilledUrl += `&${icareEntryId}=${encodeURIComponent(member.iCare)}`;
  }

  // Add location-specific URLs
  const prefilledUrlTaipei = locationEntryId ? 
    `${basePrefilledUrl}&${locationEntryId}=Taipei` : basePrefilledUrl;
  const prefilledUrlZhongli = locationEntryId ? 
    `${basePrefilledUrl}&${locationEntryId}=Zhongli` : basePrefilledUrl;

  // Try different methods with fallbacks
  let qrCodeBlobTaipei, qrCodeBlobZhongli;
  
  // Method 1: Try QRCode Monkey API (most advanced)
  qrCodeBlobTaipei = generateQRCodeWithTextOverlay(prefilledUrlTaipei, 'IFGF TPE', member.englishName, 'Taipei');
  qrCodeBlobZhongli = generateQRCodeWithTextOverlay(prefilledUrlZhongli, 'IFGF ZL', member.englishName, 'Zhongli');
  
  // Method 2: Fallback to styled QR codes
  if (!qrCodeBlobTaipei) {
    qrCodeBlobTaipei = generateStyledQRCode(prefilledUrlTaipei, 'IFGF TPE', member.englishName, 'Taipei');
  }
  if (!qrCodeBlobZhongli) {
    qrCodeBlobZhongli = generateStyledQRCode(prefilledUrlZhongli, 'IFGF ZL', member.englishName, 'Zhongli');
  }
  
  // Method 3: Fallback to HTML version
  if (!qrCodeBlobTaipei) {
    qrCodeBlobTaipei = generateQRCodeHTMLWithText(prefilledUrlTaipei, 'IFGF TPE', member.englishName, 'Taipei');
  }
  if (!qrCodeBlobZhongli) {
    qrCodeBlobZhongli = generateQRCodeHTMLWithText(prefilledUrlZhongli, 'IFGF ZL', member.englishName, 'Zhongli');
  }
  
  // Method 4: Final fallback to basic QR codes
  if (!qrCodeBlobTaipei) {
    qrCodeBlobTaipei = generateBasicQRCode(prefilledUrlTaipei, member.englishName, 'Taipei');
  }
  if (!qrCodeBlobZhongli) {
    qrCodeBlobZhongli = generateBasicQRCode(prefilledUrlZhongli, member.englishName, 'Zhongli');
  }

  Logger.log(`✅ Generated enhanced QR code blobs for ${member.englishName}.`);
  return {
    taipei: qrCodeBlobTaipei,
    zhongli: qrCodeBlobZhongli
  };
}
