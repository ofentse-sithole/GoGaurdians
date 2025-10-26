# BusinessUse

Screens and flows tailored for business/organization users (e.g., security providers, dispatch, or enterprise accounts).

## Structure

- Authentication/
  - BusinessLogin.js — Sign-in screen for business accounts
  - BusinessRegister.js — Registration for new business/organization users
  - BusinessForgotPassword.js — Password reset for business users

## Conventions

- Keep business-specific UI and logic isolated from personal flows
- Prefer shared components from `components/` when possible
- Route names and params should be namespaced to avoid conflicts with personal flows
