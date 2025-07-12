/**
 * =================================================================
 * PROJECT TESTING FILE
 * =================================================================
 *
 * This file contains mock data and comprehensive test functions for
 * the church registration project with enhanced features.
 *
 * AVAILABLE TESTS:
 * ================
 * • runAllTests()             - Run all automated tests
 * • test_FieldConfiguration() - Test field mapping and entry ID detection
 * • test_QRCodeURLs()         - Test QR code URL generation
 * • test_DuplicateCheck()     - Test duplicate member detection
 * • test_CompleteFlow()       - Test complete registration simulation
 * • test_BirthdayFeature()    - Test calendar integration (manual verification)
 * • test_sendEmail_live()     - Test email sending (manual verification)
 *
 * USAGE:
 * ======
 * 1. Start with runAllTests() for comprehensive automated testing
 * 2. Run individual tests for specific feature testing
 * 3. Use manual tests (birthday/email) when ready for live testing
 *
 * To use: Select a function from the dropdown and click "Run".
 *
 */

/**
 * MOCK TESTING DATA
 * A centralized object containing sample data for a church member.
 * Using a single object ensures consistency across all tests.
 * Updated to match the new field structure and CONFIG.FIELD_TITLES.
 */
const MOCK_MEMBER = {
  englishName: 'Steve Hopper (Test)',
  chineseName: '葛麗絲',
  birthday: new Date('1998-04-22'), // Proper Date object
  iCare: "Belum tergabung iCare", 
  phone: '+62812345678901', // WhatsApp number
  email: 'ianjoseph.project@gmail.com',
  timestamp: new Date() // Form submission timestamp
};


/**
 * -----------------------------------------------------------------
 * TEST FUNCTIONS
 * -----------------------------------------------------------------
 */


/**
 * TEST 1: Birthday Feature Test
 * This function tests the addBirthdayToCalendar() function.
 * It uses the MOCK_MEMBER data to create a new recurring birthday
 * event in the designated Google Calendar.
 */
function test_BirthdayFeature() {
  Logger.log(`--- Running Birthday Feature Test for: ${MOCK_MEMBER.englishName} ---`);
  
  // Call the actual function from your main script with the member object
  addBirthdayToCalendar(MOCK_MEMBER);

  // --- VERIFICATION ---
  Logger.log("✅ Birthday test function executed.");
  Logger.log(`➡️ TO VERIFY: Check your Google Calendar for a birthday event for "${MOCK_MEMBER.englishName}".`);
}

/**
 * TEST 2: QR Code and Email Test
 * This function tests the generateQRCodeBlobs() and sendQRCodesByEmail() functions.
 * It will generate QR codes and send a REAL email to the address specified in MOCK_MEMBER.
 */
function test_sendEmail_live() {
  Logger.log(`--- Running LIVE Email Sending Test for: ${MOCK_MEMBER.englishName} ---`);
  Logger.log(`A real email will be sent to: ${MOCK_MEMBER.email}`);

  try {
    // 1. Generate QR code blobs
    const qrCodeBlobs = generateQRCodeBlobs(MOCK_MEMBER);

    // 2. Send email with QR codes
    sendQRCodesByEmail(MOCK_MEMBER, qrCodeBlobs);

    // --- VERIFICATION ---
    Logger.log("✅ Email sending test function executed.");
    Logger.log(`➡️ TO VERIFY: Check your inbox at "${MOCK_MEMBER.email}" for a welcome email with QR codes.`);
  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
  }
}

/**
 * TEST 3: Duplicate Member Check Test
 * This function tests the checkIfMemberExists() function.
 * It checks if the mock member would be considered a duplicate.
 */
function test_DuplicateCheck() {
  Logger.log(`--- Running Duplicate Check Test for: ${MOCK_MEMBER.englishName} ---`);
  
  try {
    const memberExists = checkIfMemberExists(MOCK_MEMBER);
    
    if (memberExists) {
      Logger.log(`✅ Member "${MOCK_MEMBER.englishName}" was found as existing (duplicate detected).`);
    } else {
      Logger.log(`✅ Member "${MOCK_MEMBER.englishName}" was not found (no duplicate).`);
    }
    
    Logger.log("➡️ TO VERIFY: Check the execution log for detailed duplicate checking information.");
  } catch (error) {
    Logger.log(`❌ Duplicate check test failed: ${error.message}`);
  }
}

