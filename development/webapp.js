/**
 * @fileoverview
 * Google Apps Script Web App for Church Member Management Platform
 * Provides a custom HTML interface for member registration and password recovery
 */

/**
 * Handles GET requests to serve the main HTML page
 * @param {GoogleAppsScript.Events.DoGet} e - The event object
 * @returns {GoogleAppsScript.HTML.HtmlOutput} The HTML page
 */
function doGet(e) {
  // Get the page parameter, default to 'main'
  const page = e.parameter.page || 'main';
  
  try {
    let htmlOutput;
    
    switch (page) {
      case 'main':
        htmlOutput = HtmlService.createHtmlOutputFromFile('index');
        break;
      case 'qr':
      case 'forgot-qr-code':
        htmlOutput = HtmlService.createHtmlOutputFromFile('forgot-qr-code');
        break;
      default:
        htmlOutput = HtmlService.createHtmlOutputFromFile('index');
    }
    
    return htmlOutput
      .setTitle('Church Member Management')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log(`Error in doGet: ${error.message}`);
    return HtmlService.createHtmlOutput(`
      <html>
        <body>
          <h2>Error</h2>
          <p>Sorry, there was an error loading the page. Please try again later.</p>
        </body>
      </html>
    `);
  }
}

/**
 * Searches for a member by email or phone and sends edit URL
 * @param {string} searchValue - Email or phone number to search for
 * @returns {Object} Result object with success status and message
 */
function sendEditUrlToMember(searchValue) {
  try {
    Logger.log(`Searching for member with: ${searchValue}`);
    
    if (!searchValue || searchValue.trim() === '') {
      return {
        success: false,
        message: 'Please enter an email address or phone number.'
      };
    }
    
    // Clean the search value
    const cleanedValue = searchValue.trim().toLowerCase();
    
    // Get the spreadsheet
    let spreadsheet;
    if (CONFIG.SPREADSHEET.ID) {
      spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
    if (!sheet) {
      Logger.log(`Sheet '${CONFIG.SPREADSHEET.SHEET}' not found`);
      return {
        success: false,
        message: 'Database error. Please contact the administrator.'
      };
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find email and phone columns
    const emailColumnIndex = getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.EMAIL);
    const phoneColumnIndex = getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.PHONE);
    
    // Find edit URL column
    let editUrlColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().includes('edit')) {
        editUrlColumnIndex = i;
        break;
      }
    }
    
    if (editUrlColumnIndex === -1) {
      return {
        success: false,
        message: 'Edit URLs are not available. Please contact the administrator.'
      };
    }
    
    // Search for the member
    let foundMember = null;
    let memberEmail = '';
    let editUrl = '';
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Check email match
      if (emailColumnIndex !== -1) {
        const rowEmail = row[emailColumnIndex] ? row[emailColumnIndex].toString().trim().toLowerCase() : '';
        if (rowEmail === cleanedValue) {
          foundMember = row;
          memberEmail = rowEmail;
          editUrl = row[editUrlColumnIndex] || '';
          break;
        }
      }
      
      // Check phone match
      if (phoneColumnIndex !== -1) {
        const rowPhone = row[phoneColumnIndex] ? row[phoneColumnIndex].toString().trim() : '';
        const cleanedRowPhone = cleanPhoneNumber(rowPhone);
        const cleanedSearchPhone = cleanPhoneNumber(searchValue);
        
        if (cleanedRowPhone && cleanedSearchPhone && cleanedRowPhone === cleanedSearchPhone) {
          foundMember = row;
          // Use email from the row for sending
          memberEmail = emailColumnIndex !== -1 ? (row[emailColumnIndex] || '').toString().trim() : '';
          editUrl = row[editUrlColumnIndex] || '';
          break;
        }
      }
    }
    
    if (!foundMember) {
      return {
        success: false,
        message: 'No member found with that email or phone number. Please check your information and try again.'
      };
    }
    
    if (!editUrl) {
      return {
        success: false,
        message: 'Edit URL not available for this member. Please contact the administrator.'
      };
    }
    
    if (!memberEmail) {
      return {
        success: false,
        message: 'Email address not found for this member. Please contact the administrator.'
      };
    }
    
    // Send the edit URL via email
    const emailSent = sendEditUrlEmail(memberEmail, editUrl, foundMember);
    
    if (emailSent.success) {
      Logger.log(`Edit URL sent successfully to ${memberEmail}`);
      return {
        success: true,
        message: `Edit link has been sent to ${memberEmail}. Please check your email (including spam folder).`
      };
    } else {
      return {
        success: false,
        message: `Failed to send email: ${emailSent.message}`
      };
    }
    
  } catch (error) {
    Logger.log(`Error in sendEditUrlToMember: ${error.message}`);
    return {
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    };
  }
}

