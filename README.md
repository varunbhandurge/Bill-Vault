# ASSETCARE
### Personal Digital Asset, Appliance, Vehicle, Bill, Warranty & Maintenance System

> **AssetCare** is a production-grade personal digital asset and warranty management platform available on **Web** (desktop, tablet, mobile browsers) and **Mobile** (iOS / Android via Expo React Native).
>
> Eliminates the perpetual problem of losing old purchase bills, service invoices, and repair records by maintaining a **permanent, chronological, and searchable digital vault for every appliance and vehicle you own.**

---

## 🌟 The Core Use Case in Action

### Example: The 16-Year-Old Car Scenario
1. **The Situation**: You own a 16-year-old car (e.g. *Honda City Sedan*). Today, on **06-Nov-2026**, you get its AC Compressor overhauled and magnetic clutch coil replaced for **₹6,000** with a **3-month repair warranty** from *Apex Auto Cooling Works*.
2. **Three Months Later**: The AC stops cooling again.
3. **The Solution**: 
   - Open **AssetCare**, search for your car, and tap **"Filter by Component: AC Compressor"**.
   - Immediately retrieve:
     - **Repair Date**: `06-Nov-2026`
     - **Service Centre**: `Apex Auto Cooling Works` (Phone: `+91 98201 54321`, GST: `27AABCA1234F1Z8`)
     - **Work Done**: Overhauled compressor, replaced magnetic clutch coil, bearing, seal & valves
     - **Amount Paid**: `₹6,000`
     - **Active Warranty**: `3 Months` (Valid until `06-Feb-2027`)
     - **Original Invoice**: High-resolution scanned invoice PDF/photo preserved in vault
   - Tap **"Download Claim Dossier (PDF)"** to generate a single-page official claim history document to present to the mechanic, conclusively establishing active warranty coverage.

---

## 🚀 Quick Start (Web Application)

### 1. Prerequisites
- **Node.js**: v18+ or v20+ (tested on Node v24 LTS)
- **Yarn** / Corepack: Enabled out-of-the-box

### 2. Run Locally in Seconds
```bash
# Start development server
yarn dev

# Or run the optimized production server (already built):
yarn start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Authentication & Roles

### 1. Administrator Account
- **Username**: `admin`
- **Initial Password**: `admin`
- **Security Requirement**: Forced password change on first login is strictly enforced by the backend and UI.
- **Capabilities**:
  - Full system control: view all registered users, add/edit/deactivate users, remove accounts.
  - View all assets & bills belonging to all users.
  - Exclusive permission to edit and delete previously submitted bills or asset details.
  - Manage categories directory, review audit logs, monitor disk storage, and manage failed OCR queues.

### 2. Regular User Account
- **Username**: `john_doe`
- **Password**: `password123`
- **Capabilities & Strict RLS Restrictions**:
  - Register, log in, register new appliances/vehicles.
  - Upload purchase bills, repair receipts, and service invoices.
  - Search document vault, view personal timeline, track warranties, configure reminders.
  - **Backend Row Level Security (RLS) Restriction**: Regular users **CANNOT edit or delete existing submitted records**. Only administrators can make post-submission corrections.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technologies Used |
|---|---|
| **Web Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Mobile App** | React Native, Expo 51, Expo Camera, Expo ImagePicker, Expo Notifications |
| **Backend & Storage** | Next.js Server-Side API Handlers, Supabase PostgreSQL with RLS, Local Protected Vault |
| **OCR Pipeline** | Tesseract.js (Pure WebAssembly/Node, zero external native dependencies), PDF.js text extractor, Canvas Preprocessor |
| **PDF Generation** | jsPDF, jsPDF-AutoTable, QRCode |
| **Containerization** | Docker, Docker Compose, PostgreSQL 16 |

---

## 🗄️ Database & Supabase PostgreSQL Migration

AssetCare includes a production-ready PostgreSQL / Supabase migration script located at:
`supabase/migrations/20261106_init_assetcare.sql`

### What it includes:
1. **Schema Tables**: `users`, `households`, `categories`, `assets`, `documents`, `ocr_records`, `service_records`, `warranties`, `reminders`, `reminder_logs`, `audit_logs`.
2. **Row Level Security (RLS)**:
   - Enforces read/write boundaries between users.
   - Restricts `UPDATE` and `DELETE` on assets, documents, and service records strictly to `admin`.
3. **Seed Data**: Pre-loaded with 29 standard categories (Air Conditioner, Refrigerator, Car, Motorcycle, Water Purifier, Laptop, etc.) and pre-hashed administrator credentials.

---

## 📄 OCR Bill Scanning & Extraction Pipeline

1. **Document Preprocessing**:
   - Contrast stretching, auto-rotation/deskew, shadow removal, and binarization.
2. **Deterministic Information Extraction**:
   - **GSTIN**: Validates 15-digit Indian GSTINs (`\b[0-9]{2}[A-Z]{5}[0-9]{4}[1-9A-Z]{1}Z[0-9A-Z]{1}\b`).
   - **Invoice Numbers**: Detects bill, receipt, and tax invoice numbers.
   - **Dates**: Normalizes DD/MM/YYYY, DD-Mon-YYYY, and YYYY-MM-DD.
   - **Component Identification**: Recognizes AC Compressor, Clutch, Battery, Brake Pads, RO Membrane, etc.
   - **Financials**: Segregates Labour Charges, Material/Spare Parts, GST, Discounts, and Net Payable.
   - **Warranty Terms**: Parses warranty clauses (`"3 Months Warranty"`, `"1 Year Guarantee"`).
3. **Side-by-Side Verification Screen**:
   - Displays original PDF/image on the left and structured fields on the right.
   - Visually flags fields with low confidence (< 75%) for user review.
   - Alerts if a previous warranty for the same component is still active.
4. **Maintenance Schedule Synchronization**:
   - Uses the actual invoice service date as the reference anchor date to advance the maintenance schedule (e.g. `06-Nov-2026 + 6 Months -> 06-May-2027`).

---

## 🏷️ Unique QR Code Tag for Every Asset

- Every appliance and vehicle is assigned a unique alphanumeric QR code ID.
- Generates a **Printable 4" x 2.5" Physical Sticker Label (PDF)**:
  - High-resolution QR code
  - Asset name, brand, model, and location
  - Vehicle registration number or serial number
- **Security**: Scanning the QR code requires authentication before viewing sensitive private invoices and financials.

---

## 📱 Mobile App (React Native + Expo)

Located in `mobile/`:
- **App.tsx**: Complete navigation and mobile dashboard
- **Camera Scanner**: iPhone & Android camera scanning
- **Shared API Client**: Directly consumes the AssetCare backend endpoints
- Run with:
  ```bash
  cd mobile
  npm install
  npm start
  ```

---

## 🐳 Docker Deployment

To launch AssetCare with a self-hosted PostgreSQL database:
```bash
docker-compose up -d --build
```
Access the application at `http://localhost:3000`.
