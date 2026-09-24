# 📱 Roman Island - Expo Mobile Billing POS App

This is the dedicated React Native Expo application for showroom sales associates and cashiers to bill customers on the floor directly from mobile smartphones and tablets.

It is visual-matched 1:1 with the web terminal at `/billing`.

---

## 🌟 Key Features

1. **Terminal Header**:
   - Live branch indicator: **Branch 1 - Downtown Flagship** / **Branch 2 - Uptown Galleria**
   - Staff Cashier identification: `cashier_b1`
   - Server Connection & Wi-Fi IP setting (`⚙️`)
2. **Dynamic Apparel Catalog**:
   - Live product synchronization from Next.js server (`/api/products`)
   - High-resolution apparel cards with real-time stock badges (`X in branch` or `Out of Stock`)
   - Category filtering: `Checks`, `Streetwear`, `Sneakers`, `Essentials`, `Formals`, `Ethnic`
   - Real-time search by cloth name, SKU, or category
3. **Interactive Size Selection**:
   - Tap **Select Size →** to open the bottom sheet modal displaying exact size inventory (`S`, `M`, `L`, `XL`, `XXL` or footwear sizes `7`-`11`)
4. **Current Bill & Checkout (Tablet & Mobile Optimized)**:
   - Full bill summary with quantity steppers (`-` / `+`)
   - Customer Name and Phone Number capture
   - Payment tender toggle: **UPI**, **Cash**, **Card**
   - Custom Discount input & automatic 5% GST tax calculation
5. **Instant Bill Generation & Receipt**:
   - Submits bill to Next.js API (`/api/orders`), automatically deducting stock and mirroring to Amazon DynamoDB
   - Generates sequential bill numbers (e.g. `BILL-B1-20260921-0042`)
   - Generates thermal receipt preview with itemized table

---

## 🚀 How to Run

### Step 1: Install Dependencies (One-time)
Open your terminal in this `expo` directory:
```bash
cd expo
npm install
```

### Step 2: Start Expo Server
```bash
npx expo start
```

### Step 3: Open on Your Phone
- **Android**: Open **Expo Go** app on your phone and scan the QR code in the terminal.
- **iOS**: Open **Camera** on your iPhone and tap the Expo Go link.
- **Web**: Press `w` in the terminal to preview in your desktop browser.

---

## ⚙️ Connecting to your Next.js Server

1. Ensure your Next.js store server is running (`npm run dev`) on port 3000 or 3001.
2. In the Expo app, tap the **⚙️** icon in the top header.
3. Enter your computer's local Wi-Fi IP address:
   ```
   http://<YOUR-PC-IP>:3000
   ```
   *(Example: `http://192.168.1.15:3000`)*
4. The status badge will switch from **LOCAL** to glowing **LIVE**!
