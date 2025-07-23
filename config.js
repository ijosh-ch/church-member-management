const CONFIG = {
  // --- Form & Calendar IDs ---
  REGISTRATION_FORM_ID: '104mQ6SkiXQUdfJLBOoGHn3YsrlsaxDPXNIL4SsE5POs', // ID of the Registration Form this script is attached to.
  ATTENDANCE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfeztXprLdisVVjuv3aJra16_MWE2W4IRRAFdu6ygmfRGgoJA/viewform', // URL of the Attendance Form for QR codes.
  BIRTHDAY_CALENDAR_ID: '2e38a7c0e710c1c85a034b366a943a94d3e1776a242b15223c56008750f6b309@group.calendar.google.com', // ID of the Google Calendar for birthdays.
  SPREADSHEET: {
    ID: '1M0ARrzedTrfMRsqlPsyIxMtv0Plt1_9cG__tzOVuy0w',
    SHEET: 'Daftar Jemaat'
    // Column indices will be determined automatically from form field IDs
  }, // ID of the Google Spreadsheet where responses are stored. Leave empty to use the active spreadsheet.

  CHURCH: {
    NAME: 'IFGF',
    BRANCH: ['Taipei', 'Zhongli']
  },

  // --- Registration Form Question Titles (More maintainable than IDs) ---
  FIELD_TITLES: {
    ENGLISH_NAME: 'Full Name',        // Title of the English/Full name field
    CHINESE_NAME: 'Chinese Name',     // Title of the Chinese name field (optional)
    BIRTHDAY: 'Tanggal Lahir',             // Title of the birthday field
    ICARE: 'iCare',                   // Title of the iCare field
    EMAIL: '',                        // Empty = auto-collected by Google Forms (no separate field)
    PHONE: 'WhatsApp Number'             // Title of the phone number field
  },

  // --- Attendance Form Field Titles (For auto-detecting entry IDs) ---
  ATTENDANCE_FORM_FIELDS: {
    EMAIL: 'Email Jemaat Terdaftar',     // Field title in attendance form for email
    PHONE: 'WhatsApp Number',            // Field title in attendance form for WhatsApp
    FULL_NAME: 'Full Name',              // Field title in attendance form for name
    ICARE: 'iCare',                      // Field title in attendance form for iCare
    LOCATION: 'Lokasi'                   // Field title in attendance form for location
  },

  // --- Manual Entry IDs (REQUIRED - Auto-detection failed) ---
  // To get these entry IDs:
  // 1. Open your attendance form in EDIT mode
  // 2. For each field, click "⋮" (3 dots) → "Get pre-filled link"
  // 3. Enter test value → Get link → Find "entry.XXXXXXXXX" in the URL
  // 4. Copy the "entry.XXXXXXXXX" part below (including "entry.")
  
  ENTRY_ID_EMAIL: '',                     // For "Email Jemaat Terdaftar" field
  ENTRY_ID_PHONE: '',                     // For "WhatsApp Number" field  
  ENTRY_ID_FULL_NAME: '',                 // For "Full Name" field
  ENTRY_ID_ICARE: '',                     // For "iCare" field
  ENTRY_ID_LOCATION: '',                  // For "Lokasi" field

  // --- Location Details for Email ---
  LOCATION_TAIPEI_URL: 'https://g.co/kgs/ue5CEtv',
  LOCATION_ZHONGLI_URL: 'https://g.co/kgs/xKRLyXC',

  // --- Admin Notification ---
  ADMIN_EMAIL: Session.getActiveUser().getEmail() // Defaults to the script owner.
};
