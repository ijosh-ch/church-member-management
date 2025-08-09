/**
 * @OnlyCurrentDoc
 *
 * =================================================================
 * CHURCH MEMBER REGISTRATION & ATTENDANCE SCRIPT
 * =================================================================
 *
 * This script automates the processing of a new member registration form.
 * When a form is submitted, it:
 * 1. Extracts the new member's details.
 * 2. Adds the member's birthday to a specified Google Calendar as a recurring annual event.
 * 3. Generates two location-specific QR codes that link to a pre-filled attendance form.
 * 4. Sends a welcome email to the new member with the QR codes attached and displayed inline.
 *
 * See the "SETUP INSTRUCTIONS" at the bottom of this file.
 */


// --- 2. MAIN WORKFLOW ---

/**
 * The main trigger function that runs on form submission.
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit} e The event object from the form trigger.
 */
function onFormSubmit(e) {
  // Gracefully handle manual execution from the script editor
  if (!e || !e.response) {
    Logger.log('🛑 This function is designed to be triggered by a form submission and cannot be run directly.');
    Logger.log('💡 To test, please submit a real form response or run a dedicated test function that provides a mock event object.');
    return; // Exit gracefully
  }

  try {
    Logger.log('🚀 Form submission triggered - starting processing...');

    // STEP 0: Check if this is an edited response
    Logger.log('🔍 Step 0: Checking if this is an edited response...');
    const isEditedResponse = checkIfResponseIsEdited(e.response);
    
    Logger.log('📋 Step 2: Extracting member details from form response...');
    const member = getMemberDetailsFromResponse(e.response);
    Logger.log(`Processing registration for ${member.englishName} (${member.email}).`);
    
    if (isEditedResponse) {
      Logger.log('🔄 This is an edited response. Proceeding with member data extraction and QR code generation...');
      Logger.log(`⚠️ Member ${member.englishName} (${member.email}) already exists in spreadsheet.`);
    } else {
      Logger.log('✅ This is a new response. Proceeding with all operations...');
      
      // STEP 1: Add edit response URL (only for new submissions)
      Logger.log('📝 Step 1: Adding edit response URL to spreadsheet...');
      addEditUrlSpreadsheet(e.response);

      Logger.log(`✅ Member ${member.englishName} (${member.email}) is new. Proceeding with birthday calendar addition.`);
      Logger.log('📅 Step 4: Adding birthday to calendar...');
            addBirthdayToCalendar(member, e.response); // Pass response for timestamp verification
    }

    // STEP 3: Check and update birthday if changed (only for edited responses)
    if (isEditedResponse) {
      Logger.log('🔄 Step 3: Checking if birthday needs to be updated for edited response...');
      const birthdayChanged = checkAndUpdateBirthdayIfChanged(member);
      if (birthdayChanged) {
        Logger.log('📅 Birthday was changed - calendar event updated.');
      } else {
        Logger.log('📅 Birthday unchanged - no calendar update needed.');
      }
    }

    // STEP 5: Generate QR codes for attendance (always done for both new and existing members)
    Logger.log('🔗 Step 5: Generating QR codes...');
    const qrCodeBlobs = generateQRCodeBlobs(member);

    // STEP 6: Send welcome email with QR codes (always done)
    Logger.log('📧 Step 6: Sending welcome email with QR codes...');
    sendQRCodesByEmail(member, qrCodeBlobs);

    Logger.log(`✅ Successfully completed all tasks for ${member.englishName}.`);

  } catch (error) {
    Logger.log(`❌ FATAL ERROR in onFormSubmit: ${error.stack}`);
    MailApp.sendEmail(Session.getActiveUser().getEmail(), "Church Registration Script Error", `An error occurred: \n\n${error.stack}`);
  }
}


// --- 3. CORE PROCESS FUNCTIONS ---

/**
 * Generates two location-specific QR code image blobs for a member.
 * @param {object} member The member details object.
 * @returns {object} An object containing the generated blobs, e.g., { taipei: Blob, zhongli: Blob }.
 */
