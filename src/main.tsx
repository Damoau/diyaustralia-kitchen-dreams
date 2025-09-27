import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from './providers/QueryProvider.tsx';

// Only reset user session on specific conditions (not every page load)
const shouldResetSession = () => {
  // Reset if it's a fresh browser session (no sessionStorage data)
  const hasSessionData = sessionStorage.getItem('last_valid_route');
  const isNewSession = !hasSessionData;
  
  // Reset if there was a navigation error
  const hasNavigationError = localStorage.getItem('navigation_error');
  
  return isNewSession || hasNavigationError;
};

if (shouldResetSession()) {
  console.log('Resetting user session due to fresh start or navigation error');
  
  // Reset user session to simulate new visitor
  localStorage.removeItem('cabinet_user_preferences');
  localStorage.removeItem('cabinet_assembly_preference');
  localStorage.removeItem('cart_items');
  localStorage.removeItem('navigation_error');
  
  // Clear any other cabinet/cart related storage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('cabinet') || key.includes('cart') || key.includes('preferences'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
);
