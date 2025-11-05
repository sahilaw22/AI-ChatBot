# GCET Jammu Assistant - Frontend 🎓

**Your intelligent college companion powered by Google Gemini AI**

A modern, mobile-first chatbot interface designed specifically for GCET Jammu (Chak Bhalwal, Jammu & Kashmir) students. This application provides AI-powered assistance for college information, admissions, placements, hostel facilities, and more.

---

## ✨ Features

### Core Functionality
- 💬 **AI-Powered Chat** - Intelligent responses using Google Gemini 2.5 Flash
- 🎤 **Voice Input** - Hands-free operation with speech recognition
- � **File Management** - Upload, view, download, and delete study materials
- 👤 **Personalized Experience** - Name-based greetings and profile management
- 🌓 **Dark/Light Mode** - Eye-friendly theme toggle
- 📱 **Responsive Design** - Works seamlessly on all devices

### Smart Features
- **Profile System** - Save name, branch (CSE/ECE/ME/CE/EE), semester, and batch
- **Chat History** - Persistent conversation storage with localStorage
- **File Upload** - Support for PDF, DOC, DOCX, TXT, PPT, PPTX (up to 50MB)
- **Quick Actions** - About GCET, Placements, Hostel, Coding Tips
- **Context Awareness** - AI remembers your profile and conversation history
- **Offline Fallback** - Graceful error handling when backend is unavailable

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend server running on `http://localhost:4000` (see `../Source/README.md`)

### Installation

1. **Open the frontend:**
   ```bash
   # Option 1: Using Live Server (VS Code extension)
   Right-click index.html → Open with Live Server
   
   # Option 2: Open directly in browser
   Double-click index.html
   ```

2. **Set up your profile:**
   - Enter your name (optional)
   - Select branch: CSE, ECE, ME, CE, or EE
   - Choose semester (1-8)
   - Select batch year
   - Click "Save"

3. **Start chatting:**
   - Type messages or use voice input
   - Upload files for easy access
   - Use quick action chips for common queries

---

## 📁 Project Structure

```
frontend/
├── index.html      # Main chat interface
├── intro.html      # Welcome/landing page (legacy)
├── style.css       # Styling, themes, and animations
├── script.js       # Application logic and API integration
├── LICENSE         # MIT License
└── README.md       # This file
```

### File Descriptions

**index.html** - Main chat application
- Modern chat interface with mobile-first design
- Profile setup modal (name, branch, semester, batch)
- File upload/management UI
- Theme toggle (dark/light mode)
- Chat history drawer
- Quick action chips

**script.js** - Frontend logic (1147 lines)
- API integration with backend (`http://localhost:4000/api`)
- File upload with FormData (single/multiple files)
- User profile management and localStorage persistence
- Chat history and message rendering
- Voice input using Web Speech API
- Theme management
- Error handling and offline support

**style.css** - Complete styling
- Mobile-responsive design
- Dark/light theme support
- Smooth animations and transitions
- Form styling for profile inputs
- File upload UI components
- Chat bubbles and message formatting