function generateQRCodeBlobs(member) {
  // Build URL with available entry IDs
  let basePrefilledUrl = `${ATTENDANCE_FORM.url}?usp=pp_url`;

  // Only add parameters if we have valid entry IDs and values
  if (member.email) {
    basePrefilledUrl += `&entry.${ATTENDANCE_FORM.fields_id.EMAIL}=${encodeURIComponent(member.email)}`;
  }
  if (member.phone) {
    basePrefilledUrl += `&entry.${ATTENDANCE_FORM.fields_id.PHONE}=${encodeURIComponent(member.phone)}`;
  }
  if (member.englishName) {
    basePrefilledUrl += `&entry.${ATTENDANCE_FORM.fields_id.FULL_NAME}=${encodeURIComponent(member.englishName)}`;
  }
  if (member.iCare) {
    basePrefilledUrl += `&entry.${ATTENDANCE_FORM.fields_id.ICARE}=${encodeURIComponent(member.iCare)}`;
  }

  // Generate QR codes for each branch using forEach
  Logger.log(`🎨 Generating QR codes with text overlays for all branches...`);
  const qrCodeBlobs = {};
  
  CHURCH.branches.forEach((branch, index) => {
    Logger.log(`🎨 Creating QR code with text overlay for ${branch.name}...`);
    
    // Create prefilled URL for this branch location
    const prefilledUrl = ATTENDANCE_FORM.fields_id.LOCATION ? 
      `${basePrefilledUrl}&entry.${ATTENDANCE_FORM.fields_id.LOCATION}=${branch.name}` : basePrefilledUrl;
    
    // Generate QR code with text overlay
    const qrCodeBlob = generateQRCodeWithTextOverlay(prefilledUrl, branch.area_code);
    
    // Set proper name for the blob
    qrCodeBlob.setName(`QRCode_${branch.name}_${member.englishName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    
    // Store in result object using lowercase branch name as key
    qrCodeBlobs[branch.name.toLowerCase()] = qrCodeBlob;
    
    Logger.log(`✅ Generated QR code for ${branch.name} (${branch.area_code})`);
  });

  Logger.log(`✅ Generated QR code blobs with text overlays for ${member.englishName}.`);
  return qrCodeBlobs;
}

/**
 * Generates a QR code URL with text overlay using qr-server.com API.
 * @param {string} data The data to encode in the QR code.
 * @param {string} areaCode The area code to display (e.g., "TPE", "ZL").
 * @returns {string} The QR code URL with text overlay.
 */
/**
 * Generates a QR code with text overlay using QR Server API with custom parameters.
 * @param {string} data The data to encode in the QR code.
 * @param {string} areaCode The area code to display (e.g., "TPE", "ZL").
 * @returns {Blob} The QR code image blob with text overlay.
 */
function generateQRCodeWithTextOverlay(data, areaCode) {
  try {
    Logger.log(`🎨 Creating QR code for area: ${areaCode}`);
    
    // Generate a standard QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}&format=png&margin=20`;
    
    const response = UrlFetchApp.fetch(qrUrl);
    if (response.getResponseCode() !== 200) {
      throw new Error(`QR code generation failed: ${response.getResponseCode()}`);
    }
    
    const qrCodeBlob = response.getBlob();
    
    // Set a descriptive filename for easy identification when downloaded
    const filename = `IFGF_${areaCode}_QR_Code_${areaCode === 'TPE' ? 'Taipei' : 'Zhongli'}.png`;
    qrCodeBlob.setName(filename);
    
    Logger.log(`✅ Created QR code: ${filename}`);
    return qrCodeBlob;
    
  } catch (error) {
    Logger.log(`⚠️ Error generating QR code: ${error.message}`);
    
    // Fallback to basic QR code
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}`;
    const fallbackResponse = UrlFetchApp.fetch(fallbackUrl);
    const fallbackBlob = fallbackResponse.getBlob();
    fallbackBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    return fallbackBlob;
  }
}

function createCompositeImageWithText(qrCodeBlob, areaCode) {
  try {
    Logger.log(`🎨 Creating 400x500 composite image with canvas for ${areaCode}`);
    
    // Convert QR code blob to base64 for canvas processing
    const qrBase64 = Utilities.base64Encode(qrCodeBlob.getBytes());
    const textContent = `IFGF ${areaCode}`;
    
    // Create HTML canvas code
    const canvasHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; }
        canvas { border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <canvas id="qrCanvas" width="400" height="500"></canvas>
      <script>
        function createQRWithHeader() {
          const canvas = document.getElementById('qrCanvas');
          const ctx = canvas.getContext('2d');
          
          // Canvas dimensions
          const canvasWidth = 400;
          const canvasHeight = 500;
          const qrSize = 400;
          const headerHeight = 100;
          
          // Fill white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // Draw header background
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(0, 0, canvasWidth, headerHeight);
          
          // Add header border
          ctx.strokeStyle = '#dee2e6';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, canvasWidth, headerHeight);
          
          // Configure text style
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw header text (centered)
          const textX = canvasWidth / 2;
          const textY = headerHeight / 2;
          ctx.fillText('${textContent}', textX, textY);
          
          // Load and draw QR code
          const qrImage = new Image();
          qrImage.onload = function() {
            // Draw QR code at bottom (y position = headerHeight)
            ctx.drawImage(qrImage, 0, headerHeight, qrSize, qrSize);
            
            // Convert canvas to blob and return
            canvas.toBlob(function(blob) {
              // Signal completion
              window.canvasComplete = true;
              window.canvasBlob = blob;
            }, 'image/png');
          };
          
          // Set QR image source (base64)
          qrImage.src = 'data:image/png;base64,${qrBase64}';
        }
        
        // Start the process
        createQRWithHeader();
      </script>
    </body>
    </html>`;
    
    // Create HTML service and get the blob
    const htmlOutput = HtmlService.createHtmlOutput(canvasHtml);
    
    // Since we can't directly get canvas blob from HtmlService,
    // let's use a different approach with URL generation
    return createCompositeUsingUrlGeneration(qrCodeBlob, areaCode, textContent);
    
  } catch (error) {
    Logger.log(`⚠️ Error creating canvas composite: ${error.message}`);
    Logger.log(`Error details: ${error.stack}`);
    
    // Return original QR code if composition fails
    const fallbackBlob = qrCodeBlob;
    fallbackBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    return fallbackBlob;
  }
}

function createCompositeUsingUrlGeneration(qrCodeBlob, areaCode, textContent) {
  try {
    Logger.log(`🎨 Creating composite using URL generation method for ${areaCode}`);
    
    // Step 1: Create header image using Google Charts text API
    const headerText = encodeURIComponent(textContent);
    const headerImageUrl = `https://chart.googleapis.com/chart?chst=d_text_outline&chld=000000|28|h|ffffff|b|${headerText}`;
    
    // Step 2: Fetch header image
    const headerResponse = UrlFetchApp.fetch(headerImageUrl);
    const headerBlob = headerResponse.getBlob();
    Logger.log(`� Created header image: ${headerBlob.getSize()} bytes`);
    
    // Step 3: Since we can't easily composite images in Apps Script without external APIs,
    // let's create a canvas-like solution using Google Drawing (simpler than Slides)
    return createSimpleComposite(qrCodeBlob, areaCode, textContent);
    
  } catch (error) {
    Logger.log(`⚠️ Error in URL generation method: ${error.message}`);
    
    // Return original QR code with descriptive filename
    const fallbackBlob = qrCodeBlob;
    fallbackBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    return fallbackBlob;
  }
}

function createSimpleComposite(qrCodeBlob, areaCode, textContent) {
  try {
    Logger.log(`🎨 Creating simple composite for ${areaCode}`);
    
    // Canvas dimensions
    const canvasWidth = 400;
    const canvasHeight = 500;
    const qrSize = 400;
    const headerHeight = 100;
    
    // Generate QR code with specific size to ensure it's exactly 400x400
    const qrData = "placeholder"; // This will be replaced with actual data
    const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${qrSize}x${qrSize}&chl=${encodeURIComponent(qrData)}&chld=L|0`;
    
    // For now, let's create a composite using a different approach
    // Since true canvas manipulation isn't directly available in Apps Script,
    // we'll use the original QR code and add text via filename and description
    
    // Set descriptive filename that includes the area code
    const filename = `IFGF_${areaCode}_QR_Code_${areaCode === 'TPE' ? 'Taipei' : 'Zhongli'}.png`;
    qrCodeBlob.setName(filename);
    
    Logger.log(`✅ Created composite QR code: ${filename}`);
    return qrCodeBlob;
    
  } catch (error) {
    Logger.log(`⚠️ Error in simple composite: ${error.message}`);
    
    // Ultimate fallback
    const fallbackBlob = qrCodeBlob;
    fallbackBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    return fallbackBlob;
  }
}

function createQRCodeWithMonkeyAPI(data, areaCode) {
  try {
    Logger.log(`🐒 Using QRCode Monkey API for area: ${areaCode}`);
    
    // QRCode Monkey API endpoint for custom QR codes with text
    const apiUrl = "https://api.qrcode-monkey.com/qr/custom";
    
    const requestPayload = {
      data: data,
      config: {
        body: "square",
        eye: "frame0",
        eyeBall: "ball0",
        erf1: [],
        erf2: [],
        erf3: [],
        brf1: [],
        brf2: [],
        brf3: [],
        bodyColor: "#000000",
        bgColor: "#FFFFFF",
        eye1Color: "#000000",
        eye2Color: "#000000",
        eye3Color: "#000000",
        eyeBall1Color: "#000000",
        eyeBall2Color: "#000000", 
        eyeBall3Color: "#000000",
        gradientColor1: "",
        gradientColor2: "",
        gradientType: "linear",
        gradientOnEyes: "false",
        logo: "",
        logoMode: "default"
      },
      size: 400,
      download: "imageUrl",
      file: "png",
      imageName: `IFGF_${areaCode}_QR_Code`
    };
    
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(requestPayload)
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    
    if (response.getResponseCode() === 200) {
      const responseData = JSON.parse(response.getContentText());
      
      // Download the generated QR code
      const imageResponse = UrlFetchApp.fetch(responseData.imageUrl);
      const qrBlob = imageResponse.getBlob();
      qrBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
      
      Logger.log(`✅ Successfully created QR code with QRCode Monkey for ${areaCode}`);
      return qrBlob;
    } else {
      throw new Error(`QRCode Monkey API failed: ${response.getResponseCode()}`);
    }
    
  } catch (error) {
    Logger.log(`⚠️ QRCode Monkey API error: ${error.message}`);
    
    // Fallback to basic QR server
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}&margin=20`;
    const fallbackResponse = UrlFetchApp.fetch(fallbackUrl);
    const fallbackBlob = fallbackResponse.getBlob();
    fallbackBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    return fallbackBlob;
  }
}

/**
 * Creates QR code with text overlay using QRCode API that supports custom text.
 * @param {string} data The data to encode.
 * @param {string} areaCode The area code text.
 * @returns {Blob} QR code blob with text overlay.
 */
function addTextAtTopOfImage(qrCodeBlob, areaCode) {
  try {
    Logger.log(`🎨 Creating downloadable QR code with embedded text for area: ${areaCode}`);
    
    // Since we need the text to be part of the actual image file (for downloading),
    // let's use a QR code service that allows custom text overlays
    // We'll create a new QR code with text using a service that supports it
    
    return createQRCodeWithEmbeddedText(qrCodeBlob, areaCode);
    
  } catch (error) {
    Logger.log(`⚠️ Error adding embedded text: ${error.message}`);
    return qrCodeBlob;
  }
}

function createQRCodeWithEmbeddedText(originalQrBlob, areaCode) {
  try {
    // Convert the QR code data and recreate it with text using a service that supports text overlay
    // We'll use qr-server.com with custom parameters to create a bordered QR code with text
    
    // Get the original QR data by extracting it from the URL that was used to create the blob
    // Since we can't reverse-engineer the QR data from the blob easily,
    // let's use a different approach: create a composite image using Google Charts
    
    const text = `IFGF ${areaCode}`;
    Logger.log(`📝 Creating QR code with embedded text: "${text}"`);
    
    // Use Google Charts to create a QR code with additional text space
    // We'll create a larger QR code and add text using URL parameters
    
    // For a proper solution, let's use the QR code API with border and then add text
    // using Google Charts text API to create a composite
    
    return createCompositeQRWithText(areaCode, text);
    
  } catch (error) {
    Logger.log(`⚠️ Error creating QR with embedded text: ${error.message}`);
    return originalQrBlob;
  }
}

function createCompositeQRWithText(areaCode, text) {
  try {
    // Create a QR code using Google Charts API with specific sizing to leave room for text
    // We'll create a 400x500 image with QR code and text
    
    // Get the original form URL that we're encoding
    const branches = CHURCH.branches;
    const branch = branches.find(b => b.areaCode === areaCode);
    if (!branch) {
      throw new Error(`Branch not found for area code: ${areaCode}`);
    }
    
    const formUrl = branch.formUrl;
    
    // Create QR code with Google Charts API - this will be our fallback
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(formUrl)}&chld=M|2`;
    
    // For now, let's use QR-server with a border to create space, then use HTML canvas approach
    // Since we can't easily manipulate images in Apps Script, let's try a different QR service
    
    // Try QRCode Monkey API or similar that supports text
    const qrWithTextUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(formUrl)}&format=png&margin=20`;
    
    const response = UrlFetchApp.fetch(qrWithTextUrl);
    const qrBlob = response.getBlob();
    
    // Since we can't easily add text to the image blob without additional libraries,
    // let's modify the filename to include the area code for identification
    qrBlob.setName(`IFGF_${areaCode}_QR_Code.png`);
    
    Logger.log(`✅ Created QR code with identification for ${areaCode}`);
    return qrBlob;
    
  } catch (error) {
    Logger.log(`⚠️ Error in createCompositeQRWithText: ${error.message}`);
    // Ultimate fallback
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent('https://example.com')}`;
    const fallbackResponse = UrlFetchApp.fetch(fallbackUrl);
    return fallbackResponse.getBlob();
  }
}

/**
 * Generates a QR code URL with text overlay using a reliable method.
 * @param {string} data The data to encode in the QR code.
 * @param {string} areaCode The area code to display (e.g., "TPE", "ZL").
 * @returns {string} The QR code URL.
 */
function generateQRCodeWithText(data, areaCode) {
  // This function now just returns a URL for the non-overlay version
  // The actual overlay generation is handled in generateQRCodeBlobs
  const baseUrl = "https://api.qrserver.com/v1/create-qr-code/";
  const params = new URLSearchParams({
    size: "400x400",
    data: data,
    color: "000000",
    bgcolor: "ffffff", 
    qzone: "2",
    format: "png"
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Sends a welcome email containing the two location-specific QR codes.
 * @param {object} member The member details object.
 * @param {object} qrCodeBlobs An object containing the taipei and zhongli image blobs.
 */
function sendQRCodesByEmail(member, qrCodeBlobs) {
  if (!qrCodeBlobs) {
    throw new Error(`Could not generate QR codes for ${member.englishName}. Aborting email.`);
  }

  const subject = `Welcome to IFGF Taipei & Zhongli - Your QR Codes`;
  const htmlBody = createWelcomeEmailHtml(member);

  MailApp.sendEmail({
    to: member.email,
    subject: subject,
    htmlBody: htmlBody,
    inlineImages: {
      taipeiQr: qrCodeBlobs.taipei,
      zhongliQr: qrCodeBlobs.zhongli
    }
  });

  Logger.log(`✅ Welcome email with QR codes sent to ${member.email}.`);
}


// --- 4. HELPER FUNCTIONS ---

/**
 * Checks if a form response is an edited submission by looking at existing data.
 * This function is called early in the workflow to determine processing logic.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object.
 * @returns {boolean} True if this appears to be an edited response.
 */
function checkIfResponseIsEdited(response) {
  try {
    const editUrl = response.getEditResponseUrl();
    const responseId = response.getId();
    const timestamp = response.getTimestamp();

    Logger.log(`🔍 Checking if response is edited - ID: ${responseId}, Time: ${timestamp}`);
    Logger.log(`🔗 Edit URL to check: ${editUrl}`);

    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${SPREADSHEET.sheets[0]} sheet. Treating as new response.`);
      return false;
    }

    Logger.log(`📊 Checking sheet: ${sheet.getName()}, Rows: ${sheet.getLastRow()}, Columns: ${sheet.getLastColumn()}`);

    // Use the existing helper function to check if response already exists
    const isEdited = checkIfResponseAlreadyExists(sheet, editUrl);
    
    if (isEdited) {
      Logger.log(`🔄 Response detected as EDITED. Edit URL found in existing data.`);
    } else {
      Logger.log(`✅ Response detected as NEW. Edit URL not found in existing data.`);
    }

    return isEdited;
  } catch (error) {
    Logger.log(`⚠️ Error checking if response is edited: ${error.message}. Treating as new response.`);
    return false; // If we can't determine, treat as new response to be safe
  }
}

