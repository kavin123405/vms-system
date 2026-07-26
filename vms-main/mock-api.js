// Client-Side Mock Database & API Interceptor
// Falls back to localStorage when the backend server is unreachable.

const SEED_DATA = {
  users: [
    { id: "u-admin", email: "admin@kprcas.com", password: "admin123", name: "Administrator", role: "admin" },
    { id: "u-emp1", email: "employee@kprcas.com", password: "employee123", name: "Dr. Ramesh Kumar", role: "employee" },
    { id: "u-emp2", email: "priya@kprcas.com", password: "employee123", name: "Prof. Priya Sharma", role: "employee" },
    { id: "u-sec", email: "security@kprcas.com", password: "security123", name: "Gate 1 Security", role: "security" }
  ],
  departments: [
    { id: "dept-1", name: "Computer Science", code: "CS", block: "A-Block", floor: "2nd Floor", room: "A-204", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Ramesh Kumar", hodDesignation: "HOD & Professor", hodPhone: "9876543211", hodEmail: "ramesh.cs@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+Computer+Science" },
    { id: "dept-2", name: "Artificial Intelligence", code: "AI", block: "A-Block", floor: "4th Floor", room: "A-401", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Anitha Sen", hodDesignation: "HOD & Professor", hodPhone: "9876543233", hodEmail: "anitha.ai@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+AI+Dept" },
    { id: "dept-3", name: "Information Technology", code: "IT", block: "B-Block", floor: "3rd Floor", room: "B-302", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Suresh Babu", hodDesignation: "HOD & Associate Professor", hodPhone: "9876543222", hodEmail: "suresh.it@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+IT+Dept" },
    { id: "dept-4", name: "Commerce", code: "CO", block: "C-Block", floor: "1st Floor", room: "C-105", timing: "9:00 AM - 4:30 PM", hodName: "Prof. Priya Sharma", hodDesignation: "HOD & Professor", hodPhone: "9876543212", hodEmail: "priya.commerce@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+Commerce" },
    { id: "dept-5", name: "Mathematics", code: "MA", block: "A-Block", floor: "3rd Floor", room: "A-301", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Srinivasan", hodDesignation: "HOD & Professor", hodPhone: "9876543209", hodEmail: "srini.maths@kprcas.com", mapLink: "" },
    { id: "dept-6", name: "Electronics", code: "EC", block: "B-Block", floor: "1st Floor", room: "B-105", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Ravindran", hodDesignation: "HOD & Associate Professor", hodPhone: "9876543208", hodEmail: "ravi.ece@kprcas.com", mapLink: "" }
  ],
  employees: [
    { id: "emp-1", userId: "u-emp1", name: "Dr. Ramesh Kumar", email: "employee@kprcas.com", phone: "9876543211", departmentId: "dept-1" },
    { id: "emp-2", userId: "u-emp2", name: "Prof. Priya Sharma", email: "priya@kprcas.com", phone: "9876543212", departmentId: "dept-4" }
  ],
  faculty: [
    { id: "fac-1", name: "Dr. Ramesh Kumar", designation: "HOD & Professor", phone: "9876543211", email: "ramesh.cs@kprcas.com", departmentId: "dept-1" },
    { id: "fac-2", name: "Prof. Priya Sharma", designation: "HOD & Professor", phone: "9876543212", email: "priya.commerce@kprcas.com", departmentId: "dept-4" },
    { id: "fac-3", name: "Dr. Suresh Babu", designation: "HOD & Associate Professor", phone: "9876543222", email: "suresh.it@kprcas.com", departmentId: "dept-3" },
    { id: "fac-4", name: "Dr. Anitha Sen", designation: "HOD & Professor", phone: "9876543233", email: "anitha.ai@kprcas.com", departmentId: "dept-2" },
    { id: "fac-5", name: "Prof. Vignesh Kumar", designation: "Assistant Professor", phone: "9876543290", email: "vignesh.cs@kprcas.com", departmentId: "dept-1" },
    { id: "fac-6", name: "Dr. Karpagam", designation: "Associate Professor", phone: "9876543291", email: "karpagam.cs@kprcas.com", departmentId: "dept-1" },
    { id: "fac-7", name: "Prof. Ramya Devi", designation: "Assistant Professor", phone: "9876543292", email: "ramya.it@kprcas.com", departmentId: "dept-3" }
  ],
  admissions: {
    officeName: "Admission Center",
    timing: "9:00 AM - 5:30 PM",
    head: "Dr. Rajesh Sekar",
    phone: "9876543244",
    email: "admission@kprcas.com",
    building: "Main Block",
    floor: "Ground Floor",
    room: "Room 101",
    mapLink: "https://maps.google.com/?q=KPRCAS+Admission+Office",
    counselors: [
      { name: "Mrs. Shalini", phone: "9876543245" },
      { name: "Mr. Deepak", phone: "9876543246" }
    ]
  },
  events: [
    { id: "evt-1", name: "Tech Fest 2026", organizer: "IT Department", department: "Information Technology", coordinator: "Dr. Suresh Babu", phone: "9876543222", venue: "Auditorium", timing: "10:00 AM - 4:00 PM", capacity: 500, status: "Upcoming", building: "Main Block", floor: "1st Floor", room: "Auditorium Hall", landmark: "Near Entrance Fountain", mapLink: "https://maps.google.com/?q=KPRCAS+Auditorium" },
    { id: "evt-2", name: "Placement Drive 2026", organizer: "Placement Cell", department: "Placement Cell", coordinator: "Mr. Vijay Shankar", phone: "9876543255", venue: "Seminar Hall 1", timing: "9:00 AM - 5:00 PM", capacity: 200, status: "Ongoing", building: "Placement Block", floor: "Ground Floor", room: "Seminar Hall 1", landmark: "Opposite Playground", mapLink: "https://maps.google.com/?q=KPRCAS+Seminar+Hall+1" },
    { id: "evt-3", name: "Workshop on AI/ML", organizer: "CS Department", department: "Computer Science", coordinator: "Dr. Ramesh Kumar", phone: "9876543211", venue: "Conference Hall", timing: "11:00 AM - 1:00 PM", capacity: 100, status: "Upcoming", building: "A-Block", floor: "3rd Floor", room: "Conference Room 3", landmark: "Next to Server Room", mapLink: "https://maps.google.com/?q=KPRCAS+Conference+Hall" }
  ],
  placement: {
    cellName: "Placement Cell",
    officer: "Mr. Vijay Shankar",
    phone: "9876543255",
    email: "placement@kprcas.com",
    officeLocation: "B-Block, Room 102",
    interviewHall: "Seminar Hall 1",
    companyName: "TCS / Cognizant",
    venue: "Seminar Hall 1 & Labs",
    location: "B-Block, Ground Floor",
    activeDrives: [
      { company: "TCS", venue: "Seminar Hall 1", interviewHall: "Seminar Hall 1 & Labs", location: "B-Block, Ground Floor" },
      { company: "Cognizant", venue: "Seminar Hall 2", interviewHall: "Seminar Hall 2", location: "B-Block, 1st Floor" }
    ]
  },
  offices: [
    { id: "off-cert", name: "Academic Section", head: "Mr. Krishnan", phone: "9876543266", email: "academic@kprcas.com", timing: "10:00 AM - 4:00 PM", building: "Main Block", floor: "Ground Floor", room: "Room 10", mapLink: "https://maps.google.com/?q=KPRCAS+Academic+Section", type: "certificate" },
    { id: "off-fee", name: "Accounts Office", head: "Finance Officer", phone: "9876543277", email: "finance@kprcas.com", timing: "9:30 AM - 3:30 PM", building: "Main Block", floor: "Ground Floor", room: "Room 12", mapLink: "", type: "fee_payment" },
    { id: "off-principal", name: "Principal Office", head: "Dr. A. K. Bilal", phone: "9876543288", email: "principal@kprcas.com", timing: "11:00 AM - 1:00 PM", building: "Main Block", floor: "1st Floor", room: "Room 101", mapLink: "https://maps.google.com/?q=KPRCAS+Principal+Office", type: "principal" },
    { id: "off-admin", name: "Administrative Office", head: "Mr. Selvaraj", phone: "9876543201", email: "admin@kprcas.com", timing: "9:00 AM - 5:00 PM", building: "A-Block", floor: "Ground Floor", room: "A-101", mapLink: "", type: "admin_office" },
    { id: "off-registrar", name: "Registrar Office", head: "Dr. Manian", phone: "9876543202", email: "registrar@kprcas.com", timing: "9:00 AM - 5:00 PM", building: "A-Block", floor: "1st Floor", room: "A-110", mapLink: "", type: "registrar" },
    { id: "off-exam", name: "Examination Cell", head: "Controller of Examinations", phone: "9876543203", email: "coe@kprcas.com", timing: "9:00 AM - 4:30 PM", building: "B-Block", floor: "Ground Floor", room: "B-101", mapLink: "", type: "exam_cell" },
    { id: "off-transport", name: "Transport Office", head: "Mr. Murugan", phone: "9876543204", email: "transport@kprcas.com", timing: "8:30 AM - 5:30 PM", building: "Transport Yard", floor: "Ground Floor", room: "Cabin 1", mapLink: "", type: "transport" },
    { id: "off-library", name: "Library Office", head: "Librarian", phone: "9876543205", email: "library@kprcas.com", timing: "8:00 AM - 6:00 PM", building: "Library Block", floor: "1st Floor", room: "L-102", mapLink: "", type: "library" },
    { id: "off-hostel", name: "Hostel Office", head: "Warden", phone: "9876543206", email: "hostel@kprcas.com", timing: "24 Hours", building: "Hostel Block A", floor: "Ground Floor", room: "Room 1", mapLink: "", type: "hostel" }
  ],
  navigation: [
    { id: "nav-1", name: "Computer Science Dept", building: "A-Block", floor: "2nd Floor", room: "A-204", landmark: "Near Elevator A", distance: "120m", walkingTime: "1.5 mins", mapLink: "https://maps.google.com/?q=KPRCAS+CS+Dept" },
    { id: "nav-2", name: "Information Technology Dept", building: "B-Block", floor: "3rd Floor", room: "B-302", landmark: "Next to Server Room", distance: "180m", walkingTime: "2.5 mins", mapLink: "" },
    { id: "nav-3", name: "Auditorium", building: "Main Block", floor: "1st Floor", room: "Auditorium Hall", landmark: "Opposite Entrance Fountain", distance: "150m", walkingTime: "2 mins", mapLink: "https://maps.google.com/?q=KPRCAS+Auditorium" },
    { id: "nav-4", name: "Seminar Hall 1", building: "Placement Block", floor: "Ground Floor", room: "Room S-1", landmark: "Next to Placement Cell", distance: "210m", walkingTime: "3 mins", mapLink: "" },
    { id: "nav-5", name: "Central Library", building: "Library Block", floor: "Ground & 1st Floor", room: "Central Library", landmark: "Opposite Playground", distance: "250m", walkingTime: "3.5 mins", mapLink: "" },
    { id: "nav-6", name: "Main Canteen", building: "Food Court Block", floor: "Ground Floor", room: "Food Court", landmark: "Opposite Sports Ground", distance: "300m", walkingTime: "4 mins", mapLink: "" },
    { id: "nav-7", name: "Visitor Parking", building: "Main Entrance", floor: "Ground Floor", room: "Zone P-1", landmark: "Right of Main Gate", distance: "40m", walkingTime: "0.5 mins", mapLink: "" },
    { id: "nav-8", name: "Main Gate", building: "Entrance Arch", floor: "Ground Floor", room: "Security Gate 1", landmark: "Main Road Access", distance: "0m", walkingTime: "0 mins", mapLink: "" },
    { id: "nav-9", name: "Medical Room", building: "A-Block", floor: "Ground Floor", room: "A-102", landmark: "Opposite Reception", distance: "90m", walkingTime: "1 min", mapLink: "" },
    { id: "nav-10", name: "Reception", building: "Main Block", floor: "Ground Floor", room: "Reception Lobby", landmark: "Foyer Entrance", distance: "70m", walkingTime: "1 min", mapLink: "" },
    { id: "nav-11", name: "Emergency Exit (A-Block)", building: "A-Block", floor: "Ground Floor", room: "Stairwell 2", landmark: "Rear Exit", distance: "110m", walkingTime: "1.5 mins", mapLink: "" }
  ],
  visitors: [],
  notifications: []
};

// Initialize database in localStorage if not exists
function getDb() {
  let db = {};
  Object.keys(SEED_DATA).forEach(key => {
    const data = localStorage.getItem('vms_db_' + key);
    if (data) {
      db[key] = JSON.parse(data);
    } else {
      db[key] = SEED_DATA[key];
      localStorage.setItem('vms_db_' + key, JSON.stringify(SEED_DATA[key]));
    }
  });
  return db;
}

function saveDb(key, data) {
  localStorage.setItem('vms_db_' + key, JSON.stringify(data));
}

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

// Router for mock requests
async function handleMockRequest(urlStr, options = {}) {
  // Parse URL path and query parameters
  const urlObj = new URL(urlStr, window.location.origin);
  const path = urlObj.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const query = Object.fromEntries(urlObj.searchParams.entries());
  
  let body = {};
  if (options.body) {
    try {
      body = JSON.parse(options.body);
    } catch (e) {
      body = options.body;
    }
  }

  const db = getDb();

  // Helper response builders
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const errorResponse = (message, status = 400) => {
    return jsonResponse({ error: message }, status);
  };

  // Log mock API execution
  console.log(`[Mock API Interceptor] ${method} ${path}`, { query, body });

  // 1. POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) {
      return errorResponse('Email and password are required.');
    }
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return errorResponse('Invalid email or password.', 401);
    }
    const { password: _, ...userProfile } = user;
    return jsonResponse({ user: userProfile });
  }

  // 2. GET /api/dashboard/stats
  if (path === '/api/dashboard/stats' && method === 'GET') {
    const { role, userId } = query;
    let visitors = db.visitors;
    const todayStr = new Date().toISOString().split('T')[0];

    if (role === 'employee' && userId) {
      const employee = db.employees.find(e => e.userId === userId);
      if (employee) {
        visitors = visitors.filter(v => v.employeeId === employee.id);
      } else {
        visitors = [];
      }
    }

    const total = visitors.length;
    const today = visitors.filter(v => v.visitDate === todayStr).length;
    const pending = visitors.filter(v => v.status === 'pending').length;
    const approved = visitors.filter(v => v.status === 'approved').length;
    const rejected = visitors.filter(v => v.status === 'rejected').length;
    const checkedIn = visitors.filter(v => v.status === 'checked-in').length;
    const checkedOut = visitors.filter(v => v.status === 'checked-out').length;

    return jsonResponse({ total, today, pending, approved, rejected, checkedIn, checkedOut });
  }

  // 3. Departments API
  if (path === '/api/departments') {
    if (method === 'GET') {
      return jsonResponse(db.departments);
    }
    if (method === 'POST') {
      const { name } = body;
      if (!name) return errorResponse('Department name is required.');
      const newDept = { id: 'dept-' + Date.now(), name };
      db.departments.push(newDept);
      saveDb('departments', db.departments);
      return jsonResponse(newDept, 201);
    }
  }

  const deptMatch = path.match(/^\/api\/departments\/(.+)$/);
  if (deptMatch && method === 'DELETE') {
    const id = deptMatch[1];
    db.departments = db.departments.filter(d => d.id !== id);
    saveDb('departments', db.departments);
    return jsonResponse({ success: true });
  }

  // 4. Employees API
  if (path === '/api/employees') {
    if (method === 'GET') {
      const enriched = db.employees.map(emp => {
        const dept = db.departments.find(d => d.id === emp.departmentId);
        return {
          ...emp,
          departmentName: dept ? dept.name : 'Unknown Department'
        };
      });
      return jsonResponse(enriched);
    }
    if (method === 'POST') {
      const { name, email, phone, departmentId } = body;
      if (!name || !email || !phone || !departmentId) {
        return errorResponse('All fields are required.');
      }
      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return errorResponse('Email already exists.');
      }

      const userId = 'u-' + Date.now();
      const employeeId = 'emp-' + Date.now();

      const newUser = { id: userId, email, password: 'employee123', name, role: 'employee' };
      const newEmployee = { id: employeeId, userId, name, email, phone, departmentId };

      db.users.push(newUser);
      db.employees.push(newEmployee);

      saveDb('users', db.users);
      saveDb('employees', db.employees);

      return jsonResponse(newEmployee, 201);
    }
  }

  const empMatch = path.match(/^\/api\/employees\/(.+)$/);
  if (empMatch) {
    const id = empMatch[1];
    if (method === 'PUT') {
      const { name, email, phone, departmentId } = body;
      const idx = db.employees.findIndex(e => e.id === id);
      if (idx === -1) return errorResponse('Employee not found.', 404);

      db.employees[idx].name = name || db.employees[idx].name;
      db.employees[idx].phone = phone || db.employees[idx].phone;
      db.employees[idx].departmentId = departmentId || db.employees[idx].departmentId;

      if (email && email.toLowerCase() !== db.employees[idx].email.toLowerCase()) {
        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== db.employees[idx].userId)) {
          return errorResponse('Email already in use.');
        }
        db.employees[idx].email = email;
        const uIdx = db.users.findIndex(u => u.id === db.employees[idx].userId);
        if (uIdx !== -1) db.users[uIdx].email = email;
      }

      const uIdx = db.users.findIndex(u => u.id === db.employees[idx].userId);
      if (uIdx !== -1 && name) db.users[uIdx].name = name;

      saveDb('employees', db.employees);
      saveDb('users', db.users);

      return jsonResponse(db.employees[idx]);
    }
    if (method === 'DELETE') {
      const emp = db.employees.find(e => e.id === id);
      if (!emp) return errorResponse('Employee not found.', 404);

      db.employees = db.employees.filter(e => e.id !== id);
      db.users = db.users.filter(u => u.id !== emp.userId);

      saveDb('employees', db.employees);
      saveDb('users', db.users);

      return jsonResponse({ success: true });
    }
  }

  // 5. Visitors API
  if (path === '/api/visitors') {
    if (method === 'GET') {
      const { employeeUserId } = query;
      let visitors = db.visitors;

      if (employeeUserId) {
        const emp = db.employees.find(e => e.userId === employeeUserId);
        if (emp) {
          visitors = visitors.filter(v => v.employeeId === emp.id);
        } else {
          visitors = [];
        }
      }

      const enriched = visitors.map(v => {
        const emp = db.employees.find(e => e.id === v.employeeId);
        const dept = db.departments.find(d => d.id === v.departmentId);
        return {
          ...v,
          employeeName: emp ? emp.name : 'Unknown Host',
          departmentName: dept ? dept.name : 'Unknown Department'
        };
      });

      return jsonResponse(enriched);
    }
    if (method === 'POST') {
      const {
        name, phone, email, gender, address, purpose,
        employeeId, departmentId, visitDate, expectedArrival, expectedExit,
        govId, vehicleNum, expectedDuration, eventId, officeId
      } = body;

      if (!name || !phone || !purpose || !visitDate || !expectedArrival) {
        return errorResponse('Name, phone, purpose, visit date and arrival time are required.');
      }

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
          console.error(e);
        }
      }

      const newVisitor = {
        id: 'v-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name, phone, email: email || '', gender: gender || 'Not Specified',
        address: address || '', purpose, employeeId: employeeId || 'none',
        departmentId: departmentId || 'none', eventId: eventId || 'none', officeId: officeId || 'none',
        visitDate, expectedArrival, expectedExit: calculatedExit,
        expectedDuration: expectedDuration || '1 Hour', expectedExitTime: calculatedExitTime,
        govId: govId || '', vehicleNum: vehicleNum || '',
        checkInTime: null, checkOutTime: null, actualCheckInTime: null, actualCheckOutTime: null,
        reminderCount: 0, lastReminderSent: null, reminderStatus: 'none',
        visitStatus: 'registered', extensionRequested: false, extendedUntil: null,
        status: 'pending', createdAt: new Date().toISOString()
      };

      db.visitors.push(newVisitor);
      saveDb('visitors', db.visitors);

      // Create notification
      db.notifications.push({
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        visitorId: newVisitor.id,
        visitorName: newVisitor.name,
        type: 'registration',
        message: `New visitor registration: ${newVisitor.name} for ${newVisitor.purpose}.`,
        timestamp: new Date().toISOString(),
        read: false
      });
      saveDb('notifications', db.notifications);

      return jsonResponse(newVisitor, 201);
    }
  }

  const visitorMatch = path.match(/^\/api\/visitors\/(.+)$/);
  if (visitorMatch) {
    const id = visitorMatch[1];
    
    // PUT /api/visitors/:id
    if (method === 'PUT') {
      const idx = db.visitors.findIndex(v => v.id === id);
      if (idx === -1) return errorResponse('Visitor not found.', 404);

      Object.keys(body).forEach(field => {
        db.visitors[idx][field] = body[field];
      });

      saveDb('visitors', db.visitors);
      return jsonResponse(db.visitors[idx]);
    }
    
    // DELETE /api/visitors/:id
    if (method === 'DELETE') {
      db.visitors = db.visitors.filter(v => v.id !== id);
      saveDb('visitors', db.visitors);
      return jsonResponse({ success: true });
    }

    // PATCH /api/visitors/:id/status
    if (path.endsWith('/status') && method === 'PATCH') {
      const { status } = body;
      const idx = db.visitors.findIndex(v => v.id === id);
      if (idx === -1) return errorResponse('Visitor not found.', 404);

      db.visitors[idx].status = status;
      saveDb('visitors', db.visitors);
      return jsonResponse(db.visitors[idx]);
    }

    // PATCH /api/visitors/:id/checkin
    if (path.endsWith('/checkin') && method === 'PATCH') {
      const idx = db.visitors.findIndex(v => v.id === id);
      if (idx === -1) return errorResponse('Visitor not found.', 404);

      const now = new Date();
      const durationMin = getDurationMinutes(db.visitors[idx].expectedDuration);

      db.visitors[idx].status = 'checked-in';
      db.visitors[idx].visitStatus = 'checked-in';
      db.visitors[idx].checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      db.visitors[idx].actualCheckInTime = now.toISOString();

      const expectedExitDate = new Date(now.getTime() + durationMin * 60 * 1000);
      db.visitors[idx].expectedExitTime = expectedExitDate.toISOString();
      db.visitors[idx].expectedExit = `${expectedExitDate.getHours().toString().padStart(2, '0')}:${expectedExitDate.getMinutes().toString().padStart(2, '0')}`;
      
      db.visitors[idx].reminderCount = 0;
      db.visitors[idx].reminderStatus = 'none';

      saveDb('visitors', db.visitors);

      db.notifications.push({
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        visitorId: db.visitors[idx].id,
        visitorName: db.visitors[idx].name,
        type: 'check-in',
        message: `Visitor ${db.visitors[idx].name} has checked in.`,
        timestamp: now.toISOString(),
        read: false
      });
      saveDb('notifications', db.notifications);

      return jsonResponse(db.visitors[idx]);
    }

    // PATCH /api/visitors/:id/checkout
    if (path.endsWith('/checkout') && method === 'PATCH') {
      const idx = db.visitors.findIndex(v => v.id === id);
      if (idx === -1) return errorResponse('Visitor not found.', 404);

      const now = new Date();
      db.visitors[idx].status = 'checked-out';
      db.visitors[idx].visitStatus = 'checked-out';
      db.visitors[idx].checkOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      db.visitors[idx].actualCheckOutTime = now.toISOString();
      db.visitors[idx].reminderStatus = 'dismissed';

      saveDb('visitors', db.visitors);

      db.notifications.push({
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        visitorId: db.visitors[idx].id,
        visitorName: db.visitors[idx].name,
        type: 'check-out',
        message: `Visitor ${db.visitors[idx].name} has checked out.`,
        timestamp: now.toISOString(),
        read: false
      });
      saveDb('notifications', db.notifications);

      return jsonResponse(db.visitors[idx]);
    }

    // PATCH /api/visitors/:id/extend
    if (path.endsWith('/extend') && method === 'PATCH') {
      const { extraMinutes } = body;
      const idx = db.visitors.findIndex(v => v.id === id);
      if (idx === -1) return errorResponse('Visitor not found.', 404);

      const now = new Date();
      let baseTime = new Date(db.visitors[idx].expectedExitTime || now);
      if (baseTime < now) baseTime = now;

      const newExit = new Date(baseTime.getTime() + parseInt(extraMinutes) * 60 * 1000);
      db.visitors[idx].expectedExitTime = newExit.toISOString();
      db.visitors[idx].expectedExit = `${newExit.getHours().toString().padStart(2, '0')}:${newExit.getMinutes().toString().padStart(2, '0')}`;
      
      db.visitors[idx].reminderCount = 0;
      db.visitors[idx].reminderStatus = 'none';
      db.visitors[idx].visitStatus = 'checked-in';
      db.visitors[idx].extensionRequested = true;
      db.visitors[idx].extendedUntil = newExit.toISOString();

      saveDb('visitors', db.visitors);

      db.notifications.push({
        id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        visitorId: db.visitors[idx].id,
        visitorName: db.visitors[idx].name,
        type: 'extended',
        message: `Visitor ${db.visitors[idx].name} extended stay by ${extraMinutes} mins.`,
        timestamp: now.toISOString(),
        read: false
      });
      saveDb('notifications', db.notifications);

      return jsonResponse(db.visitors[idx]);
    }
  }

  // 6. Config items CRUD
  if (path === '/api/faculty') {
    if (method === 'GET') return jsonResponse(db.faculty);
    if (method === 'POST') {
      const { name, designation, phone, email, departmentId } = body;
      const newFac = { id: 'fac-' + Date.now(), name, designation, phone, email: email || '', departmentId };
      db.faculty.push(newFac);
      saveDb('faculty', db.faculty);
      return jsonResponse(newFac, 201);
    }
  }

  const facMatch = path.match(/^\/api\/faculty\/(.+)$/);
  if (facMatch) {
    const id = facMatch[1];
    if (method === 'PUT') {
      const idx = db.faculty.findIndex(f => f.id === id);
      if (idx === -1) return errorResponse('Faculty not found.', 404);
      Object.assign(db.faculty[idx], body);
      saveDb('faculty', db.faculty);
      return jsonResponse(db.faculty[idx]);
    }
    if (method === 'DELETE') {
      db.faculty = db.faculty.filter(f => f.id !== id);
      saveDb('faculty', db.faculty);
      return jsonResponse({ success: true });
    }
  }

  if (path === '/api/admissions') {
    if (method === 'GET') return jsonResponse(db.admissions);
    if (method === 'PUT') {
      db.admissions = body;
      saveDb('admissions', db.admissions);
      return jsonResponse(db.admissions);
    }
  }

  if (path === '/api/placement') {
    if (method === 'GET') return jsonResponse(db.placement);
    if (method === 'PUT') {
      db.placement = body;
      saveDb('placement', db.placement);
      return jsonResponse(db.placement);
    }
  }

  if (path === '/api/events') {
    if (method === 'GET') return jsonResponse(db.events);
    if (method === 'POST') {
      const newEvent = { id: 'evt-' + Date.now(), status: 'Upcoming', capacity: 100, ...body };
      db.events.push(newEvent);
      saveDb('events', db.events);
      return jsonResponse(newEvent, 201);
    }
  }

  const eventMatch = path.match(/^\/api\/events\/(.+)$/);
  if (eventMatch) {
    const id = eventMatch[1];
    if (method === 'PUT') {
      const idx = db.events.findIndex(e => e.id === id);
      if (idx === -1) return errorResponse('Event not found.', 404);
      Object.assign(db.events[idx], body);
      saveDb('events', db.events);
      return jsonResponse(db.events[idx]);
    }
    if (method === 'DELETE') {
      db.events = db.events.filter(e => e.id !== id);
      saveDb('events', db.events);
      return jsonResponse({ success: true });
    }
  }

  if (path === '/api/offices') {
    if (method === 'GET') return jsonResponse(db.offices);
    if (method === 'POST') {
      const newOffice = { id: 'off-' + Date.now(), ...body };
      db.offices.push(newOffice);
      saveDb('offices', db.offices);
      return jsonResponse(newOffice, 201);
    }
  }

  const officeMatch = path.match(/^\/api\/offices\/(.+)$/);
  if (officeMatch) {
    const id = officeMatch[1];
    if (method === 'PUT') {
      const idx = db.offices.findIndex(o => o.id === id);
      if (idx === -1) return errorResponse('Office not found.', 404);
      Object.assign(db.offices[idx], body);
      saveDb('offices', db.offices);
      return jsonResponse(db.offices[idx]);
    }
    if (method === 'DELETE') {
      db.offices = db.offices.filter(o => o.id !== id);
      saveDb('offices', db.offices);
      return jsonResponse({ success: true });
    }
  }

  if (path === '/api/navigation') {
    if (method === 'GET') return jsonResponse(db.navigation);
    if (method === 'POST') {
      const newNav = { id: 'nav-' + Date.now(), ...body };
      db.navigation.push(newNav);
      saveDb('navigation', db.navigation);
      return jsonResponse(newNav, 201);
    }
  }

  const navMatch = path.match(/^\/api\/navigation\/(.+)$/);
  if (navMatch) {
    const id = navMatch[1];
    if (method === 'PUT') {
      const idx = db.navigation.findIndex(n => n.id === id);
      if (idx === -1) return errorResponse('Location not found.', 404);
      Object.assign(db.navigation[idx], body);
      saveDb('navigation', db.navigation);
      return jsonResponse(db.navigation[idx]);
    }
    if (method === 'DELETE') {
      db.navigation = db.navigation.filter(n => n.id !== id);
      saveDb('navigation', db.navigation);
      return jsonResponse({ success: true });
    }
  }

  // 7. Notifications
  if (path === '/api/notifications' && method === 'GET') {
    return jsonResponse(db.notifications);
  }
  if (path === '/api/notifications/read' && method === 'POST') {
    db.notifications.forEach(n => { n.read = true; });
    saveDb('notifications', db.notifications);
    return jsonResponse({ success: true });
  }

  // 8. Analytics
  if (path === '/api/analytics' && method === 'GET') {
    // Basic mock metrics
    const purposeCounts = {
      'Parents Meeting': 0, 'Student Admission': 0, 'College Event': 0, 'Placement Drive': 0,
      'Certificate Collection': 0, 'Fee Payment': 0, 'Principal Meeting': 0, 'Office Work': 0,
      'Faculty Meeting': 0, 'Campus Inquiry': 0, 'Other': 0
    };

    const deptCounts = {};
    db.departments.forEach(d => { deptCounts[d.name] = 0; });

    const eventCounts = {};
    db.events.forEach(e => { eventCounts[e.name] = 0; });

    const hourlyPeak = Array(24).fill(0);
    let totalMinutes = 0;
    let checkoutCount = 0;
    let earlyCheckouts = 0;
    let extendedVisits = 0;
    let totalOverstayed = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyReports = { checkedIn: 0, checkedOut: 0, currentlyInside: 0, expectedLeaveSoon: 0, overstayed: 0 };
    const now = new Date();

    db.visitors.forEach(v => {
      let matched = Object.keys(purposeCounts).find(p => v.purpose && v.purpose.toLowerCase().includes(p.toLowerCase()));
      if (matched) purposeCounts[matched]++;
      else purposeCounts['Other']++;

      if (v.departmentId && v.departmentId !== 'none') {
        const d = db.departments.find(dept => dept.id === v.departmentId);
        if (d) deptCounts[d.name] = (deptCounts[d.name] || 0) + 1;
      }
      if (v.eventId && v.eventId !== 'none') {
        const e = db.events.find(evt => evt.id === v.eventId);
        if (e) eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
      }

      if (v.actualCheckInTime) {
        const h = new Date(v.actualCheckInTime).getHours();
        hourlyPeak[h]++;
      }

      if (v.actualCheckInTime && v.actualCheckOutTime) {
        const duration = Math.floor((new Date(v.actualCheckOutTime) - new Date(v.actualCheckInTime)) / 60000);
        totalMinutes += duration;
        checkoutCount++;
      }

      if (v.visitDate === todayStr) {
        if (v.status === 'checked-in') dailyReports.currentlyInside++;
        if (v.status === 'checked-out') dailyReports.checkedOut++;
        if (v.visitStatus === 'overstayed') dailyReports.overstayed++;
      }
    });

    const avgStay = checkoutCount > 0 ? Math.round(totalMinutes / checkoutCount) : 45;

    return jsonResponse({
      purposeCounts,
      deptCounts,
      eventCounts,
      hourlyPeak,
      avgStay,
      earlyCheckouts,
      extendedVisits,
      totalOverstayed,
      dailyReports
    });
  }

  return errorResponse('API endpoint not found on client mock database.', 404);
}

// Global Interceptor logic
const originalFetch = window.fetch;
window.fetch = async function (resource, options) {
  const urlStr = typeof resource === 'string' ? resource : resource.url;
  
  // Intercept all /api/ requests
  if (urlStr.includes('/api/')) {
    try {
      const res = await originalFetch(resource, options);
      const contentType = res.headers.get('content-type') || '';
      
      // If Vercel fallback redirects to index.html, it returns text/html, treat it as a 404 fallback
      if (res.status === 404 || contentType.includes('text/html')) {
        return await handleMockRequest(urlStr, options);
      }
      
      return res;
    } catch (err) {
      console.warn('[VMS Local Database Fallback] Network failed. Using offline local storage API:', err.message);
      return await handleMockRequest(urlStr, options);
    }
  }

  // Pass-through for non-API requests
  return originalFetch(resource, options);
};
