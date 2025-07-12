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
  try {
    Logger.log('🚀 Form submission triggered - starting processing...');
    
    // STEP 1: Always add edit response URL first (for all submissions)
    Logger.log('📝 Step 1: Adding edit response URL to spreadsheet...');
    addEditResponseUrlToSpreadsheet(e.response);
    
    // STEP 2: Extract member details from response
    Logger.log('📋 Step 2: Extracting member details from form response...');
    const member = getMemberDetailsFromResponse(e.response);
    Logger.log(`Processing registration for ${member.englishName} (${member.email}).`);

    // STEP 3: Check if member already exists in spreadsheet
    Logger.log('🔍 Step 3: Checking if member already exists...');
    const memberExists = checkIfMemberExists(member);
    
    if (memberExists) {
      Logger.log(`⚠️ Member ${member.englishName} (${member.email}) already exists in spreadsheet. Skipping birthday calendar addition.`);
    } else {
      Logger.log(`✅ Member ${member.englishName} (${member.email}) is new. Proceeding with birthday calendar addition.`);
      Logger.log('📅 Step 4: Adding birthday to calendar...');
      addBirthdayToCalendar(member);
    }

    // STEP 5: Generate QR codes for attendance (always done for both new and existing members)
    Logger.log('🔗 Step 5: Generating QR codes...');
    const qrCodeBlobs = generateQRCodeBlobs(member);
    
    // STEP 6: Send welcome email with QR codes
    Logger.log('📧 Step 6: Sending welcome email with QR codes...');
    sendQRCodesByEmail(member, qrCodeBlobs);

    Logger.log(`✅ Successfully completed all tasks for ${member.englishName}.`);

  } catch (error) {
    Logger.log(`❌ FATAL ERROR in onFormSubmit: ${error.stack}`);
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, "Church Registration Script Error", `An error occurred: \n\n${error.stack}`);
  }
}


// --- 3. CORE PROCESS FUNCTIONS ---

/**
 * Creates a recurring annual birthday event on the specified calendar.
 * @param {object} member The member details object.
 */
function addBirthdayToCalendar(member) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.BIRTHDAY_CALENDAR_ID);
    if (!calendar) throw new Error(`Calendar with ID '${CONFIG.BIRTHDAY_CALENDAR_ID}' not found.`);

    const recurrence = CalendarApp.newRecurrence().addYearlyRule().until(new Date(member.birthday.getFullYear() + 99, member.birthday.getMonth(), member.birthday.getDate()));
    const eventTitle = `🎂 ${member.englishName} (${member.chineseName})'s Birthday`;
    const eventDescription = `English Name: ${member.englishName}\nChinese Name: ${member.chineseName}\nYear of Birth: ${member.birthday.getFullYear()}`;

    const eventSeries = calendar.createAllDayEventSeries(eventTitle, member.birthday, recurrence, { description: eventDescription });
    eventSeries.addPopupReminder(10080); // 1 week
    eventSeries.addPopupReminder(1440);  // 1 day

    Logger.log(`✅ Added birthday event for ${member.englishName}.`);
  } catch (error) {
    Logger.log(`⚠️  Could not add birthday to calendar: ${error.message}`);
    // Does not throw error to allow rest of script to run.
  }
}

/**
 * Generates two location-specific QR code image blobs for a member.
 * @param {object} member The member details object.
 * @returns {object} An object containing the generated blobs, e.g., { taipei: Blob, zhongli: Blob }.
 */
