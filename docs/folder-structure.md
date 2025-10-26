# Folder Structure

This project is an Expo (React Native) app. Below is the current structure with explanations for each folder and key files.

```
GoGaurdians/
├─ App.js                     # Root component; sets up navigation/root providers
├─ index.js                   # Entry registered with Expo
├─ app.json                   # Expo app manifest (name, icons, splash)
├─ app.config.js              # Config for Expo (can read env vars)
├─ eas.json                   # EAS (Expo Application Services) build config
├─ eslint.config.js           # ESLint configuration for the project
├─ firebaseConfig.js          # Firebase initialization/config (auth, db)
├─ config.js                  # App-level configuration helpers/constants
├─ package.json               # Dependencies and scripts
├─ README.md                  # Product/overview readme
├─ .env.example               # Example environment variables
├─ .env                       # Local environment variables (not committed)
│
├─ assets/                    # App static assets (icons, splash, images)
│  ├─ images/
│  │  ├─ GoGraurdianLogo.jpeg
│  │  └─ GoGraurdianLogo-removebg-preview.png
│  ├─ icon.png
│  ├─ adaptive-icon.png
│  ├─ splash-icon.png
│  └─ favicon.png
│
├─ components/                # Shared/reusable UI components
│  ├─ CommunitySafetyAlerts.js
│  ├─ DirectCommsWithAuth.js
│  ├─ EmergencyButton.js
│  └─ EmergencyConatctList.js  # NOTE: filename has a typo; see docs
│
├─ BusinessUse/               # Flows for business/organization users
│  └─ Authentication/
│     ├─ BusinessLogin.js
│     ├─ BusinessRegister.js
│     └─ BusinessForgotPassword.js
│
└─ PersonalUse/               # Flows for individual/personal users
   ├─ Authentication/
   │  ├─ PersonalLogin.js
   │  ├─ PersonalRegister.js
   │  └─ PersonalForgotPassword.js
   │
   ├─ Components/             # Personal-use specific components
   │  ├─ AIAssistant.js
   │  ├─ BioAuthGate.js
   │  ├─ PanicButton.js
   │  ├─ PersonalNavbar.js
   │  └─ SafetyAssistantOverlay.js
   │
   ├─ LocationSharing/
   │  ├─ FamilyMapView.js
   │  └─ LocationSharing.js
   │
   ├─ screens/                # Screen-level containers (navigation targets)
   │  ├─ Homepage.js
   │  ├─ AISafetyAssistantScreen.js
   │  ├─ FamilyScreen.js
   │  ├─ ProfileScreen.js
   │  ├─ ReportsScreen.js
   │  └─ SmartRouteScreen.js
   │
   └─ Services/               # Client-side services and API integration
      ├─ AISafetyService.js
      └─ APIService.js
```

## Root files

- App.js — App root; typically sets up navigation, providers (theme, state, etc.)
- index.js — Expo entry point that registers the root component
- app.json / app.config.js — Expo app configuration. app.config.js allows JS-based config and env usage
- eas.json — EAS build profiles for development/production
- eslint.config.js — Linting rules
- firebaseConfig.js — Firebase SDK configuration (ensure API keys are loaded from env)
- config.js — Centralized app configuration or constants
- package.json — Scripts and dependencies
- .env / .env.example — Environment variables. Copy .env.example → .env and fill values

## assets/

Static resources used by the app: icons, splash, and images. Prefer vector or optimized PNGs where possible to reduce bundle size.

## components/

Reusable UI components shared across app contexts.
- CommunitySafetyAlerts.js — Lists or displays nearby/community alerts
- DirectCommsWithAuth.js — Direct communication UI requiring authenticated user
- EmergencyButton.js — Primary panic button logic/UI
- EmergencyConatctList.js — Renders emergency contacts (NOTE: consider renaming to EmergencyContactList.js)

## BusinessUse/

Flows targeted at organizations/business responders.
- Authentication/ — Login/Register/ForgotPassword screens for business accounts

## PersonalUse/

End-user flows for personal safety.

- Authentication/
  - PersonalLogin.js — Sign-in screen
  - PersonalRegister.js — New account/sign-up screen
  - PersonalForgotPassword.js — Password reset flow

- Components/
  - AIAssistant.js — Client-side AI assistant UI
  - BioAuthGate.js — Biometric lock/auth gate component
  - PanicButton.js — Personal panic button logic/UI
  - PersonalNavbar.js — Navigation bar for personal use screens
  - SafetyAssistantOverlay.js — On-screen helper overlay during incidents

- LocationSharing/
  - FamilyMapView.js — Family/contacts map view
  - LocationSharing.js — Share/revoke live location logic/UI

- screens/
  - Homepage.js — Landing/home screen for personal users
  - AISafetyAssistantScreen.js — Host screen for the AI safety assistant
  - FamilyScreen.js — Family dashboard
  - ProfileScreen.js — User profile and settings
  - ReportsScreen.js — Incident reporting/history
  - SmartRouteScreen.js — Safer route planning

- Services/
  - AISafetyService.js — AI assistant orchestration (client-side)
  - APIService.js — API client wrapper for network calls

## Notes and recommendations

- Filename typo: components/EmergencyConatctList.js → consider renaming to EmergencyContactList.js to improve clarity
- Keep environment secrets out of source control; reference them via app.config.js and .env
- If you add new folders, create a README.md inside explaining purpose and how to use it