/**
 * Enhanced function to send QR codes to a member based on their email or phone number
 * This function reuses the existing QR code generation logic from main.js
 * @param {string} searchValue - Email or phone number to search for
 * @returns {object} Result object with success status and message
 */
function sendQRCodesToMember(searchValue) {
  try {
    Logger.log(`🔍 Searching for member with: ${searchValue}`);
    
    if (!searchValue || searchValue.trim() === '') {
      return {
        success: false,
        message: 'Please enter an email address or WhatsApp number.'
      };
    }
    
    // Find the member using enhanced search function
    const member = findMemberByEmailOrPhone(searchValue);
    
    if (!member) {
      Logger.log(`❌ Member not found for: ${searchValue}`);
      
      // Check if the search value is an email to provide registration option
      const isEmail = searchValue.includes('@');
      
      if (isEmail) {
        const registrationUrl = getRegistrationFormUrl();
        return {
          success: false,
          message: `❌ Email "${searchValue}" is not found in our member database.
          
🆕 Would you like to register as a new member?

📝 Click the link below to register:
${registrationUrl}

After completing registration, you'll receive your QR codes automatically via email.`,
          showRegistration: true,
          registrationUrl: registrationUrl,
          email: searchValue
        };
      } else {
        return {
          success: false,
          message: 'Member not found. Please check your email or WhatsApp number and try again.'
        };
      }
    }
    
    Logger.log(`✅ Found member: ${member.englishName} (${member.email})`);
    
    // Generate QR codes using the existing function from main.js
    const qrCodeBlobs = generateQRCodeBlobs(member);
    
    if (!qrCodeBlobs || !qrCodeBlobs.taipei || !qrCodeBlobs.zhongli) {
      Logger.log(`❌ Failed to generate QR codes for: ${member.englishName}`);
      return {
        success: false,
        message: 'Failed to generate QR codes. Please try again later.'
      };
    }
    
    // Send email with QR codes using the existing function from main.js
    sendQRCodesByEmail(member, qrCodeBlobs);
    
    Logger.log(`✅ QR codes sent successfully to: ${member.email}`);
    
    return {
      success: true,
      message: `✅ QR codes sent successfully to ${member.email}! 
                
📧 Email includes:
• Taipei QR code with "${CONFIG.QR_CODE_SETTINGS?.TAIPEI_TEXT || 'IFGF TPE'}" text overlay
• Zhongli QR code with "${CONFIG.QR_CODE_SETTINGS?.ZHONGLI_TEXT || 'IFGF ZL'}" text overlay  
• Instructions for attendance scanning

Please check your email inbox (including spam folder).`
    };
    
  } catch (error) {
    Logger.log(`❌ Error in sendQRCodesToMember: ${error.message}`);
    return {
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    };
  }
}

/**
 * Enhanced function to find a member by email or phone number and return complete member data
 * @param {string} searchValue - Email or phone number to search for
 * @returns {object|null} Complete member object with edit URL, or null if not found
 */