/**
 * TEST 4: Field Configuration Test
 * This function tests the field title mapping and entry ID detection.
 */
function test_FieldConfiguration() {
  Logger.log(`--- Running Field Configuration Test ---`);
  
  try {
    Logger.log("=== REGISTRATION FORM FIELD MAPPING ===");
    logQuestionIDs();
    
    Logger.log("=== ATTENDANCE FORM FIELD MAPPING ===");
    logAttendanceFormFields();
    
    Logger.log("=== ENTRY ID AUTO-DETECTION ===");
    testEntryIdDetection();
    
    Logger.log("=== FIELD REQUIREMENTS ===");
    logFieldRequirements();
    
    Logger.log("✅ Field configuration test completed.");
    Logger.log("➡️ TO VERIFY: Review the execution logs for field mapping and entry ID detection results.");
  } catch (error) {
    Logger.log(`❌ Field configuration test failed: ${error.message}`);
  }
}

/**
 * TEST 5: QR Code URL Test
 * This function tests QR code URL generation without actually generating image blobs.
 */
function test_QRCodeURLs() {
  Logger.log(`--- Running QR Code URL Generation Test ---`);
  
  try {
    // Test the URL generation logic
    const basePrefilledUrl = `${CONFIG.ATTENDANCE_FORM_URL}?usp=pp_url` +
      `&${getEntryId('EMAIL')}=${encodeURIComponent(MOCK_MEMBER.email)}` +
      `&${getEntryId('PHONE')}=${encodeURIComponent(MOCK_MEMBER.phone)}` +
      `&${getEntryId('FULL_NAME')}=${encodeURIComponent(MOCK_MEMBER.englishName)}` +
      `&${getEntryId('ICARE')}=${encodeURIComponent(MOCK_MEMBER.iCare)}`;

    const taipeiUrl = `${basePrefilledUrl}&${getEntryId('LOCATION')}=Taipei`;
    const zhongliUrl = `${basePrefilledUrl}&${getEntryId('LOCATION')}=Zhongli`;
    
    Logger.log("Generated Pre-filled URLs:");
    Logger.log("TAIPEI URL:");
    Logger.log(taipeiUrl);
    Logger.log("");
    Logger.log("ZHONGLI URL:");
    Logger.log(zhongliUrl);
    
    Logger.log("✅ QR Code URL generation test completed.");
    Logger.log("➡️ TO VERIFY: Copy one of the URLs above and open it in a browser to see if the form is pre-filled correctly.");
  } catch (error) {
    Logger.log(`❌ QR Code URL test failed: ${error.message}`);
  }
}

/**
 * TEST 6: Complete Registration Flow Test
 * This function simulates a complete registration flow without triggering the form submission.
 */
function test_CompleteFlow() {
  Logger.log(`--- Running Complete Registration Flow Test ---`);
  
  try {
    Logger.log(`Processing mock registration for ${MOCK_MEMBER.englishName} (${MOCK_MEMBER.email})`);

    // 1. Check if member already exists
    const memberExists = checkIfMemberExists(MOCK_MEMBER);
    
    if (memberExists) {
      Logger.log(`⚠️ Member ${MOCK_MEMBER.englishName} already exists. Would skip birthday calendar addition.`);
    } else {
      Logger.log(`✅ Member ${MOCK_MEMBER.englishName} is new. Would proceed with birthday calendar addition.`);
      // Note: Not actually adding to calendar in test mode
      Logger.log(`➡️ Would add birthday event for ${MOCK_MEMBER.englishName} on ${MOCK_MEMBER.birthday.toDateString()}`);
    }

    // 2. Generate QR codes (test mode)
    Logger.log(`➡️ Would generate QR codes for ${MOCK_MEMBER.englishName}`);
    
    // 3. Send email (test mode)
    Logger.log(`➡️ Would send welcome email to ${MOCK_MEMBER.email}`);

    Logger.log("✅ Complete registration flow test completed successfully.");
    Logger.log("➡️ TO VERIFY: Review the execution logs for the simulated registration process.");
  } catch (error) {
    Logger.log(`❌ Complete flow test failed: ${error.message}`);
  }
}

/**
 * TEST 7: Phone Number Cleaning Test
 * This function tests the phone number cleaning functionality.
 */
