// =================================================================
//                      UTILITY & TRIGGER FUNCTIONS
// =================================================================

/**
 * UTILITY: Runs manually to log the IDs of all questions in your Registration Form.
 * This version opens the form using its unique Form ID.
 */
function getFormFieldsID() {
  try {
    Logger.log(CONFIG)

    // 2. Check if the ID property exists
    if (!CONFIG.REGISTRATION_FORM_ID) {
      throw new Error("The 'REGISTRATION_FORM_ID' property is not set. Please set it in Project Settings.");
    }

    // --- THIS IS THE KEY CHANGE ---
    // Use openById() with the Form ID from your configuration
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
    
    // The rest of the function works the same
    const items = form.getItems();
    items.forEach(item => {
      Logger.log(`Question Title: "${item.getTitle()}"  -->  ID: ${item.getId()}`);
    });

  } catch (e) {
    Logger.log(`Error: ${e.message}`);
  }
}

/**
 * TRIGGERED FUNCTION: Opens the registration form to accept responses.
 * Set a time-driven trigger to run this every Saturday morning.
 */
function openRegistrationForm() {
  try {
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
    form.setAcceptingResponses(true);
    Logger.log("Registration form is now OPEN.");
  } catch (e) {
    Logger.log("Error opening form: " + e.toString());
  }
}

/**
 * TRIGGERED FUNCTION: Closes the registration form to stop accepting responses.
 * Set a time-driven trigger to run this every Sunday night or Monday morning.
 */
function closeRegistrationForm() {
  try {
    const form = FormApp.openById(CONFIG.REGISTRATION_FORM_ID);
    form.setAcceptingResponses(false);
    Logger.log("Registration form is now CLOSED.");
  } catch (e) {
    Logger.log("Error closing form: " + e.toString());
  }
}

/**
 * A simple, focused function to check if the script has access
 * to the Google Form it is attached to.
 */
function checkFormAccess() {
  try {
    Logger.log("Starting form access check...");
    
    // This is the simplest command to access the current form.
    // It requires the '.../auth/forms' scope.
    const form = FormApp.getActiveForm();
    
    Logger.log(`✅ SUCCESS! Script has access to the form titled: "${form.getTitle()}"`);
    Logger.log(`The ID of this form is: ${form.getId()}`);

  } catch (e) {
    Logger.log(`❌ FAILURE: The script could not get access.`);
    Logger.log(`Error message: ${e.message}`);
  }
}