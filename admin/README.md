# Admin Panel - Resto Host AI Onboarding

This is the Admin Panel for the Resto Host AI Onboarding application. It allows administrators to view and manage form submissions from the onboarding wizard.

## Features

- Secure admin login with restricted access
- View all form submissions
- Detailed view of each submission
- Export submissions to PDF
- User profile management

## Requirements

- Node.js 18+
- npm or yarn

## Installation

1. Navigate to the admin directory:

   ```bash
   cd admin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your Firebase configuration (or copy from frontend):
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3002](http://localhost:3002).

## Building for Production

Build the application for production:

```bash
npm run build
```

The built files will be available in the `dist` directory.

## Access Control

Only the following email addresses have admin access:

- tomas@host.ai
- tomas@lopezsaavedra.com.ar

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase (Authentication, Firestore)
- jsPDF for PDF export
