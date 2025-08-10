const ADMIN_EMAIL = 'tpe.ifgf@gmail.com' // Defaults to the script owner.

const REGISTRATION_FORM = {
  id: '104mQ6SkiXQUdfJLBOoGHn3YsrlsaxDPXNIL4SsE5POs', // ID of the Registration Form this script is attached to.
  fields: {
    ENGLISH_NAME: 'Full Name',        // Title of the English/Full name field
    CHINESE_NAME: 'Chinese Name',     // Title of the Chinese name field (optional)
    BIRTHDAY: 'Tanggal Lahir',             // Title of the birthday field
    ICARE: 'iCare',                   // Title of the iCare field
    EMAIL: 'Email',                        // Empty = auto-collected by Google Forms (no separate field)
    PHONE: 'WhatsApp Number'             // Title of the phone number field
  },
}

const ATTENDANCE_FORM = {
  fields_name: {
    EMAIL: 'Email Jemaat Terdaftar',     // Field title in attendance form for email
    PHONE: 'WhatsApp Number',            // Field title in attendance form for WhatsApp
    FULL_NAME: 'Full Name',              // Field title in attendance form for name
    ICARE: 'iCare',                      // Field title in attendance form for iCare
    LOCATION: 'Lokasi'                   // Field title in attendance form for location
  }, 
  fields_id: {                            // Get this information from ATTENDANCE pre-filled Google form
    EMAIL: '912489277',                     // For "Email Jemaat Terdaftar" field
    PHONE: '188905337',                     // For "WhatsApp Number" field
    FULL_NAME: '2091296168',                 // For "Full Name" field
    ICARE: '371715918',                     // For "iCare" field
    LOCATION: '1008173553',                  // For "Lokasi" field
  }, url: 'https://docs.google.com/forms/d/e/1FAIpQLSfeztXprLdisVVjuv3aJra16_MWE2W4IRRAFdu6ygmfRGgoJA/viewform', // URL of the Attendance Form for QR codes.
}

const CHURCH = {
  name: 'IFGF',
  branches: [{
    name: 'Taipei',
    area_code: "TPE",
    gmaps: 'https://g.co/kgs/ue5CEtv'
  }, {
    name: 'Zhongli',
    area_code: "ZL",
    gmaps: 'https://g.co/kgs/xKRLyXC'
  }]
}

const CALENDAR = {
  id: '2e38a7c0e710c1c85a034b366a943a94d3e1776a242b15223c56008750f6b309@group.calendar.google.com', // ID of the Google Calendar for birthdays.
}

const SPREADSHEET = {
  id: '1M0ARrzedTrfMRsqlPsyIxMtv0Plt1_9cG__tzOVuy0w',
  sheets:{
    DAFTAR_JEMAAT: 'Daftar Jemaat',
    DAFTAR_ABSENSI: 'Daftar Absensi',
    ABSEN: [
      'Absen - Taipei',
      'Absen - Zhongli'
    ]
  }
}
