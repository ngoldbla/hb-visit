# HatchBridge Kiosk Setup Guide

This guide covers how to set up iPads as 24/7 kiosks for the HatchBridge check-in system.

## Requirements

- iPad running iOS 16.4 or later (for Wake Lock API support)
- Power adapter and cable
- Stable Wi-Fi connection
- The kiosk URL (e.g., `https://your-domain.com`)

## Quick Setup Steps

1. Configure iPad settings (see below)
2. Open Safari and navigate to the kiosk URL
3. Tap Share → Add to Home Screen
4. Launch from the Home Screen icon
5. Enable Guided Access to lock the device

---

## iPad Configuration

### 1. Disable Auto-Lock

The screen must stay on indefinitely.

1. Open **Settings** → **Display & Brightness**
2. Tap **Auto-Lock**
3. Select **Never**

### 2. Set Manual Brightness

Prevent automatic brightness changes.

1. Open **Settings** → **Display & Brightness**
2. Disable **True Tone**
3. Open **Settings** → **Accessibility** → **Display & Text Size**
4. Disable **Auto-Brightness**
5. Set brightness to a comfortable level (70-80% recommended)

### 3. Enable Guided Access

Guided Access locks the iPad to a single app and prevents accidental exit.

1. Open **Settings** → **Accessibility** → **Guided Access**
2. Toggle **Guided Access** ON
3. Tap **Passcode Settings** → **Set Guided Access Passcode**
4. Set a secure passcode (you'll need this to exit kiosk mode)
5. Optionally enable **Face ID** or **Touch ID** for quicker exit

### 4. Enable Do Not Disturb

Prevent notifications from interrupting the display.

1. Open **Settings** → **Focus** → **Do Not Disturb**
2. Create a schedule or enable manually
3. Under **Options**, set **Silence** to **Always**

### 5. Disable Notifications

For extra safety, disable all notifications.

1. Open **Settings** → **Notifications**
2. Toggle off **Show Previews** or set to **Never**
3. Disable notifications for individual apps if needed

---

## Installing the Kiosk App

### Add to Home Screen

1. Open **Safari** on the iPad
2. Navigate to your kiosk URL
3. Tap the **Share** button (box with arrow)
4. Scroll down and tap **Add to Home Screen**
5. Name it "HB Check-In" (or leave default)
6. Tap **Add**

The app will now appear on the Home Screen with the HatchBridge icon.

### Launch as Full-Screen App

1. Tap the **HB Check-In** icon on the Home Screen
2. The app will open in full-screen mode (no Safari UI)
3. The screen should be in landscape orientation

---

## Starting Guided Access

Once the kiosk app is running:

1. **Triple-click** the Home button (older iPads) or **Side button** (newer iPads)
2. Tap **Guided Access** → **Start**
3. The iPad is now locked to the kiosk app

### Exiting Guided Access

1. **Triple-click** the Home or Side button
2. Enter your Guided Access passcode (or use Face ID/Touch ID)
3. Tap **End** in the top-left corner

---

## Power & Hardware

### Always Plugged In

Kiosk iPads should always be connected to power:

- Use an Apple-certified power adapter
- Consider a USB charging hub for multiple kiosks
- Route cables safely to prevent tripping hazards

### Thermal Considerations

iPads may run warm when powered on 24/7:

- Ensure adequate ventilation around the device
- Avoid enclosed cases that trap heat
- If using a kiosk enclosure, ensure it has ventilation
- Operating temperature: 32°F to 95°F (0°C to 35°C)

### Mounting Options

- Wall-mounted iPad holders
- Countertop stands with anti-theft features
- Kiosk enclosures (ensure they have ventilation)

---

## Troubleshooting

### Screen Goes to Sleep

1. Verify Auto-Lock is set to **Never**
2. Ensure the app was launched from the Home Screen (not Safari)
3. The Wake Lock API should keep the screen active

### App Shows Safari UI

The app was opened in Safari instead of as a standalone app:

1. Close Safari
2. Launch the app from the Home Screen icon

### Screen Dims

1. Check that Auto-Brightness is disabled
2. Verify the iPad is plugged into power
3. Adjust manual brightness to desired level

### iPad Restarts or Crashes

1. Ensure iOS is up to date
2. Check available storage (Settings → General → iPad Storage)
3. Force restart if needed: Press and quickly release Volume Up, then Volume Down, then hold Side button until Apple logo appears

### Wi-Fi Disconnects

1. Forget and re-join the network
2. Use a Wi-Fi network with a stable signal
3. Consider a dedicated network for kiosk devices

---

## Summary Checklist

- [ ] Auto-Lock: Never
- [ ] True Tone: Off
- [ ] Auto-Brightness: Off
- [ ] Guided Access: Enabled with passcode
- [ ] Do Not Disturb: Enabled
- [ ] App added to Home Screen
- [ ] App launched from Home Screen (full-screen mode)
- [ ] Guided Access started (triple-click)
- [ ] iPad plugged into power
- [ ] Adequate ventilation around device
