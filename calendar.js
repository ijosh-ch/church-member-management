/**
 * @OnlyCurrentDoc
 *
 * =================================================================
 * BIRTHDAY CALENDAR MANAGEMENT MODULE
 * =================================================================
 *
 * Thi    //    // Step 1: Remove old birthday events
    Logger.log(`🗑️ Step 1: Removing old birthday events...`);
    
    // Try to use Birthday ID first (more efficient)
    const existingEventId = getEventIdFromSpreadsheet(member);
    if (existingEventId) {
      Logger.log(`🆔 Found existing Birthday ID: ${existingEventId}. Using direct removal.`);
      removeEventById(existingEventId);
      clearEventIdFromSpreadsheet(member);
    } else {
      Logger.log(`ℹ️ No Birthday ID found. Using name-based search removal.`);
      removeBirthdayEventsByNameAndDate(member, oldBirthday);
    }irthday ID first (more efficient)
    const existingEventId = getEventIdFromSpreadsheet(member);
    if (existingEventId) {
      Logger.log(`🆔 Found existing Birthday ID: ${existingEventId}. Using direct removal.`);
      removeEventById(existingEventId);
      clearEventIdFromSpreadsheet(member);
    } else {
      Logger.log(`ℹ️ No Birthday ID found. Using name-based search removal.`);
      removeBirthdayEventsByNameAndDate(member, oldBirthday);
    }andles all calendar-related functionality for the church
 * member registration system, including:
 * - Adding birthday events to Google Calendar
 * - Managing event IDs in spreadsheet
 * - Checking birthday event existence and consistency
 * - Updating and removing birthday events
 * - Spreadsheet integration for birthday data
 */

// =================================================================
// CORE CALENDAR FUNCTIONS
// =================================================================

/**
 * Creates a recurring annual birthday event on the specified calendar.
 * @param {object} member The member details object.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object (optional, for new submissions).
 */
function addBirthdayToCalendar(member, response = null) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR.id);
    if (!calendar) throw new Error(`Calendar with ID '${CALENDAR.id}' not found.`);

    const recurrence = CalendarApp.newRecurrence().addYearlyRule().until(new Date(member.birthday.getFullYear() + 99, member.birthday.getMonth(), member.birthday.getDate()));
    const eventTitle = `🎂 ${member.englishName} (${member.chineseName})'s Birthday`;
    const eventDescription = `English Name: ${member.englishName}\nChinese Name: ${member.chineseName}\nYear of Birth: ${member.birthday.getFullYear()}`;

    const eventSeries = calendar.createAllDayEventSeries(eventTitle, member.birthday, recurrence, { description: eventDescription });
    eventSeries.addPopupReminder(10080); // 1 week
    eventSeries.addPopupReminder(1440);  // 1 day

    // Get the event series ID
    const eventId = eventSeries.getId();
    Logger.log(`📅 Created birthday event with ID: ${eventId}`);

    // Store the event ID in the spreadsheet using member data to find the row
    updateEventIdInSpreadsheet(member, eventId, response);

    Logger.log(`✅ Added birthday event for ${member.englishName} to calendar.`);
  } catch (error) {
    Logger.log(`⚠️  Could not add birthday to calendar: ${error.message}`);
    // Does not throw error to allow rest of script to run.
  }
}

/**
 * Removes existing birthday events for a member from the calendar.
 * @param {object} member The member details object.
 * @param {Date} oldBirthday The previous birthday date to search for.
 */
function removeBirthdayFromCalendar(member, oldBirthday) {
  try {
    Logger.log(`🗑️ Removing birthday events for ${member.englishName}...`);
    return removeBirthdayEventsByNameAndDate(member, oldBirthday);
  } catch (error) {
    Logger.log(`⚠️ Could not remove birthday from calendar: ${error.message}`);
    return false;
  }
}

/**
 * Removes a calendar event by its Event ID.
 * @param {string} eventId The calendar event ID.
 * @returns {boolean} True if event was removed successfully.
 */