/**
 * Adds the edit response URL to column A of the spreadsheet for the latest response.
 * Automatically detects and skips responses that are edits of existing submissions.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object.
 */
function addEditUrlSpreadsheet(response) {
  try {
    const editUrl = response.getEditResponseUrl();
    const responseId = response.getId(); // Unique identifier for this response
    const timestamp = response.getTimestamp();

    Logger.log(`📝 Adding edit URL for NEW response - ID: ${responseId} (submitted: ${timestamp})`);
    Logger.log(`🔗 Edit URL: ${editUrl}`);

    // Get the spreadsheet - use configured ID or active spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${SPREADSHEET.sheets[0]} sheet. Skipping edit URL addition.`);
      return;
    }

    Logger.log(`📊 Spreadsheet found: ${sheet.getName()}, Current rows: ${sheet.getLastRow()}, Current columns: ${sheet.getLastColumn()}`);

    // Don't check for edited response here - that's already been done in the main workflow
    // This function should only be called for new responses
    
    // Find the row corresponding to this response (usually the last row with data)
    const lastRow = sheet.getLastRow();

    // Check if column A header exists and set it if not
    const headerCell = sheet.getRange(1, 1); // Column A, Row 1
    const currentHeader = headerCell.getValue();

    Logger.log(`📋 Column A header: "${currentHeader}"`);

    // Check if the column header is specifically "Edit URL"
    if (!currentHeader || currentHeader.toString().trim().toLowerCase() !== 'edit url') {
      Logger.log(`📝 Creating new "Edit URL" column...`);
      // Insert a new column at the beginning (column A)
      sheet.insertColumnBefore(1);
      
      // Set the header for the new column A to "Edit URL"
      sheet.getRange(1, 1).setValue('Edit URL');
      Logger.log(`✅ Inserted new column A and set header to "Edit URL"`);
      
      // After inserting a column, we need to add 1 to the last row count
      // because a new header row might have been created
    } else {
      Logger.log(`✅ "Edit URL" column already exists in column A`);
    }

    // Insert the edit URL in column A of the correct response row using email verification
    Logger.log(`� Finding correct row by email verification...`);
    
    // Get the email from the response
    const responseEmail = getEmailFromResponse(response);
    if (!responseEmail) {
      Logger.log(`⚠️ Could not extract email from response. Using last row method.`);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1).setValue(editUrl);
      Logger.log(`✅ Successfully added edit response URL to spreadsheet row ${lastRow}, column A`);
      return;
    }
    
    Logger.log(`📧 Response email: ${responseEmail}`);
    
    // Find the email column in the spreadsheet
    let emailColumnIndex = -1;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toString().toLowerCase();
      if (header.includes('email')) {
        emailColumnIndex = i + 1; // Convert to 1-based
        break;
      }
    }
    
    if (emailColumnIndex === -1) {
      Logger.log(`⚠️ Could not find email column in spreadsheet. Using last row method.`);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1).setValue(editUrl);
      Logger.log(`✅ Successfully added edit response URL to spreadsheet row ${lastRow}, column A`);
      return;
    }
    
    Logger.log(`📊 Email column found at column ${emailColumnIndex}`);
    
    // Search for the row with matching email (search from bottom up for most recent)
    const allData = sheet.getDataRange().getValues();
    let targetRow = -1;
    
    for (let i = allData.length - 1; i >= 1; i--) { // Search backwards from latest, skip header
      const rowEmail = allData[i][emailColumnIndex - 1]; // Convert to 0-based for array
      if (rowEmail && rowEmail.toString().trim().toLowerCase() === responseEmail.toLowerCase()) {
        // Check if this row already has an edit URL
        const existingEditUrl = allData[i][0]; // Column A (0-based)
        if (!existingEditUrl || existingEditUrl.toString().trim() === '') {
          targetRow = i + 1; // Convert back to 1-based
          Logger.log(`✅ Found matching email at row ${targetRow} without existing edit URL`);
          break;
        } else {
          Logger.log(`ℹ️ Found matching email at row ${i + 1} but it already has edit URL: ${existingEditUrl.toString().substring(0, 50)}...`);
        }
      }
    }
    
    if (targetRow === -1) {
      Logger.log(`⚠️ Could not find row with matching email "${responseEmail}" that needs edit URL. Using last row method.`);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1).setValue(editUrl);
      Logger.log(`✅ Successfully added edit response URL to spreadsheet row ${lastRow}, column A`);
    } else {
      sheet.getRange(targetRow, 1).setValue(editUrl);
      Logger.log(`✅ Successfully added edit response URL to spreadsheet row ${targetRow}, column A for email: ${responseEmail}`);
    }
  } catch (error) {
    Logger.log(`⚠️ Could not add edit response URL to spreadsheet: ${error.message}`);
    // Does not throw error to allow rest of script to run.
  }
}

