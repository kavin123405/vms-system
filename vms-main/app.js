import './mock-api.js';

// Shared Frontend Utilities

// API Base URL
const API_URL = ''; // Uses relative paths since Vite proxies them


// Check if user session is valid and has correct role
function checkSession(requiredRole) {
  const userJson = localStorage.getItem('vms_user');
  
  if (!userJson) {
    window.location.href = 'index.html';
    return null;
  }

  const session = JSON.parse(userJson);

  if (requiredRole && session.role !== requiredRole) {
    // Redirect to correct dashboard based on actual role
    if (session.role === 'admin') window.location.href = 'admin.html';
    else if (session.role === 'employee') window.location.href = 'employee.html';
    else if (session.role === 'security') window.location.href = 'security.html';
    return null;
  }

  return session;
}

// Perform Logout
function logout() {
  localStorage.removeItem('vms_user');
  window.location.href = 'index.html';
}

// Display Toast alert
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Populates User Name and Role Badge in Header
function updateNavbar(user) {
  if (!user) return;
  const nameEl = document.getElementById('navUserName');
  const roleEl = document.getElementById('navUserRole');
  
  if (nameEl) nameEl.innerText = user.name;
  if (roleEl) roleEl.innerText = user.role;
}

// Escape HTML characters to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Standard modal handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

// Expose functions globally for non-module inline scripts and event handlers
window.checkSession = checkSession;
window.logout = logout;
window.showToast = showToast;
window.updateNavbar = updateNavbar;
window.escapeHTML = escapeHTML;
window.openModal = openModal;
window.closeModal = closeModal;

