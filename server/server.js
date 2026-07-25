import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Success: Return user details without password
  const { password: _, ...userProfile } = user;
  res.json({ user: userProfile });
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', (req, res) => {
  const { role, userId } = req.query;
  let visitors = db.getVisitors();
  const employees = db.getEmployees();

  // If role is employee, filter statistics to visitors assigned to this employee
  if (role === 'employee' && userId) {
    const employee = employees.find(e => e.userId === userId);
    if (employee) {
      visitors = visitors.filter(v => v.employeeId === employee.id);
    } else {
      visitors = [];
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const total = visitors.length;
  const today = visitors.filter(v => v.visitDate === todayStr).length;
  const pending = visitors.filter(v => v.status === 'pending').length;
  const approved = visitors.filter(v => v.status === 'approved').length;
  const rejected = visitors.filter(v => v.status === 'rejected').length;
  const checkedIn = visitors.filter(v => v.status === 'checked-in').length;
  const checkedOut = visitors.filter(v => v.status === 'checked-out').length;

  res.json({ total, today, pending, approved, rejected, checkedIn, checkedOut });
});

// --- DEPARTMENTS CRUD ---
app.get('/api/departments', (req, res) => {
  res.json(db.getDepartments());
});

app.post('/api/departments', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required.' });

  const depts = db.getDepartments();
  const newDept = {
    id: 'dept-' + Date.now(),
    name
  };
  depts.push(newDept);
  db.saveDepartments(depts);
  res.status(201).json(newDept);
});

app.delete('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  let depts = db.getDepartments();
  depts = depts.filter(d => d.id !== id);
  db.saveDepartments(depts);
  res.json({ success: true });
});

// --- EMPLOYEES CRUD ---
app.get('/api/employees', (req, res) => {
  const employees = db.getEmployees();
  const departments = db.getDepartments();

  // Join department name
  const enriched = employees.map(emp => {
    const dept = departments.find(d => d.id === emp.departmentId);
    return {
      ...emp,
      departmentName: dept ? dept.name : 'Unknown Department'
    };
  });
  res.json(enriched);
});

app.post('/api/employees', (req, res) => {
  const { name, email, phone, departmentId } = req.body;
  if (!name || !email || !phone || !departmentId) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = db.getUsers();
  const employees = db.getEmployees();

  // Verify email does not already exist
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already exists.' });
  }

  const userId = 'u-' + Date.now();
  const employeeId = 'emp-' + Date.now();

  // 1. Create Login User (default password is 'employee123')
  const newUser = {
    id: userId,
    email,
    password: 'employee123',
    name,
    role: 'employee'
  };

  // 2. Create Employee profile
  const newEmployee = {
    id: employeeId,
    userId,
    name,
    email,
    phone,
    departmentId
  };

  users.push(newUser);
  employees.push(newEmployee);

  db.saveUsers(users);
  db.saveEmployees(employees);

  res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, departmentId } = req.body;

  const employees = db.getEmployees();
  const users = db.getUsers();

  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Employee not found.' });

  // Update employee profile
  employees[idx].name = name || employees[idx].name;
  employees[idx].phone = phone || employees[idx].phone;
  employees[idx].departmentId = departmentId || employees[idx].departmentId;

  // If email changes, check unique constraints and update users login table
  if (email && email.toLowerCase() !== employees[idx].email.toLowerCase()) {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== employees[idx].userId)) {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    employees[idx].email = email;
    const uIdx = users.findIndex(u => u.id === employees[idx].userId);
    if (uIdx !== -1) {
      users[uIdx].email = email;
    }
  }

  // Update associated user's name and password
  const uIdx = users.findIndex(u => u.id === employees[idx].userId);
  if (uIdx !== -1) {
    if (name) users[uIdx].name = name;
    if (password) users[uIdx].password = password;
  }

  db.saveEmployees(employees);
  db.saveUsers(users);

  res.json(employees[idx]);
});

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  let employees = db.getEmployees();
  let users = db.getUsers();

  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  // Filter out employee and user
  employees = employees.filter(e => e.id !== id);
  users = users.filter(u => u.id !== emp.userId);

  db.saveEmployees(employees);
  db.saveUsers(users);

  res.json({ success: true });
});