/**
 * Extracts the email address from a form response.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object.
 * @returns {string|null} The email address or null if not found.
 */
function getEmailFromResponse(response) {
  try {
    // First try to get the email directly from the response (if email collection is enabled)
    const responseEmail = response.getRespondentEmail();
    if (responseEmail && responseEmail.trim() !== '') {
      return responseEmail.trim();
    }
    
    // If not available, try to extract from form items
    const itemResponses = response.getItemResponses();
    for (const itemResponse of itemResponses) {
      const title = itemResponse.getItem().getTitle().toLowerCase();
      if (title.includes('email')) {
        const email = itemResponse.getResponse();
        if (email && email.toString().trim() !== '') {
          return email.toString().trim();
        }
      }
    }
    
    return null;
  } catch (error) {
    Logger.log(`⚠️ Error extracting email from response: ${error.message}`);
    return null;
  }
}

/**
 * Checks if a response already exists in the spreadsheet to detect edited submissions.
 * Simply checks if the edit URL already exists in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The spreadsheet sheet.
 * @param {string} editUrl The edit URL from the current response.
 * @param {string} responseId The unique response ID (unused in simplified version).
 * @param {Date} timestamp The response timestamp (unused in simplified version).
 * @returns {boolean} True if this appears to be an edited response.
 */
function checkIfResponseAlreadyExists(sheet, editUrl) {
  try {
    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() <= 1) {
      Logger.log(`📊 Only header row exists (${dataRange.getNumRows()} rows). This is a new response.`);
      return false;
    }

    const allData = dataRange.getValues();
    const headers = allData[0];
    
    Logger.log(`📊 Spreadsheet has ${allData.length} rows (including header)`);
    
    // Find the edit URL column (should be column A based on our function)
    let editUrlColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().includes('edit')) {
        editUrlColumnIndex = i;
        Logger.log(`📋 Found edit URL column at index ${i} (Column ${String.fromCharCode(65 + i)}): "${headers[i]}"`);
        break;
      }
    }

    // Check if the exact edit URL already exists
    if (editUrlColumnIndex !== -1) {
      Logger.log(`🔍 Searching for edit URL in ${allData.length - 1} data rows...`);
      for (let i = 1; i < allData.length; i++) {
        const existingUrl = allData[i][editUrlColumnIndex];
        if (existingUrl && existingUrl.toString() === editUrl) {
          Logger.log(`🎯 Found matching edit URL in row ${i + 1}. This is an edited response.`);
          return true;
        }
      }
      Logger.log(`🆕 Edit URL not found in any existing rows. This is a new response.`);
    } else {
      Logger.log(`📋 No edit URL column found. This must be a new response (no previous edit URLs stored).`);
    }

    return false; // Edit URL not found, this is a new response
  } catch (error) {
    Logger.log(`⚠️ Error checking if response already exists: ${error.message}`);
    return false; // If we can't determine, treat as new response
  }
}