---

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:4000/api`

### Endpoints Used:
- `POST /api/query` - Send messages and receive AI responses
- `GET /api/history/:userId` - Retrieve chat history
- `DELETE /api/history/:userId` - Clear chat history
- `POST /api/profile` - Save user profile
- `POST /api/upload` - Upload single file
- `POST /api/upload-multiple` - Upload multiple files
- `GET /api/files` - Get all uploaded files
- `GET /api/files/:id` - Download specific file
- `DELETE /api/files/:id` - Delete file
- `GET /api/faqs` - Get GCET Jammu FAQs

### Configuration
To change the API endpoint (for production deployment):
```javascript
// In script.js, line 12
const API_BASE = 'https://your-domain.com/api';
```

---

## 💾 Data Storage

### LocalStorage Keys:
- `chatHistory` - Array of conversation messages
- `userContext` - User profile (name, branch, semester, batch)
- `userId` - Unique identifier for the user
- `isDarkMode` - Theme preference (true/false)

### Backend Sync:
- Profile automatically synced to backend on save
- Files stored on backend with metadata
- Chat history retrievable from backend

---

## 🎨 Customization

### Change Theme Colors
Edit `style.css`:
```css
:root {
  --primary: #7c3aed;        /* Purple */
  --primary-dark: #6d28d9;
  --accent: #ec4899;         /* Pink */
  /* Customize other colors */
}
```

### Add Quick Action Chips
Edit `index.html`:
```html
<div class="chip">Your New Action</div>
```

### Modify Welcome Message
Edit `script.js`, function `initApp()`:
```javascript
const welcomeMessage = "Your custom welcome message";
```

---

## 📱 Mobile Features

- **Touch Gestures** - Swipe to expand/collapse bottom sheet
- **Responsive Layout** - Adapts to screen size
- **Mobile-First Design** - Optimized for phones (320px+)
- **Voice Input** - Works on mobile browsers with mic permission
- **File Upload** - Native file picker on mobile devices

---

## 🔧 Troubleshooting

### Backend Not Responding
- Ensure backend is running: `cd ../Source && npm start`
- Check console for CORS errors
- Verify API_BASE URL in script.js

### File Upload Fails
- Check file size (max 50MB)
- Verify file format (PDF, DOC, DOCX, TXT, PPT, PPTX)
- Ensure backend has write permissions in uploads folder

### Voice Input Not Working
- Grant microphone permission in browser
- Use HTTPS or localhost (required by Web Speech API)
- Check browser compatibility (Chrome/Edge recommended)

### Chat History Not Saving
- Check localStorage is enabled in browser
- Clear browser cache and reload
- Verify userId is generated (check console)

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ⚠️ Voice input limited |
| Opera | 76+ | ✅ Fully Supported |

---

## 📄 License

MIT License - See `LICENSE` file for details

---

## 🤝 Contributing

This is a college project for GCET Jammu. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

For GCET Jammu specific queries, the AI assistant can help with:
- 🏛️ College information and facilities
- 📚 Admission process (JEE Main, JKCET)
- 🎓 Available branches and courses
- 💼 Placement opportunities
- 🏠 Hostel facilities
- 💻 Coding and skill development tips

---

## 🚀 Deployment

### Option 1: Static Hosting (Netlify, Vercel)
1. Push code to GitHub
2. Connect repository to Netlify/Vercel
3. Update `API_BASE` in script.js to production backend URL
4. Deploy

### Option 2: Traditional Web Server
1. Upload files to web server (Apache, Nginx)
2. Configure CORS on backend
3. Update `API_BASE` in script.js
4. Access via domain

---

**Built with ❤️ for GCET Jammu Students**

- Profile setup on first visit

**style.css** - Complete styling system
- Mobile-responsive layout (works on any screen size)
- Light and dark theme support
- Smooth animations and transitions
- Card-based component design
- Glassmorphism effects

**script.js** - Application brain
- Chat message handling
- API communication (with fallback to demo data)
- Voice recognition integration
- Theme switching logic
- Data persistence (localStorage)
- Gesture controls for bottom sheet

---

## 🚀 Getting Started

### Option 1: Direct File Access (Simplest)

1. **Open the intro page**
   ```
   Double-click `intro.html` in your file explorer
   ```

2. **Set up your profile**
   - A modal will appear after 4 seconds
   - Select your Branch, Semester, and Batch
   - Click "Save & Continue"

3. **Start chatting**
   - Click "Enter Assistant" button
   - Try the quick action chips: Timetable, Exams, Web Technology Notes
   - Or type your own questions

### Option 2: Local Web Server (Recommended for Development)

If you have Node.js installed:

```powershell
# Navigate to the chatbot folder
cd "C:\Program Files (x86)\sahilaw\chatbot"

# Start a simple web server
npx http-server -p 8080

# Open in browser
# http://localhost:8080/intro.html
```

---

## 💡 How It Works

### 1. **Initial Setup**
When you first open the app:
1. Theme is loaded from browser storage (defaults to light mode)
2. Profile data (branch/semester/batch) is checked
3. If no profile exists, setup modal appears
4. Previous chat history is restored (if any)

### 2. **Sending a Message**
When you send a message:
1. Message is added to chat history
2. App shows typing indicator
3. Tries to contact backend server at `http://localhost:4000/api`
4. If server is unavailable, uses built-in demo data
5. Response is formatted and displayed
6. Everything is saved to localStorage

### 3. **Data Storage**
The app uses browser localStorage to save:
- `gcet_theme` - Current theme (light/dark)
- `userContext` - Your profile (branch/semester/batch)
- `chatHistory` - All your chat messages

### 4. **Voice Input**
When you click the microphone button:
1. Browser asks for microphone permission (first time only)
2. Speech recognition starts listening
3. What you say is converted to text
4. Text appears in the input field
5. You can then send it or edit it first

---

## 🎯 Quick Demo Guide (For Presentations)

**5-Minute Demo Flow:**

1. **Open intro.html** (0:30)
   - Show the hero card and features list
   - Highlight "Your college companion" tagline
   - Click "Enter Assistant"

2. **Profile Setup** (0:30)
   - Modal appears automatically
   - Fill in: Branch = CSE, Semester = 3, Batch = 2025
   - Click "Save & Continue"

3. **Try Quick Actions** (2:00)
   - Click "📅 Timetable" chip → Shows class schedule by day
   - Click "📝 Exams" chip → Shows upcoming exams with countdown
   - Click "📚 Web Technology Notes" chip → Shows study materials list

4. **Voice Input Demo** (1:00)
   - Click microphone button
   - Say "Show my timetable"
   - Watch it fill the input and send