function findMemberByEmailOrPhone(searchValue) {
  try {
    Logger.log(`🔍 Searching for member with: ${searchValue}`);
    
    if (!searchValue || searchValue.trim() === '') {
      Logger.log('⚠️ Empty search value provided');
      return null;
    }
    
    // Get the spreadsheet
    let spreadsheet;
    if (CONFIG.SPREADSHEET.ID) {
      spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
    if (!sheet) {
      Logger.log(`⚠️ Could not find '${CONFIG.SPREADSHEET.SHEET}' sheet.`);
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log('⚠️ No data found in spreadsheet');
      return null;
    }
    
    const headers = data[0];
    
    // Find column indices for all member fields
    const columnIndices = {
      editUrl: 0, // Edit URL is typically in Column A (index 0)
      email: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.EMAIL),
      phone: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.PHONE),
      englishName: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.ENGLISH_NAME),
      chineseName: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.CHINESE_NAME),
      birthday: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.BIRTHDAY),
      icare: getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.ICARE)
    };
    
    // Try to find edit URL column by header name
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (header && header.toString().toLowerCase().includes('edit')) {
        columnIndices.editUrl = i;
        break;
      }
    }
    
    const isEmail = searchValue.includes('@');
    const cleanedSearchValue = isEmail ? 
      searchValue.toLowerCase().trim() : 
      cleanPhoneNumber(searchValue);
    
    Logger.log(`Searching for ${isEmail ? 'email' : 'phone'}: ${cleanedSearchValue}`);
    Logger.log(`Column indices:`, columnIndices);
    
    // Search through all data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let memberFound = false;
      
      // Check email match
      if (isEmail && columnIndices.email !== -1) {
        const rowEmail = row[columnIndices.email] ? 
          row[columnIndices.email].toString().toLowerCase().trim() : '';
        if (rowEmail === cleanedSearchValue) {
          memberFound = true;
        }
      }
      
      // Check phone match
      if (!isEmail && columnIndices.phone !== -1) {
        const rowPhone = row[columnIndices.phone] ? 
          row[columnIndices.phone].toString().trim() : '';
        const cleanedRowPhone = cleanPhoneNumber(rowPhone);
        if (cleanedRowPhone === cleanedSearchValue) {
          memberFound = true;
        }
      }
      
      if (memberFound) {
        // Build complete member object with edit URL
        const member = {
          editUrl: row[columnIndices.editUrl] || '',
          englishName: columnIndices.englishName !== -1 ? 
            (row[columnIndices.englishName] || '').toString().trim() : '',
          chineseName: columnIndices.chineseName !== -1 ? 
            (row[columnIndices.chineseName] || '').toString().trim() : '',
          email: columnIndices.email !== -1 ? 
            (row[columnIndices.email] || '').toString().trim() : '',
          phone: columnIndices.phone !== -1 ? 
            cleanPhoneNumber(row[columnIndices.phone] || '') : '',
          birthday: columnIndices.birthday !== -1 && row[columnIndices.birthday] ? 
            new Date(row[columnIndices.birthday]) : null,
          iCare: columnIndices.icare !== -1 ? 
            (row[columnIndices.icare] || '').toString().trim() : '',
          timestamp: new Date(),
          rowIndex: i + 1, // 1-based row index for reference
          spreadsheetData: row // Raw row data for additional processing if needed
        };
        
        Logger.log(`✅ Found member: ${member.englishName} (${member.email})`);
        Logger.log(`Edit URL: ${member.editUrl}`);
        return member;
      }
    }
    
    Logger.log(`❌ No member found for: ${searchValue}`);
    return null;
    
  } catch (error) {
    Logger.log(`⚠️ Error searching for member: ${error.message}`);
    return null;
  }
}

/**
 * Helper function to build member object from spreadsheet row (legacy support)
 * @param {array} row - Spreadsheet row data
 * @param {object} columnIndices - Object containing column indices
 * @returns {object} Member object (without edit URL for backward compatibility)
 */
