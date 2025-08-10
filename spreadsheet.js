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
        
        // Step 2: Merge cells E6:F6
        Logger.log(`🔗 Merging cells E6:F6 in '${sheetName}'...`);
        try {
          // First check if the range is already merged
          const mergeRange = sheet.getRange(6, 5, 1, 2); // Row 6, Column E-F (5-6), 1 row, 2 columns
          
          // Unmerge first in case it's already merged
          try {
            sheet.getRange('E6:F6').breakApart();
          } catch (e) {
            // Range might not be merged, continue
          }
          
          // Now merge the range
          mergeRange.mergeAcross();
          Logger.log(`✅ Successfully merged cells E6:F6`);
        } catch (mergeError) {
          Logger.log(`⚠️ Could not merge E6:F6: ${mergeError.message}`);
        }
        
        // Step 3: Copy content from G-H to E-F (including formulas)
        // After insertion, the previous E-F data is now in G-H
        Logger.log(`📋 Copying content from G-H to E-F in '${sheetName}' (including formulas)...`);
        
        const maxRows = sheet.getMaxRows(); // Use maxRows for a full column copy
        Logger.log(`📊 Copying full columns (up to ${maxRows} rows) to ensure all formulas are included.`);

        // Get source ranges from columns G and H
        const sourceG = sheet.getRange(1, 7, maxRows, 1);
        const sourceH = sheet.getRange(1, 8, maxRows, 1);

        // Get target ranges in columns E and F
        const targetE = sheet.getRange(1, 5, maxRows, 1);
        const targetF = sheet.getRange(1, 6, maxRows, 1);

        // Copy formulas, formatting, and values
        sourceG.copyTo(targetE, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
        sourceH.copyTo(targetF, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
        
        Logger.log(`✅ Copied formulas and formatting from G-H to E-F`);
        
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
