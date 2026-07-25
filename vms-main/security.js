// Security Guard Portal Scripts
let currentUser = null;
let allVisitors = [];
let allEmployees = [];
let allDepartments = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  currentUser = checkSession('security');
  if (!currentUser) return;

  updateNavbar(currentUser);
  
  // Set default registration date to today
  document.getElementById('regDate').value = new Date().toISOString().split('T')[0];

  // Fetch initial data
  fetchInitialData();
  fetchDashboardData();
  
  // Poll notifications
  fetchNotifications();
  setInterval(fetchNotifications, 5000);
});

// Switch view tabs
function switchTab(tabId) {
  const tabs = ['dashboard', 'register', 'search'];
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
    dashboard: 'Security Dashboard',
    register: 'Register Walk-In Visitor',
    search: 'Visitor Log Search'
  };
  document.getElementById('currentTabTitle').innerText = titles[tabId] || 'Security Guard';

  if (tabId === 'dashboard') {
    fetchDashboardData();
  } else if (tabId === 'search') {
    fetchVisitorsList();
  }
}

// Fetch lists of employees and departments for form selects
async function fetchInitialData() {
  try {
    const [deptRes, empRes] = await Promise.all([
      fetch('/api/departments'),
      fetch('/api/employees')
    ]);

    if (deptRes.ok && empRes.ok) {
      allDepartments = await deptRes.json();
      allEmployees = await empRes.json();

      populateDepartmentSelects();
    }
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    showToast('Failed to load department or employee data.', 'danger');
  }
}

// Populate department selector
function populateDepartmentSelects() {
  const select = document.getElementById('regDepartment');
  select.innerHTML = '<option value="">Select Department</option>';
  allDepartments.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.innerText = d.name;
    select.appendChild(opt);
  });
}

// Handle department filter update for host employee dropdown
function onDepartmentChange() {
  const deptId = document.getElementById('regDepartment').value;
  const empSelect = document.getElementById('regEmployee');
  
  empSelect.innerHTML = '<option value="">Select Employee</option>';

  if (!deptId) return;

  const filtered = allEmployees.filter(e => e.departmentId === deptId);
  filtered.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.innerText = e.name;
    empSelect.appendChild(opt);
  });
}

// Fetch dashboard stats & actionable visitor entries
async function fetchDashboardData() {
  try {
    const [statsRes, listRes] = await Promise.all([
      fetch('/api/dashboard/stats'),
      fetch('/api/visitors')
    ]);

    if (statsRes.ok && listRes.ok) {
      const stats = await statsRes.json();
      allVisitors = await listRes.json();

      // Update counters
      document.getElementById('statToday').innerText = stats.today;
      document.getElementById('statInside').innerText = stats.checkedIn;
      document.getElementById('statCheckedOut').innerText = stats.checkedOut;

      renderDashboardTables();
    }
  } catch (error) {
    console.error('Error fetching dashboard status:', error);
  }
}

// Render check-in / check-out dashboard sub-tables
function renderDashboardTables() {
  const approvedBody = document.getElementById('approvedTableBody');
  const checkedInBody = document.getElementById('checkedInTableBody');

  approvedBody.innerHTML = '';
  checkedInBody.innerHTML = '';

  const approved = allVisitors.filter(v => v.status === 'approved');
  const checkedIn = allVisitors.filter(v => v.status === 'checked-in');

  // Populate Approved (Ready for Check-In)
  if (approved.length === 0) {
    approvedBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No approved visitors waiting.</td></tr>';
  } else {
    approved.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${escapeHTML(v.name)}<br><span style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(v.phone)}</span></td>
        <td>${escapeHTML(v.employeeName)}<br><span style="font-size:0.75rem;color:#2563eb;">${escapeHTML(v.departmentName)}</span></td>
        <td>${v.expectedArrival}</td>
        <td><button class="btn btn-primary btn-sm" onclick="checkInVisitor('${v.id}')">Check In</button></td>
      `;
      approvedBody.appendChild(tr);
    });
  }

  // Populate Checked-In (Ready for Check-Out)
  if (checkedIn.length === 0) {
    checkedInBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No visitors currently inside.</td></tr>';
  } else {
    checkedIn.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${escapeHTML(v.name)}<br><span style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(v.phone)}</span></td>
        <td>${escapeHTML(v.employeeName)}<br><span style="font-size:0.75rem;color:#2563eb;">${escapeHTML(v.departmentName)}</span></td>
        <td style="font-weight:600; color:var(--info);">${v.checkInTime}</td>
        <td><button class="btn btn-danger btn-sm" onclick="checkOutVisitor('${v.id}')">Check Out</button></td>
      `;
      checkedInBody.appendChild(tr);
    });
  }
}

// Verify and Check In Visitor
async function checkInVisitor(id) {
  try {
    const res = await fetch(`/api/visitors/${id}/checkin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      showToast('Visitor Checked In successfully!', 'success');
      fetchDashboardData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to check in.', 'danger');
    }
  } catch (error) {
    console.error('Checkin error:', error);
    showToast('Failed to connect to server.', 'danger');
  }
}

// Check Out Visitor
async function checkOutVisitor(id) {
  try {
    const res = await fetch(`/api/visitors/${id}/checkout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      showToast('Visitor Checked Out successfully!', 'success');
      fetchDashboardData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to check out.', 'danger');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Failed to connect to server.', 'danger');
  }
}

