# PersonalUse/Components

Components specific to personal-user experiences.

## Files

- AIAssistant.js — UI for the AI Safety Assistant embedded in flows
- BioAuthGate.js — Gatekeeping component using biometric authentication
- PanicButton.js — Personal panic trigger logic/UI for individual users
- PersonalNavbar.js — Navigation bar used by personal screens
- SafetyAssistantOverlay.js — Contextual overlay with safety tips/actions

## Guidance

- Keep these components presentational when possible; delegate network logic to `Services/`
- Share cross-feature components via the root `components/` folder
