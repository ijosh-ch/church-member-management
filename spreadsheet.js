/**
 * Adds two new columns (E-F) for weekly attendance tracking
 */
function addWeeklyAttendanceColumns() {
  Logger.log('Adding new weekly attendance columns...');

  const spreadsheet = SPREADSHEET.id ?
    SpreadsheetApp.openById(SPREADSHEET.id) :
    SpreadsheetApp.getActiveSpreadsheet();

  SPREADSHEET.sheets.ABSEN.forEach((sheetName) => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Sheet '${sheetName}' not found. Skipping...`);
      return;
    }

    // Insert 2 blank columns at position E
    sheet.insertColumnsAfter(4, 2);

    // Copy content from G-H to E-F
    const maxRows = sheet.getMaxRows();
    const sourceG = sheet.getRange(1, 7, maxRows, 1);
    const sourceH = sheet.getRange(1, 8, maxRows, 1);
    const targetE = sheet.getRange(1, 5, maxRows, 1);
    const targetF = sheet.getRange(1, 6, maxRows, 1);

    sourceG.copyTo(targetE, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
    sourceH.copyTo(targetF, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

    // Merge cell E6:F6
    sheet.getRange('E5:F5').merge();

    // Auto-resize columns
    sheet.autoResizeColumns(5, 6);

    // Copy columns G:H and paste only values to convert formulas to values
    Logger.log(`🔄 Converting formulas to values in columns G:H for '${sheetName}'...`);
    const totalRows = sheet.getMaxRows();
    const rangeGH = sheet.getRange(1, 7, totalRows, 2); // Columns G:H
    
    // Copy the range and paste only values back to itself
    rangeGH.copyTo(rangeGH, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false);
    Logger.log(`✅ Converted formulas to values in columns G:H`);

    
    Logger.log(`Weekly columns added to ${sheetName}`);
  });

  Logger.log('✅ Weekly attendance columns added successfully.');
}