function removeEventById(eventId) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR.id);
    if (!calendar) throw new Error(`Calendar with ID '${CALENDAR.id}' not found.`);

    Logger.log(`🗑️ Removing calendar event with ID: ${eventId}`);

    try {
      // Try to get the event series by ID
      const eventSeries = calendar.getEventSeriesById(eventId);
      
      if (eventSeries) {
        // Delete the entire event series (all recurring events)
        Logger.log(`🗑️ Deleting entire recurring event series...`);
        eventSeries.deleteEventSeries();
        Logger.log(`✅ Successfully deleted recurring event series with ID: ${eventId}`);
        return true;
      } else {
        Logger.log(`⚠️ Event series with ID ${eventId} not found. It may have been deleted already.`);
        return false;
      }
    } catch (eventError) {
      Logger.log(`⚠️ Error accessing event with ID ${eventId}: ${eventError.message}`);
      return false;
    }
    
  } catch (error) {
    Logger.log(`⚠️ Could not remove event by ID: ${error.message}`);
    return false;
  }
}

/**
 * Removes birthday events for a member by searching for their name and specific date.
 * @param {object} member The member details object.
 * @param {Date} birthdayDate The birthday date to search for.
 * @returns {boolean} True if events were found and deleted.
 */
function removeBirthdayEventsByNameAndDate(member, birthdayDate) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR.id);
    if (!calendar) throw new Error(`Calendar with ID '${CALENDAR.id}' not found.`);

    // Search from the birthday year to a reasonable future date
    const startDate = new Date(birthdayDate.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate());
    const endDate = new Date(startDate.getFullYear() + 100, startDate.getMonth(), startDate.getDate());
    
    Logger.log(`🔍 Searching for birthday events for ${member.englishName} between ${startDate.toDateString()} and ${endDate.toDateString()}`);
    
    const events = calendar.getEvents(startDate, endDate);
    let deletedCount = 0;
    
    for (const event of events) {
      const eventTitle = event.getTitle();
      const eventDescription = event.getDescription();
      const eventDate = event.getStartTime();
      
      // Check if this event is a birthday event for this member
      if (eventTitle.includes('Birthday') && 
          (eventTitle.includes(member.englishName) || 
           (member.chineseName && eventTitle.includes(member.chineseName)) ||
           (eventDescription && eventDescription.includes(member.englishName)))) {
        
        Logger.log(`🗑️ Found matching birthday event: "${eventTitle}" on ${eventDate.toDateString()}`);
        
        // If it's a recurring event, delete the entire series
        if (event.isRecurringEvent()) {
          const eventSeries = event.getEventSeries();
          Logger.log(`🗑️ Deleting entire recurring event series for ${member.englishName}...`);
          eventSeries.deleteEventSeries(); // This deletes ALL events in the recurring series
          Logger.log(`✅ Successfully deleted ALL recurring birthday events for ${member.englishName}`);
          deletedCount++;
        } else {
          // Delete individual event
          Logger.log(`🗑️ Deleting individual birthday event for ${member.englishName}...`);
          event.deleteEvent();
          Logger.log(`✅ Deleted individual birthday event for ${member.englishName}`);
          deletedCount++;
        }
      }
    }
    
    if (deletedCount > 0) {
      Logger.log(`✅ Removed ${deletedCount} birthday event(s) for ${member.englishName}.`);
      return true;
    } else {
      Logger.log(`ℹ️ No birthday events found for ${member.englishName} on ${birthdayDate.toDateString()}.`);
      return false;
    }
    
  } catch (error) {
    Logger.log(`⚠️ Error removing birthday events: ${error.message}`);
    return false;
  }
}



// =================================================================
// BIRTHDAY EVENT VERIFICATION FUNCTIONS
// =================================================================

/**
 * Checks if a birthday event already exists for a member.
 * @param {object} member The member details object.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object (optional, for new submissions).
 * @returns {boolean} True if birthday event exists, false otherwise.
 */
