# 🏬 Roman Island POS — Mobile Billing Terminal

**Production-grade React Native (Expo) Point-of-Sale app for premium retail store staff.**

Built with Expo SDK 57 • React Navigation • TanStack Query • TypeScript

---

## 🚀 Features

### Core Billing
- **Product Catalog** — Browse apparel with live images, pricing & branch-specific stock
- **Size-Based Inventory** — Real-time size availability per branch (S/M/L/XL/XXL, shoe sizes, ethnic sizes)
- **Smart Cart** — Add/remove items, auto stock validation, per-item notes
- **Dynamic Pricing** — Supports size-specific variable pricing and flat discounts
- **GST Calculation** — Automatic 5% GST on taxable amount with discount deduction
- **Multi-Tender Payment** — UPI, Cash, Card support

### Production Features
- **PIN-Based Terminal Authentication** — Branch-locked cashier PINs with admin override
- **Offline Billing** — Full offline fallback with local order storage & auto-sync
- **Receipt Printing** — Native print dialog (AirPrint, Bluetooth ESC/POS, USB)
- **PDF Invoice Generation** — Generate and share PDF receipts via native share sheet
- **WhatsApp Invoicing** — Send digital bills via WhatsApp Cloud API
- **Customer Loyalty** — VIP tier detection, loyalty points accrual & redemption
- **Shift Reconciliation** — Z-Report with tender breakdown & cash variance tracking
- **Real-Time Sync** — 3-second continuous background catalog & order sync

### Admin Features
- **Revenue Dashboard** — Today/Week/Month/All-time revenue with branch breakdown
- **Stock Matrix** — Cross-branch inventory view with low-stock alerts
- **Order Returns** — Full refund workflow with reason tracking and auto-restock

---

## 📱 Quick Start

### Prerequisites
- **Node.js** 18+ with npm
- **Expo CLI**: `npm install -g eas-cli`
- **Expo Go** app on your device (for development)

### Development
```bash
# Install dependencies
cd expo
npm install

# Start Metro bundler
npx expo start

# Scan QR code with Expo Go (Android) or Camera (iOS)
```

### Server Connection
The app connects to your Next.js backend. Configure the API server:

| Environment | Default URL |
|---|---|
| **Production** | `https://clothingstore-pos.vercel.app` |
| **Android Dev** | `http://<YOUR-WIFI-IP>:3000` |
| **iOS Simulator** | `http://localhost:3000` |
| **Android Emulator** | `http://10.0.2.2:3000` |

You can change the server URL at runtime via **Settings → Server Connection → Edit**.

---

## 🔨 Building Production APK

### 1. Login to EAS
```bash
npx eas login
```

### 2. Build Preview APK (Direct Install)
```bash
npx eas build --platform android --profile preview
```
This generates a `.apk` file you can directly install on any Android device.

### 3. Build Production APK
```bash
npx eas build --platform android --profile production
```

### 4. Build AAB (Google Play Store)
```bash
npx eas build --platform android --profile production-aab
```

---

## ⚡ Over-The-Air (OTA) Automatic Updates

Roman Island POS has a built-in **Over-The-Air (OTA) Update System** powered by `expo-updates` and EAS Update.

### How it Works:
1. **No APK Reinstall Needed**: Whenever you make UI changes, bug fixes, or add new features, you **do not** need to rebuild and distribute a new `.apk` file!
2. **Publish an Instant Update**:
   ```bash
   # Push update to production APK devices:
   npm run update:production

   # Push update to preview APK devices:
   npm run update:preview
   ```
3. **Automatic Staff Delivery**:
   - When billing staff opens the app, it checks for updates silently in the background.
   - Staff receives a toast: *"Terminal Update Ready 🚀 — Visit Settings to upgrade."*
   - Or staff can go to **Settings → System Updates & Over-The-Air** and tap **"Check for Updates"**.
   - Tapping **"⚡ Upgrade App"** downloads the new bundle and restarts the app in under 3 seconds with all latest features.