function buildMemberObject(row, columnIndices) {
  const member = {
    englishName: columnIndices.nameColumnIndex !== -1 ? 
      (row[columnIndices.nameColumnIndex] || '').toString().trim() : '',
    chineseName: columnIndices.chineseNameColumnIndex !== -1 ? 
      (row[columnIndices.chineseNameColumnIndex] || '').toString().trim() : '',
    email: columnIndices.emailColumnIndex !== -1 ? 
      (row[columnIndices.emailColumnIndex] || '').toString().trim() : '',
    phone: columnIndices.phoneColumnIndex !== -1 ? 
      cleanPhoneNumber(row[columnIndices.phoneColumnIndex] || '') : '',
    birthday: columnIndices.birthdayColumnIndex !== -1 && row[columnIndices.birthdayColumnIndex] ? 
      new Date(row[columnIndices.birthdayColumnIndex]) : new Date(),
    iCare: columnIndices.icareColumnIndex !== -1 ? 
      (row[columnIndices.icareColumnIndex] || '').toString().trim() : '',
    timestamp: new Date()
  };
  
  Logger.log(`Built member object: ${member.englishName} (${member.email})`);
  return member;
}

/**
 * Enhanced function to get the edit URL for a member based on their email
 * @param {string} email - Email address to search for
 * @returns {Object} Result object with success status, message, and editUrl
 */
function getMemberEditUrl(email) {
  try {
    Logger.log(`🔍 Getting edit URL for: ${email}`);
    
    if (!email || email.trim() === '') {
      return {
        success: false,
        message: 'Please enter an email address.'
      };
    }
    
    // Clean and validate email
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail.includes('@')) {
      return {
        success: false,
        message: 'Please enter a valid email address.'
      };
    }
    
    // Use the enhanced member search function
    const member = findMemberByEmailOrPhone(cleanedEmail);
    
    if (!member) {
      Logger.log(`❌ No member found with email: ${email}`);
      return {
        success: false,
        message: `No member found with email address: ${email}. Please check your email and try again.`,
        showRegistration: true,
        registrationUrl: getRegistrationFormUrl()
      };
    }
    
    if (!member.editUrl || member.editUrl.trim() === '') {
      Logger.log(`⚠️ Member found but no edit URL: ${member.englishName}`);
      return {
        success: false,
        message: 'Edit URL not available for this member. Please contact the administrator.'
      };
    }
    
    Logger.log(`✅ Edit URL found for ${member.englishName}: ${member.editUrl}`);
    
    return {
      success: true,
      message: `Edit link found for ${member.englishName || 'member'}! Opening your form...`,
      editUrl: member.editUrl,
      memberName: member.englishName || '',
      memberData: member // Include full member data for additional processing if needed
    };
    
  } catch (error) {
    Logger.log(`❌ Error in getMemberEditUrl: ${error.message}`);
    return {
      success: false,
      message: 'An error occurred while searching for your information. Please try again later.'
    };
  }
}

/**
 * Sends an email with the edit URL to the member
 * @param {string} email - Member's email address
 * @param {string} editUrl - The edit URL for the form response
 * @param {Array} memberRow - The member's data row from spreadsheet
 * @returns {Object} Result object with success status and message
 */
