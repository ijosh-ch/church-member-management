/**
 * @fileoverview
 * Birthday calendar management functions for the Church Member Management System.
 * Provides Google Calendar integration for recurring member birthday events.
 *
 * This module exposes:
 *   - addBirthdayToCalendar(member): Adds a recurring birthday event to the configured calendar.
 *   - formatBirthdayEvent(member): Formats the event title and description for birthdays.
 *
 * Usage:
 *   - Ensure CONFIG.BIRTHDAY_CALENDAR_ID is set to a valid Google Calendar ID.
 *   - Pass a member object with at least 'englishName' and 'birthday' fields.
 *   - Optionally include 'chineseName', 'email', and 'iCare' for richer event details.
 */

/**
 * Adds a recurring annual birthday event for a member to the configured Google Calendar.
 *
 * @function addBirthdayToCalendar
 * @param {Object} member - Member details object. Must include at least 'englishName' and 'birthday'.
 * @param {string} member.englishName - Member's English name (required)
 * @param {string} [member.chineseName] - Member's Chinese name (optional)
 * @param {Date} member.birthday - Member's birthday as a Date object (required)
 * @param {string} [member.email] - Member's email address (optional)
 * @param {string} [member.iCare] - Member's iCare group (optional)
 * @throws {Error} If calendar is not found, birthday is invalid, or event creation fails
 * @returns {GoogleAppsScript.Calendar.CalendarEventSeries} The created recurring birthday event series
 *
 * @example
 * // Example usage:
 * const member = {
 *   englishName: 'John Doe',
 *   chineseName: '約翰',
 *   birthday: new Date('1990-01-15'),
 *   email: 'john@example.com',
 *   iCare: 'Alpha'
 * };
 * try {
 *   const eventSeries = addBirthdayToCalendar(member);
 *   Logger.log('Birthday event created successfully');
 * } catch (error) {
 *   Logger.log('Failed to create birthday event: ' + error.message);
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
 * Formats the event title and description for a member's birthday event.
 *
 * @function formatBirthdayEvent
 * @param {Object} member - Member details object. Should include 'englishName', 'birthday', and optionally 'chineseName', 'email', 'iCare'.
 * @returns {Object} Object with:
 *   - title {string}: Formatted event title (e.g., "🎂 John Doe (約翰)'s Birthday")
 *   - description {string}: Formatted event description with member details
 *
 * @example
 * const member = {
 *   englishName: 'John Doe',
 *   chineseName: '約翰',
 *   birthday: new Date('1990-01-15'),
 *   email: 'john@example.com',
 *   iCare: 'Alpha'
 * };
 * const { title, description } = formatBirthdayEvent(member);
 * // title: "🎂 John Doe (約翰)'s Birthday"
 * // description: "🎉 Happy Birthday John Doe! ..."
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