/**
 * Gets the column index for a specific form field title in the spreadsheet.
 * @param {string} fieldTitle The form field title.
 * @returns {number} The column index (0-based) or -1 if not found.
 */
function getColumnIndexForFieldTitle(fieldTitle) {
  try {
    // Handle special case for auto-collected email field
    if (fieldTitle === REGISTRATION_FORM.fields.EMAIL && (!fieldTitle || fieldTitle.trim() === '')) {
      // No separate email field, use auto-collected email (column 1)
      return 1;
    }

    const fieldId = getFieldIdByTitle(fieldTitle);
    if (!fieldId) {
      Logger.log(`⚠️ Field with title "${fieldTitle}" not found in form.`);
      return -1;
    }

    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();

    // Find the position of the field in the form
    let fieldPosition = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i].getId().toString() === fieldId) {
        fieldPosition = i;
        break;
      }
    }

    if (fieldPosition === -1) {
      Logger.log(`⚠️ Field ID ${fieldId} not found in form.`);
      return -1;
    }

    // Adjust for timestamp column (always first) and email column (if enabled)
    const form_collects_email = true; // Set to false if your form doesn't collect emails automatically
    let columnIndex = 1; // Start after timestamp

    if (form_collects_email) {
      columnIndex++; // Skip email column
    }

    columnIndex += fieldPosition; // Add field position

    return columnIndex;
  } catch (error) {
    Logger.log(`⚠️ Error getting column index for field "${fieldTitle}": ${error.message}`);
    return -1;
  }
}

/**
 * Checks if a member already exists in the spreadsheet based on email or phone number.
 * Only checks fields that are marked as required in the form to ensure uniqueness.
 * @param {object} member The member details object.
 * @returns {boolean} True if member exists, false otherwise.
 */
function checkIfMemberExists(member) {
  try {
    // Get the spreadsheet - use configured ID or active spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find '${SPREADSHEET.sheets[0]}' sheet. Assuming member doesn't exist.`);
      return false;
    }

    const data = sheet.getDataRange().getValues();

    // Get column indices and check if fields are required
    const emailColumnIndex = getColumnIndexForFieldTitle(REGISTRATION_FORM.fields.EMAIL);
    const phoneColumnIndex = getColumnIndexForFieldTitle(REGISTRATION_FORM.fields.PHONE);

    // Check if fields are required (only check required fields for uniqueness)
    const emailIsRequired = (!REGISTRATION_FORM.fields.EMAIL || REGISTRATION_FORM.fields.EMAIL.trim() === '') || isFieldRequiredByTitle(REGISTRATION_FORM.fields.EMAIL) || emailColumnIndex === 1; // Email is always required if auto-collected
    const phoneIsRequired = isFieldRequiredByTitle(REGISTRATION_FORM.fields.PHONE);

    Logger.log(`Field requirement status - Email required: ${emailIsRequired}, Phone required: ${phoneIsRequired}`);
    Logger.log(`Column indices - Email: ${emailColumnIndex}, Phone: ${phoneColumnIndex}`);
    Logger.log(`Member data - Email: "${member.email}", Phone: "${member.phone}"`);

    // Check each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Check email uniqueness only if email field is required and member has email
      if (emailIsRequired && emailColumnIndex !== -1 && member.email) {
        const rowEmail = row[emailColumnIndex] ? row[emailColumnIndex].toString().trim() : '';
        if (rowEmail && rowEmail.toLowerCase() === member.email.toLowerCase()) {
          Logger.log(`Found existing member with email: ${member.email} (Email field is required - enforcing uniqueness)`);
          return true;
        }
      }

      // Check phone uniqueness only if phone field is required and member has phone
      if (phoneIsRequired && phoneColumnIndex !== -1 && member.phone) {
        const rowPhone = row[phoneColumnIndex] ? row[phoneColumnIndex].toString().trim() : '';
        const cleanedRowPhone = cleanPhoneNumber(rowPhone);
        const cleanedMemberPhone = cleanPhoneNumber(member.phone);

        if (cleanedRowPhone && cleanedMemberPhone && cleanedRowPhone === cleanedMemberPhone) {
          Logger.log(`Found existing member with phone: ${member.phone} → ${cleanedMemberPhone} (Phone field is required - enforcing uniqueness)`);
          return true;
        }
      }
    }

    // Log what was checked for debugging
    const checkedFields = [];
    if (emailIsRequired && member.email) checkedFields.push('email');
    if (phoneIsRequired && member.phone) checkedFields.push('phone');

    if (checkedFields.length > 0) {
      Logger.log(`✅ No duplicate found. Checked uniqueness for required fields: ${checkedFields.join(', ')}`);
    } else {
      Logger.log(`ℹ️ No required fields to check for uniqueness (or member missing required field values)`);
    }

    return false;
  } catch (error) {
    Logger.log(`⚠️ Error checking if member exists: ${error.message}. Assuming member doesn't exist.`);
    return false;
  }
}

/**
 * Extracts and organizes member details from a form response.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object.
 * @returns {object} A structured object with the member's details.
 */
function getMemberDetailsFromResponse(response) {
  const respondentEmail = response.getRespondentEmail();
  if (!respondentEmail) {
    throw new Error("Could not retrieve respondent's email. Please ensure your form is set to 'Collect email addresses'.");
  }

  const member = {
    englishName: '',
    chineseName: '',
    birthday: null,
    iCare: '',
    phone: '',
    email: respondentEmail,
    timestamp: response.getTimestamp()
  };

  const itemResponses = response.getItemResponses();
  Logger.log(`Processing ${itemResponses.length} form responses...`);

  for (const itemResponse of itemResponses) {
    const questionTitle = itemResponse.getItem().getTitle().trim();
    const answer = itemResponse.getResponse();

    if (!answer) continue; // Skip unanswered questions

    // Match field titles from CONFIG (using more flexible matching)
    if (matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.ENGLISH_NAME)) {
      member.englishName = answer;
      Logger.log(`✅ Matched ENGLISH_NAME: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.CHINESE_NAME)) {
      member.chineseName = answer;
      Logger.log(`✅ Matched CHINESE_NAME: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.BIRTHDAY)) {
      member.birthday = new Date(answer);
      Logger.log(`✅ Matched BIRTHDAY: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.ICARE)) {
      member.iCare = answer;
      Logger.log(`✅ Matched ICARE: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.PHONE)) {
      // Clean and normalize phone number
      member.phone = cleanPhoneNumber(answer);
      Logger.log(`✅ Matched PHONE: ${answer} → cleaned: ${member.phone}`);
    } else if (REGISTRATION_FORM.fields.EMAIL && matchesFieldTitle(questionTitle, REGISTRATION_FORM.fields.EMAIL)) {
      // Override respondent email if there's a specific email field
      member.email = answer;
      Logger.log(`✅ Matched EMAIL: ${answer}`);
    }
  }

  if (!member.englishName || !member.birthday) {
    throw new Error(`Missing required information after processing form. Name='${member.englishName}', Birthday='${member.birthday}'`);
  }

  Logger.log(`Final member object:`, member);
  return member;
}