// Handle Form Submission
async function handleRegistration(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const gender = document.getElementById('regGender').value;
  const address = document.getElementById('regAddress').value.trim();
  const departmentId = document.getElementById('regDepartment').value;
  const employeeId = document.getElementById('regEmployee').value;
  const purpose = document.getElementById('regPurpose').value.trim();
  const visitDate = document.getElementById('regDate').value;
  const expectedArrival = document.getElementById('regArrival').value;
  const expectedDuration = document.getElementById('regDuration').value;
  const govId = document.getElementById('regGovId').value.trim();
  const vehicleNum = document.getElementById('regVehicle').value.trim();

  // Validate phone (10-digit)
  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile number.', 'warning');
    document.getElementById('regPhone').focus();
    return;
  }

  const payload = {
    name, phone, email, gender, address, purpose,
    employeeId, departmentId, visitDate, expectedArrival,
    govId, vehicleNum, expectedDuration,
    expectedExit: ''
  };

  const btn = document.getElementById('regSubmitBtn');
  btn.disabled = true;
  btn.innerText = 'Registering...';

  try {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Visitor registered successfully! Awaiting Employee Approval.', 'success');
      resetRegisterForm();
      switchTab('dashboard');
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to register visitor.', 'danger');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Failed to connect to server.', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Register Walk-In';
  }
}

// Reset form values
function resetRegisterForm() {
  document.getElementById('visitorRegisterForm').reset();
  document.getElementById('regDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('regEmployee').innerHTML = '<option value="">Select Employee</option>';
  document.getElementById('regDuration').value = '1 Hour';
}

// Fetch visitors for full search list
async function fetchVisitorsList() {
  try {
    const res = await fetch('/api/visitors');
    if (res.ok) {
      allVisitors = await res.json();
      renderSearchTable(allVisitors);
    }
  } catch (error) {
    console.error('Error fetching visitor log:', error);
  }
}

// Render full search logs table
function renderSearchTable(logs) {
  const tbody = document.getElementById('searchTableBody');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No matching visitor logs found.</td></tr>';
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
      <td>${escapeHTML(v.employeeName)}</td>
      <td>${escapeHTML(v.departmentName)}</td>
      <td>${v.checkInTime || v.expectedArrival || '-'}</td>
      <td>${v.checkOutTime || v.expectedExit || '-'}</td>
      <td><span class="badge ${badgeClass}">${escapeHTML(v.status)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Search and filter logs client-side
function searchLogs() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  if (!query) {
    renderSearchTable(allVisitors);
    return;
  }

  const filtered = allVisitors.filter(v => {
    return (
      v.name.toLowerCase().includes(query) ||
      v.phone.includes(query) ||
      v.employeeName.toLowerCase().includes(query) ||
      v.departmentName.toLowerCase().includes(query) ||
      v.purpose.toLowerCase().includes(query)
    );
  });

  renderSearchTable(filtered);
}

// --- NOTIFICATIONS HANDLERS ---

async function fetchNotifications() {
  try {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const list = await res.json();
      const unread = list.filter(n => !n.read);
      
      const badge = document.getElementById('notifBadge');
      if (badge) {
        if (unread.length > 0) {
          badge.innerText = unread.length;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }

      const body = document.getElementById('notifListBody');
      if (body && document.getElementById('notificationsPanel').style.display === 'flex') {
        renderNotificationsList(list);
      }
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
}

function toggleNotificationsPanel() {
  const panel = document.getElementById('notificationsPanel');
  if (panel.style.display === 'flex') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'flex';
    fetchNotifications();
  }
}

function renderNotificationsList(list) {
  const body = document.getElementById('notifListBody');
  body.innerHTML = '';

  if (list.length === 0) {
    body.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">No alerts.</div>';
    return;
  }

  const sorted = list.slice(-20).reverse();
  sorted.forEach(n => {
    const div = document.createElement('div');
    div.style.padding = '12px';
    div.style.borderRadius = '8px';
    div.style.fontSize = '0.9rem';
    div.style.border = '1px solid var(--border-slate)';
    div.style.marginBottom = '10px';
    
    let color = '#3b82f6';
    let title = 'System Alert';
    
    if (n.type === 'reached') { color = '#f59e0b'; title = 'Exit Reached'; }
    else if (n.type === 'overstayed') { color = '#ef4444'; title = 'OVERSTAYED'; }
    else if (n.type === 'check-in') { color = '#10b981'; title = 'Check-In'; }
    else if (n.type === 'check-out') { color = '#6b7280'; title = 'Check-Out'; }
    else if (n.type === 'extended') { color = '#8b5cf6'; title = 'Extended stay'; }

    div.style.borderLeft = `4px solid ${color}`;
    div.style.backgroundColor = n.read ? '#f8fafc' : '#eff6ff';

    const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--primary-dark); font-size:0.8rem; margin-bottom:4px;">
        <span>${title}</span>
        <span style="color:var(--text-muted); font-weight:400;">${timeStr}</span>
      </div>
      <div style="color:var(--text-dark);">${escapeHTML(n.message)}</div>
      ${n.type === 'overstayed' ? `<div style="margin-top:8px; text-align:right;"><button class="btn btn-danger btn-sm" onclick="checkOutVisitorDirect('${n.visitorId}')">Checkout Visitor</button></div>` : ''}
    `;
    body.appendChild(div);
  });
}

async function checkOutVisitorDirect(visitorId) {
  await checkOutVisitor(visitorId);
  fetchNotifications();
}

async function markAllNotificationsRead() {
  try {
    const res = await fetch('/api/notifications/read', { method: 'POST' });
    if (res.ok) {
      fetchNotifications();
      showToast('Alerts cleared.', 'success');
    }
  } catch (err) {
    console.error(err);
  }
}
