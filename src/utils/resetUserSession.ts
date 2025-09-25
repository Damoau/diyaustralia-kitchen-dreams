// Utility to reset user session and local storage to simulate new visitor
export const resetUserSession = () => {
  // Clear all cabinet-related preferences
  localStorage.removeItem('cabinet_user_preferences');
  localStorage.removeItem('cabinet_assembly_preference');
  
  // Clear cart data
  localStorage.removeItem('cart_items');
  
  // Clear any other potential storage items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('cabinet') || key.includes('cart') || key.includes('preferences'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Refresh the page to reset all state
  window.location.reload();
};