function checkBirthdayExists(member, response = null) {
  try {
    Logger.log(`🔍 Checking birthday event for ${member.englishName}...`);
    
    // Get existing member data from spreadsheet (old date)
    const existingMemberData = getExistingMemberDataFromSpreadsheet(member);
    
    if (!existingMemberData || !existingMemberData.birthday) {
      Logger.log(`ℹ️ No existing birthday data found in spreadsheet. Adding new calendar event...`);
      addBirthdayToCalendar(member, response);
      return true;
    }
    
    const oldBirthday = existingMemberData.birthday;
    const newBirthday = member.birthday;
    
    if (!newBirthday) {
      Logger.log(`⚠️ No new birthday data provided. Skipping calendar update.`);
      return false;
    }
    
    // Compare birthday dates (ignore time)
    const oldDateStr = oldBirthday.toDateString();
    const newDateStr = newBirthday.toDateString();
    
    Logger.log(`📅 Comparing dates - Old: ${oldDateStr}, New: ${newDateStr}`);
    
    if (oldDateStr === newDateStr) {
      Logger.log(`✅ Birthday dates are the same. Skipping calendar update.`);
      return true;
    }
    
    Logger.log(`🔄 Birthday dates are different. Updating calendar...`);
    Logger.log(`   Old: ${oldDateStr}`);
    Logger.log(`   New: ${newDateStr}`);
    
    // Step 1: Remove old birthday events
    Logger.log(`🗑️ Step 1: Removing old birthday events...`);
    
    // Try to use Event ID first (more efficient)
    const existingEventId = getEventIdFromSpreadsheet(member);
    if (existingEventId) {
      Logger.log(`� Found existing Event ID: ${existingEventId}. Using direct removal.`);
      removeEventById(existingEventId);
      clearEventIdFromSpreadsheet(member);
    } else {
      Logger.log(`ℹ️ No Event ID found. Using name-based search removal.`);
      removeBirthdayEventsByNameAndDate(member, oldBirthday);
    }
    
    // Step 2: Add new birthday event
    Logger.log(`📅 Step 2: Adding new birthday event...`);
    addBirthdayToCalendar(member, response);
    
    Logger.log(`✅ Birthday calendar successfully updated for ${member.englishName}.`);
    return true;
    
  } catch (error) {
    Logger.log(`⚠️ Error in checkBirthdayExists: ${error.message}`);
    return false;
  }
}

/**
 * Checks if the birthday has changed for an edited response and updates the calendar if needed.
 * @param {object} member The current member details object.
 * @returns {boolean} True if birthday was changed and calendar was updated.
 */
function checkAndUpdateBirthdayIfChanged(member) {
  try {
    Logger.log(`🔍 Checking if birthday changed for ${member.englishName}...`);
    
    // Use the same logic as checkBirthdayExists
    return checkBirthdayExists(member);
    
  } catch (error) {
    Logger.log(`⚠️ Error checking birthday changes: ${error.message}`);
    return false;
  }
}

// =================================================================
// SPREADSHEET INTEGRATION FUNCTIONS
// =================================================================

/**
 * Helper function to find the row index for a member in the spreadsheet.
 * This function is used by both main.js and calendar.gs.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The spreadsheet sheet.
 * @param {object} member The member details object.
 * @returns {number} The row index (1-based) or -1 if not found.
 */
function findMemberRowInSpreadsheet(sheet, member) {
  try {
    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() <= 1) {
      return -1; // No data except headers
    }

    const allData = dataRange.getValues();
    const headers = allData[0];
    
    // Find column indices for email and name
    let emailColumnIndex = -1;
    let englishNameColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toString().toLowerCase().trim();
      
      if (header.includes('email') || header === 'email address') {
        emailColumnIndex = i;
      } else if (header.includes('name') && (header.includes('full') || header.includes('english'))) {
        englishNameColumnIndex = i;
      }
    }
    
    // Find the member's row by email first (most reliable), then by name
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      
      // Try to match by email first
      if (emailColumnIndex !== -1 && member.email) {
        const rowEmail = row[emailColumnIndex] ? row[emailColumnIndex].toString().trim() : '';
        if (rowEmail.toLowerCase() === member.email.toLowerCase()) {
          Logger.log(`✅ Found member by email at row ${i + 1}: ${member.email}`);
          return i + 1; // Return 1-based row index
        }
      }
      
      // Fallback: try to match by name
      if (englishNameColumnIndex !== -1 && member.englishName) {
        const rowName = row[englishNameColumnIndex] ? row[englishNameColumnIndex].toString().trim() : '';
        if (rowName.toLowerCase() === member.englishName.toLowerCase()) {
          Logger.log(`✅ Found member by name at row ${i + 1}: ${member.englishName}`);
          return i + 1; // Return 1-based row index
        }
      }
    }
    
    return -1; // Member not found
  } catch (error) {
    Logger.log(`⚠️ Error finding member row: ${error.message}`);
    return -1;
  }
}

/**
 * Retrieves existing member data from the spreadsheet for comparison.
 * For new submissions, this looks at the previous row to avoid comparing with itself.
 * For edits, this finds the existing record to compare against.
 * @param {object} member The current member details object.
 * @returns {object|null} The existing member data or null if not found.
 */