// --- VISITORS CRUD & WORKFLOWS ---

function getDurationMinutes(durationStr) {
  if (!durationStr) return 60;
  const d = durationStr.toLowerCase();
  if (d.includes('15')) return 15;
  if (d.includes('30')) return 30;
  if (d.includes('45')) return 45;
  if (d.includes('1 hour') || d === '1hr') return 60;
  if (d.includes('2 hour') || d === '2hr') return 120;
  if (d.includes('3 hour') || d === '3hr') return 180;
  if (d.includes('half day')) return 240;
  if (d.includes('full day')) return 480;
  return 60;
}

app.get('/api/visitors', (req, res) => {
  const { employeeUserId } = req.query;
  let visitors = db.getEnrichedVisitors();

  // If employeeUserId is passed, filter visitors assigned to this employee's ID
  if (employeeUserId) {
    const employees = db.getEmployees();
    const emp = employees.find(e => e.userId === employeeUserId);
    if (emp) {
      visitors = visitors.filter(v => v.employeeId === emp.id);
    } else {
      visitors = [];
    }
  }

  res.json(visitors);
});

app.post('/api/visitors', (req, res) => {
  const {
    name, phone, email, gender, address, purpose,
    employeeId, departmentId, visitDate, expectedArrival, expectedExit,
    govId, vehicleNum, expectedDuration, eventId, officeId
  } = req.body;

  if (!name || !phone || !purpose || !visitDate || !expectedArrival) {
    return res.status(400).json({ error: 'Name, phone, purpose, visit date and arrival time are required.' });
  }

  const visitors = db.getVisitors();
  
  // Calculate expected exit time on registration if expected duration is provided
  let calculatedExit = expectedExit || '';
  let calculatedExitTime = null;
  if (expectedDuration && expectedDuration !== 'Custom') {
    const durationMin = getDurationMinutes(expectedDuration);
    try {
      const [arrHour, arrMin] = expectedArrival.split(':');
      const targetDate = new Date(visitDate);
      targetDate.setHours(parseInt(arrHour), parseInt(arrMin), 0, 0);
      calculatedExitTime = new Date(targetDate.getTime() + durationMin * 60 * 1000).toISOString();
      
      const hours = new Date(calculatedExitTime).getHours().toString().padStart(2, '0');
      const minutes = new Date(calculatedExitTime).getMinutes().toString().padStart(2, '0');
      calculatedExit = `${hours}:${minutes}`;
    } catch (e) {
      console.error('Failed to parse arrival time in registration:', e);
    }
  }

  const newVisitor = {
    id: 'v-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name,
    phone,
    email: email || '',
    gender: gender || 'Not Specified',
    address: address || '',
    purpose,
    employeeId: employeeId || 'none',
    departmentId: departmentId || 'none',
    eventId: eventId || 'none',
    officeId: officeId || 'none',
    visitDate,
    expectedArrival,
    expectedExit: calculatedExit,
    expectedDuration: expectedDuration || '1 Hour',
    expectedExitTime: calculatedExitTime,
    govId: govId || '',
    vehicleNum: vehicleNum || '',
    checkInTime: null,
    checkOutTime: null,
    actualCheckInTime: null,
    actualCheckOutTime: null,
    reminderCount: 0,
    lastReminderSent: null,
    reminderStatus: 'none',
    visitStatus: 'registered',
    extensionRequested: false,
    extendedUntil: null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  visitors.push(newVisitor);
  db.saveVisitors(visitors);

  // Create system notification for new registration
  const notifications = db.getNotifications();
  notifications.push({
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    visitorId: newVisitor.id,
    visitorName: newVisitor.name,
    type: 'registration',
    message: `New visitor registration: ${newVisitor.name} for ${newVisitor.purpose}.`,
    timestamp: new Date().toISOString(),
    read: false
  });
  db.saveNotifications(notifications);

  res.status(201).json(newVisitor);
});

// Update Visitor details (Admin Only)
app.put('/api/visitors/:id', (req, res) => {
  const { id } = req.params;
  const visitors = db.getVisitors();
  const idx = visitors.findIndex(v => v.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Visitor record not found.' });

  // Update allowed details
  const fields = ['name', 'phone', 'email', 'gender', 'address', 'purpose', 'employeeId', 'departmentId', 'eventId', 'officeId', 'visitDate', 'expectedArrival', 'expectedExit', 'expectedDuration', 'expectedExitTime', 'govId', 'vehicleNum', 'status', 'visitStatus', 'checkInTime', 'checkOutTime', 'actualCheckInTime', 'actualCheckOutTime'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      visitors[idx][field] = req.body[field];
    }
  });

  db.saveVisitors(visitors);
  res.json(visitors[idx]);
});

