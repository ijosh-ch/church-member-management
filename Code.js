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
    const FIELD_IDS = {
      ENGLISH_NAME: '346680072',    // Make sure these are correct
      BIRTH_DATE: '1319447115'     
    };
    
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    let englishName = '';
    let birthDate = '';
    
    itemResponses.forEach(itemResponse => {
      const itemId = itemResponse.getItem().getId().toString();
      
      if (itemId === FIELD_IDS.ENGLISH_NAME.toString()) {
        englishName = itemResponse.getResponse();
      } else if (itemId === FIELD_IDS.BIRTH_DATE.toString()) {
        birthDate = itemResponse.getResponse();
      }

      
      // Logger.log(`${itemId} == ${FIELD_IDS.ENGLISH_NAME.toString()}`)
      // Logger.log(`${itemId} == ${FIELD_IDS.BIRTH_DATE.toString()}`)
    });
    
    if (!englishName || !birthDate) {
      throw new Error('Missing required fields');
    }
    
    // Rest of your function remains the same
    addBirthdayToCalendar(englishName, birthDate);
    
    MailApp.sendEmail(Session.getActiveUser().getEmail(),
      'Birthday Added',
      `Added birthday for ${englishName} (${birthDate}) to calendar`);
      
  } catch (error) {
    Logger.log(`Error: ${error.stack}`);
  }
}

// Separate function to log field IDs (run this once manually)
function logFieldIds() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();
  
  items.forEach(item => {
    Logger.log(`Title: ${item.getTitle()}, ID: ${item.getId()}`);
  });
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
    const calendar = CalendarApp.getCalendarById('35d33c133e208027c6868b013d142bf1fa06db5252f8523065f09e18e9ff0f86@group.calendar.google.com');
    const birthdayDate = new Date(birthday);
    const birthYear = birthdayDate.getFullYear();
    const endYear = birthYear + 99;

    // Set recurrence until 100 years later
    const recurrence = CalendarApp.newRecurrence()
      .addYearlyRule()
      .until(new Date(endYear, birthdayDate.getMonth(), birthdayDate.getDate()));

    const eventTitle = `🎂 ${fullName} (${birthYear})`;

    // Create the event series first
    const eventSeries = calendar.createAllDayEventSeries(eventTitle, birthdayDate, recurrence);

    // Add reminders AFTER creating the event
    eventSeries.addPopupReminder(1440);    // 1 day before (1440 minutes = 24 hours)
    eventSeries.addPopupReminder(10080);   // 1 week before (10080 minutes = 7 days)
    eventSeries.addPopupReminder(43200);   // 1 month before (~30 days, 43200 minutes)

    Logger.log(`✅ Birthday added: ${fullName} (repeats until ${endYear})`);
  } catch (error) {
    Logger.log(`❌ Error: ${error}`);
  }
}

function test_birthday(){
  addBirthdayToCalendar("Johanes Kevin", "11/13/2002")
}