function getExistingMemberDataFromSpreadsheet(member) {
  try {
    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${SPREADSHEET.sheets[0]} sheet.`);
      return null;
    }

    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() <= 2) {
      Logger.log(`ℹ️ Not enough data to compare - only ${dataRange.getNumRows()} rows (including headers)`);
      return null; // Need at least 2 data rows to compare
    }

    const allData = dataRange.getValues();
    const headers = allData[0];
    const lastRowIndex = allData.length - 1; // Index of the last row
    
    // Find column indices for important fields
    let emailColumnIndex = -1;
    let birthdayColumnIndex = -1;
    let englishNameColumnIndex = -1;
    
    // Try to find columns by matching headers
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toString().toLowerCase().trim();
      
      if (header.includes('email') || header === 'email address') {
        emailColumnIndex = i;
      } else if (header.includes('birthday') || header.includes('birth') || header.includes('tanggal') || header.includes('lahir')) {
        birthdayColumnIndex = i;
      } else if (header.includes('name') && (header.includes('full') || header.includes('english'))) {
        englishNameColumnIndex = i;
      }
    }
    
    // Check if this is likely a new submission (current row is the last row)
    const currentRow = allData[lastRowIndex];
    const isNewSubmission = emailColumnIndex !== -1 && member.email && 
                           currentRow[emailColumnIndex] && 
                           currentRow[emailColumnIndex].toString().trim().toLowerCase() === member.email.toLowerCase();
    
    if (isNewSubmission) {
      Logger.log(`ℹ️ Detected new submission - looking for previous data to compare against`);
      
      // Look for the previous submission with the same email (excluding the current/last row)
      for (let i = lastRowIndex - 1; i >= 1; i--) { // Search backwards from second-to-last row
        const row = allData[i];
        
        if (emailColumnIndex !== -1 && member.email) {
          const rowEmail = row[emailColumnIndex] ? row[emailColumnIndex].toString().trim() : '';
          if (rowEmail.toLowerCase() === member.email.toLowerCase()) {
            Logger.log(`✅ Found previous submission by email at row ${i + 1}: ${member.email}`);
            
            // Extract birthday if available
            let existingBirthday = null;
            if (birthdayColumnIndex !== -1 && row[birthdayColumnIndex]) {
              const birthdayValue = row[birthdayColumnIndex];
              if (birthdayValue instanceof Date) {
                existingBirthday = birthdayValue;
              } else {
                existingBirthday = new Date(birthdayValue);
                if (isNaN(existingBirthday.getTime())) {
                  existingBirthday = null;
                }
              }
            }
            
            return {
              birthday: existingBirthday,
              email: rowEmail,
              englishName: englishNameColumnIndex !== -1 ? row[englishNameColumnIndex] : '',
              rowIndex: i + 1 // 1-based row number
            };
          }
        }
      }
      
      Logger.log(`ℹ️ No previous submission found for ${member.email} - this appears to be the first submission`);
      return null;
    } else {
      Logger.log(`ℹ️ Detected edit/update - looking for existing data to compare against`);
      
      // For edits, find the existing record (this is the original logic)
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
        
        // Try to match by email first (most reliable)
        if (emailColumnIndex !== -1 && member.email) {
          const rowEmail = row[emailColumnIndex] ? row[emailColumnIndex].toString().trim() : '';
          if (rowEmail.toLowerCase() === member.email.toLowerCase()) {
            Logger.log(`✅ Found existing member by email at row ${i + 1}: ${member.email}`);
            
            // Extract birthday if available
            let existingBirthday = null;
            if (birthdayColumnIndex !== -1 && row[birthdayColumnIndex]) {
              const birthdayValue = row[birthdayColumnIndex];
              if (birthdayValue instanceof Date) {
                existingBirthday = birthdayValue;
              } else {
                existingBirthday = new Date(birthdayValue);
                if (isNaN(existingBirthday.getTime())) {
                  existingBirthday = null;
                }
              }
            }
            
            return {
              birthday: existingBirthday,
              email: rowEmail,
              englishName: englishNameColumnIndex !== -1 ? row[englishNameColumnIndex] : '',
              rowIndex: i + 1 // 1-based row number
            };
          }
        }
        
        // Fallback: try to match by name if email matching fails
        if (englishNameColumnIndex !== -1 && member.englishName) {
          const rowName = row[englishNameColumnIndex] ? row[englishNameColumnIndex].toString().trim() : '';
          if (rowName.toLowerCase() === member.englishName.toLowerCase()) {
            Logger.log(`✅ Found existing member by name at row ${i + 1}: ${member.englishName}`);
            
            // Extract birthday if available
            let existingBirthday = null;
            if (birthdayColumnIndex !== -1 && row[birthdayColumnIndex]) {
              const birthdayValue = row[birthdayColumnIndex];
              if (birthdayValue instanceof Date) {
                existingBirthday = birthdayValue;
              } else {
                existingBirthday = new Date(birthdayValue);
                if (isNaN(existingBirthday.getTime())) {
                  existingBirthday = null;
                }
              }
            }
            
            return {
              birthday: existingBirthday,
              email: emailColumnIndex !== -1 ? row[emailColumnIndex] : '',
              englishName: rowName,
              rowIndex: i + 1
            };
          }
        }
      }
    }
    
    Logger.log(`ℹ️ No existing member data found for ${member.englishName} (${member.email})`);
    return null;
    
  } catch (error) {
    Logger.log(`⚠️ Error retrieving existing member data: ${error.message}`);
    return null;
  }
}

// =================================================================
// BIRTHDAY ID MANAGEMENT FUNCTIONS
// =================================================================



/**
 * Updates the Birthday ID for an existing member during birthday updates.
 * @param {object} member The member details object.
 * @param {string} eventId The new calendar event ID.
 * @param {GoogleAppsScript.Forms.FormResponse} response The form response object (optional, for timestamp verification).
 */
function updateEventIdInSpreadsheet(member, eventId, response = null) {
  try {
    Logger.log(`🔄 Updating Birthday ID for ${member.englishName}...`);
    
    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${SPREADSHEET.sheets[0]} sheet. Skipping Event ID update.`);
      return;
    }

    // Find the Birthday ID column (should be column B) or create it
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let birthdayIdColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().trim() === 'birthday id') {
        birthdayIdColumnIndex = i + 1; // Convert to 1-based index
        break;
      }
    }
    
    if (birthdayIdColumnIndex === -1) {
      // Birthday ID column doesn't exist, create it in column B
      Logger.log(`📝 Creating new "Birthday ID" column in column B...`);
      
      // Check if column B is empty or needs to be created
      const currentColumns = sheet.getLastColumn();
      if (currentColumns < 2) {
        // Not enough columns, need to add more
        Logger.log(`📝 Expanding spreadsheet to have at least 2 columns...`);
      }
      
      // Insert a new column at position B (column 2) 
      sheet.insertColumnBefore(2);
      
      // Set the header for column B to "Birthday ID"
      sheet.getRange(1, 2).setValue('Birthday ID');
      Logger.log(`✅ Inserted new column B and set header to "Birthday ID"`);
      
      birthdayIdColumnIndex = 2; // Column B
    } else {
      Logger.log(`✅ Found existing "Birthday ID" column at column ${birthdayIdColumnIndex}`);
    }

    // Find the correct row using email verification (if response available)
    Logger.log(`� Finding correct row for Birthday ID using email verification...`);
    
    if (response) {
      // Get the email from the response
      const responseEmail = getEmailFromResponse(response);
      if (responseEmail) {
        Logger.log(`📧 Response email: ${responseEmail}`);
        
        // Find the email column in the spreadsheet
        let emailColumnIndex = -1;
        const allHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        for (let i = 0; i < allHeaders.length; i++) {
          const header = allHeaders[i].toString().toLowerCase();
          if (header.includes('email')) {
            emailColumnIndex = i + 1; // Convert to 1-based
            break;
          }
        }
        
        if (emailColumnIndex > 0) {
          Logger.log(`� Email column found at column ${emailColumnIndex}`);
          
          // Search for the row with matching email (search from bottom up for most recent)
          const allData = sheet.getDataRange().getValues();
          let targetRow = -1;
          
          for (let i = allData.length - 1; i >= 1; i--) { // Search backwards from latest, skip header
            const rowEmail = allData[i][emailColumnIndex - 1]; // Convert to 0-based for array
            if (rowEmail && rowEmail.toString().trim().toLowerCase() === responseEmail.toLowerCase()) {
              // Check if this row already has a birthday ID
              const existingBirthdayId = allData[i][birthdayIdColumnIndex - 1]; // Convert to 0-based
              if (!existingBirthdayId || existingBirthdayId.toString().trim() === '') {
                targetRow = i + 1; // Convert back to 1-based
                Logger.log(`✅ Found matching email at row ${targetRow} without existing birthday ID`);
                break;
              } else {
                Logger.log(`ℹ️ Found matching email at row ${i + 1} but it already has birthday ID: ${existingBirthdayId.toString().substring(0, 30)}...`);
              }
            }
          }
          
          if (targetRow > 0) {
            sheet.getRange(targetRow, birthdayIdColumnIndex).setValue(eventId);
            Logger.log(`✅ Updated Birthday ID in spreadsheet row ${targetRow}, column ${birthdayIdColumnIndex} for email: ${responseEmail}`);
            return;
          } else {
            Logger.log(`⚠️ Could not find row with matching email "${responseEmail}" that needs birthday ID. Using last row method.`);
          }
        } else {
          Logger.log(`⚠️ Could not find email column in spreadsheet. Using last row method.`);
        }
      } else {
        Logger.log(`⚠️ Could not extract email from response. Using last row method.`);
      }
    } else {
      Logger.log(`ℹ️ No response object provided - using last row method`);
    }

    // Fallback: Update the birthday ID in the Birthday ID column for the newest submission row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, birthdayIdColumnIndex).setValue(eventId);
    Logger.log(`✅ Updated Birthday ID in spreadsheet row ${lastRow}, column ${birthdayIdColumnIndex} for ${member.englishName}`);

  } catch (error) {
    Logger.log(`⚠️ Could not update Birthday ID in spreadsheet: ${error.message}`);
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
 * Gets the Birthday ID from the spreadsheet for a member.
 * @param {object} member The member details object.
 * @returns {string|null} The birthday ID or null if not found.
 */
function getEventIdFromSpreadsheet(member) {
  try {
    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      Logger.log(`⚠️ Could not find ${SPREADSHEET.sheets[0]} sheet.`);
      return null;
    }

    // Find the Birthday ID column
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let birthdayIdColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().trim() === 'birthday id') {
        birthdayIdColumnIndex = i + 1; // Convert to 1-based index
        break;
      }
    }
    
    if (birthdayIdColumnIndex === -1) {
      Logger.log(`ℹ️ No "Birthday ID" column found in spreadsheet.`);
      return null;
    }

    // Find the member's row
    const memberRowIndex = findMemberRowInSpreadsheet(sheet, member);
    if (memberRowIndex === -1) {
      Logger.log(`⚠️ Could not find member ${member.englishName} in spreadsheet.`);
      return null;
    }

    // Get the birthday ID from the Birthday ID column
    const birthdayId = sheet.getRange(memberRowIndex, birthdayIdColumnIndex).getValue();
    
    if (birthdayId && birthdayId.toString().trim() !== '') {
      return birthdayId.toString().trim();
    } else {
      Logger.log(`ℹ️ No birthday ID stored for ${member.englishName}.`);
      return null;
    }

  } catch (error) {
    Logger.log(`⚠️ Error getting Birthday ID from spreadsheet: ${error.message}`);
    return null;
  }
}

/**
 * Clears the Birthday ID from the spreadsheet for a member.
 * @param {object} member The member details object.
 */
function clearEventIdFromSpreadsheet(member) {
  try {
    // Get the spreadsheet
    let spreadsheet;
    if (SPREADSHEET.id) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET.id);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    const sheet = spreadsheet.getSheetByName(SPREADSHEET.sheets[0]);
    if (!sheet) {
      return;
    }

    // Find the Birthday ID column
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let birthdayIdColumnIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase().trim() === 'birthday id') {
        birthdayIdColumnIndex = i + 1;
        break;
      }
    }
    
    if (birthdayIdColumnIndex === -1) {
      return;
    }

    // Find the member's row and clear the birthday ID
    const memberRowIndex = findMemberRowInSpreadsheet(sheet, member);
    if (memberRowIndex !== -1) {
      sheet.getRange(memberRowIndex, birthdayIdColumnIndex).setValue('');
      Logger.log(`🧹 Cleared Birthday ID from spreadsheet for ${member.englishName}`);
    }

  } catch (error) {
    Logger.log(`⚠️ Error clearing Birthday ID from spreadsheet: ${error.message}`);
  }
}
