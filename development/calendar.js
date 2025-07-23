/**
 * @fileoverview Birthday calendar management functions for Church Member Management System
 * @description Handles Google Calendar integration specifically for member birthdays
 */

/**
 * Creates a recurring annual birthday event on the specified calendar.
 * @param {Object} member - The member details object
 * @param {string} member.englishName - Member's English name
 * @param {string} member.chineseName - Member's Chinese name
 * @param {Date} member.birthday - Member's birthday date
 * @throws {Error} When calendar is not found or event creation fails
 * @returns {GoogleAppsScript.Calendar.CalendarEventSeries} The created recurring birthday event
 * 
 * @example
 * const member = {
 *   englishName: 'John Doe',
 *   chineseName: '約翰',
 *   birthday: new Date('1990-01-15')
 * };
 * 
 * try {
 *   const eventSeries = addBirthdayToCalendar(member);
 *   console.log('Birthday event created successfully');
 * } catch (error) {
 *   console.error('Failed to create birthday event:', error);
 * }
 */
function addBirthdayToCalendar(member) {
  try {
    Logger.log(`📅 Starting birthday calendar addition for ${member.englishName}...`);
    
    // Validate input parameters
    if (!member || !member.englishName || !member.birthday) {
      throw new Error('Invalid member data: missing required fields (englishName, birthday)');
    }
    
    if (!(member.birthday instanceof Date) || isNaN(member.birthday.getTime())) {
      throw new Error('Invalid birthday date provided');
    }
    
    // Get the birthday calendar
    const calendar = CalendarApp.getCalendarById(CONFIG.BIRTHDAY_CALENDAR_ID);
    if (!calendar) {
      throw new Error(`Calendar with ID '${CONFIG.BIRTHDAY_CALENDAR_ID}' not found. Please check your CONFIG.BIRTHDAY_CALENDAR_ID setting.`);
    }
    
    Logger.log(`✅ Found calendar: ${calendar.getName()}`);
    
    // Create recurrence rule - repeat annually for 99 years
    const recurrence = CalendarApp.newRecurrence()
      .addYearlyRule()
      .until(new Date(member.birthday.getFullYear() + 99, member.birthday.getMonth(), member.birthday.getDate()));
    
    // Format event title and description
    const { title, description } = formatBirthdayEvent(member);
    
    Logger.log(`Creating event: "${title}" on ${member.birthday.toDateString()}`);
    
    // Create the recurring birthday event
    const eventSeries = calendar.createAllDayEventSeries(
      title, 
      member.birthday, 
      recurrence, 
      { 
        description: description,
        location: 'Church Community'
      }
    );
    
    // Add reminders - 1 week and 1 day before
    try {
      eventSeries.addPopupReminder(10080); // 1 week (10080 minutes)
      eventSeries.addPopupReminder(1440);  // 1 day (1440 minutes)
      Logger.log('✅ Added birthday reminders (1 week and 1 day)');
    } catch (reminderError) {
      Logger.log(`⚠️ Could not add reminders: ${reminderError.message}`);
      // Continue without reminders rather than failing
    }
    
    Logger.log(`✅ Successfully added recurring birthday event for ${member.englishName}`);
    return eventSeries;
    
  } catch (error) {
    Logger.log(`❌ Failed to add birthday to calendar for ${member.englishName}: ${error.message}`);
    throw new Error(`Birthday calendar integration failed: ${error.message}`);
  }
}

/**
 * Formats both the title and description for a birthday event.
 * @param {Object} member - The member details object
 * @returns {Object} Object containing formatted title and description
 * @returns {string} returns.title - Formatted event title
 * @returns {string} returns.description - Formatted event description
 * 
 * @example
 * const member = {
 *   englishName: 'John Doe',
 *   chineseName: '約翰',
 *   birthday: new Date('1990-01-15'),
 *   email: 'john@example.com'
 * };
 * const { title, description } = formatBirthdayEvent(member);
 * // title: "🎂 John (約翰)'s Birthday"
 * // description: "🎉 Happy Birthday John!..."
 */
function formatBirthdayEvent(member) {
  // Format title
  let title = `🎂 ${member.englishName}`;
  
  // Add Chinese name if available
  if (member.chineseName && member.chineseName.trim() !== '') {
    title += ` (${member.chineseName})`;
  }
  
  title += "'s Birthday";
  
  // Format description
  let description = `🎉 Happy Birthday ${member.englishName}!\n\n`;
  
  description += `📝 Member Details:\n`;
  description += `• English Name: ${member.englishName}\n`;
  
  if (member.chineseName && member.chineseName.trim() !== '') {
    description += `• Chinese Name: ${member.chineseName}\n`;
  }
  
  if (member.birthday) {
    description += `• Year of Birth: ${member.birthday.getFullYear()}\n`;
    description += `• Birthday: ${member.birthday.toLocaleDateString()}\n`;
  }
  
  if (member.email) {
    description += `• Email: ${member.email}\n`;
  }
  
  if (member.iCare && member.iCare.trim() !== '') {
    description += `• iCare Group: ${member.iCare}\n`;
  }
  
  description += `\n🎂 Remember to celebrate this special day!`;
  
  return { title, description };
}


