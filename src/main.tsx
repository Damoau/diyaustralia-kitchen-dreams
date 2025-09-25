import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Reset user session to simulate new visitor
localStorage.removeItem('cabinet_user_preferences');
localStorage.removeItem('cabinet_assembly_preference');
localStorage.removeItem('cart_items');

// Clear any other cabinet/cart related storage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('cabinet') || key.includes('cart') || key.includes('preferences'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));

createRoot(document.getElementById("root")!).render(<App />);