// Delete Visitor record (Admin Only)
app.delete('/api/visitors/:id', (req, res) => {
  const { id } = req.params;
  let visitors = db.getVisitors();
  visitors = visitors.filter(v => v.id !== id);
  db.saveVisitors(visitors);
  res.json({ success: true });
});

// Approve or Reject Visitor (Employee Workflow)
app.patch('/api/visitors/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
  }

  const visitors = db.getVisitors();
  const idx = visitors.findIndex(v => v.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Visitor record not found.' });

  // Safety check: Status can only be changed if it is currently pending
  if (visitors[idx].status !== 'pending') {
    return res.status(400).json({ error: `Cannot change status. Visitor request is already ${visitors[idx].status}.` });
  }

  visitors[idx].status = status;
  db.saveVisitors(visitors);
  res.json(visitors[idx]);
});

// Check-In Visitor (Security Workflow)
app.patch('/api/visitors/:id/checkin', (req, res) => {
  const { id } = req.params;
  const visitors = db.getVisitors();
  const idx = visitors.findIndex(v => v.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Visitor record not found.' });

  // Relax employee approval for office work / event / admissions / principal
  if (visitors[idx].employeeId !== 'none' && visitors[idx].employeeId !== '' && visitors[idx].status !== 'approved') {
    return res.status(400).json({ error: 'Only approved visitors can be checked in.' });
  }

  const now = new Date();
  const durationMin = getDurationMinutes(visitors[idx].expectedDuration);

  visitors[idx].status = 'checked-in';
  visitors[idx].visitStatus = 'checked-in';
  visitors[idx].checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  visitors[idx].actualCheckInTime = now.toISOString();
  
  // Recalculate Expected Exit Time from check-in moment
  const expectedExitDate = new Date(now.getTime() + durationMin * 60 * 1000);
  visitors[idx].expectedExitTime = expectedExitDate.toISOString();
  
  const hours = expectedExitDate.getHours().toString().padStart(2, '0');
  const minutes = expectedExitDate.getMinutes().toString().padStart(2, '0');
  visitors[idx].expectedExit = `${hours}:${minutes}`;
  
  visitors[idx].reminderCount = 0;
  visitors[idx].reminderStatus = 'none';

  db.saveVisitors(visitors);

  // Create system notification
  const notifications = db.getNotifications();
  notifications.push({
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    visitorId: visitors[idx].id,
    visitorName: visitors[idx].name,
    type: 'check-in',
    message: `Visitor ${visitors[idx].name} has checked in.`,
    timestamp: now.toISOString(),
    read: false
  });
  db.saveNotifications(notifications);

  res.json(visitors[idx]);
});

// Check-Out Visitor (Security Workflow)
app.patch('/api/visitors/:id/checkout', (req, res) => {
  const { id } = req.params;
  const visitors = db.getVisitors();
  const idx = visitors.findIndex(v => v.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Visitor record not found.' });

  if (visitors[idx].status !== 'checked-in') {
    return res.status(400).json({ error: 'Only checked-in visitors can be checked out.' });
  }

  const now = new Date();
  visitors[idx].status = 'checked-out';
  visitors[idx].visitStatus = 'checked-out';
  visitors[idx].checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  visitors[idx].actualCheckOutTime = now.toISOString();
  visitors[idx].reminderStatus = 'dismissed';

  db.saveVisitors(visitors);

  // Create system notification
  const notifications = db.getNotifications();
  notifications.push({
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    visitorId: visitors[idx].id,
    visitorName: visitors[idx].name,
    type: 'check-out',
    message: `Visitor ${visitors[idx].name} has checked out.`,
    timestamp: now.toISOString(),
    read: false
  });
  db.saveNotifications(notifications);

  res.json(visitors[idx]);
});

// Extend Visitor Expected Stay (Visitor Workflow)
app.patch('/api/visitors/:id/extend', (req, res) => {
  const { id } = req.params;
  const { extraMinutes } = req.body;
  if (!extraMinutes) return res.status(400).json({ error: 'Extra minutes are required.' });

  const visitors = db.getVisitors();
  const idx = visitors.findIndex(v => v.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Visitor record not found.' });

  if (visitors[idx].status !== 'checked-in') {
    return res.status(400).json({ error: 'Only checked-in visitors can extend stay.' });
  }

  const now = new Date();
  let baseTime = new Date(visitors[idx].expectedExitTime || now);
  if (baseTime < now) baseTime = now;

  const newExit = new Date(baseTime.getTime() + parseInt(extraMinutes) * 60 * 1000);
  visitors[idx].expectedExitTime = newExit.toISOString();
  
  const hours = newExit.getHours().toString().padStart(2, '0');
  const minutes = newExit.getMinutes().toString().padStart(2, '0');
  visitors[idx].expectedExit = `${hours}:${minutes}`;

  visitors[idx].reminderCount = 0; // reset reminders
  visitors[idx].reminderStatus = 'none';
  visitors[idx].visitStatus = 'checked-in'; // reset overstayed
  visitors[idx].extensionRequested = true;
  visitors[idx].extendedUntil = newExit.toISOString();

  db.saveVisitors(visitors);

  // Create notification
  const notifications = db.getNotifications();
  notifications.push({
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    visitorId: visitors[idx].id,
    visitorName: visitors[idx].name,
    type: 'extended',
    message: `Visitor ${visitors[idx].name} extended stay by ${extraMinutes} mins.`,
    timestamp: now.toISOString(),
    read: false
  });
  db.saveNotifications(notifications);

  res.json(visitors[idx]);
});


// --- CONFIGURATION MANAGEMENT ENDPOINTS ---

// Faculty CRUD
app.get('/api/faculty', (req, res) => {
  res.json(db.getFaculty());
});

app.post('/api/faculty', (req, res) => {
  const { name, designation, phone, email, departmentId } = req.body;
  if (!name || !designation || !phone || !departmentId) {
    return res.status(400).json({ error: 'Name, designation, phone, and departmentId are required.' });
  }
  const faculty = db.getFaculty();
  const newFac = {
    id: 'fac-' + Date.now(),
    name,
    designation,
    phone,
    email: email || '',
    departmentId
  };
  faculty.push(newFac);
  db.saveFaculty(faculty);
  res.status(201).json(newFac);
});

app.put('/api/faculty/:id', (req, res) => {
  const { id } = req.params;
  const faculty = db.getFaculty();
  const idx = faculty.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Faculty not found.' });

  const fields = ['name', 'designation', 'phone', 'email', 'departmentId'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) faculty[idx][f] = req.body[f];
  });

  db.saveFaculty(faculty);
  res.json(faculty[idx]);
});

app.delete('/api/faculty/:id', (req, res) => {
  const { id } = req.params;
  let faculty = db.getFaculty();
  faculty = faculty.filter(f => f.id !== id);
  db.saveFaculty(faculty);
  res.json({ success: true });
});

// Admissions Office configuration
app.get('/api/admissions', (req, res) => {
  res.json(db.getAdmissions());
});

app.put('/api/admissions', (req, res) => {
  db.saveAdmissions(req.body);
  res.json(req.body);
});

// Events CRUD
app.get('/api/events', (req, res) => {
  res.json(db.getEvents());
});

app.post('/api/events', (req, res) => {
  const { name, organizer, department, coordinator, phone, venue, timing, capacity, status, building, floor, room, landmark, mapLink } = req.body;
  if (!name || !organizer || !venue || !timing) {
    return res.status(400).json({ error: 'Event name, organizer, venue, and timing are required.' });
  }
  const events = db.getEvents();
  const newEvent = {
    id: 'evt-' + Date.now(),
    name,
    organizer,
    department: department || '',
    coordinator: coordinator || '',
    phone: phone || '',
    venue,
    timing,
    capacity: capacity || 100,
    status: status || 'Upcoming',
    building: building || '',
    floor: floor || '',
    room: room || '',
    landmark: landmark || '',
    mapLink: mapLink || ''
  };
  events.push(newEvent);
  db.saveEvents(events);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const events = db.getEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found.' });

  Object.assign(events[idx], req.body);
  db.saveEvents(events);
  res.json(events[idx]);
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  let events = db.getEvents();
  events = events.filter(e => e.id !== id);
  db.saveEvents(events);
  res.json({ success: true });
});

// Placement Cell configuration
app.get('/api/placement', (req, res) => {
  res.json(db.getPlacement());
});

app.put('/api/placement', (req, res) => {
  db.savePlacement(req.body);
  res.json(req.body);
});

// Administrative Offices CRUD
app.get('/api/offices', (req, res) => {
  res.json(db.getOffices());
});

app.post('/api/offices', (req, res) => {
  const { name, head, phone, email, timing, building, floor, room, mapLink, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Office name and type are required.' });
  }
  const offices = db.getOffices();
  const newOffice = {
    id: 'off-' + Date.now(),
    name,
    head: head || '',
    phone: phone || '',
    email: email || '',
    timing: timing || '',
    building: building || '',
    floor: floor || '',
    room: room || '',
    mapLink: mapLink || '',
    type
  };
  offices.push(newOffice);
  db.saveOffices(offices);
  res.status(201).json(newOffice);
});

app.put('/api/offices/:id', (req, res) => {
  const { id } = req.params;
  const offices = db.getOffices();
  const idx = offices.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Office not found.' });

  Object.assign(offices[idx], req.body);
  db.saveOffices(offices);
  res.json(offices[idx]);
});

app.delete('/api/offices/:id', (req, res) => {
  const { id } = req.params;
  let offices = db.getOffices();
  offices = offices.filter(o => o.id !== id);
  db.saveOffices(offices);
  res.json({ success: true });
});

// Campus Navigation Data CRUD
app.get('/api/navigation', (req, res) => {
  res.json(db.getNavigation());
});

app.post('/api/navigation', (req, res) => {
  const { name, building, floor, room, landmark, distance, walkingTime, mapLink } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Location name is required.' });
  }
  const nav = db.getNavigation();
  const newNav = {
    id: 'nav-' + Date.now(),
    name,
    building: building || '',
    floor: floor || '',
    room: room || '',
    landmark: landmark || '',
    distance: distance || '',
    walkingTime: walkingTime || '',
    mapLink: mapLink || ''
  };
  nav.push(newNav);
  db.saveNavigation(nav);
  res.status(201).json(newNav);
});