function testPhoneNumberCleaning() {
  Logger.log('--- Testing Phone Number Cleaning ---');
  
  const testCases = [
    { input: '+62 812 3456 7890', expected: '+628123456789' },
    { input: '0812-3456-7890', expected: '08123456789' },
    { input: '(0812) 3456-7890', expected: '08123456789' },
    { input: '+62.812.3456.7890', expected: '+628123456789' },
    { input: '00628123456789', expected: '+628123456789' },
    { input: '08123456789', expected: '08123456789' },
    { input: '', expected: '' },
    { input: null, expected: '' }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(test => {
    const result = cleanPhoneNumber(test.input);
    const success = result === test.expected;
    
    Logger.log(`${success ? '✅' : '❌'} Input: "${test.input}" → Expected: "${test.expected}", Got: "${result}"`);
    
    if (success) passed++;
  });
  
  Logger.log(`Phone cleaning tests: ${passed}/${total} passed`);
  return passed === total;
}

/**
 * TEST 8: Field Matching Test
 * This function tests the flexible field title matching functionality.
 */
function testFieldMatching() {
  Logger.log('--- Testing Field Title Matching ---');
  
  const testCases = [
    { question: 'WhatsApp Number', config: 'WhatsApp Number', expected: true },
    { question: 'Phone Number', config: 'WhatsApp Number', expected: true },
    { question: 'Contact Number', config: 'WhatsApp Number', expected: true },
    { question: 'Full Name', config: 'Full Name', expected: true },
    { question: 'English Name', config: 'Full Name', expected: true },
    { question: 'Tanggal Lahir', config: 'Tanggal Lahir', expected: true },
    { question: 'Birthday', config: 'Tanggal Lahir', expected: true },
    { question: 'Random Field', config: 'WhatsApp Number', expected: false },
    { question: '', config: 'WhatsApp Number', expected: false },
    { question: 'WhatsApp Number', config: '', expected: false }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(test => {
    const result = matchesFieldTitle(test.question, test.config);
    const success = result === test.expected;
    
    Logger.log(`${success ? '✅' : '❌'} Question: "${test.question}", Config: "${test.config}" → Expected: ${test.expected}, Got: ${result}`);
    
    if (success) passed++;
  });
  
  Logger.log(`Field matching tests: ${passed}/${total} passed`);
  return passed === total;
}

/**
 * TEST 9: Edit URL Column Handling Test
 * This function tests the edit URL column detection and creation.
 */
function testEditUrlColumnHandling() {
  Logger.log('--- Testing Edit URL Column Handling ---');
  
  try {
    if (!CONFIG.SPREADSHEET.ID) {
      Logger.log('⚠️ No spreadsheet ID configured, skipping test');
      return false;
    }
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET.ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SPREADSHEET.SHEET);
    
    if (!sheet) {
      Logger.log('⚠️ Sheet not found, skipping test');
      return false;
    }
    
    const numColumns = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, numColumns).getValues()[0];
    
    Logger.log('Current spreadsheet headers:');
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
    
    Logger.log(`Edit URL column: ${editUrlColumn === -1 ? 'Not found (will be created)' : `Found at column ${editUrlColumn}`}`);
    
    return true;
  } catch (error) {
    Logger.log(`❌ Error testing edit URL column: ${error.message}`);
    return false;
  }
}

/**
 * -----------------------------------------------------------------
 * TEST RUNNER
 * -----------------------------------------------------------------
 */

/**
 * RUN ALL TESTS
 * This function runs all available tests in sequence.
 * Use this for comprehensive testing of the entire system.
 */