function sendEditUrlEmail(email, editUrl, memberRow) {
  try {
    // Get member name for personalization
    const nameColumnIndex = getColumnIndexForFieldTitle(CONFIG.FIELD_TITLES.ENGLISH_NAME);
    const memberName = nameColumnIndex !== -1 && memberRow[nameColumnIndex] ? 
      memberRow[nameColumnIndex].toString().trim() : 'Member';
    
    const subject = 'Your Church Member Profile - Edit Link';
    
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Church Member Profile Access</h2>
          <p>Dear ${memberName},</p>
          
          <p>You requested access to edit your church member profile. Click the link below to update your information:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${editUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Edit My Profile
            </a>
          </div>
          
          <p><strong>Note:</strong> This link will allow you to update your registration information. Please keep it secure and do not share it with others.</p>
          
          <p>If you did not request this link, please ignore this email.</p>
          
          <hr style="margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            If the button above doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${editUrl}">${editUrl}</a>
          </p>
          
          <p style="font-size: 0.9em; color: #666;">
            Best regards,<br>
            Church Management Team
          </p>
        </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    return {
      success: true,
      message: 'Email sent successfully'
    };
    
  } catch (error) {
    Logger.log(`Error sending edit URL email: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Gets the registration form URL from CONFIG
 * @returns {string} The registration form URL
 */
function getRegistrationFormUrl() {
  try {
    // Construct the form URL from the form ID
    return `https://docs.google.com/forms/d/${CONFIG.REGISTRATION_FORM_ID}/viewform`;
  } catch (error) {
    Logger.log(`Error getting registration form URL: ${error.message}`);
    return '';
  }
}

/**
 * Test function to verify the enhanced web app functionality
 */
function testEnhancedWebAppFunctions() {
  Logger.log('=== Testing Enhanced Web App Functions ===');
  
  try {
    // Test 1: QR Code Settings Verification
    Logger.log('1. Testing QR Code Settings:');
    Logger.log(`   USE_ADVANCED_QR: ${CONFIG.QR_CODE_SETTINGS?.USE_ADVANCED_QR}`);
    Logger.log(`   SIZE: ${CONFIG.QR_CODE_SETTINGS?.SIZE}`);
    Logger.log(`   TAIPEI_TEXT: ${CONFIG.QR_CODE_SETTINGS?.TAIPEI_TEXT}`);
    Logger.log(`   ZHONGLI_TEXT: ${CONFIG.QR_CODE_SETTINGS?.ZHONGLI_TEXT}`);
    
    // Test 2: Registration form URL
    Logger.log('2. Testing Registration Form URL:');
    const formUrl = getRegistrationFormUrl();
    Logger.log(`   Registration URL: ${formUrl}`);
    
    // Test 3: Enhanced member search (use a test email)
    Logger.log('3. Testing Enhanced Member Search:');
    Logger.log('   Note: Replace "test@example.com" with actual member email for real testing');
    
    // Test 4: Edit URL function
    Logger.log('4. Testing Edit URL Function:');
    const editUrlResult = getMemberEditUrl('test@example.com');
    Logger.log(`   Test result:`, editUrlResult);
    
    // Test 5: QR code function availability
    Logger.log('5. Testing QR Code Function Availability:');
    
    const requiredFunctions = [
      'generateQRCodeBlobs',
      'sendQRCodesByEmail', 
      'cleanPhoneNumber',
      'getColumnIndexForFieldTitle',
      'generateQRCodeWithText'
    ];
    
    requiredFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          Logger.log(`   ✅ ${funcName} function is available`);
        } else {
          Logger.log(`   ❌ ${funcName} is NOT a function`);
        }
      } catch (error) {
        Logger.log(`   ❌ ${funcName} function is NOT available: ${error.message}`);
      }
    });
    
    // Test 6: Spreadsheet access
    Logger.log('6. Testing Spreadsheet Access:');
    if (CONFIG.SPREADSHEET.ID) {
      try {
        const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
        const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
        if (sheet) {
          const lastRow = sheet.getLastRow();
          const lastCol = sheet.getLastColumn();
          Logger.log(`   ✅ Spreadsheet accessible: ${lastRow} rows, ${lastCol} columns`);
          
          // Check for edit URL column
          const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
          let editUrlCol = -1;
          for (let i = 0; i < headers.length; i++) {
            if (headers[i] && headers[i].toString().toLowerCase().includes('edit')) {
              editUrlCol = i + 1;
              break;
            }
          }
          Logger.log(`   Edit URL column: ${editUrlCol === -1 ? 'Not found (using Column A)' : `Column ${editUrlCol}`}`);
        } else {
          Logger.log(`   ❌ Sheet '${CONFIG.SPREADSHEET.SHEET}' not found`);
        }
      } catch (error) {
        Logger.log(`   ❌ Error accessing spreadsheet: ${error.message}`);
      }
    } else {
      Logger.log('   ⚠️ No spreadsheet ID configured');
    }
    
    Logger.log('=== Test Complete ===');
    Logger.log('📝 Next Steps:');
    Logger.log('   1. Test with real member email using getMemberEditUrl(email)');
    Logger.log('   2. Deploy to Google Apps Script and test web app URLs');
    Logger.log('   3. Test QR code generation with actual member data');
    
  } catch (error) {
    Logger.log(`❌ Error during testing: ${error.message}`);
  }
}
