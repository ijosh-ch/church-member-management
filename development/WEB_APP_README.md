# Church Member Management Web App

This web app provides a user-friendly interface for church member management with two main features:

1. **Register New Member** - Redirects to the Google Form for new member registration
2. **Edit My Information** - Allows existing members to request an edit link via email/phone lookup

## Files Added

- `webapp.js` - Main web app backend functions
- `Index.html` - Main web app interface
- Updated `appsscript.json` with required OAuth scopes

## Deployment Instructions

### 1. Deploy the Web App

1. Open Google Apps Script: https://script.google.com/
2. Go to your church member management project
3. Add the new files (`webapp.js` and `Index.html`)
4. Click **Deploy** → **New deployment**
5. Choose type: **Web app**
6. Configure:
   - **Description**: Church Member Management Platform
   - **Execute as**: Me
   - **Who has access**: Anyone (or Anyone with Google account)
7. Click **Deploy**
8. Copy the **Web app URL**

### 2. Test the Web App

1. Open the web app URL in a browser
2. You should see two options:
   - Register New Member
   - Edit My Information

### 3. Security Considerations

- The web app uses the same CONFIG object as your existing scripts
- Only members with existing records can request edit links
- Edit links are sent to the email address on file
- The web app validates input and provides user-friendly error messages

## How It Works

### Register New Member
- Calls `getRegistrationFormUrl()` to get the form URL from CONFIG
- Opens the registration form in a new tab

### Edit My Information
- User enters email or phone number
- Calls `sendEditUrlToMember()` to search the spreadsheet
- If found, sends edit URL via email using `sendEditUrlEmail()`
- Provides success/error feedback to the user

## Customization

You can customize the web app by:

1. **Styling**: Edit the CSS in `Index.html`
2. **Messaging**: Update text and error messages
3. **Functionality**: Modify functions in `webapp.js`
4. **Branding**: Add church logo and colors

## Testing Functions

Run these functions in Apps Script to test:

- `testWebAppFunctions()` - Tests the main web app functions
- `sendEditUrlToMember('test@example.com')` - Test with actual member data

## Integration with Existing System

The web app integrates seamlessly with your existing church member management system:

- Uses the same CONFIG settings
- Searches the same spreadsheet
- Uses existing phone cleaning functions
- Sends professional emails with edit links

## Support

If you encounter issues:

1. Check the execution log in Google Apps Script
2. Verify CONFIG settings are correct
3. Ensure proper OAuth permissions are granted
4. Test with actual member data from your spreadsheet