4. **Server Version Check Fallback**:
   - The app also connects to `/api/app-version` on your Next.js backend, providing release notes and update notifications even across major APK upgrades.

---

## 🔐 Staff PIN Codes

| Branch | PIN | Role |
|---|---|---|
| Downtown Flagship | `1111` / `1001` / `111` | Cashier |
| Uptown Galleria | `2222` / `2002` / `222` | Cashier |
| Banjara Hills | `3333` / `3003` / `333` | Cashier |
| HQ General Manager | `9999` / `9009` / `999` | Admin |
| Demo / Any 3+ Digit | `1234` / `123` | Cashier |

---

## 📁 Project Structure

```
expo/
├── App.tsx                     # Root component with providers
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build profiles
├── package.json                # Dependencies & scripts
├── src/
│   ├── components/
│   │   ├── CartPanel.tsx       # Cart sidebar / bottom sheet
│   │   ├── ErrorBoundary.tsx   # Crash recovery
│   │   ├── Header.tsx          # Brand header with offline indicator
│   │   ├── NotificationToast.tsx  # In-app notification system
│   │   ├── OrderSuccessModal.tsx  # Thermal receipt modal with print/share
│   │   ├── SizePickerModal.tsx    # Size selection overlay
│   │   └── StatusBadge.tsx        # Order status pills
│   ├── constants/
│   │   ├── fallbacks.js        # Offline fallback catalog data
│   │   ├── layout.ts           # Responsive breakpoint hooks
│   │   └── theme.ts            # Design tokens (colors, spacing, typography)
│   ├── context/
│   │   ├── AuthContext.tsx      # PIN authentication & branch isolation
│   │   ├── NotificationContext.tsx  # Toast notifications
│   │   └── PosContext.tsx       # Central POS state orchestrator
│   ├── hooks/
│   │   ├── useCart.ts           # Cart state management
│   │   ├── useNetwork.ts       # Connectivity monitoring
│   │   └── useOrders.ts        # Order CRUD with React Query
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Tab navigation (Cashier / Admin)
│   ├── screens/
│   │   ├── LoginScreen.tsx      # PIN keypad authentication
│   │   ├── POSScreen.tsx        # Main billing catalog + cart
│   │   ├── HistoryScreen.tsx    # Invoice list + Z-Report
│   │   ├── StockScreen.tsx      # Inventory matrix
│   │   ├── SettingsScreen.tsx   # Server config + diagnostics
│   │   └── admin/
│   │       └── AdminRevenueScreen.tsx  # Revenue analytics
│   ├── services/
│   │   └── api.ts               # REST API client
│   └── utils/
│       ├── calculations.js      # Financial computation helpers
│       ├── haptics.ts           # Non-blocking haptic feedback
│       ├── network.js           # Server connectivity testing
│       ├── receiptPrinter.ts    # Thermal print & PDF generation
│       └── storage.ts           # AsyncStorage with fallback
```

---

## 🌐 Backend API Endpoints

The app communicates with these Next.js API routes:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | Fetch apparel catalog |
| GET | `/api/categories` | Fetch product categories |
| GET | `/api/branches` | Fetch store branches |
| POST | `/api/orders` | Submit billing order |
| GET | `/api/orders` | Fetch order history |
| POST | `/api/orders/return` | Process return/refund |
| GET | `/api/analytics` | Revenue analytics |
| POST | `/api/auth/terminal-pin` | Verify staff PIN |
| GET | `/api/customers?phone=` | Customer loyalty lookup |
| POST | `/api/notifications/invoice` | Send digital invoice |

---

## 🎨 Design System

- **Theme**: Obsidian dark luxury with Roman Island Gold (#D4AF37) accent
- **Typography**: System fonts with 9-weight scale
- **Responsive**: Phone (< 768px) and Tablet (≥ 768px) optimized layouts
- **Haptics**: Non-blocking, debounced haptic feedback on all interactions
- **Animations**: Spring-based enter/exit animations

---

## 📄 License

Proprietary — Roman Island Clothing Stores