app.put('/api/navigation/:id', (req, res) => {
  const { id } = req.params;
  const nav = db.getNavigation();
  const idx = nav.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Location not found.' });

  Object.assign(nav[idx], req.body);
  db.saveNavigation(nav);
  res.json(nav[idx]);
});

app.delete('/api/navigation/:id', (req, res) => {
  const { id } = req.params;
  let nav = db.getNavigation();
  nav = nav.filter(n => n.id !== id);
  db.saveNavigation(nav);
  res.json({ success: true });
});

// Real-time notifications endpoints
app.get('/api/notifications', (req, res) => {
  res.json(db.getNotifications());
});

app.post('/api/notifications/read', (req, res) => {
  const notifs = db.getNotifications();
  notifs.forEach(n => { n.read = true; });
  db.saveNotifications(notifs);
  res.json({ success: true });
});


// --- VISIT ANALYTICS & REPORTS ---

app.get('/api/analytics', (req, res) => {
  const visitors = db.getVisitors();
  const departments = db.getDepartments();
  const events = db.getEvents();

  // Purpose breakdowns
  const purposeCounts = {
    'Parents Meeting': 0,
    'Student Admission': 0,
    'College Event': 0,
    'Placement Drive': 0,
    'Certificate Collection': 0,
    'Fee Payment': 0,
    'Principal Meeting': 0,
    'Office Work': 0,
    'Faculty Meeting': 0,
    'Campus Inquiry': 0,
    'Other': 0
  };

  // Department counts
  const deptCounts = {};
  departments.forEach(d => {
    deptCounts[d.name] = 0;
  });

  // Event counts
  const eventCounts = {};
  events.forEach(e => {
    eventCounts[e.name] = 0;
  });

  // Time metrics
  const hourlyPeak = Array(24).fill(0);
  let totalMinutes = 0;
  let checkoutCount = 0;
  let earlyCheckouts = 0;
  let extendedVisits = 0;
  let totalOverstayed = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyReports = {
    checkedIn: 0,
    checkedOut: 0,
    currentlyInside: 0,
    expectedLeaveSoon: 0,
    overstayed: 0
  };

  const now = new Date();

  visitors.forEach(v => {
    // 1. Purposes
    let matched = Object.keys(purposeCounts).find(p => v.purpose && v.purpose.toLowerCase().includes(p.toLowerCase()));
    if (matched) {
      purposeCounts[matched]++;
    } else {
      purposeCounts['Other']++;
    }

    // 2. Departments
    if (v.departmentId && v.departmentId !== 'none') {
      const dObj = departments.find(d => d.id === v.departmentId);
      if (dObj) {
        deptCounts[dObj.name] = (deptCounts[dObj.name] || 0) + 1;
      }
    }

    // 3. Events
    if (v.eventId && v.eventId !== 'none') {
      const eObj = events.find(e => e.id === v.eventId);
      if (eObj) {
        eventCounts[eObj.name] = (eventCounts[eObj.name] || 0) + 1;
      }
    }

    // 4. Hourly Peak checkins
    if (v.actualCheckInTime) {
      const cinDate = new Date(v.actualCheckInTime);
      hourlyPeak[cinDate.getHours()]++;
    }

    // 5. Durations and Checkout details
    if (v.actualCheckInTime && v.actualCheckOutTime) {
      const cin = new Date(v.actualCheckInTime);
      const cout = new Date(v.actualCheckOutTime);
      const duration = (cout - cin) / 60000;
      if (duration > 0) {
        totalMinutes += duration;
        checkoutCount++;
      }

      if (v.expectedExitTime && cout < new Date(v.expectedExitTime)) {
        earlyCheckouts++;
      }
    }

    if (v.extensionRequested) {
      extendedVisits++;
    }

    if (v.visitStatus === 'overstayed' || v.reminderStatus === 'overstayed') {
      totalOverstayed++;
    }

    // 6. Daily status reports
    if (v.visitDate === todayStr) {
      if (v.status === 'checked-in') dailyReports.currentlyInside++;
      if (v.status === 'checked-out') dailyReports.checkedOut;
      if (v.actualCheckInTime) dailyReports.checkedIn++;
    } else if (v.status === 'checked-in') {
      dailyReports.currentlyInside++;
    }

    if (v.status === 'checked-in' && v.expectedExitTime) {
      const expectedDate = new Date(v.expectedExitTime);
      const diffMs = expectedDate - now;
      if (diffMs < 0) {
        dailyReports.overstayed++;
      } else if (diffMs <= 30 * 60 * 1000) {
        dailyReports.expectedLeaveSoon++;
      }
    }
  });

  const avgDuration = checkoutCount > 0 ? Math.round(totalMinutes / checkoutCount) : 0;

  // Generate last 7 days daily counts for trends
  const dailyTrends = {};
  for (let i = 6; i >= 0; i--) {
    const temp = new Date();
    temp.setDate(now.getDate() - i);
    const dateKey = temp.toISOString().split('T')[0];
    dailyTrends[dateKey] = 0;
  }
  visitors.forEach(v => {
    if (dailyTrends[v.visitDate] !== undefined) {
      dailyTrends[v.visitDate]++;
    }
  });

  res.json({
    purposeCounts,
    deptCounts,
    eventCounts,
    timeStats: {
      hourlyPeak,
      avgDuration,
      earlyCheckouts,
      extendedVisits,
      overstayed: totalOverstayed
    },
    dailyReports,
    trends: {
      daily: dailyTrends
    }
  });
});


