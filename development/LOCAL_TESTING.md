# 📱 Church Member Management - Local Testing

This folder contains everything you need to test the Church Member Management web app locally on your network.

## 🚀 Quick Start

### Option 1: Using the Startup Script (Recommended)
```bash
./start-server.sh
```

### Option 2: Using Python Directly
```bash
python3 start-server.py
```

## 📋 What You'll Get

When you run the server, you'll see something like:
```
🚀 Church Member Management - Local Server
==================================================
📁 Serving: local-server.html
🌐 Port: 8080

📱 Access URLs:
   Local:    http://localhost:8080
   Network:  http://192.168.1.100:8080
```

## 📱 Testing on Mobile Devices

1. **Make sure all devices are on the same WiFi network**
2. **Use the Network URL** (e.g., `http://192.168.1.100:8080`)
3. **Open the URL on your mobile browser**
4. **Test all the responsive features:**
   - Touch interactions
   - Form inputs
   - Button responses
   - Different screen orientations

## 🔧 Features to Test

### ✅ Responsive Design
- [ ] Open on phone (portrait mode)
- [ ] Open on phone (landscape mode)
- [ ] Open on tablet
- [ ] Open on desktop browser

### ✅ Touch Interactions
- [ ] Tap the "Register New Member" card
- [ ] Tap the "Edit My Information" card
- [ ] Test button press feedback
- [ ] Test form input focus

### ✅ Form Functionality
- [ ] Enter email address in the edit form
- [ ] Enter phone number in the edit form
- [ ] Test the "Send Edit Link" button
- [ ] Test the "Back to Main Menu" button

### ✅ Mobile-Specific Features
- [ ] Auto-detection of email vs phone input
- [ ] Smooth scrolling
- [ ] Proper keyboard input modes
- [ ] No unwanted zoom on input focus

## 🛠️ Technical Details

### Files Included:
- `local-server.html` - Demo version of the web app
- `start-server.py` - Python HTTP server
- `start-server.sh` - Bash startup script
- `LOCAL_TESTING.md` - This instruction file

### What's Different in Demo Mode:
- **Simulated API calls** - No actual Google Apps Script integration
- **Mock responses** - Fake success/error messages
- **Demo notifications** - Clear indicators that it's a test version

### Network Requirements:
- **Same WiFi network** for all devices
- **Port 8080** available (or next available port)
- **Modern web browser** (Chrome, Safari, Firefox, Edge)

## 🔍 QR Code for Easy Mobile Access

You can generate a QR code for the Network URL to easily access it on mobile:

1. Copy the Network URL (e.g., `http://192.168.1.100:8080`)
2. Use any QR code generator (like qr-code-generator.com)
3. Scan with your phone to open the web app

## 🐛 Troubleshooting

### Server Won't Start
- **Port already in use**: The script will automatically find the next available port
- **Python not found**: Install Python 3 from https://www.python.org/downloads/
- **Permission denied**: Run `chmod +x start-server.sh` to make it executable

### Can't Access from Mobile
- **Check WiFi**: Ensure both computer and mobile are on the same network
- **Check firewall**: Your computer's firewall might be blocking the connection
- **Try different port**: If 8080 is blocked, the script will try other ports

### Mobile Browser Issues
- **Clear cache**: Clear your mobile browser cache and try again
- **Try different browser**: Test with Chrome, Safari, or Firefox
- **Check JavaScript**: Make sure JavaScript is enabled

## 🔄 Stopping the Server

Press `Ctrl+C` in the terminal to stop the server.

## 🚀 Next Steps

Once you're happy with the mobile responsiveness:

1. **Deploy to Google Apps Script** using the actual `Index.html`
2. **Configure the backend functions** in `webapp.js`
3. **Set up the Google Form integration**
4. **Test with real form submissions**

## 📞 Need Help?

If you encounter any issues:
1. Check the terminal output for error messages
2. Try refreshing the browser
3. Restart the server
4. Check your network connection

Happy testing! 🎉