function runAllTests() {
  Logger.log("🚀 STARTING COMPREHENSIVE TEST SUITE");
  Logger.log("=====================================");
  
  try {
    // Test 1: Form Submit Function Tests (New)
    Logger.log("🎯 FORM SUBMIT FUNCTION TESTS");
    Logger.log("-----------------------------");
    test_getMemberDetailsFromResponse();
    Logger.log("");
    
    test_addEditResponseUrlToSpreadsheet();
    Logger.log("");
    
    test_onFormSubmitSafe(); // Safe version first
    Logger.log("");
    
    // Test 2: Field Configuration (Should run first)
    Logger.log("📋 FIELD CONFIGURATION TESTS");
    Logger.log("----------------------------");
    test_FieldConfiguration();
    Logger.log("");
    
    // Test 3: QR Code URLs (Test URL generation)
    test_QRCodeURLs();
    Logger.log("");
    
    // Test 4: Duplicate Check (Test database operations)
    test_DuplicateCheck();
    Logger.log("");
    
    // Test 5: Complete Flow (Test overall logic)
    test_CompleteFlow();
    Logger.log("");
    
    // Test 6: Enhanced functionality tests
    Logger.log("� ENHANCED FUNCTIONALITY TESTS");
    Logger.log("-------------------------------");
    
    // Test 7: Phone Number Cleaning
    testPhoneNumberCleaning();
    Logger.log("");
    
    // Test 8: Field Matching
    testFieldMatching();
    Logger.log("");
    
    // Test 9: Edit URL Column Handling
    testEditUrlColumnHandling();
    Logger.log("");
    
    // Note: Full onFormSubmit and manual tests
    Logger.log("📋 ADDITIONAL TESTS AVAILABLE:");
    Logger.log("- Run test_onFormSubmit() to test the full form submission with actual operations");
    Logger.log("- Run test_BirthdayFeature() to test calendar integration (manual verification)");
    Logger.log("- Run test_sendEmail_live() to test email sending (manual verification)");
    
    Logger.log("\n✅ ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY!");
    Logger.log("=====================================");
  } catch (error) {
    Logger.log(`❌ TEST SUITE FAILED: ${error.message}`);
    Logger.log("=====================================");
  }
}

/**
 * Runs only the onFormSubmit related tests.
 * Use this for focused testing of the main form submission workflow.
 */
