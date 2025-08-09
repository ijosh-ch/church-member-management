// function onFormSubmit(e) {
//   var responses = e.namedValues;
//   var email = e.response.getRespondentEmail();
//   var timestamp = e.values[0];

//   // Add Birthday
//   var fullName = responses['Nama (English)'][0];
//   addBirthdayToCalendar(fullName, responses['Tanggal Lahir'][0]);

//   // Generate QR codes
//   var formDataUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfeztXprLdisVVjuv3aJra16_MWE2W4IRRAFdu6ygmfRGgoJA/viewform?usp=pp_url";
//   var qrCodeTaipei = generateQRCode(formDataUrl, timestamp, fullName, 'Taipei');
//   var qrCodeZhongli = generateQRCode(formDataUrl, timestamp, fullName, 'Zhongli');

//   // Send QR codes to member's email
//   sendEmailWithQRCodeAttachment(email, fullName, qrCodeTaipei, qrCodeZhongli);
// }
function onFormSubmit(e) {
  // For testing - create a mock event object
  if (!e) {
    e = {
      response: FormApp.getActiveForm().getResponses().pop() // Gets the most recent response
    };
    if (!e.response) throw new Error("No form responses found for testing");
  }
  
  try {
    // Use field titles from config.js (much more maintainable)
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    let englishName = '';
    let birthDate = '';
    
    // Loop through all form responses and match by field title from config
    itemResponses.forEach(itemResponse => {
      const fieldTitle = itemResponse.getItem().getTitle();
      const fieldValue = itemResponse.getResponse();
      
      // Match field titles using constants from config.js
      if (fieldTitle === REGISTRATION_FORM.fields.ENGLISH_NAME) {
        englishName = fieldValue;
      } else if (fieldTitle === REGISTRATION_FORM.fields.BIRTHDAY) {
        birthDate = fieldValue;
      }
      
      // Log all fields for debugging (uncomment if needed)
      // Logger.log(`Field: "${fieldTitle}" = "${fieldValue}"`);
    });
    
    if (!englishName || !birthDate) {
      throw new Error(`Missing required fields. Expected: "${REGISTRATION_FORM.fields.ENGLISH_NAME}" and "${REGISTRATION_FORM.fields.BIRTHDAY}". Found: englishName="${englishName}", birthDate="${birthDate}"`);
    }
    
    Logger.log(`Processing member: ${englishName}, Birthday: ${birthDate}`);
    
    // Add birthday to calendar
    addBirthdayToCalendar(englishName, birthDate);
    
    // Send confirmation email
    MailApp.sendEmail(Session.getActiveUser().getEmail(),
      'Birthday Added to Calendar',
      `Successfully added birthday for ${englishName} (${birthDate}) to the church calendar.`);
      
  } catch (error) {
    Logger.log(`Error in onFormSubmit: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
    
    // Send error notification to admin
    MailApp.sendEmail(Session.getActiveUser().getEmail(),
      'Error: Church Member Form Submission',
      `An error occurred while processing a form submission:\n\n${error.message}\n\nStack trace:\n${error.stack}`);
  }
}

// Helper function to log all field titles (run this manually to see your form structure)
function logFormFieldTitles() {
  try {
    const form = FormApp.getActiveForm();
    const items = form.getItems();
    
    Logger.log('=== FORM FIELD TITLES ===');
    items.forEach((item, index) => {
      Logger.log(`${index + 1}. Title: "${item.getTitle()}" | Type: ${item.getType()} | ID: ${item.getId()}`);
    });
    Logger.log('========================');
    
    // Also log the most recent response to see actual data
    const responses = form.getResponses();
    if (responses.length > 0) {
      const latestResponse = responses[responses.length - 1];
      const itemResponses = latestResponse.getItemResponses();
      
      Logger.log('=== LATEST RESPONSE VALUES ===');
      itemResponses.forEach(itemResponse => {
        Logger.log(`"${itemResponse.getItem().getTitle()}" = "${itemResponse.getResponse()}"`);
      });
      Logger.log('==============================');
    }
    
  } catch (error) {
    Logger.log(`Error logging form fields: ${error.message}`);
  }
}
// function generateQRCode(formDataUrl, timestamp, fullName, churchLocation) {
//   try {
//     var timestampEntry = "&entry.912489277=" + encodeURIComponent(Utilities.formatDate(new Date(timestamp), Session.getScriptTimeZone(), "m/d/yyyy H:mm:ss"));
//     var fullNameEntry = "&entry.2091296168=" + encodeURIComponent(fullName);
//     var churchLocationEntry = "&entry.1008173553=" + encodeURIComponent(churchLocation);

//     var dataString = formDataUrl + timestampEntry + fullNameEntry + churchLocationEntry;
//     return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(dataString);
//   } catch (error) {
//     Logger.log("Error generating QR code: " + error.toString());
//     return null;
//   }
// }

// function sendEmailWithQRCodeAttachment(email, fullName, qrCodeTaipeiUrl, qrCodeZhongliUrl) {
//   try {
//     var subject = "Your Church QR Codes";
//     var body = "Dear " + fullName + ",\n\nHere are your personal QR codes as attachments.";

//     var qrCodeTaipeiBlob = UrlFetchApp.fetch(qrCodeTaipeiUrl).getBlob().setName("IFGF Taipei - " + fullName + ".png");
//     var qrCodeZhongliBlob = UrlFetchApp.fetch(qrCodeZhongliUrl).getBlob().setName("IFGF Zhongli - " + fullName + ".png");

//     MailApp.sendEmail({
//       to: email,
//       subject: subject,
//       body: body,
//       attachments: [qrCodeTaipeiBlob, qrCodeZhongliBlob]
//     });

//     Logger.log("Email sent with attachments to: " + email);
//   } catch (error) {
//     Logger.log("Error sending email with attachments: " + error.toString());
//   }
// }

function addBirthdayToCalendar(fullName, birthday) {
  try {   
    // Use calendar ID from config.js
    const calendar = CalendarApp.getCalendarById(CALENDAR.id);
    const birthdayDate = new Date(birthday);
    const birthYear = birthdayDate.getFullYear();
    const endYear = birthYear + 99;

    // Set recurrence until 100 years later
    const recurrence = CalendarApp.newRecurrence()
      .addYearlyRule()
      .until(new Date(endYear, birthdayDate.getMonth(), birthdayDate.getDate()));

    // Use church name from config for event title
    const eventTitle = `🎂 ${fullName} (${birthYear})`;
    
    // Create event description with church context
    const eventDescription = `🎉 Happy Birthday ${fullName}!\n\n` +
      `📝 Member Details:\n` +
      `• Full Name: ${fullName}\n` +
      `• Birth Year: ${birthYear}\n` +
      `• Church: ${CHURCH.name}\n\n` +
      `🎈 Celebrate with our ${CHURCH.name} community!`;

    // Create the event series with description and location
    const eventSeries = calendar.createAllDayEventSeries(
      eventTitle, 
      birthdayDate, 
      recurrence, 
      {
        description: eventDescription,
        location: `${CHURCH.name} Community`
      }
    );

    // Add reminders using consistent timing
    eventSeries.addPopupReminder(1440);    // 1 day before (1440 minutes = 24 hours)
    eventSeries.addPopupReminder(10080);   // 1 week before (10080 minutes = 7 days)
    eventSeries.addPopupReminder(43200);   // 1 month before (~30 days, 43200 minutes)

    Logger.log(`✅ Birthday added: ${fullName} (${CHURCH.name}) - repeats until ${endYear}`);
  } catch (error) {
    Logger.log(`❌ Error adding birthday to calendar: ${error.message}`);
    Logger.log(`❌ Stack trace: ${error.stack}`);
  }
}

function test_birthday(){
  addBirthdayToCalendar("Johanes Kevin", "11/13/2002")
}

