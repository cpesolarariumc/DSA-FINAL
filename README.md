# Hospital Queue

Hospital Queue is a web application for managing patient appointments, emergency cases, and the hospital queue. It includes patient-facing tools for viewing appointments, queue progress, medical records, and prescriptions, alongside staff-facing workflows for managing patients and consultations.

## Features

- Patient, doctor, and administrator interfaces
- Appointment and live queue management
- Emergency case routing and room assignment
- Patient profiles, medical records, progress updates, and prescriptions
- Firebase Authentication and Cloud Firestore integration

## Tech stack

- React 19 and TypeScript
- Vite
- Firebase Authentication and Cloud Firestore
- Tailwind CSS

## Requirements

- Node.js (use a current version compatible with the Vite version in `package.json`)
- npm
- A Firebase project with Authentication and Cloud Firestore configured

## Getting started

1. Clone the repository and change into the project directory:

   ```sh
   git clone <repository-url>
   cd HospitalQueue
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the project root and add the Firebase web app configuration:

   ```dotenv
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   ```

   Replace the example values with the values from your Firebase project. The `.env` file is ignored by Git; do not commit real environment values.

4. Start the development server:

   ```sh
   npm run dev
   ```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## GitHub Pages deployment

The workflow in `.github/workflows/build.yml` builds and deploys the app when changes are pushed to `main`. It also publishes a GitHub Pages fallback so direct links to staff login routes work. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. Configure the Firebase `VITE_FIREBASE_*` values listed above as repository or environment secrets so the deployed app can connect to Firebase.

## Firebase setup

Configure the Firebase services used by the application in the Firebase Console. Add the local development URL and any deployed app URL to the authorized domains for Firebase Authentication. Set Firestore security rules appropriate to your deployment and verify that they restrict access to authorized users.

For the one-time patient name edit, publish the patient update rules from `firebaseRuling.txt` in Firebase Console → Firestore Database → Rules. The app cannot enforce the one-edit limit securely unless those rules are active.

The Firebase web configuration is used by a browser application and is not a substitute for access control. Never commit service-account credentials, private keys, patient data, or other secrets to the repository.

## Project structure

```text
src/
  components/   Shared patient and staff UI
  pages/        Page-level views
  services/     Firebase and application data services
  assets/       Images and other imported assets
public/         Static files served as-is
```