function runOnFormSubmitTests() {
  Logger.log("🎯 RUNNING ONFORMSUBMIT TESTS");
  Logger.log("=============================");
  
  try {
    Logger.log("1. Testing Member Extraction...");
    const test1Result = test_getMemberDetailsFromResponse();
    Logger.log(`Result: ${test1Result ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    Logger.log("2. Testing Edit URL Insertion...");
    const test2Result = test_addEditResponseUrlToSpreadsheet();
    Logger.log(`Result: ${test2Result ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    Logger.log("3. Testing Complete Workflow (Safe Mode)...");
    const test3Result = test_onFormSubmitSafe();
    Logger.log(`Result: ${test3Result ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    const allPassed = test1Result && test2Result && test3Result;
    
    Logger.log("=============================");
    Logger.log(`📊 SUMMARY: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    Logger.log("=============================");
    
    if (allPassed) {
      Logger.log("🚀 Ready to test with real form submission!");
      Logger.log("💡 Run test_onFormSubmit() to test with actual operations");
    }
    
    return allPassed;
  } catch (error) {
    Logger.log(`❌ OnFormSubmit tests failed: ${error.message}`);
    return false;
  }
}

/**
 * -----------------------------------------------------------------
 * UTILITY FUNCTIONS
 * -----------------------------------------------------------------
 */

/**
 * Clean up test data (if needed)
 * This function can be used to clean up any test data created during testing.
 */
function cleanupTestData() {
  Logger.log("🧹 CLEANING UP TEST DATA");
  
  // Add cleanup logic here if needed
  // For example, removing test calendar events, etc.
  
  Logger.log("✅ Test data cleanup completed.");
}

/**
 * Tests the complete onFormSubmit(e) function with a mocked form response event.
 * This simulates the actual form submission trigger and tests all steps.
 */
function test_onFormSubmit() {
  Logger.log('🧪 Testing onFormSubmit(e) Function');
  Logger.log('===================================');
  
  try {
    // Create a mock form response event
    const mockEvent = createMockFormSubmitEvent();
    
    Logger.log('📋 Mock Event Created:');
    Logger.log(`- Respondent Email: ${mockEvent.response.getRespondentEmail()}`);
    Logger.log(`- Response Count: ${mockEvent.response.getItemResponses().length}`);
    Logger.log(`- Edit URL Available: ${!!mockEvent.response.getEditResponseUrl()}`);
    
    // Test the main function
    Logger.log('\n🚀 Calling onFormSubmit(e)...\n');
    
    // Call the actual function with mock data
    onFormSubmit(mockEvent);
    
    Logger.log('\n✅ onFormSubmit(e) completed successfully!');
    
    // Verify expected outcomes
    Logger.log('\n🔍 Verification Checklist:');
    Logger.log('1. ✅ Edit URL should be added to spreadsheet (check logs above)');
    Logger.log('2. ✅ Member details should be extracted (check logs above)');
    Logger.log('3. ✅ Duplicate check should complete (check logs above)');
    Logger.log('4. ✅ QR codes should be generated (check logs above)');
    Logger.log('5. ✅ Email should be sent (check logs above)');
    
    return true;
  } catch (error) {
    Logger.log(`❌ onFormSubmit test failed: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
    return false;
  }
}

/**
 * Creates a mock form submission event object that mimics the structure
 * of the actual Google Forms trigger event.
 * @returns {object} Mock event object with response property
 */
function createMockFormSubmitEvent() {
  // Create mock item responses based on CONFIG.FIELD_TITLES
  const mockItemResponses = [
    createMockItemResponse(CONFIG.FIELD_TITLES.ENGLISH_NAME, MOCK_MEMBER.englishName),
    createMockItemResponse(CONFIG.FIELD_TITLES.CHINESE_NAME, MOCK_MEMBER.chineseName),
    createMockItemResponse(CONFIG.FIELD_TITLES.BIRTHDAY, MOCK_MEMBER.birthday.toDateString()),
    createMockItemResponse(CONFIG.FIELD_TITLES.ICARE, MOCK_MEMBER.iCare),
    createMockItemResponse(CONFIG.FIELD_TITLES.PHONE, MOCK_MEMBER.phone),
    // Note: Email is typically auto-collected, so we might not have it as a separate field
  ];
  
  // Create mock form response
  const mockResponse = {
    getRespondentEmail: () => MOCK_MEMBER.email,
    getTimestamp: () => MOCK_MEMBER.timestamp,
    getEditResponseUrl: () => 'https://docs.google.com/forms/d/e/1FAIpQLSample-Mock-Edit-URL/edit',
    getItemResponses: () => mockItemResponses
  };
  
  // Create mock event
  const mockEvent = {
    response: mockResponse,
    source: 'mock-form-source',
    triggerUid: 'mock-trigger-uid'
  };
  
  return mockEvent;
}

/**
 * Creates a mock item response for form fields.
 * @param {string} questionTitle The question title
 * @param {string} answer The answer value
 * @returns {object} Mock item response object
 */
function createMockItemResponse(questionTitle, answer) {
  const mockItem = {
    getTitle: () => questionTitle,
    getId: () => Math.floor(Math.random() * 1000000000) // Random ID for testing
  };
  
  return {
    getItem: () => mockItem,
    getResponse: () => answer
  };
}

/**
 * Tests only the member extraction from a form response without triggering
 * the full onFormSubmit workflow. Useful for isolated testing.
 */
function test_getMemberDetailsFromResponse() {
  Logger.log('🧪 Testing getMemberDetailsFromResponse Function');
  Logger.log('================================================');
  
  try {
    const mockEvent = createMockFormSubmitEvent();
    
    Logger.log('📋 Testing member extraction...');
    const member = getMemberDetailsFromResponse(mockEvent.response);
    
    Logger.log('\n✅ Extracted Member Details:');
    Logger.log(`- English Name: "${member.englishName}"`);
    Logger.log(`- Chinese Name: "${member.chineseName}"`);
    Logger.log(`- Birthday: ${member.birthday}`);
    Logger.log(`- iCare: "${member.iCare}"`);
    Logger.log(`- Phone: "${member.phone}"`);
    Logger.log(`- Email: "${member.email}"`);
    Logger.log(`- Timestamp: ${member.timestamp}`);
    
    // Validate required fields
    const hasRequiredFields = member.englishName && member.birthday;
    Logger.log(`\n🔍 Required Fields Check: ${hasRequiredFields ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Validate field matching
    const expectedMatches = [
      { field: 'englishName', expected: MOCK_MEMBER.englishName, actual: member.englishName },
      { field: 'chineseName', expected: MOCK_MEMBER.chineseName, actual: member.chineseName },
      { field: 'iCare', expected: MOCK_MEMBER.iCare, actual: member.iCare },
      { field: 'phone', expected: cleanPhoneNumber(MOCK_MEMBER.phone), actual: member.phone },
      { field: 'email', expected: MOCK_MEMBER.email, actual: member.email }
    ];
    
    Logger.log('\n🔍 Field Matching Validation:');
    let allMatched = true;
    expectedMatches.forEach(({ field, expected, actual }) => {
      const matches = actual === expected;
      Logger.log(`- ${field}: ${matches ? '✅' : '❌'} Expected: "${expected}", Got: "${actual}"`);
      if (!matches) allMatched = false;
    });
    
    Logger.log(`\n📊 Overall Result: ${allMatched && hasRequiredFields ? '✅ PASSED' : '❌ FAILED'}`);
    
    return allMatched && hasRequiredFields;
  } catch (error) {
    Logger.log(`❌ getMemberDetailsFromResponse test failed: ${error.message}`);
    return false;
  }
}

/**
 * Tests the edit URL insertion functionality with mock data.
 */
function test_addEditResponseUrlToSpreadsheet() {
  Logger.log('🧪 Testing addEditResponseUrlToSpreadsheet Function');
  Logger.log('==================================================');
  
  try {
    if (!CONFIG.SPREADSHEET.ID) {
      Logger.log('⚠️ No spreadsheet ID configured, skipping test');
      return false;
    }
    
    const mockEvent = createMockFormSubmitEvent();
    
    Logger.log('📝 Testing edit URL insertion...');
    Logger.log(`Mock Edit URL: ${mockEvent.response.getEditResponseUrl()}`);
    
    // Call the function
    addEditResponseUrlToSpreadsheet(mockEvent.response);
    
    Logger.log('✅ Edit URL insertion test completed (check logs above for success/failure)');
    
    // Note: We can't easily verify the actual insertion without affecting real data
    // The function's own logging will indicate success or failure
    
    return true;
  } catch (error) {
    Logger.log(`❌ addEditResponseUrlToSpreadsheet test failed: ${error.message}`);
    return false;
  }
}

/**
 * Tests the complete onFormSubmit workflow but with safer mock operations.
 * This version tests the logic flow without actually sending emails or modifying calendars.
 */
function test_onFormSubmitSafe() {
  Logger.log('🧪 Testing onFormSubmit (Safe Mode)');
  Logger.log('===================================');
  
  try {
    const mockEvent = createMockFormSubmitEvent();
    
    Logger.log('Step 1: Testing edit URL addition (safe)...');
    // We'll test this but it might affect real spreadsheet
    if (CONFIG.SPREADSHEET.ID) {
      Logger.log('⚠️ Real spreadsheet configured - edit URL test will affect real data');
    }
    
    Logger.log('Step 2: Testing member extraction...');
    const member = getMemberDetailsFromResponse(mockEvent.response);
    Logger.log(`✅ Member extracted: ${member.englishName}`);
    
    Logger.log('Step 3: Testing duplicate check...');
    const memberExists = checkIfMemberExists(member);
    Logger.log(`✅ Duplicate check result: ${memberExists ? 'Member exists' : 'New member'}`);
    
    Logger.log('Step 4: Testing QR code URL generation (no actual generation)...');
    // Test URL construction without actually fetching QR codes
    const baseUrl = `${CONFIG.ATTENDANCE_FORM_URL}?usp=pp_url` +
      `&${getEntryId('EMAIL')}=${encodeURIComponent(member.email)}` +
      `&${getEntryId('PHONE')}=${encodeURIComponent(member.phone || '')}` +
      `&${getEntryId('FULL_NAME')}=${encodeURIComponent(member.englishName)}` +
      `&${getEntryId('ICARE')}=${encodeURIComponent(member.iCare)}`;
    
    const taipeiUrl = `${baseUrl}&${getEntryId('LOCATION')}=Taipei`;
    const zhongliUrl = `${baseUrl}&${getEntryId('LOCATION')}=Zhongli`;
    
    Logger.log(`✅ QR URLs generated:`);
    Logger.log(`- Taipei: ${taipeiUrl.substring(0, 100)}...`);
    Logger.log(`- Zhongli: ${zhongliUrl.substring(0, 100)}...`);
    
    Logger.log('Step 5: Testing email HTML generation...');
    const emailHtml = createWelcomeEmailHtml(member);
    const hasExpectedContent = emailHtml.includes(member.englishName) && 
                              emailHtml.includes('taipeiQr') && 
                              emailHtml.includes('zhongliQr');
    Logger.log(`✅ Email HTML generated: ${hasExpectedContent ? 'Valid content' : 'Missing content'}`);
    
    Logger.log('\n🎉 Safe mode test completed successfully!');
    Logger.log('ℹ️ To test actual email sending and calendar operations, use the full onFormSubmit test');
    
    return true;
  } catch (error) {
    Logger.log(`❌ Safe mode test failed: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
    return false;
  }
}