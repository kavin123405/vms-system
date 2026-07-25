import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  departments: path.join(DATA_DIR, 'departments.json'),
  employees: path.join(DATA_DIR, 'employees.json'),
  visitors: path.join(DATA_DIR, 'visitors.json'),
  faculty: path.join(DATA_DIR, 'faculty.json'),
  admissions: path.join(DATA_DIR, 'admissions.json'),
  events: path.join(DATA_DIR, 'events.json'),
  placement: path.join(DATA_DIR, 'placement.json'),
  offices: path.join(DATA_DIR, 'offices.json'),
  navigation: path.join(DATA_DIR, 'navigation.json'),
  notifications: path.join(DATA_DIR, 'notifications.json')
};

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seeding Data
const defaultUsers = [
  { id: "u-admin", email: "admin@kprcas.com", password: "admin123", name: "Administrator", role: "admin" },
  { id: "u-emp1", email: "employee@kprcas.com", password: "employee123", name: "Dr. Ramesh Kumar", role: "employee" },
  { id: "u-emp2", email: "priya@kprcas.com", password: "employee123", name: "Prof. Priya Sharma", role: "employee" },
  { id: "u-sec", email: "security@kprcas.com", password: "security123", name: "Gate 1 Security", role: "security" }
];

const defaultDepartments = [
  { id: "dept-1", name: "Computer Science", code: "CS", block: "A-Block", floor: "2nd Floor", room: "A-204", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Ramesh Kumar", hodDesignation: "HOD & Professor", hodPhone: "9876543211", hodEmail: "ramesh.cs@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+Computer+Science" },
  { id: "dept-2", name: "Artificial Intelligence", code: "AI", block: "A-Block", floor: "4th Floor", room: "A-401", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Anitha Sen", hodDesignation: "HOD & Professor", hodPhone: "9876543233", hodEmail: "anitha.ai@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+AI+Dept" },
  { id: "dept-3", name: "Information Technology", code: "IT", block: "B-Block", floor: "3rd Floor", room: "B-302", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Suresh Babu", hodDesignation: "HOD & Associate Professor", hodPhone: "9876543222", hodEmail: "suresh.it@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+IT+Dept" },
  { id: "dept-4", name: "Commerce", code: "CO", block: "C-Block", floor: "1st Floor", room: "C-105", timing: "9:00 AM - 4:30 PM", hodName: "Prof. Priya Sharma", hodDesignation: "HOD & Professor", hodPhone: "9876543212", hodEmail: "priya.commerce@kprcas.com", mapLink: "https://maps.google.com/?q=KPRCAS+Commerce" },
  { id: "dept-5", name: "Mathematics", code: "MA", block: "A-Block", floor: "3rd Floor", room: "A-301", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Srinivasan", hodDesignation: "HOD & Professor", hodPhone: "9876543209", hodEmail: "srini.maths@kprcas.com", mapLink: "" },
  { id: "dept-6", name: "Electronics", code: "EC", block: "B-Block", floor: "1st Floor", room: "B-105", timing: "9:00 AM - 4:30 PM", hodName: "Dr. Ravindran", hodDesignation: "HOD & Associate Professor", hodPhone: "9876543208", hodEmail: "ravi.ece@kprcas.com", mapLink: "" }
];

const defaultEmployees = [
  { id: "emp-1", userId: "u-emp1", name: "Dr. Ramesh Kumar", email: "employee@kprcas.com", phone: "9876543211", departmentId: "dept-1" },
  { id: "emp-2", userId: "u-emp2", name: "Prof. Priya Sharma", email: "priya@kprcas.com", phone: "9876543212", departmentId: "dept-4" }
];

const defaultFaculty = [
  { id: "fac-1", name: "Dr. Ramesh Kumar", designation: "HOD & Professor", phone: "9876543211", email: "ramesh.cs@kprcas.com", departmentId: "dept-1" },
  { id: "fac-2", name: "Prof. Priya Sharma", designation: "HOD & Professor", phone: "9876543212", email: "priya.commerce@kprcas.com", departmentId: "dept-4" },
  { id: "fac-3", name: "Dr. Suresh Babu", designation: "HOD & Associate Professor", phone: "9876543222", email: "suresh.it@kprcas.com", departmentId: "dept-3" },
  { id: "fac-4", name: "Dr. Anitha Sen", designation: "HOD & Professor", phone: "9876543233", email: "anitha.ai@kprcas.com", departmentId: "dept-2" },
  { id: "fac-5", name: "Prof. Vignesh Kumar", designation: "Assistant Professor", phone: "9876543290", email: "vignesh.cs@kprcas.com", departmentId: "dept-1" },
  { id: "fac-6", name: "Dr. Karpagam", designation: "Associate Professor", phone: "9876543291", email: "karpagam.cs@kprcas.com", departmentId: "dept-1" },
  { id: "fac-7", name: "Prof. Ramya Devi", designation: "Assistant Professor", phone: "9876543292", email: "ramya.it@kprcas.com", departmentId: "dept-3" }
];

const defaultAdmissions = {
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
};

const defaultEvents = [
  { id: "evt-1", name: "Tech Fest 2026", organizer: "IT Department", department: "Information Technology", coordinator: "Dr. Suresh Babu", phone: "9876543222", venue: "Auditorium", timing: "10:00 AM - 4:00 PM", capacity: 500, status: "Upcoming", building: "Main Block", floor: "1st Floor", room: "Auditorium Hall", landmark: "Near Entrance Fountain", mapLink: "https://maps.google.com/?q=KPRCAS+Auditorium" },
  { id: "evt-2", name: "Placement Drive 2026", organizer: "Placement Cell", department: "Placement Cell", coordinator: "Mr. Vijay Shankar", phone: "9876543255", venue: "Seminar Hall 1", timing: "9:00 AM - 5:00 PM", capacity: 200, status: "Ongoing", building: "Placement Block", floor: "Ground Floor", room: "Seminar Hall 1", landmark: "Opposite Playground", mapLink: "https://maps.google.com/?q=KPRCAS+Seminar+Hall+1" },
  { id: "evt-3", name: "Workshop on AI/ML", organizer: "CS Department", department: "Computer Science", coordinator: "Dr. Ramesh Kumar", phone: "9876543211", venue: "Conference Hall", timing: "11:00 AM - 1:00 PM", capacity: 100, status: "Upcoming", building: "A-Block", floor: "3rd Floor", room: "Conference Room 3", landmark: "Next to Server Room", mapLink: "https://maps.google.com/?q=KPRCAS+Conference+Hall" }
];

const defaultPlacement = {
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
};

const defaultOffices = [
  { id: "off-cert", name: "Academic Section", head: "Mr. Krishnan", phone: "9876543266", email: "academic@kprcas.com", timing: "10:00 AM - 4:00 PM", building: "Main Block", floor: "Ground Floor", room: "Room 10", mapLink: "https://maps.google.com/?q=KPRCAS+Academic+Section", type: "certificate" },
  { id: "off-fee", name: "Accounts Office", head: "Finance Officer", phone: "9876543277", email: "finance@kprcas.com", timing: "9:30 AM - 3:30 PM", building: "Main Block", floor: "Ground Floor", room: "Room 12", mapLink: "", type: "fee_payment" },
  { id: "off-principal", name: "Principal Office", head: "Dr. A. K. Bilal", phone: "9876543288", email: "principal@kprcas.com", timing: "11:00 AM - 1:00 PM", building: "Main Block", floor: "1st Floor", room: "Room 101", mapLink: "https://maps.google.com/?q=KPRCAS+Principal+Office", type: "principal" },
  { id: "off-admin", name: "Administrative Office", head: "Mr. Selvaraj", phone: "9876543201", email: "admin@kprcas.com", timing: "9:00 AM - 5:00 PM", building: "A-Block", floor: "Ground Floor", room: "A-101", mapLink: "", type: "admin_office" },
  { id: "off-registrar", name: "Registrar Office", head: "Dr. Manian", phone: "9876543202", email: "registrar@kprcas.com", timing: "9:00 AM - 5:00 PM", building: "A-Block", floor: "1st Floor", room: "A-110", mapLink: "", type: "registrar" },
  { id: "off-exam", name: "Examination Cell", head: "Controller of Examinations", phone: "9876543203", email: "coe@kprcas.com", timing: "9:00 AM - 4:30 PM", building: "B-Block", floor: "Ground Floor", room: "B-101", mapLink: "", type: "exam_cell" },
  { id: "off-transport", name: "Transport Office", head: "Mr. Murugan", phone: "9876543204", email: "transport@kprcas.com", timing: "8:30 AM - 5:30 PM", building: "Transport Yard", floor: "Ground Floor", room: "Cabin 1", mapLink: "", type: "transport" },
  { id: "off-library", name: "Library Office", head: "Librarian", phone: "9876543205", email: "library@kprcas.com", timing: "8:00 AM - 6:00 PM", building: "Library Block", floor: "1st Floor", room: "L-102", mapLink: "", type: "library" },
  { id: "off-hostel", name: "Hostel Office", head: "Warden", phone: "9876543206", email: "hostel@kprcas.com", timing: "24 Hours", building: "Hostel Block A", floor: "Ground Floor", room: "Room 1", mapLink: "", type: "hostel" }
];

const defaultNavigation = [
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
];

// Initialize JSON files if missing
Object.keys(FILES).forEach(key => {
  const filePath = FILES[key];
  if (!fs.existsSync(filePath)) {
    let initialData = [];
    if (key === 'users') initialData = defaultUsers;
    else if (key === 'departments') initialData = defaultDepartments;
    else if (key === 'employees') initialData = defaultEmployees;
    else if (key === 'faculty') initialData = defaultFaculty;
    else if (key === 'admissions') initialData = defaultAdmissions;
    else if (key === 'events') initialData = defaultEvents;
    else if (key === 'placement') initialData = defaultPlacement;
    else if (key === 'offices') initialData = defaultOffices;
    else if (key === 'navigation') initialData = defaultNavigation;
    else if (key === 'notifications') initialData = [];
    
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
});

// Database Operations
export const db = {
  // Users
  getUsers: () => JSON.parse(fs.readFileSync(FILES.users, 'utf8')),
  saveUsers: (data) => fs.writeFileSync(FILES.users, JSON.stringify(data, null, 2)),

  // Departments
  getDepartments: () => JSON.parse(fs.readFileSync(FILES.departments, 'utf8')),
  saveDepartments: (data) => fs.writeFileSync(FILES.departments, JSON.stringify(data, null, 2)),

  // Employees
  getEmployees: () => JSON.parse(fs.readFileSync(FILES.employees, 'utf8')),
  saveEmployees: (data) => fs.writeFileSync(FILES.employees, JSON.stringify(data, null, 2)),

  // Visitors
  getVisitors: () => JSON.parse(fs.readFileSync(FILES.visitors, 'utf8')),
  saveVisitors: (data) => fs.writeFileSync(FILES.visitors, JSON.stringify(data, null, 2)),

  // Faculty
  getFaculty: () => JSON.parse(fs.readFileSync(FILES.faculty, 'utf8')),
  saveFaculty: (data) => fs.writeFileSync(FILES.faculty, JSON.stringify(data, null, 2)),

  // Admissions Office
  getAdmissions: () => JSON.parse(fs.readFileSync(FILES.admissions, 'utf8')),
  saveAdmissions: (data) => fs.writeFileSync(FILES.admissions, JSON.stringify(data, null, 2)),

  // Events
  getEvents: () => JSON.parse(fs.readFileSync(FILES.events, 'utf8')),
  saveEvents: (data) => fs.writeFileSync(FILES.events, JSON.stringify(data, null, 2)),

  // Placement Cell
  getPlacement: () => JSON.parse(fs.readFileSync(FILES.placement, 'utf8')),
  savePlacement: (data) => fs.writeFileSync(FILES.placement, JSON.stringify(data, null, 2)),

  // Administrative Offices
  getOffices: () => JSON.parse(fs.readFileSync(FILES.offices, 'utf8')),
  saveOffices: (data) => fs.writeFileSync(FILES.offices, JSON.stringify(data, null, 2)),

  // Navigation Points
  getNavigation: () => JSON.parse(fs.readFileSync(FILES.navigation, 'utf8')),
  saveNavigation: (data) => fs.writeFileSync(FILES.navigation, JSON.stringify(data, null, 2)),

  // Notifications audit logs
  getNotifications: () => JSON.parse(fs.readFileSync(FILES.notifications, 'utf8')),
  saveNotifications: (data) => fs.writeFileSync(FILES.notifications, JSON.stringify(data, null, 2)),

  // Helper: Get Visitors with resolved Employee and Department information
  getEnrichedVisitors: () => {
    const visitors = db.getVisitors();
    const employees = db.getEmployees();
    const departments = db.getDepartments();

    return visitors.map(v => {
      const emp = employees.find(e => e.id === v.employeeId);
      const dept = departments.find(d => d.id === v.departmentId);
      return {
        ...v,
        employeeName: emp ? emp.name : 'Unknown Host',
        departmentName: dept ? dept.name : 'Unknown Department'
      };
    });
  }
};
