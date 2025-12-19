# Visitor Management System

VMS helps in managing visitors visiting the institutions for various reasons. It allows visitors to check-in digitally to eliminate the tedious registeration and other paperwork. Additionally, it also keeps a track of every individual inside the campus and their timings. Institutions has guards who enter their detail in some notebooks to keep a log which are practically impossible to reconcile. It is really unpleasent and hectic for visitor to stand at the gate and give details about the visit. To ease the process of registeration, Entry-In, Entry-Out, time tracking and logging the history, this VMS can be of great use!!

**Frameworks:** MEAN-Stack

## Environment Variables

The following environment variables are required or optional for running this application:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string for the database | `mongodb+srv://user:pass@cluster.mongodb.net/VMS` |
| `JWT_SECRET` | Secret key for JWT token signing. **Must be changed in production!** | `your-secure-secret-key-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the Express server | `3000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `ENABLE_WHATSAPP` | Enable WhatsApp bot functionality (see below) | `false` |

### WhatsApp/Puppeteer Variables (only if ENABLE_WHATSAPP=true)

| Variable | Description |
|----------|-------------|
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chromium executable (set automatically on Railway) |

## Railway Deployment

This app is configured for Railway deployment using Nixpacks. The `nixpacks.toml` file automatically installs Chromium dependencies if you want to use the WhatsApp feature.

### Minimum Railway Environment Variables

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
```

### Optional: Enable WhatsApp Bot

```
ENABLE_WHATSAPP=true
```

**Note:** WhatsApp Web automation requires a persistent browser session. In headless mode (production), you may have limited functionality for QR code scanning. This feature works best in local development with a visible browser.

## WhatsApp Bot Feature (Puppeteer)

This application includes an optional WhatsApp Web automation feature powered by Puppeteer. Here's what it does:

### How It Works

1. **Browser Automation**: Puppeteer launches a Chromium browser instance that connects to WhatsApp Web
2. **QR Code Authentication**: Admin scans a QR code from the admin panel to link the institution's WhatsApp number
3. **Visitor Registration**: Visitors can register by messaging the institution's WhatsApp number
4. **Gate Pass Delivery**: Visitors receive their QR code gate-pass directly via WhatsApp

### Endpoints

- `POST /api/whatsapp/getQR` - Get QR code for WhatsApp Web authentication
- `POST /api/whatsapp/checkStatus` - Check if WhatsApp is connected

### Limitations

- **Requires GUI for initial setup**: QR code scanning needs a visible browser or screen capture
- **Session persistence**: WhatsApp session data is stored in `./whatsappData` directory
- **Cloud deployment**: In headless mode, initial QR scanning is challenging. Consider running locally first to establish a session.

## Features

1. **User Registeration**:
   - Visitors can register themselves either from **Whatsapp** or on the website. It has simple user interface for the guest to register with their convieneint time-slots. There is a 4-step process on Whatsapp to register, starting by sending a simple Hi. User can retrieve his/her own **Gate-pass** without any issues from Whatsapp bot itself. Then that Gate-pass is needed to be scanned by guard at the door.

2. **Profile Page**:
   - There's user and admin page. They can change their details and password on this. The Admin page helps changing the page settings and the **content of home page with HTML editor** to provide text and data with different styles.

3. **Whatsapp Settings**:
   - **Whatsapp Settings Page can edit the messages of core AI** which replies to the user who texts on the institution's Whatsapp number. To start with this system, you only need to scan the QR Code for Web Whatsapp. This gives you the power to change the replies which will be sent to visitors while registering.

4. **Guard Scanning QR Code (Entry & Exit)**:
   - There will be access for guard's accounts as well. The guard will just **scan the QR-Code** of the visitor and get all their details and timings of entry/exit. If they are using mobile phones which they will be in the most of the cases, will open their phone's camera for scanning and uploading. Else if they are using computer we need to upload the photo of QR Code. If he lets the visitor in, the timer will start to log the time and it will end at the time of exit. Guard just needs to scan the QR-code at the time of exit, to end the tour of Visitor.

5. **Admin**:
   - Admin dashboard shows real time updates. If a guard lets someone in from any gate the numbers here changes same goes with registration. Afterwards we can even monitor each visits. It shows all the data of visits which are currently active or are completed in past. As the time increases of the visit, it will have change in color and this will alert the guards(to check up if any suspicious activity is conducted or not). In the same-way we can see master data of visitors and guards. Only the Admin panel has the ability to deregister them or register new guards.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

**Hope you like it!! Thank You :)**