// --- BACKGROUND SYSTEM REMINDERS CHECK DAEMON ---

setInterval(() => {
  try {
    const visitors = db.getVisitors();
    const notifications = db.getNotifications();
    const now = new Date();
    let visitorsUpdated = false;
    let notificationsUpdated = false;

    visitors.forEach(v => {
      if (v.status === 'checked-in' && v.expectedExitTime) {
        const exitTime = new Date(v.expectedExitTime);
        const diffMs = now - exitTime;

        // Reminder 1: Exactly at Expected Exit Time
        if (diffMs >= 0 && v.reminderCount === 0) {
          v.reminderCount = 1;
          v.lastReminderSent = now.toISOString();
          v.reminderStatus = 'sent-1';
          
          console.log(`[EMAIL SEND] To ${v.name} (${v.email || 'Visitor'}): Expected duration ended. Please Checkout or extend visit.`);
          notifications.push({
            id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
            visitorId: v.id,
            visitorName: v.name,
            type: 'reached',
            message: `Visitor ${v.name}'s expected exit time has reached.`,
            timestamp: now.toISOString(),
            read: false
          });
          
          visitorsUpdated = true;
          notificationsUpdated = true;
        }
        // Reminder 2: 15 Minutes Later
        else if (diffMs >= 15 * 60 * 1000 && v.reminderCount === 1) {
          v.reminderCount = 2;
          v.lastReminderSent = now.toISOString();
          v.reminderStatus = 'sent-2';

          console.log(`[EMAIL SEND] To ${v.name} (${v.email || 'Visitor'}): OVERSTAY WARNING - 15 mins overdue.`);
          notifications.push({
            id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
            visitorId: v.id,
            visitorName: v.name,
            type: 'approaching',
            message: `Visitor ${v.name} has overstayed by 15 minutes.`,
            timestamp: now.toISOString(),
            read: false
          });

          visitorsUpdated = true;
          notificationsUpdated = true;
        }
        // Reminder 3: 30 Minutes Later -> Notify Admin/Security, Status = Overstayed
        else if (diffMs >= 30 * 60 * 1000 && v.reminderCount === 2) {
          v.reminderCount = 3;
          v.lastReminderSent = now.toISOString();
          v.reminderStatus = 'overstayed';
          v.visitStatus = 'overstayed';

          console.log(`[ALERT ADMIN] Visitor ${v.name} is marked as OVERSTAYED (30+ minutes overdue).`);
          notifications.push({
            id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
            visitorId: v.id,
            visitorName: v.name,
            type: 'overstayed',
            message: `CRITICAL ALERT: Visitor ${v.name} is overstayed by 30+ minutes!`,
            timestamp: now.toISOString(),
            read: false
          });

          visitorsUpdated = true;
          notificationsUpdated = true;
        }
      }
    });

    if (visitorsUpdated) db.saveVisitors(visitors);
    if (notificationsUpdated) db.saveNotifications(notifications);
  } catch (err) {
    console.error('Error in background reminder loop:', err);
  }
}, 10000); // Polls every 10 seconds


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
