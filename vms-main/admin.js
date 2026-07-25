// Admin Dashboard Page Logic
let currentUser = null;
let allVisitors = [];
let allEmployees = [];
let allDepartments = [];
let reportResults = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  currentUser = checkSession('admin');
  if (!currentUser) return;

  updateNavbar(currentUser);
  
  // Load initial dashboard stats
  fetchDashboardStats();
  fetchRecentVisitors();

  // Poll alerts
  fetchNotifications();
  setInterval(fetchNotifications, 5000);
});

// View switcher
function switchTab(tabId) {
  const tabs = ['dashboard', 'analytics', 'departments', 'employees', 'events', 'offices', 'navigation', 'visitors', 'reports'];
  tabs.forEach(t => {
    const el = document.getElementById(`${t}View`);
    if (el) el.style.display = t === tabId ? 'block' : 'none';
  });

  // Highlight active sidebar item
  const menuLinks = document.querySelectorAll('.sidebar-link');
  menuLinks.forEach(link => {
    // Exact matching for safety
    const text = link.innerText.toLowerCase();
    if (
      (tabId === 'analytics' && text.includes('analytics')) ||
      (tabId === 'departments' && text.includes('depts')) ||
      (tabId === 'employees' && text.includes('employees')) ||
      (tabId === 'events' && text.includes('events')) ||
      (tabId === 'offices' && text.includes('offices')) ||
      (tabId === 'navigation' && text.includes('navigation')) ||
      (tabId === 'visitors' && text.includes('visitors')) ||
      (tabId === 'reports' && text.includes('reports')) ||
      (tabId === 'dashboard' && text.includes('dashboard'))
    ) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update header title
  const titles = {
    dashboard: 'Admin Dashboard',
    analytics: 'Visit Analytics & Insights',
    departments: 'Manage Departments & Faculty',
    employees: 'Employee Registry',
    events: 'Manage College Events & Venues',
    offices: 'Configure Administrative Offices',
    navigation: 'Configure Campus Navigation Guides',
    visitors: 'All Visitor Entries',
    reports: 'Visitor Audit & Reports'
  };
  document.getElementById('currentTabTitle').innerText = titles[tabId] || 'Admin Portal';

  // Load specific tab data
  if (tabId === 'dashboard') {
    fetchDashboardStats();
    fetchRecentVisitors();
  } else if (tabId === 'analytics') {
    fetchAnalyticsData();
  } else if (tabId === 'departments') {
    fetchDepartments();
  } else if (tabId === 'employees') {
    fetchEmployees();
    loadDeptSelectOptions('newEmpDept'); // Populate dropdown in Add Employee Modal
  } else if (tabId === 'events') {
    fetchEvents();
    loadDeptSelectOptions('evtDept'); // Populate departments dropdown in Event Modal
  } else if (tabId === 'offices') {
    fetchOffices();
    fetchAdmissionSettings();
    fetchPlacementSettings();
  } else if (tabId === 'navigation') {
    fetchNavigation();
  } else if (tabId === 'visitors') {
    fetchVisitorsList();
  } else if (tabId === 'reports') {
    loadDeptSelectOptions('reportDept'); // Populate dropdown in Report Filter Panel
    resetReportFilters();
  }
}

// Fetch dashboard card stats
async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats');
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('statTotal').innerText = stats.total;
      document.getElementById('statPending').innerText = stats.pending;
      document.getElementById('statApproved').innerText = stats.approved;
      document.getElementById('statRejected').innerText = stats.rejected;
      document.getElementById('statInside').innerText = stats.checkedIn;
      document.getElementById('statCheckedOut').innerText = stats.checkedOut;
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
}

// Fetch and render recent visitors on main dashboard
async function fetchRecentVisitors() {
  try {
    const res = await fetch('/api/visitors');
    if (res.ok) {
      const visitors = await res.json();
      const recent = visitors.slice(0, 5); // Limit to top 5
      const tbody = document.getElementById('recentVisitorsTableBody');
      tbody.innerHTML = '';

      if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No records found.</td></tr>';
        return;
      }

      recent.forEach(v => {
        const tr = document.createElement('tr');
        let badgeClass = 'badge-pending';
        if (v.status === 'approved') badgeClass = 'badge-approved';
        else if (v.status === 'rejected') badgeClass = 'badge-rejected';
        else if (v.status === 'checked-in') badgeClass = 'badge-checked-in';
        else if (v.status === 'checked-out') badgeClass = 'badge-checked-out';

        tr.innerHTML = `
          <td>${v.visitDate}</td>
          <td style="font-weight:600;">${escapeHTML(v.name)}</td>
          <td>${escapeHTML(v.employeeName)}</td>
          <td>${escapeHTML(v.departmentName)}</td>
          <td>${v.checkInTime || v.expectedArrival || '-'}</td>
          <td><span class="badge ${badgeClass}">${escapeHTML(v.status)}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error fetching recent visitors:', error);
  }
}

// Helper to load department list into dropdowns
async function loadDeptSelectOptions(selectElementId) {
  try {
    const res = await fetch('/api/departments');
    if (res.ok) {
      const depts = await res.json();
      const select = document.getElementById(selectElementId);
      
      // Preserve first option (All / Select)
      const firstOpt = select.options[0] ? select.options[0].outerHTML : '<option value="">Select Option</option>';
      select.innerHTML = firstOpt;

      depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.innerText = d.name;
        select.appendChild(opt);
      });
    }
  } catch (error) {
    console.error('Error loading department dropdown:', error);
  }
}

// --- DEPARTMENTS CRUD ---
async function fetchDepartments() {
  try {
    const res = await fetch('/api/departments');
    if (res.ok) {
      allDepartments = await res.json();
      const tbody = document.getElementById('departmentsTableBody');
      tbody.innerHTML = '';

      if (allDepartments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No departments configured.</td></tr>';
        return;
      }

      allDepartments.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="font-weight:600; color:var(--primary);">${escapeHTML(d.code || '-')}</span><br><span style="font-size:0.75rem; color:var(--text-muted);">${d.id}</span></td>
          <td style="font-weight:600;">${escapeHTML(d.name)}</td>
          <td>${escapeHTML(d.block || '-')} / ${escapeHTML(d.floor || '-')} / ${escapeHTML(d.room || '-')}</td>
          <td>
            <strong>${escapeHTML(d.hodName || 'None')}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(d.hodPhone || '')}</span>
          </td>
          <td>${escapeHTML(d.timing || '-')}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openFacultyModal('${d.id}', '${escapeHTML(d.name)}')">👥 Faculty</button>
            <button class="btn btn-danger btn-sm" onclick="deleteDepartment('${d.id}')">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
  }
}

async function handleAddDept(e) {
  e.preventDefault();
  const name = document.getElementById('newDeptName').value.trim();

  try {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      showToast('Department created successfully!', 'success');
      document.getElementById('addDeptForm').reset();
      closeModal('addDeptModal');
      fetchDepartments();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to create department.', 'danger');
    }
  } catch (error) {
    console.error('Add department error:', error);
  }
}

async function deleteDepartment(id) {
  if (!confirm('Are you sure you want to delete this department? This will affect hosts linked to it.')) return;
  try {
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Department deleted successfully.', 'success');
      fetchDepartments();
    }
  } catch (error) {
    console.error('Delete department error:', error);
  }
}

// --- EMPLOYEES CRUD ---
async function fetchEmployees() {
  try {
    const res = await fetch('/api/employees');
    if (res.ok) {
      allEmployees = await res.json();
      const tbody = document.getElementById('employeesTableBody');
      tbody.innerHTML = '';

      if (allEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No employees registered.</td></tr>';
        return;
      }

      allEmployees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(emp.name)}</td>
          <td>${escapeHTML(emp.email)}</td>
          <td>${escapeHTML(emp.phone)}</td>
          <td><span style="color:#2563eb; font-weight:500;">${escapeHTML(emp.departmentName)}</span></td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp.id}')">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
  }
}

async function handleAddEmp(e) {
  e.preventDefault();
  const name = document.getElementById('newEmpName').value.trim();
  const email = document.getElementById('newEmpEmail').value.trim();
  const phone = document.getElementById('newEmpPhone').value.trim();
  const departmentId = document.getElementById('newEmpDept').value;

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile number.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, departmentId })
    });

    if (res.ok) {
      showToast('Employee host added successfully!', 'success');
      document.getElementById('addEmpForm').reset();
      closeModal('addEmpModal');
      fetchEmployees();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to add employee.', 'danger');
    }
  } catch (error) {
    console.error('Add employee error:', error);
  }
}

async function deleteEmployee(id) {
  if (!confirm('Are you sure you want to delete this employee? This will also remove their portal user login.')) return;
  try {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Employee deleted successfully.', 'success');
      fetchEmployees();
    }
  } catch (error) {
    console.error('Delete employee error:', error);
  }
}

// --- VISITORS LOG VIEW ---
async function fetchVisitorsList() {
  try {
    const res = await fetch('/api/visitors');
    if (res.ok) {
      allVisitors = await res.json();
      renderVisitorsTable(allVisitors);
    }
  } catch (error) {
    console.error('Error fetching visitor log:', error);
  }
}

function renderVisitorsTable(logs) {
  const tbody = document.getElementById('visitorsTableBody');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No visitor entries found.</td></tr>';
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
      <td>${v.checkInTime || '-'}</td>
      <td>${v.checkOutTime || '-'}</td>
      <td><span class="badge ${badgeClass}">${escapeHTML(v.status)}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditVisitor('${v.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteVisitor('${v.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function searchLogs() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  if (!query) {
    renderVisitorsTable(allVisitors);
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

  renderVisitorsTable(filtered);
}

// Edit Visitor operations
function openEditVisitor(id) {
  const visitor = allVisitors.find(v => v.id === id);
  if (!visitor) return;

  document.getElementById('editVisitorId').value = visitor.id;
  document.getElementById('editName').value = visitor.name;
  document.getElementById('editPhone').value = visitor.phone;
  document.getElementById('editEmail').value = visitor.email;
  document.getElementById('editPurpose').value = visitor.purpose;
  document.getElementById('editArrival').value = visitor.expectedArrival;
  document.getElementById('editExit').value = visitor.expectedExit;
  document.getElementById('editStatus').value = visitor.status;

  openModal('editVisitorModal');
}

async function handleEditVisitor(e) {
  e.preventDefault();
  const id = document.getElementById('editVisitorId').value;
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const purpose = document.getElementById('editPurpose').value.trim();
  const expectedArrival = document.getElementById('editArrival').value;
  const expectedExit = document.getElementById('editExit').value;
  const status = document.getElementById('editStatus').value;

  const payload = { name, phone, email, purpose, expectedArrival, expectedExit, status };

  try {
    const res = await fetch(`/api/visitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Visitor details updated!', 'success');
      closeModal('editVisitorModal');
      fetchVisitorsList();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to update details.', 'danger');
    }
  } catch (error) {
    console.error('Update visitor error:', error);
  }
}

async function deleteVisitor(id) {
  if (!confirm('Are you sure you want to permanently delete this visitor entry log?')) return;
  try {
    const res = await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Visitor record deleted.', 'success');
      fetchVisitorsList();
    }
  } catch (error) {
    console.error('Delete visitor error:', error);
  }
}

// --- REPORTS VIEW ---
function resetReportFilters() {
  document.getElementById('reportDept').value = '';
  document.getElementById('reportStatus').value = '';
  
  // Set defaults: Start of current month to today
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 2).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  document.getElementById('reportStartDate').value = startOfMonth;
  document.getElementById('reportEndDate').value = today;

  document.getElementById('reportOutputCard').style.display = 'none';
}

