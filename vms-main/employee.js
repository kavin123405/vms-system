// Employee Portal Scripts
let currentUser = null;
let currentEmployeeProfile = null;
let myVisitors = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  currentUser = checkSession('employee');
  if (!currentUser) return;

  updateNavbar(currentUser);
  
  // Fetch initial profile & logs
  fetchProfileAndLogs();
});

// Switch view tabs
function switchTab(tabId) {
  const tabs = ['dashboard', 'requests', 'profile'];
  tabs.forEach(t => {
    const el = document.getElementById(`${t}View`);
    if (el) el.style.display = t === tabId ? 'block' : 'none';
  });

  // Update navigation styles
  const menuLinks = document.querySelectorAll('.sidebar-link');
  menuLinks.forEach(link => {
    if (link.innerText.toLowerCase().includes(tabId)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update navbar title
  const titles = {
    dashboard: 'Employee Dashboard',
    requests: 'Visitor Approval Requests',
    profile: 'My Profile'
  };
  document.getElementById('currentTabTitle').innerText = titles[tabId] || 'Employee Portal';

  if (tabId === 'dashboard') {
    fetchDashboardStats();
    fetchRequestsLog();
  } else if (tabId === 'requests') {
    fetchRequestsLog();
  } else if (tabId === 'profile') {
    populateProfileForm();
  }
}

// Fetch dashboard stats & visitor requests concurrently
async function fetchProfileAndLogs() {
  try {
    // 1. Fetch all employees to find this logged-in user's profile
    const empRes = await fetch('/api/employees');
    if (empRes.ok) {
      const list = await empRes.json();
      currentEmployeeProfile = list.find(e => e.userId === currentUser.id);
      
      if (currentEmployeeProfile) {
        // Load stats and log
        fetchDashboardStats();
        fetchRequestsLog();
      } else {
        showToast('Employee profile matching user was not found.', 'danger');
      }
    }
  } catch (error) {
    console.error('Error fetching employee profiles:', error);
  }
}

// Fetch stats for cards
async function fetchDashboardStats() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/dashboard/stats?role=employee&userId=${currentUser.id}`);
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('statTotal').innerText = stats.total;
      document.getElementById('statPending').innerText = stats.pending;
      document.getElementById('statApproved').innerText = stats.approved;
      document.getElementById('statRejected').innerText = stats.rejected;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

// Fetch visitor log assigned to this host employee
async function fetchRequestsLog() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/visitors?employeeUserId=${currentUser.id}`);
    if (res.ok) {
      myVisitors = await res.json();
      renderPendingRequests();
      renderHistoryTable(myVisitors);
    }
  } catch (error) {
    console.error('Error fetching requests list:', error);
  }
}

// Render active request card queue
function renderPendingRequests() {
  const tbody = document.getElementById('pendingRequestsTableBody');
  tbody.innerHTML = '';

  const pending = myVisitors.filter(v => v.status === 'pending');

  if (pending.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">
          No pending approvals waiting.
        </td>
      </tr>
    `;
    return;
  }

  pending.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${escapeHTML(v.name)}</td>
      <td>${escapeHTML(v.phone)}</td>
      <td>${v.visitDate}</td>
      <td>${v.expectedArrival} - ${v.expectedExit}</td>
      <td>${escapeHTML(v.purpose)}</td>
      <td>
        <button class="btn btn-success btn-sm" onclick="respondRequest('${v.id}', 'approved')">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="respondRequest('${v.id}', 'rejected')">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Handle Approve / Reject Actions
async function respondRequest(id, status) {
  const confirmMsg = `Are you sure you want to mark this request as ${status}?`;
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/visitors/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      showToast(`Visitor request has been ${status}!`, 'success');
      
      // Update local storage name if employee approved/rejected so dashboard updates
      fetchDashboardStats();
      fetchRequestsLog();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to update request status.', 'danger');
    }
  } catch (error) {
    console.error('Respond request error:', error);
    showToast('Failed to connect to server.', 'danger');
  }
}

// Render visitor requests history
function renderHistoryTable(logs) {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No visitor logs recorded.</td></tr>';
    return;
  }

  logs.forEach(v => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-pending';
    if (v.status === 'approved') badgeClass = 'badge-approved';
    else if (v.status === 'rejected') badgeClass = 'badge-rejected';
    else if (v.status === 'checked-in') badgeClass = 'badge-checked-in';
    else if (v.status === 'checked-out') badgeClass = 'badge-checked-out';

    tr.innerHTML = `
      <td>${v.visitDate}</td>
      <td style="font-weight:600;">${escapeHTML(v.name)}</td>
      <td>${escapeHTML(v.phone)}</td>
      <td>${escapeHTML(v.purpose)}</td>
      <td>${v.checkInTime || '-'}</td>
      <td>${v.checkOutTime || '-'}</td>
      <td><span class="badge ${badgeClass}">${escapeHTML(v.status)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Search filters client-side
function searchRequests() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  if (!query) {
    renderHistoryTable(myVisitors);
    return;
  }

  const filtered = myVisitors.filter(v => {
    return (
      v.name.toLowerCase().includes(query) ||
      v.phone.includes(query) ||
      v.purpose.toLowerCase().includes(query)
    );
  });

  renderHistoryTable(filtered);
}

// Populate the profile edit inputs
function populateProfileForm() {
  if (!currentEmployeeProfile) return;
  document.getElementById('profName').value = currentEmployeeProfile.name;
  document.getElementById('profEmail').value = currentEmployeeProfile.email;
  document.getElementById('profPhone').value = currentEmployeeProfile.phone;
  document.getElementById('profPassword').value = '';
}

// Handle Update Profile Dispatch
async function handleProfileUpdate(e) {
  e.preventDefault();

  if (!currentEmployeeProfile) return;

  const name = document.getElementById('profName').value.trim();
  const email = document.getElementById('profEmail').value.trim();
  const phone = document.getElementById('profPhone').value.trim();
  const password = document.getElementById('profPassword').value;

  const payload = {
    name, email, phone
  };
  if (password) {
    payload.password = password;
  }

  const btn = document.getElementById('profileSubmitBtn');
  btn.disabled = true;
  btn.innerText = 'Updating...';

  try {
    const res = await fetch(`/api/employees/${currentEmployeeProfile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Profile updated successfully!', 'success');
      
      // Update session values locally
      currentUser.name = name;
      currentUser.email = email;
      localStorage.setItem('vms_user', JSON.stringify(currentUser));
      updateNavbar(currentUser);

      // Re-fetch employee profile object
      fetchProfileAndLogs();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to update profile.', 'danger');
    }
  } catch (error) {
    console.error('Update profile error:', error);
    showToast('Failed to connect to server.', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Update Profile';
  }
}

// Expose functions globally for HTML event handlers and navigation
window.switchTab = switchTab;
window.respondRequest = respondRequest;
window.searchRequests = searchRequests;
window.handleProfileUpdate = handleProfileUpdate;