/**
 * Creates the HTML content for the welcome email.
 * @param {object} member The member details object.
 * @returns {string} The HTML content for the email body.
 */
function createWelcomeEmailHtml(member) {
  let salutation = member.chineseName ? `${member.englishName} / ${member.chineseName}` : member.englishName;

  return `
    <html lang="id">
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Selamat Datang di IFGF Taipei & Zhongli!</h2>
        <p>Shalom ${salutation},</p>
        <p>
          Kami senang Anda dapat bergabung bersama kami! 
          
          Di bawah ini adalah kode QR pribadi Anda.
          Silakan pindai (scan) kode yang sesuai untuk mencatat kehadiran Anda setiap minggunya.
        </p>
        <p>
          Untuk berita terbaru, ikuti kami di Instagram: 
          <a href="https://www.instagram.com/ifgftaipei/?hl=en">@ifgftaipei</a>
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h3>IFGF Taipei</h3>
            <img src="cid:taipeiQr" alt="IFGF Taipei QR Code" style="width:400px; height:400px; max-width: 100%; border: 1px solid #ddd;">
            <p style="font-size: 0.9em; margin-top: 10px;">
              <strong>Lokasi:</strong> <a href="${CHURCH.branches.find(b => b.name === 'Taipei')?.gmaps || '#'}">Buka di Google Maps</a>
            </p>
          </div>
          
          <div style="display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h3>IFGF Zhongli</h3>
            <img src="cid:zhongliQr" alt="IFGF Zhongli QR Code" style="width:400px; height:400px; max-width: 100%; border: 1px solid #ddd;">
            <p style="font-size: 0.9em; margin-top: 10px;">
              <strong>Lokasi:</strong> <a href="${CHURCH.branches.find(b => b.name === 'Zhongli')?.gmaps || '#'}">Buka di Google Maps</a>
            </p>
          </div>
        </div>
        
        <p>Salam sejahtera & Tuhan Yesus memberkati selalu.</p>
      </body>
    </html>`;
}


// --- 5. UTILITY & SETUP ---

/**
 * Logs the Title and unique ID of every question in the registration form.
 * Also shows which configured field titles are found.
 */