async function generateReport() {
  const deptId = document.getElementById('reportDept').value;
  const status = document.getElementById('reportStatus').value;
  const start = document.getElementById('reportStartDate').value;
  const end = document.getElementById('reportEndDate').value;

  try {
    const res = await fetch('/api/visitors');
    if (res.ok) {
      const allLogs = await res.json();

      // Filter local list
      reportResults = allLogs.filter(v => {
        const matchesDept = !deptId || v.departmentId === deptId;
        const matchesStatus = !status || v.status === status;
        
        let matchesDate = true;
        if (start) matchesDate = matchesDate && v.visitDate >= start;
        if (end) matchesDate = matchesDate && v.visitDate <= end;

        return matchesDept && matchesStatus && matchesDate;
      });

      renderReportTable();
    }
  } catch (error) {
    console.error('Generate report error:', error);
  }
}

function renderReportTable() {
  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = '';
  document.getElementById('reportOutputCard').style.display = 'block';
  document.getElementById('reportOutputTitle').innerText = `Report Results (${reportResults.length} records found)`;

  if (reportResults.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No records match the filter criteria.</td></tr>';
    return;
  }

  reportResults.forEach(v => {
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
      <td>${escapeHTML(v.employeeName)}</td>
      <td>${escapeHTML(v.departmentName)}</td>
      <td>${v.checkInTime || '-'}</td>
      <td>${v.checkOutTime || '-'}</td>
      <td><span class="badge ${badgeClass}">${escapeHTML(v.status)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Export report outputs to CSV
function exportReportCSV() {
  if (reportResults.length === 0) {
    showToast('Generate a report first before exporting.', 'warning');
    return;
  }

  // Define headers
  let csv = 'Date,Visitor Name,Phone,Purpose,Host Employee,Department,Check-In,Check-Out,Status\n';
  
  reportResults.forEach(v => {
    csv += `"${v.visitDate}","${v.name}","${v.phone}","${v.purpose}","${v.employeeName}","${v.departmentName}","${v.checkInTime || '-'}","${v.checkOutTime || '-'}","${v.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VMS_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// --- REAL-TIME NOTIFICATIONS ---

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
    console.error(err);
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
      ${n.type === 'overstayed' ? `<div style="margin-top:8px; text-align:right;"><button class="btn btn-danger btn-sm" onclick="checkOutOverstayedDirect('${n.visitorId}')">Checkout Visitor</button></div>` : ''}
    `;
    body.appendChild(div);
  });
}

async function checkOutOverstayedDirect(visitorId) {
  try {
    const res = await fetch(`/api/visitors/${visitorId}/checkout`, { method: 'PATCH' });
    if (res.ok) {
      showToast('Visitor Checked Out successfully!', 'success');
      fetchNotifications();
      if (document.getElementById('analyticsView').style.display === 'block') {
        fetchAnalyticsData();
      }
    }
  } catch (err) {
    console.error(err);
  }
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


// --- VISIT ANALYTICS ---

async function fetchAnalyticsData() {
  try {
    const res = await fetch('/api/analytics');
    if (res.ok) {
      const data = await res.json();
      
      // Update Summary Cards
      document.getElementById('statAvgDuration').innerText = `${data.timeStats.avgDuration} mins`;
      document.getElementById('statOverstayed').innerText = data.timeStats.overstayed;
      document.getElementById('statEarlyCheckouts').innerText = data.timeStats.earlyCheckouts;
      document.getElementById('statExtended').innerText = data.timeStats.extendedVisits;

      // Render Charts
      renderAnalyticsCharts(data);
      
      // Render Tables
      renderAnalyticsTables();
    }
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
}

let purposeChartInstance = null;
let deptChartInstance = null;
let peakChartInstance = null;
let trendChartInstance = null;

function renderAnalyticsCharts(data) {
  // 1. Purpose Chart
  const purposeCtx = document.getElementById('purposeChart').getContext('2d');
  if (purposeChartInstance) purposeChartInstance.destroy();
  const purpLabels = Object.keys(data.purposeCounts);
  const purpVals = Object.values(data.purposeCounts);
  purposeChartInstance = new Chart(purposeCtx, {
    type: 'doughnut',
    data: {
      labels: purpLabels,
      datasets: [{
        data: purpVals,
        backgroundColor: ['#1e3c72', '#2a5298', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#14b8a6', '#6b7280']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } }
    }
  });

  // 2. Dept Chart
  const deptCtx = document.getElementById('deptChart').getContext('2d');
  if (deptChartInstance) deptChartInstance.destroy();
  const deptLabels = Object.keys(data.deptCounts);
  const deptVals = Object.values(data.deptCounts);
  deptChartInstance = new Chart(deptCtx, {
    type: 'bar',
    data: {
      labels: deptLabels,
      datasets: [{ label: 'Visitors', data: deptVals, backgroundColor: '#3b82f6' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // 3. Peak Chart (8am to 6pm)
  const peakCtx = document.getElementById('peakChart').getContext('2d');
  if (peakChartInstance) peakChartInstance.destroy();
  const hours = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);
  const peakVals = data.timeStats.hourlyPeak.slice(8, 19);
  peakChartInstance = new Chart(peakCtx, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{ label: 'Check-ins', data: peakVals, backgroundColor: '#f59e0b' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // 4. Trend Chart
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  if (trendChartInstance) trendChartInstance.destroy();
  const trendLabels = Object.keys(data.trends.daily);
  const trendVals = Object.values(data.trends.daily);
  trendChartInstance = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trendLabels.map(l => l.substring(5)),
      datasets: [{
        label: 'Daily Count',
        data: trendVals,
        borderColor: '#10b981',
        tension: 0.25,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.08)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

async function renderAnalyticsTables() {
  try {
    const res = await fetch('/api/visitors');
    if (!res.ok) return;

    const list = await res.json();
    const now = new Date();

    const insideBody = document.getElementById('insideTableBody');
    const overdueBody = document.getElementById('overdueTableBody');

    insideBody.innerHTML = '';
    overdueBody.innerHTML = '';

    const inside = list.filter(v => v.status === 'checked-in');
    const overstayed = list.filter(v => v.status === 'checked-in' && v.expectedExitTime && new Date(v.expectedExitTime) < now);

    // Populate currently inside
    if (inside.length === 0) {
      insideBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No visitors currently inside.</td></tr>';
    } else {
      inside.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(v.name)}</td>
          <td><span class="badge badge-approved">${escapeHTML(v.purpose)}</span></td>
          <td>${v.checkInTime || '-'}</td>
          <td>${v.expectedExit || '-'}</td>
        `;
        insideBody.appendChild(tr);
      });
    }

    // Populate overstayed
    if (overstayed.length === 0) {
      overdueBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No overstayed visitors.</td></tr>';
    } else {
      overstayed.forEach(v => {
        const exitDate = new Date(v.expectedExitTime);
        const overMs = now - exitDate;
        const overMin = Math.round(overMs / 60000);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600; color:var(--danger);">${escapeHTML(v.name)}</td>
          <td>${escapeHTML(v.purpose)}</td>
          <td style="font-weight:600; color:var(--danger);">${overMin} mins</td>
          <td><button class="btn btn-danger btn-sm" onclick="checkOutOverstayedDirect('${v.id}')">Checkout</button></td>
        `;
        overdueBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}


// --- EVENTS CRUD ---

async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const list = await res.json();
      const tbody = document.getElementById('eventsTableBody');
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No events configured.</td></tr>';
        return;
      }

      list.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(e.name)}</td>
          <td>${escapeHTML(e.organizer)}</td>
          <td><strong>${escapeHTML(e.coordinator)}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(e.phone)}</span></td>
          <td>${escapeHTML(e.venue)}</td>
          <td>${escapeHTML(e.timing)}</td>
          <td><span class="badge badge-approved">${escapeHTML(e.status)}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteEvent('${e.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAddEvent(e) {
  e.preventDefault();
  const name = document.getElementById('evtName').value.trim();
  const organizer = document.getElementById('evtOrganizer').value.trim();
  const departmentId = document.getElementById('evtDept').value;
  const coordinator = document.getElementById('evtCoordinator').value.trim();
  const phone = document.getElementById('evtPhone').value.trim();
  const venue = document.getElementById('evtVenue').value.trim();
  const timing = document.getElementById('evtTiming').value.trim();
  const capacity = document.getElementById('evtCapacity').value;
  const status = document.getElementById('evtStatus').value;
  const building = document.getElementById('evtBuilding').value.trim();
  const room = document.getElementById('evtRoom').value.trim();
  const landmark = document.getElementById('evtLandmark').value.trim();

  const payload = { name, organizer, departmentId, coordinator, phone, venue, timing, capacity, status, building, room, landmark };

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Event created successfully!', 'success');
      document.getElementById('addEventForm').reset();
      closeModal('addEventModal');
      fetchEvents();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to add event.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteEvent(id) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Event deleted.', 'success');
      fetchEvents();
    }
  } catch (err) {
    console.error(err);
  }
}


// --- OFFICES & SETTINGS ---

async function fetchOffices() {
  try {
    const res = await fetch('/api/offices');
    if (res.ok) {
      const list = await res.json();
      const tbody = document.getElementById('officesTableBody');
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No administrative offices configured.</td></tr>';
        return;
      }

      list.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(o.name)}</td>
          <td>${escapeHTML(o.head || '-')}</td>
          <td>${escapeHTML(o.phone || '-')}</td>
          <td>${escapeHTML(o.email || '-')}</td>
          <td>${escapeHTML(o.timing || '-')}</td>
          <td>${escapeHTML(o.building || '-')} / ${escapeHTML(o.room || '-')}</td>
          <td><span class="badge badge-approved" style="font-size:0.7rem;">${escapeHTML(o.type)}</span></td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteOffice('${o.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAddOffice(e) {
  e.preventDefault();
  const name = document.getElementById('offName').value.trim();
  const head = document.getElementById('offHead').value.trim();
  const phone = document.getElementById('offPhone').value.trim();
  const email = document.getElementById('offEmail').value.trim();
  const timing = document.getElementById('offTiming').value.trim();
  const building = document.getElementById('offBuilding').value.trim();
  const room = document.getElementById('offRoom').value.trim();
  const type = document.getElementById('offType').value;

  const payload = { name, head, phone, email, timing, building, room, type };

  try {
    const res = await fetch('/api/offices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Office created!', 'success');
      document.getElementById('addOfficeForm').reset();
      closeModal('addOfficeModal');
      fetchOffices();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to create office.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteOffice(id) {
  if (!confirm('Are you sure you want to delete this office?')) return;
  try {
    const res = await fetch(`/api/offices/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Office deleted.', 'success');
      fetchOffices();
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchAdmissionSettings() {
  try {
    const res = await fetch('/api/admissions');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('admHead').value = data.head || '';
      document.getElementById('admPhone').value = data.phone || '';
      document.getElementById('admEmail').value = data.email || '';
      document.getElementById('admTiming').value = data.timing || '';
      document.getElementById('admBuilding').value = data.building || '';
      document.getElementById('admRoom').value = data.room || '';
    }
  } catch (err) {
    console.error(err);
  }
}

async function saveAdmissionSettings() {
  const head = document.getElementById('admHead').value.trim();
  const phone = document.getElementById('admPhone').value.trim();
  const email = document.getElementById('admEmail').value.trim();
  const timing = document.getElementById('admTiming').value.trim();
  const building = document.getElementById('admBuilding').value.trim();
  const room = document.getElementById('admRoom').value.trim();

  const payload = { officeName: "Admission Center", head, phone, email, timing, building, room, counselors: [{ name: "Mrs. Shalini", phone: "9876543245" }, { name: "Mr. Deepak", phone: "9876543246" }] };

  try {
    const res = await fetch('/api/admissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Admission settings saved!', 'success');
    } else {
      showToast('Failed to save settings.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchPlacementSettings() {
  try {
    const res = await fetch('/api/placement');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('plcOfficer').value = data.officer || '';
      document.getElementById('plcPhone').value = data.phone || '';
      document.getElementById('plcEmail').value = data.email || '';
      document.getElementById('plcLocation').value = data.officeLocation || '';
    }
  } catch (err) {
    console.error(err);
  }
}

async function savePlacementSettings() {
  const officer = document.getElementById('plcOfficer').value.trim();
  const phone = document.getElementById('plcPhone').value.trim();
  const email = document.getElementById('plcEmail').value.trim();
  const officeLocation = document.getElementById('plcLocation').value.trim();

  const payload = { cellName: "Placement Cell", officer, phone, email, officeLocation, activeDrives: [{ company: "TCS", venue: "Seminar Hall 1", interviewHall: "Seminar Hall 1 & Labs", location: "B-Block, Ground Floor" }, { company: "Cognizant", venue: "Seminar Hall 2", interviewHall: "Seminar Hall 2", location: "B-Block, 1st Floor" }] };

  try {
    const res = await fetch('/api/placement', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Placement settings saved!', 'success');
    } else {
      showToast('Failed to save placement settings.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}


// --- CAMPUS NAVIGATION CONFIG ---

async function fetchNavigation() {
  try {
    const res = await fetch('/api/navigation');
    if (res.ok) {
      const list = await res.json();
      const tbody = document.getElementById('navigationTableBody');
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No locations registered.</td></tr>';
        return;
      }

      list.forEach(n => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(n.name)}</td>
          <td>${escapeHTML(n.building || '-')}</td>
          <td>${escapeHTML(n.floor || '-')}</td>
          <td>${escapeHTML(n.room || '-')}</td>
          <td>${escapeHTML(n.landmark || '-')}</td>
          <td><span class="badge badge-approved">${escapeHTML(n.distance || '-')}</span></td>
          <td>${escapeHTML(n.walkingTime || '-')}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteNav('${n.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAddNav(e) {
  e.preventDefault();
  const name = document.getElementById('navName').value.trim();
  const building = document.getElementById('navBuilding').value.trim();
  const floor = document.getElementById('navFloor').value.trim();
  const room = document.getElementById('navRoom').value.trim();
  const landmark = document.getElementById('navLandmark').value.trim();
  const distance = document.getElementById('navDistance').value.trim();
  const walkingTime = document.getElementById('navWalking').value.trim();

  const payload = { name, building, floor, room, landmark, distance, walkingTime };

  try {
    const res = await fetch('/api/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Location setup saved!', 'success');
      document.getElementById('addNavForm').reset();
      closeModal('addNavModal');
      fetchNavigation();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to save location.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteNav(id) {
  if (!confirm('Are you sure you want to delete this navigation location?')) return;
  try {
    const res = await fetch(`/api/navigation/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Location deleted.', 'success');
      fetchNavigation();
    }
  } catch (err) {
    console.error(err);
  }
}


// --- DEPT FACULTY MEMBERS MANAGEMENT ---

let activeFacultyDeptId = '';

async function openFacultyModal(deptId, deptName) {
  activeFacultyDeptId = deptId;
  document.getElementById('facDeptId').value = deptId;
  document.getElementById('manageFacultyTitle').innerText = `Manage Faculty: ${deptName}`;
  
  await fetchFacultyMembers();
  openModal('manageFacultyModal');
}

async function fetchFacultyMembers() {
  try {
    const res = await fetch('/api/faculty');
    if (res.ok) {
      const list = await res.json();
      const filtered = list.filter(f => f.departmentId === activeFacultyDeptId);
      
      const tbody = document.getElementById('facTableBody');
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:10px;">No faculty members added yet.</td></tr>';
        return;
      }

      filtered.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(f.name)}</td>
          <td>${escapeHTML(f.designation)}</td>
          <td>${escapeHTML(f.phone)}</td>
          <td>${escapeHTML(f.email || '-')}</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteFacultyMember('${f.id}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleAddFacultyInline(e) {
  e.preventDefault();
  const name = document.getElementById('facName').value.trim();
  const designation = document.getElementById('facDesignation').value.trim();
  const phone = document.getElementById('facPhone').value.trim();
  const email = document.getElementById('facEmail').value.trim();

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number.', 'warning');
    return;
  }

  const payload = { name, designation, phone, email, departmentId: activeFacultyDeptId };

  try {
    const res = await fetch('/api/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Faculty member added successfully!', 'success');
      document.getElementById('addFacultyInlineForm').reset();
      document.getElementById('facDeptId').value = activeFacultyDeptId;
      fetchFacultyMembers();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to add member.', 'danger');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteFacultyMember(id) {
  if (!confirm('Are you sure you want to delete this faculty member?')) return;
  try {
    const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Faculty member removed.', 'success');
      fetchFacultyMembers();
    }
  } catch (err) {
    console.error(err);
  }
}
