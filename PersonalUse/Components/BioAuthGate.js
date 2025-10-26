import React from 'react';

// Lightweight placeholder gate: simply renders children.
// You can upgrade this to use expo-local-authentication for real biometric checks.
export default function BioAuthGate({ children }) {
  return children;
}