5. **Show Features** (1:00)
   - Toggle dark mode (moon/sun icon in header)
   - Open chat history (clock icon in bottom sheet)
   - Swipe down on bottom sheet to minimize

---

## 🔧 Configuration

### Changing the Backend URL

Edit `script.js`, line 7:
```javascript
const API_BASE = 'http://localhost:4000/api';
```

Change this to your backend server URL when deploying.

### Customizing Mock Data

The app has built-in demo data in `script.js`:
- `mockTimetable()` - Sample class schedule
- `mockExams()` - Sample exam dates
- `mockPDFs()` - Sample study materials

You can edit these functions to show your own demo data.

### Adjusting Profile Options

Edit the dropdowns in `index.html` and `intro.html`:
```html
<select id="branchSelect">
  <option value="CSE">Computer Science (CSE)</option>
  <!-- Add more branches here -->
</select>
```

---

## 🐛 Troubleshooting

### Voice Input Not Working
**Problem:** Microphone button doesn't respond
**Solutions:**
- Use Chrome or Microsoft Edge (best support)
- Check browser microphone permissions
- HTTPS is required for mic access (except on localhost)
- Try clicking the mic icon twice

### Dark Mode Not Persisting
**Problem:** Theme resets on page reload
**Solutions:**
- Check if localStorage is enabled in browser
- Don't use private/incognito mode
- Clear browser cache and try again

### Chat History Disappeared
**Problem:** Old messages are gone
**Solutions:**
- Check if localStorage was cleared
- Don't clear browser data for this site
- Messages are saved per browser (won't sync across devices)

### PDF Preview Not Opening
**Problem:** "View" button doesn't work
**Solutions:**
- Some browsers block PDF previews
- Try downloading the PDF instead
- Use Chrome or Edge for best results
- Check if popup blocker is interfering

### Backend Connection Failing
**Problem:** "Connect the backend" messages appear
**Solutions:**
- This is normal! App works fine with demo data
- To connect backend: ensure it's running on `http://localhost:4000`
- Check CORS settings on your backend
- Check browser console (F12) for error details

---

## 🎨 Customization Guide

### Changing Colors

All colors are defined in `style.css`. Main color variables:

```css
/* Primary Purple */
#7b3ff2, #a259e6

/* Dark Mode Background */
#1c1f35, #1a1e33

/* Text Colors */
Light mode: #2f1a59, #4b3c73
Dark mode: #f0ecff, #e5e1ff
```

### Modifying Layout

The app uses a phone-container approach:
```css
.phone-container {
  max-width: 400px;    /* Phone width */
  height: min(92vh, 760px);  /* Phone height */
}
```

Adjust these values to change the app dimensions.

### Adding New Quick Action Chips

In `index.html`, find the `.chip-row` section:
```html
<button type="button" class="chip" onclick="sendQuickMessage('Your query here')">
  🆕 New Action
</button>
```

---

## 🔐 Security Notes

- User data is stored locally (never sent to external servers)
- No passwords or sensitive information is collected
- Voice recordings are processed by browser (not saved)
- All HTML is escaped to prevent XSS attacks
- Profile data can be cleared anytime via browser settings

---

## 🚀 Future Enhancements

Potential features for future versions:

- **Backend Integration** - Connect to real database
- **Admin Panel** - Upload and manage materials
- **Notifications** - Exam reminders and announcements
- **Calendar Export** - Download timetable as .ics file
- **Multi-language** - Support for regional languages
- **AI Chatbot** - Natural language processing with OpenAI
- **File Upload** - Students can share notes
- **Discussion Forum** - Subject-wise threads
- **Assignment Tracker** - Deadline management

---

## 📝 Development Notes

### Code Style
- Comprehensive comments explain what each function does
- Functions are grouped by category with headers
- Variable names are descriptive (no cryptic abbreviations)
- Consistent indentation (2 spaces)

### Browser Compatibility
- **Best Experience:** Chrome 90+, Edge 90+
- **Good Experience:** Firefox 88+, Safari 14+
- **Limited:** Older browsers (no voice input)

### Performance
- Chat history limited by browser storage (~5-10MB)
- Images are SVG (very lightweight)
- CSS animations use GPU acceleration
- Lazy loading for chat messages (renders on demand)

---

## 📄 License

This project is created for educational purposes for GCET students.

---

## 👥 Support

For questions or issues:
1. Check the Troubleshooting section above
2. Look at browser console (F12) for error messages
3. Verify all files are in the same folder
4. Try clearing browser cache and reloading

---

## 🎓 About GCET

**Goa College of Engineering and Technology**

This assistant is designed to make student life easier by providing quick access to:
- Class schedules personalized to your branch and semester
- Exam dates with helpful countdowns
- Study materials organized by subject
- Voice-enabled access for hands-free use

---

**Built with ❤️ for GCET Students**

*Last Updated: October 2025*