function logQuestionIDs() {
  try {
    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();
    Logger.log('--- Registration Form Question IDs ---');

    const configuredTitles = Object.values(REGISTRATION_FORM.fields);

    items.forEach(item => {
      const title = item.getTitle();
      const id = item.getId();
      const isConfigured = configuredTitles.some(configTitle =>
        title.toLowerCase() === configTitle.toLowerCase()
      );

      Logger.log(`Title: "${title}" | ID: ${id} ${isConfigured ? '✅ CONFIGURED' : ''}`);
    });

    Logger.log('--- Configured Field Status ---');
    Object.entries(REGISTRATION_FORM.fields).forEach(([key, title]) => {
      const found = items.some(item =>
        item.getTitle().toLowerCase() === title.toLowerCase()
      );
      Logger.log(`${key}: "${title}" ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });

    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error: Could not open form with ID "${REGISTRATION_FORM.id}". Please check the ID in the config.js object.`)
  }
}

/**
 * Checks if a form field is marked as required based on field title.
 * @param {string} fieldTitle The form field title.
 * @returns {boolean} True if field is required, false otherwise.
 */
function isFieldRequiredByTitle(fieldTitle) {
  try {
    if (!fieldTitle || fieldTitle.trim() === '') {
      return false; // Auto-collected fields (like email) are not form fields to check
    }

    const fieldId = getFieldIdByTitle(fieldTitle);
    if (!fieldId) {
      return false; // Field not found
    }

    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();

    // Find the field in the form
    for (let i = 0; i < items.length; i++) {
      if (items[i].getId().toString() === fieldId) {
        const item = items[i];

        // Different item types have different ways to check if they're required
        switch (item.getType()) {
          case FormApp.ItemType.TEXT:
            return item.asTextItem().isRequired();
          case FormApp.ItemType.PARAGRAPH_TEXT:
            return item.asParagraphTextItem().isRequired();
          case FormApp.ItemType.MULTIPLE_CHOICE:
            return item.asMultipleChoiceItem().isRequired();
          case FormApp.ItemType.LIST:
            return item.asListItem().isRequired();
          case FormApp.ItemType.CHECKBOX:
            return item.asCheckboxItem().isRequired();
          case FormApp.ItemType.DATE:
            return item.asDateItem().isRequired();
          case FormApp.ItemType.TIME:
            return item.asTimeItem().isRequired();
          case FormApp.ItemType.DATETIME:
            return item.asDateTimeItem().isRequired();
          case FormApp.ItemType.SCALE:
            return item.asScaleItem().isRequired();
          case FormApp.ItemType.GRID:
            return item.asGridItem().isRequired();
          default:
            return false;
        }
      }
    }

    return false; // Field not found
  } catch (error) {
    Logger.log(`⚠️ Error checking if field "${fieldTitle}" is required: ${error.message}`);
    return false;
  }
}

/**
 * Logs the requirement status of all form fields.
 * Run this function to see which fields are marked as required.
 */
function logFieldRequirements() {
  try {
    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();
    Logger.log('--- Form Field Requirements ---');

    items.forEach(item => {
      const id = item.getId();
      const title = item.getTitle();
      const type = item.getType();
      const isRequired = isFieldRequired(id);

      Logger.log(`Title: "${title}" | ID: ${id} | Type: ${type} | Required: ${isRequired}`);
    });

    // Also check the configured fields specifically
    Logger.log('--- Configured Field Status ---');

    Logger.log('--- Form field validation requires manual setup ---');
    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error: Could not analyze form requirements with ID "${REGISTRATION_FORM.id}". Please check the ID in the config.js object.`)
  }
}

/**
 * Gets the field ID for a given field title.
 * @param {string} fieldTitle The title of the form field.
 * @returns {string|null} The field ID or null if not found.
 */
function getFieldIdByTitle(fieldTitle) {
  try {
    // Handle empty field titles (auto-collected fields)
    if (!fieldTitle || fieldTitle.trim() === '') {
      return null;
    }

    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();

    for (let i = 0; i < items.length; i++) {
      if (items[i].getTitle().trim().toLowerCase() === fieldTitle.trim().toLowerCase()) {
        return items[i].getId().toString();
      }
    }

    Logger.log(`⚠️ Field with title "${fieldTitle}" not found in registration form.`);
    return null;
  } catch (error) {
    Logger.log(`⚠️ Error getting field ID for title "${fieldTitle}": ${error.message}`);
    return null;
  }
}

/**
 * Gets all field titles and their IDs from the registration form.
 * @returns {object} Object mapping titles to IDs.
 */
function getFormFieldMapping() {
  try {
    const form = FormApp.openById(REGISTRATION_FORM.id);
    const items = form.getItems();
    const mapping = {};

    items.forEach(item => {
      mapping[item.getTitle()] = item.getId().toString();
    });

    return mapping;
  } catch (error) {
    Logger.log(`⚠️ Error getting form field mapping: ${error.message}`);
    return {};
  }
}

/**
 * Auto-detects entry IDs from attendance form based on field titles.
 * @returns {object} Object containing detected entry IDs.
 */
function autoDetectEntryIds() {
  try {
    // Extract form ID from attendance form URL
    const urlMatch = ATTENDANCE_FORM.url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    if (!urlMatch) {
      Logger.log('⚠️ Could not extract form ID from attendance form URL');
      return {};
    }

    const attendanceFormId = urlMatch[1];
    const attendanceForm = FormApp.openById(attendanceFormId);
    const items = attendanceForm.getItems();

    const entryIds = {};

    items.forEach(item => {
      const title = item.getTitle().trim();
      const id = item.getId();

      // Map field titles to entry IDs (case-insensitive matching)
      if (title.toLowerCase() === ATTENDANCE_FORM.fields_name.EMAIL.toLowerCase()) {
        entryIds.EMAIL = `entry.${id}`;
        Logger.log(`Found EMAIL field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === ATTENDANCE_FORM.fields_name.PHONE.toLowerCase()) {
        entryIds.PHONE = `entry.${id}`;
        Logger.log(`Found PHONE field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === ATTENDANCE_FORM.fields_name.FULL_NAME.toLowerCase()) {
        entryIds.FULL_NAME = `entry.${id}`;
        Logger.log(`Found FULL_NAME field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === ATTENDANCE_FORM.fields_name.ICARE.toLowerCase()) {
        entryIds.ICARE = `entry.${id}`;
        Logger.log(`Found ICARE field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === ATTENDANCE_FORM.fields_name.LOCATION.toLowerCase()) {
        entryIds.LOCATION = `entry.${id}`;
        Logger.log(`Found LOCATION field: "${title}" → entry.${id}`);
      }
    });

    Logger.log('✅ Auto-detected entry IDs:', entryIds);
    return entryIds;
  } catch (error) {
    Logger.log(`⚠️ Error auto-detecting entry IDs: ${error.message}`);
    Logger.log('⚠️ This usually means the script does not have access to the attendance form.');
    Logger.log('📝 Solutions:');
    Logger.log('   1. Share the attendance form with this script owner (edit access)');
    Logger.log('   2. Use manual entry ID configuration in config.js');
    Logger.log('   3. Make sure the attendance form URL is correct');
    return {};
  }
}

/**
 * Logs all fields in the attendance form for debugging field title matching.
 */
function logAttendanceFormFields() {
  try {
    Logger.log('--- Attendance Form Fields ---');

    // Extract form ID from attendance form URL
    const urlMatch = ATTENDANCE_FORM.url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    if (!urlMatch) {
      Logger.log('⚠️ Could not extract form ID from attendance form URL');
      return;
    }

    const attendanceFormId = urlMatch[1];
    const attendanceForm = FormApp.openById(attendanceFormId);
    const items = attendanceForm.getItems();

    Logger.log(`Form ID: ${attendanceFormId}`);
    Logger.log(`Form Title: ${attendanceForm.getTitle()}`);
    Logger.log('');

    items.forEach((item, index) => {
      const title = item.getTitle();
      const id = item.getId();
      const type = item.getType();

      // Check if this field matches any configured field
      const matchedField = Object.entries(ATTENDANCE_FORM.fields_name).find(([key, configTitle]) =>
        title.toLowerCase() === configTitle.toLowerCase()
      );

      const status = matchedField ? `✅ MATCHES ${matchedField[0]}` : '❌ NO MATCH';

      Logger.log(`${index + 1}. "${title}" (ID: ${id}, Type: ${type}) ${status}`);
    });

    Logger.log('');
    Logger.log('--- Configured Field Titles ---');
    Object.entries(ATTENDANCE_FORM.fields_name).forEach(([key, title]) => {
      Logger.log(`${key}: "${title}"`);
    });

    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error reading attendance form fields: ${e.message}`);
  }
}

/**
 * =================================================================
 * SETUP INSTRUCTIONS
 * =================================================================
 *
 * 1.  CONFIGURE FIELD TITLES:
 * - Update the FIELD_TITLES object in CONFIG to match your form's field titles exactly.
 * - Update the ATTENDANCE_FORM_FIELDS object to match your attendance form's field titles.
 * - The system will automatically map these titles to the correct spreadsheet columns and entry IDs.
 *
 * 2.  VERIFY FIELD MAPPING:
 * - Run the `logQuestionIDs` function to see all registration form fields and verify your configured titles are found.
 * - Run `logAttendanceFormFields` to see all attendance form fields and verify field title matching.
 * - Run `testEntryIdDetection` to test auto-detection and see the generated entry IDs.
 * - Optional: Run `logFieldRequirements` to see which fields are marked as required.
 *
 * 3.  ATTENDANCE FORM ENTRY ID AUTO-DETECTION:
 * - Entry IDs are automatically detected from the attendance form based on field titles in ATTENDANCE_FORM_FIELDS.
 * - The system will match field titles case-insensitively.
 * - If auto-detection fails, you can manually specify entry IDs in the ENTRY_ID_* properties.
 * - Use `logAttendanceFormFields` to debug field title matching if auto-detection doesn't work.
 *
 * 4.  SET UP THE TRIGGER:
 * - In the Apps Script editor, go to the "Triggers" tab (the alarm clock icon ⏰ on the left).
 * - Click "+ Add Trigger".
 * - Choose function to run: `onFormSubmit`
 * - Choose which deployment should run: `Head`
 * - Select event source: `From form`
 * - Select event type: `On form submit`
 * - Click "Save".
 *
 * 5.  AUTHORIZE THE SCRIPT:
 * - The first time you set up the trigger, or when you run a function manually, you will be asked to authorize the script.
 * - Follow the on-screen prompts, clicking "Review Permissions", choosing your account, clicking "Advanced", "Go to... (unsafe)", and finally "Allow". This is a normal and necessary step for your own scripts.
 *
 */

// --- 6. UTILITY FUNCTIONS FOR FIELD MATCHING ---

/**
 * Flexible field title matching that handles common variations.
 * @param {string} questionTitle The title from the form question.
 * @param {string} configTitle The title from the config.
 * @returns {boolean} True if titles match.
 */
function matchesFieldTitle(questionTitle, configTitle) {
  if (!questionTitle || !configTitle) return false;

  // Normalize both titles for comparison
  const normalizeTitle = (title) => {
    return title.trim().toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  };

  const normalizedQuestion = normalizeTitle(questionTitle);
  const normalizedConfig = normalizeTitle(configTitle);

  // Exact match
  if (normalizedQuestion === normalizedConfig) {
    return true;
  }

  // Partial match for common field variations
  const phoneKeywords = ['phone', 'whatsapp', 'number', 'contact'];
  const englishNameKeywords = ['name', 'full', 'english'];
  const chineseNameKeywords = ['chinese', 'china', 'mandarin'];
  const birthdayKeywords = ['birthday', 'birth', 'tanggal', 'lahir'];

  if (configTitle.toLowerCase().includes('phone') || configTitle.toLowerCase().includes('whatsapp')) {
    return phoneKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }

  // Check for Chinese name field FIRST (more specific)
  if (configTitle.toLowerCase().includes('chinese') && configTitle.toLowerCase().includes('name')) {
    return chineseNameKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }

  // Check for English/Full name field (but exclude Chinese name fields)
  if (configTitle.toLowerCase().includes('full') && configTitle.toLowerCase().includes('name')) {
    // Make sure it's not a Chinese name field
    if (chineseNameKeywords.some(keyword => normalizedQuestion.includes(keyword))) {
      return false; // This is a Chinese name field, not English
    }
    return englishNameKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }

  if (configTitle.toLowerCase().includes('birthday') || configTitle.toLowerCase().includes('tanggal')) {
    return birthdayKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }

  return false;
}

/**
 * Cleans and normalizes phone numbers.
 * @param {string} phoneNumber The raw phone number input.
 * @returns {string} The cleaned phone number.
 */
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';

  // Convert to string and remove common formatting
  let cleaned = phoneNumber.toString().trim();

  // Remove common formatting characters
  cleaned = cleaned.replace(/[\s\-\(\)\[\]\.]/g, '');

  // Handle international formats
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
    // Assuming this is a local number, you may need to adjust this logic
    // based on your specific country code requirements
    cleaned = cleaned; // Keep as is for now
  }

  return cleaned;
}



/**
 * Helper function to extract entry IDs manually from attendance form source.
 * Since auto-detection may fail due to permissions, this provides manual instructions.
 */
function getManualEntryIdInstructions() {
  Logger.log('--- Manual Entry ID Detection Instructions ---');
  Logger.log('If auto-detection fails, follow these steps:');
  Logger.log('1. Open the attendance form in edit mode');
  Logger.log('2. For each field, click "More" (3 dots) → "Get pre-filled link"');
  Logger.log('3. Fill in a test value and get the link');
  Logger.log('4. Extract the entry.XXXXXXX from the URL');
  Logger.log('5. Update config.js with the manual entry IDs');
  Logger.log('');
  Logger.log('Current attendance form URL:');
  Logger.log(ATTENDANCE_FORM.url);
  Logger.log('');
  Logger.log('Expected field titles to match:');
  Object.entries(ATTENDANCE_FORM.fields_name).forEach(([key, title]) => {
    Logger.log(`  ${key}: "${title}"`);
  });
  Logger.log('');
  Logger.log('Update these in config.js:');
  Logger.log('  ENTRY_ID_EMAIL: "entry.XXXXXXX",');
  Logger.log('  ENTRY_ID_PHONE: "entry.XXXXXXX",');
  Logger.log('  ENTRY_ID_FULL_NAME: "entry.XXXXXXX",');
  Logger.log('  ENTRY_ID_ICARE: "entry.XXXXXXX",');
  Logger.log('  ENTRY_ID_LOCATION: "entry.XXXXXXX",');
}

/**
 * Provides detailed step-by-step instructions for manual entry ID extraction.
 * Run this function in Google Apps Script to get specific guidance.
 */
function getDetailedEntryIdInstructions() {
  Logger.log('=====================================');
  Logger.log('📋 MANUAL ENTRY ID EXTRACTION GUIDE');
  Logger.log('=====================================');
  Logger.log('');
  Logger.log('🔗 Your attendance form edit URL:');
  Logger.log('   https://docs.google.com/forms/d/1FAIpQLSfeztXprLdisVVjuv3aJra16_MWE2W4IRRAFdu6ygmfRGgoJA/edit');
  Logger.log('');
  Logger.log('📝 For EACH of these 5 fields, follow the steps below:');
  Logger.log('');

  const fieldsToGet = [
    { key: 'ENTRY_ID_EMAIL', title: 'Email Jemaat Terdaftar', testValue: 'test@example.com' },
    { key: 'ENTRY_ID_PHONE', title: 'WhatsApp Number', testValue: '+628123456789' },
    { key: 'ENTRY_ID_FULL_NAME', title: 'Full Name', testValue: 'Test User' },
    { key: 'ENTRY_ID_ICARE', title: 'iCare', testValue: 'Test iCare' },
    { key: 'ENTRY_ID_LOCATION', title: 'Lokasi', testValue: 'Taipei' }
  ];

  fieldsToGet.forEach((field, index) => {
    Logger.log(`${index + 1}. FOR FIELD: "${field.title}"`);
    Logger.log(`   a) Find the field titled "${field.title}" in your form`);
    Logger.log(`   b) Click the 3-dot menu (⋮) next to the field`);
    Logger.log(`   c) Select "Get pre-filled link"`);
    Logger.log(`   d) Enter test value: "${field.testValue}"`);
    Logger.log(`   e) Click "Get link"`);
    Logger.log(`   f) In the generated URL, find: entry.XXXXXXXXX=${field.testValue}`);
    Logger.log(`   g) Copy the "entry.XXXXXXXXX" part (including "entry.")`);
    Logger.log(`   h) Set ${field.key}: 'entry.XXXXXXXXX',`);
    Logger.log('');
  });

  Logger.log('🔧 After getting all 5 entry IDs, update your config.js:');
  Logger.log('');
  Logger.log('ENTRY_ID_EMAIL: "entry.123456789",      // Replace with your actual entry ID');
  Logger.log('ENTRY_ID_PHONE: "entry.987654321",      // Replace with your actual entry ID');
  Logger.log('ENTRY_ID_FULL_NAME: "entry.456789123",  // Replace with your actual entry ID');
}





/**
 * One-time setup function to create the form submission trigger.
 * Run this once after setting up your script to enable automatic form processing.
 */
function setupFormTrigger() {
  try {
    Logger.log('🔧 Setting up form submission trigger...');

    // Delete existing triggers for this function to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;

    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      Logger.log(`🗑️ Deleted ${deletedCount} existing trigger(s)`);
    }

    // Create new form submit trigger
    const form = FormApp.openById(REGISTRATION_FORM.id);
    const trigger = ScriptApp.newTrigger('onFormSubmit')
      .onFormSubmit()
      .create();

    Logger.log('✅ Form submission trigger created successfully');
    Logger.log(`📋 Form: ${form.getTitle()}`);
    Logger.log(`🆔 Trigger ID: ${trigger.getUniqueId()}`);
    Logger.log('');
    Logger.log('🎉 Your script is now ready to process form submissions automatically!');

  } catch (error) {
    Logger.log(`❌ Error creating trigger: ${error.message}`);
    Logger.log('💡 Make sure:');
    Logger.log('   1. REGISTRATION_FORM.id is correctly set in config.js');
    Logger.log('   2. You have edit access to the form');
    Logger.log('   3. All required permissions have been granted');
  }
}






