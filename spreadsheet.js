/**
 * Adds two new columns (E-F) for weekly attendance tracking
 * 1. Inserts 2 blank columns at positions E-F, which automatically shifts existing columns right
 * 2. Copies content from G-H (previous week's data) back to the new E-F columns
 */
function addWeeklyAttendanceColumns() {
  try {
    Logger.log('🔧 Adding new weekly attendance columns...');
    
    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    // Process both attendance sheets
    const attendanceSheets = SPREADSHEET.sheets.ABSEN; // ['Absen - Taipei', 'Absen - Zhongli']
    
    attendanceSheets.forEach((sheetName) => {
      Logger.log(`📊 Processing sheet: ${sheetName}`);
      
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log(`⚠️ Could not find sheet '${sheetName}'. Skipping...`);
        return;
      }
      
      try {
        // Step 1: Insert 2 blank columns at position E (column 5)
        // This automatically shifts existing E-F to G-H, G-H to I-J, etc.
        Logger.log(`➕ Inserting 2 new blank columns at position E in '${sheetName}'...`);
        sheet.insertColumnsAfter(4, 2); // Insert 2 columns after column D (position 4)
        
        // Step 2: Copy content from G-H back to E-F
        // After insertion, the previous E-F data is now in G-H
        const lastRow = sheet.getLastRow();
        if (lastRow > 0) {
          Logger.log(`📋 Copying content from G-H to E-F in '${sheetName}'...`);
          
          // Get data from columns G and H (positions 7 and 8)
          const dataG = sheet.getRange(1, 7, lastRow, 1).getValues();
          const dataH = sheet.getRange(1, 8, lastRow, 1).getValues();
          
          // Copy to the new columns E and F (positions 5 and 6)
          sheet.getRange(1, 5, lastRow, 1).setValues(dataG);
          sheet.getRange(1, 6, lastRow, 1).setValues(dataH);
          
          Logger.log(`✅ Copied content from G-H to E-F`);
        }
        
        Logger.log(`✅ Successfully added weekly columns to '${sheetName}'`);
        
      } catch (sheetError) {
        Logger.log(`❌ Error processing sheet '${sheetName}': ${sheetError.message}`);
      }
    });
    
    Logger.log('🎉 Weekly attendance columns added successfully!');
    Logger.log('💡 Columns E-F now contain previous week\'s data as starting point');
    
  } catch (error) {
    Logger.log(`❌ Error in addWeeklyAttendanceColumns: ${error.message}`);
  }
}