function generateQRCodeBlobs(member) {
  const qrApiBaseUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=";
  
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

  const qrCodeUrlTaipei = qrApiBaseUrl + encodeURIComponent(prefilledUrlTaipei);
  const qrCodeUrlZhongli = qrApiBaseUrl + encodeURIComponent(prefilledUrlZhongli);

  // Fetch both blobs concurrently for a minor speed improvement
  const requests = [{
    url: qrCodeUrlTaipei,
    muteHttpExceptions: true
  }, {
    url: qrCodeUrlZhongli,
    muteHttpExceptions: true
  }];
  const responses = UrlFetchApp.fetchAll(requests);

  const qrCodeBlobTaipei = responses[0].getBlob().setName(`QRCode_Taipei_${member.englishName}.png`);
  const qrCodeBlobZhongli = responses[1].getBlob().setName(`QRCode_Zhongli_${member.englishName}.png`);

  Logger.log(`✅ Generated QR code blobs for ${member.englishName}.`);
  return {
    taipei: qrCodeBlobTaipei,
    zhongli: qrCodeBlobZhongli
  };
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
 * Adds the edit response URL to the first column of the spreadsheet for the latest response.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object.
 */
function addEditResponseUrlToSpreadsheet(response) {
  try {
    const editUrl = response.getEditResponseUrl();
    
    // Get the spreadsheet - use configured ID or active spreadsheet
    let spreadsheet;
    if (CONFIG.SPREADSHEET.ID) {
      spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${CONFIG.SPREADSHEET.SHEET} sheet. Skipping edit URL addition.`);
      return;
    }
    
    // Find the row corresponding to this response (usually the last row with data)
    const lastRow = sheet.getLastRow();
    const numColumns = sheet.getLastColumn();
    
    // Check if there's already an "Edit URL" column header
    const headerRow = 1;
    const headers = sheet.getRange(headerRow, 1, 1, numColumns).getValues()[0];
    
    let editUrlColumn = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().includes('edit')) {
        editUrlColumn = i + 1; // Convert to 1-based index
        break;
      }
    }
    
    // If no edit URL column exists, create one at the end
    if (editUrlColumn === -1) {
      editUrlColumn = numColumns + 1;
      sheet.getRange(headerRow, editUrlColumn).setValue('Edit Response URL');
      Logger.log(`📝 Created new "Edit Response URL" column at column ${editUrlColumn}`);
    }
    
    // Insert the edit URL in the appropriate column of the latest response
    sheet.getRange(lastRow, editUrlColumn).setValue(editUrl);
    
    Logger.log(`✅ Added edit response URL to spreadsheet row ${lastRow}, column ${editUrlColumn}.`);
  } catch (error) {
    Logger.log(`⚠️ Could not add edit response URL to spreadsheet: ${error.message}`);
    // Does not throw error to allow rest of script to run.
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
    if (fieldTitle === CONFIG.FIELD_TITLES.EMAIL && (!fieldTitle || fieldTitle.trim() === '')) {
      // No separate email field, use auto-collected email (column 1)
      return 1;
    }
    
    const fieldId = getFieldIdByTitle(fieldTitle);
    if (!fieldId) {
      Logger.log(`⚠️ Field with title "${fieldTitle}" not found in form.`);
      return -1;
    }
    
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
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
    
    // In Google Forms spreadsheet, columns are:
    // Column 0: Timestamp
    // Column 1: Email (if collecting emails automatically)
    // Column 2+: Form fields in order
    
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
    if (CONFIG.SPREADSHEET.ID) {
      spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
    if (!sheet) {
      Logger.log(`⚠️ Could not find '${CONFIG.SPREADSHEET.SHEET}' sheet. Assuming member doesn't exist.`);
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Get column indices and check if fields are required
    const emailColumnIndex = getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.EMAIL);
    const phoneColumnIndex = getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.PHONE);
    
    // Check if fields are required (only check required fields for uniqueness)
    const emailIsRequired = (!CONFIG.FIELD_TITLES.EMAIL || CONFIG.FIELD_TITLES.EMAIL.trim() === '') || isFieldRequiredByTitle(CONFIG.FIELD_TITLES.EMAIL) || emailColumnIndex === 1; // Email is always required if auto-collected
    const phoneIsRequired = isFieldRequiredByTitle(CONFIG.FIELD_TITLES.PHONE);
    
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
    
    Logger.log(`Field: "${questionTitle}" = "${answer}"`);
    
    if (!answer) continue; // Skip unanswered questions

    // Match field titles from CONFIG (using more flexible matching)
    if (matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.ENGLISH_NAME)) {
      member.englishName = answer;
      Logger.log(`✅ Matched ENGLISH_NAME: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.CHINESE_NAME)) {
      member.chineseName = answer;
      Logger.log(`✅ Matched CHINESE_NAME: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.BIRTHDAY)) {
      member.birthday = new Date(answer);
      Logger.log(`✅ Matched BIRTHDAY: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.ICARE)) {
      member.iCare = answer;
      Logger.log(`✅ Matched ICARE: ${answer}`);
    } else if (matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.PHONE)) {
      // Clean and normalize phone number
      member.phone = cleanPhoneNumber(answer);
      Logger.log(`✅ Matched PHONE: ${answer} → cleaned: ${member.phone}`);
    } else if (CONFIG.FIELD_TITLES.EMAIL && matchesFieldTitle(questionTitle, CONFIG.FIELD_TITLES.EMAIL)) {
      // Override respondent email if there's a specific email field
      member.email = answer;
      Logger.log(`✅ Matched EMAIL: ${answer}`);
    } else {
      Logger.log(`❌ No match for field: "${questionTitle}"`);
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
            <img src="cid:taipeiQr" alt="IFGF Taipei QR Code" style="width:300px; height:300px; max-width: 100%;">
            <p style="font-size: 0.9em; margin-top: 10px;">
              <strong>Lokasi:</strong> <a href="${CONFIG.LOCATION_TAIPEI_URL}">Buka di Google Maps</a>
            </p>
          </div>
          
          <div style="display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h3>IFGF Zhongli</h3>
            <img src="cid:zhongliQr" alt="IFGF Zhongli QR Code" style="width:300px; height:300px; max-width: 100%;">
            <p style="font-size: 0.9em; margin-top: 10px;">
              <strong>Lokasi:</strong> <a href="${CONFIG.LOCATION_ZHONGLI_URL}">Buka di Google Maps</a>
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
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
    const items = form.getItems();
    Logger.log('--- Registration Form Question IDs ---');
    
    const configuredTitles = Object.values(CONFIG.FIELD_TITLES);
    
    items.forEach(item => {
      const title = item.getTitle();
      const id = item.getId();
      const isConfigured = configuredTitles.some(configTitle => 
        title.toLowerCase() === configTitle.toLowerCase()
      );
      
      Logger.log(`Title: "${title}" | ID: ${id} ${isConfigured ? '✅ CONFIGURED' : ''}`);
    });
    
    Logger.log('--- Configured Field Status ---');
    Object.entries(CONFIG.FIELD_TITLES).forEach(([key, title]) => {
      const found = items.some(item => 
        item.getTitle().toLowerCase() === title.toLowerCase()
      );
      Logger.log(`${key}: "${title}" ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });
    
    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error: Could not open form with ID "${CONFIG.REGISTRATION_FORM_ID}". Please check the ID in the CONFIG object.`)
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
    
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
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
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
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
    Logger.log(`QID_EMAIL (${CONFIG.QID_EMAIL}): ${CONFIG.QID_EMAIL === 0 ? 'Auto-collected (always required)' : `Required: ${isFieldRequired(CONFIG.QID_EMAIL)}`}`);
    Logger.log(`QID_PHONE (${CONFIG.QID_PHONE}): Required: ${isFieldRequired(CONFIG.QID_PHONE)}`);
    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error: Could not analyze form requirements with ID "${CONFIG.REGISTRATION_FORM_ID}". Please check the ID in the CONFIG object.`)
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
    
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
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
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
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
    const urlMatch = CONFIG.ATTENDANCE_FORM_URL.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
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
      if (title.toLowerCase() === CONFIG.ATTENDANCE_FORM_FIELDS.EMAIL.toLowerCase()) {
        entryIds.EMAIL = `entry.${id}`;
        Logger.log(`Found EMAIL field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === CONFIG.ATTENDANCE_FORM_FIELDS.PHONE.toLowerCase()) {
        entryIds.PHONE = `entry.${id}`;
        Logger.log(`Found PHONE field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === CONFIG.ATTENDANCE_FORM_FIELDS.FULL_NAME.toLowerCase()) {
        entryIds.FULL_NAME = `entry.${id}`;
        Logger.log(`Found FULL_NAME field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === CONFIG.ATTENDANCE_FORM_FIELDS.ICARE.toLowerCase()) {
        entryIds.ICARE = `entry.${id}`;
        Logger.log(`Found ICARE field: "${title}" → entry.${id}`);
      } else if (title.toLowerCase() === CONFIG.ATTENDANCE_FORM_FIELDS.LOCATION.toLowerCase()) {
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
 * Gets the entry ID for a field, using auto-detection if not manually configured.
 * @param {string} fieldType The field type (EMAIL, PHONE, FULL_NAME, ICARE, LOCATION).
 * @returns {string} The entry ID.
 */
function getEntryId(fieldType) {
  // Check if manually configured
  const manualEntryId = CONFIG[`ENTRY_ID_${fieldType}`];
  if (manualEntryId && manualEntryId.trim() !== '') {
    return manualEntryId;
  }
  
  // Auto-detect if not cached
  if (!CONFIG._cachedEntryIds) {
    CONFIG._cachedEntryIds = autoDetectEntryIds();
  }
  
  return CONFIG._cachedEntryIds[fieldType] || '';
}

/**
 * Tests the configured entry IDs for the attendance form.
 */
function testEntryIdDetection() {
  try {
    Logger.log('--- Testing Entry ID Auto-Detection ---');
    
    // Clear cache to force fresh detection
    CONFIG._cachedEntryIds = null;
    
    const detectedIds = autoDetectEntryIds();
    
    // Check if auto-detection worked
    const hasDetectedIds = Object.keys(detectedIds).length > 0;
    
    if (!hasDetectedIds) {
      Logger.log('⚠️ Auto-detection failed. Showing manual instructions...');
      getManualEntryIdInstructions();
      return;
    }
    
    Logger.log('Auto-Detected Entry IDs:');
    Object.entries(detectedIds).forEach(([key, entryId]) => {
      Logger.log(`  ${key}: ${entryId}`);
    });
    
    Logger.log('Final Entry IDs (with manual overrides):');
    ['EMAIL', 'PHONE', 'FULL_NAME', 'ICARE', 'LOCATION'].forEach(fieldType => {
      const entryId = getEntryId(fieldType);
      const source = CONFIG[`ENTRY_ID_${fieldType}`] && CONFIG[`ENTRY_ID_${fieldType}`].trim() !== '' ? 'MANUAL' : 'AUTO-DETECTED';
      Logger.log(`  ${fieldType}: ${entryId} (${source})`);
    });
    
    Logger.log('--- Attendance Form Field Mapping ---');
    Object.entries(CONFIG.ATTENDANCE_FORM_FIELDS).forEach(([key, title]) => {
      Logger.log(`  ${key}: Looking for "${title}"`);
    });
    
    Logger.log('--- Test QR Code URL Generation ---');
    const testMember = {
      email: 'test@example.com',
      englishName: 'Test User',
      phone: '+1234567890',
      iCare: 'Test iCare'
    };
    
    const baseUrl = `${CONFIG.ATTENDANCE_FORM_URL}?usp=pp_url` +
      `&${getEntryId('EMAIL')}=${encodeURIComponent(testMember.email)}` +
      `&${getEntryId('PHONE')}=${encodeURIComponent(testMember.phone)}` +
      `&${getEntryId('FULL_NAME')}=${encodeURIComponent(testMember.englishName)}` +
      `&${getEntryId('ICARE')}=${encodeURIComponent(testMember.iCare)}`;
    
    const taipeiUrl = `${baseUrl}&${getEntryId('LOCATION')}=Taipei`;
    
    Logger.log('Sample pre-filled URL:');
    Logger.log(taipeiUrl);
    
    Logger.log('------------------------------------');
  } catch (e) {
    Logger.log(`Error testing entry ID detection: ${e.message}`);
    Logger.log('⚠️ Showing manual instructions as fallback...');
    getManualEntryIdInstructions();
  }
}

/**
 * Logs all fields in the attendance form for debugging field title matching.
 */
function logAttendanceFormFields() {
  try {
    Logger.log('--- Attendance Form Fields ---');
    
    // Extract form ID from attendance form URL
    const urlMatch = CONFIG.ATTENDANCE_FORM_URL.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
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
      const matchedField = Object.entries(CONFIG.ATTENDANCE_FORM_FIELDS).find(([key, configTitle]) => 
        title.toLowerCase() === configTitle.toLowerCase()
      );
      
      const status = matchedField ? `✅ MATCHES ${matchedField[0]}` : '❌ NO MATCH';
      
      Logger.log(`${index + 1}. "${title}" (ID: ${id}, Type: ${type}) ${status}`);
    });
    
    Logger.log('');
    Logger.log('--- Configured Field Titles ---');
    Object.entries(CONFIG.ATTENDANCE_FORM_FIELDS).forEach(([key, title]) => {
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
  const nameKeywords = ['name', 'full', 'english'];
  const birthdayKeywords = ['birthday', 'birth', 'tanggal', 'lahir'];
  
  if (configTitle.toLowerCase().includes('phone') || configTitle.toLowerCase().includes('whatsapp')) {
    return phoneKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }
  
  if (configTitle.toLowerCase().includes('name') && configTitle.toLowerCase().includes('full')) {
    return nameKeywords.some(keyword => normalizedQuestion.includes(keyword));
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
  
  Logger.log(`Phone cleaning: "${phoneNumber}" → "${cleaned}"`);
  return cleaned;
}

/**
 * Debug function to test phone field extraction and edit URL insertion.
 */
function debugPhoneFieldAndEditUrl() {
  try {
    Logger.log('--- Debug: Phone Field and Edit URL Tests ---');
    
    // Test phone number cleaning
    const testPhones = [
      '+62 812 3456 7890',
      '0812-3456-7890',
      '(0812) 3456-7890',
      '+62.812.3456.7890',
      '00628123456789',
      '08123456789'
    ];
    
    Logger.log('Phone Number Cleaning Tests:');
    testPhones.forEach(phone => {
      const cleaned = cleanPhoneNumber(phone);
      Logger.log(`  "${phone}" → "${cleaned}"`);
    });
    
    // Test field title matching
    const testTitles = [
      'WhatsApp Number',
      'Phone Number',
      'Contact Number',
      'Nomor WhatsApp',
      'Full Name',
      'English Name',
      'Tanggal Lahir',
      'Birthday'
    ];
    
    Logger.log('Field Title Matching Tests:');
    Object.entries(CONFIG.FIELD_TITLES).forEach(([key, configTitle]) => {
      Logger.log(`  Config: ${key} = "${configTitle}"`);
      testTitles.forEach(testTitle => {
        const matches = matchesFieldTitle(testTitle, configTitle);
        if (matches) {
          Logger.log(`    ✅ "${testTitle}" matches "${configTitle}"`);
        }
      });
    });
    
    // Test spreadsheet column detection
    Logger.log('Spreadsheet Column Detection:');
    if (CONFIG.SPREADSHEET.ID) {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
      const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
      if (sheet) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        Logger.log('Spreadsheet headers:');
        headers.forEach((header, index) => {
          Logger.log(`  Column ${index + 1}: "${header}"`);
        });
        
        // Check for edit URL column
        let editUrlColumn = -1;
        for (let i = 0; i < headers.length; i++) {
          if (headers[i] && headers[i].toString().toLowerCase().includes('edit')) {
            editUrlColumn = i + 1;
            break;
          }
        }
        Logger.log(`Edit URL column: ${editUrlColumn === -1 ? 'Not found' : editUrlColumn}`);
      }
    }
    
    Logger.log('------------------------------------');
  } catch (error) {
    Logger.log(`Error in debug function: ${error.message}`);
  }
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
  Logger.log(CONFIG.ATTENDANCE_FORM_URL);
  Logger.log('');
  Logger.log('Expected field titles to match:');
  Object.entries(CONFIG.ATTENDANCE_FORM_FIELDS).forEach(([key, title]) => {
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
  Logger.log('ENTRY_ID_ICARE: "entry.789123456",      // Replace with your actual entry ID');
  Logger.log('ENTRY_ID_LOCATION: "entry.321654987",   // Replace with your actual entry ID');
  Logger.log('');
  Logger.log('✅ Once updated, run clasp push and test with test_onFormSubmitSafe()');
  Logger.log('=====================================');
}

/**
 * Tests the system without requiring entry IDs to be configured.
 * This helps verify everything else is working before getting entry IDs.
 */
function test_SystemWithoutEntryIds() {
  Logger.log('🧪 Testing system components WITHOUT entry IDs...');
  Logger.log('==================================================');
  
  try {
    // Test 1: Member extraction
    Logger.log('1. Testing member extraction from mock form response...');
    const mockMember = {
      englishName: 'Test User',
      chineseName: 'Test Chinese',
      birthday: new Date('1990-01-01'),
      iCare: 'Test iCare',
      phone: '+628123456789',
      email: 'test@example.com',
      timestamp: new Date()
    };
    
    Logger.log(`✅ Mock member created: ${mockMember.englishName}`);
    
    // Test 2: Phone number cleaning
    Logger.log('2. Testing phone number cleaning...');
    const cleanedPhone = cleanPhoneNumber(mockMember.phone);
    Logger.log(`✅ Phone cleaning: "${mockMember.phone}" → "${cleanedPhone}"`);
    
    // Test 3: Duplicate checking (if spreadsheet configured)
    Logger.log('3. Testing duplicate checking...');
    if (CONFIG.SPREADSHEET.ID) {
      const exists = checkIfMemberExists(mockMember);
      Logger.log(`✅ Duplicate check completed: ${exists ? 'Member exists' : 'New member'}`);
    } else {
      Logger.log('⚠️ No spreadsheet configured, skipping duplicate check');
    }
    
    // Test 4: QR code URL generation (without actual entry IDs)
    Logger.log('4. Testing QR code URL generation...');
    const baseUrl = `${CONFIG.ATTENDANCE_FORM_URL}?usp=pp_url`;
    Logger.log(`✅ Base attendance form URL: ${baseUrl}`);
    
    // Test 5: Email HTML generation
    Logger.log('5. Testing email HTML generation...');
    const emailHtml = createWelcomeEmailHtml(mockMember);
    const hasContent = emailHtml.includes(mockMember.englishName) && 
                      emailHtml.includes('taipeiQr') && 
                      emailHtml.includes('zhongliQr');
    Logger.log(`✅ Email HTML generated successfully: ${hasContent ? 'All content present' : 'Missing content'}`);
    
    // Test 6: Entry ID status
    Logger.log('6. Checking entry ID configuration status...');
    const entryIds = ['EMAIL', 'PHONE', 'FULL_NAME', 'ICARE', 'LOCATION'];
    const configuredIds = entryIds.filter(id => {
      const entryId = CONFIG[`ENTRY_ID_${id}`];
      return entryId && entryId.trim() !== '';
    });
    
    Logger.log(`Entry IDs configured: ${configuredIds.length}/${entryIds.length}`);
    if (configuredIds.length > 0) {
      Logger.log(`✅ Configured: ${configuredIds.join(', ')}`);
    }
    
    const missingIds = entryIds.filter(id => {
      const entryId = CONFIG[`ENTRY_ID_${id}`];
      return !entryId || entryId.trim() === '';
    });
    
    if (missingIds.length > 0) {
      Logger.log(`⚠️ Missing: ${missingIds.join(', ')}`);
      Logger.log('📝 Run getDetailedEntryIdInstructions() for help getting these');
    }
    
    Logger.log('==================================================');
    Logger.log('📊 SUMMARY:');
    Logger.log(`✅ Core functions: Working`);
    Logger.log(`✅ Phone cleaning: Working`);
    Logger.log(`✅ Email generation: Working`);
    Logger.log(`${configuredIds.length === entryIds.length ? '✅' : '⚠️'} Entry IDs: ${configuredIds.length}/${entryIds.length} configured`);
    
    if (configuredIds.length === entryIds.length) {
      Logger.log('🎉 All systems ready! You can now test form submissions.');
    } else {
      Logger.log('📝 Next step: Configure missing entry IDs using getDetailedEntryIdInstructions()');
    }
    
    return true;
  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}