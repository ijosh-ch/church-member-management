/**
 * QR Code Testing Functions
 * Use these functions to test and preview QR code generation
 */

/**
 * Test function to generate and preview QR codes with text overlay
 * Run this function to test the QR code generation
 */
function testQRCodeGeneration() {
  Logger.log('🧪 Testing QR Code Generation...');
  
  // Test member data
  const testMember = {
    englishName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+886912345678',
    iCare: 'Young Adults'
  };
  
  try {
    // Generate QR codes
    const qrBlobs = generateQRCodeBlobs(testMember);
    
    if (qrBlobs.taipei && qrBlobs.zhongli) {
      Logger.log('✅ Successfully generated QR codes!');
      Logger.log(`   Taipei QR: ${qrBlobs.taipei.getName()}`);
      Logger.log(`   Zhongli QR: ${qrBlobs.zhongli.getName()}`);
      
      // Optional: Save to Drive for inspection
      const folder = DriveApp.createFolder(`QR_Test_${new Date().getTime()}`);
      folder.createFile(qrBlobs.taipei);
      folder.createFile(qrBlobs.zhongli);
      
      Logger.log(`📁 Test QR codes saved to Drive folder: ${folder.getName()}`);
      Logger.log(`🔗 Folder URL: ${folder.getUrl()}`);
      
      return true;
    } else {
      Logger.log('❌ Failed to generate one or both QR codes');
      return false;
    }
  } catch (error) {
    Logger.log(`❌ Error during QR code testing: ${error.message}`);
    return false;
  }
}

/**
 * Test different QR code methods to compare results
 */
function compareQRCodeMethods() {
  Logger.log('🔬 Comparing QR Code Generation Methods...');
  
  const testData = 'https://forms.google.com/test';
  const testName = 'TestUser';
  
  // Test Method 1: Advanced QR (with text overlay)
  Logger.log('Testing Method 1: Advanced QR with text overlay...');
  const advancedQR = generateQRCodeWithTextOverlay(testData, 'IFGF TPE', testName, 'Taipei');
  
  // Test Method 2: Enhanced Standard QR
  Logger.log('Testing Method 2: Enhanced standard QR...');
  const enhancedQR = generateQRCodeWithText(testData, 'IFGF TPE', testName, 'Taipei');
  
  // Test Method 3: Basic QR
  Logger.log('Testing Method 3: Basic QR...');
  const basicQR = generateBasicQRCode(testData, testName, 'Taipei');
  
  // Save all versions for comparison
  const folder = DriveApp.createFolder(`QR_Comparison_${new Date().getTime()}`);
  
  if (advancedQR) {
    folder.createFile(advancedQR);
    Logger.log('✅ Advanced QR generated');
  } else {
    Logger.log('❌ Advanced QR failed');
  }
  
  if (enhancedQR) {
    folder.createFile(enhancedQR);
    Logger.log('✅ Enhanced QR generated');
  } else {
    Logger.log('❌ Enhanced QR failed');
  }
  
  if (basicQR) {
    folder.createFile(basicQR);
    Logger.log('✅ Basic QR generated');
  } else {
    Logger.log('❌ Basic QR failed');
  }
  
  Logger.log(`📁 Comparison QR codes saved to: ${folder.getUrl()}`);
}

/**
 * Test QR code configuration settings
 */
function testQRCodeSettings() {
  Logger.log('⚙️ Testing QR Code Configuration...');
  
  // Display current settings
  if (CONFIG.QR_CODE_SETTINGS) {
    Logger.log('Current QR Code Settings:');
    Logger.log(`- Advanced QR: ${CONFIG.QR_CODE_SETTINGS.USE_ADVANCED_QR}`);
    Logger.log(`- Size: ${CONFIG.QR_CODE_SETTINGS.SIZE}`);
    Logger.log(`- Error Correction: ${CONFIG.QR_CODE_SETTINGS.ERROR_CORRECTION}`);
    Logger.log(`- Taipei Text: ${CONFIG.QR_CODE_SETTINGS.TAIPEI_TEXT}`);
    Logger.log(`- Zhongli Text: ${CONFIG.QR_CODE_SETTINGS.ZHONGLI_TEXT}`);
    Logger.log(`- Background: #${CONFIG.QR_CODE_SETTINGS.BACKGROUND_COLOR}`);
    Logger.log(`- Foreground: #${CONFIG.QR_CODE_SETTINGS.FOREGROUND_COLOR}`);
  } else {
    Logger.log('❌ QR Code settings not found in CONFIG');
  }
  
  // Test with current settings
  return testQRCodeGeneration();
}

/**
 * Generate sample QR codes for both locations with custom text
 */
function generateSampleQRCodes() {
  Logger.log('🎨 Generating Sample QR Codes...');
  
  const sampleUrl = CONFIG.ATTENDANCE_FORM_URL || 'https://forms.google.com/sample';
  
  // Generate samples for both locations
  const taipeiQR = generateQRCodeWithText(sampleUrl, 'IFGF TPE', 'Sample', 'Taipei');
  const zhongliQR = generateQRCodeWithText(sampleUrl, 'IFGF ZL', 'Sample', 'Zhongli');
  
  if (taipeiQR && zhongliQR) {
    // Save to a specific folder for easy access
    const folder = DriveApp.createFolder(`Sample_QR_Codes_${new Date().toISOString().split('T')[0]}`);
    folder.createFile(taipeiQR);
    folder.createFile(zhongliQR);
    
    Logger.log('✅ Sample QR codes generated successfully!');
    Logger.log(`📁 View samples at: ${folder.getUrl()}`);
    
    return folder.getUrl();
  } else {
    Logger.log('❌ Failed to generate sample QR codes');
    return null;
  }
}
