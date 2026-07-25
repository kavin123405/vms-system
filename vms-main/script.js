const translations = {
  en: {
    title: "Visitor Form",
    name: "Your Name",
    location: "Where are you from?",
    mail: "Mail ID (Optional)",
    phone: "Phone Number",
    purpose: "Select Purpose",
    purposes: ["Admission", "Meeting", "Guest Visit", "Official Work", "Interview", "Other"],
    entry: "Entry Time",
    exit: "Expected Exit Time / Duration",
    submit: "Submit Details",
    thank: "Thank you for visiting!",
    errors: {
      name: "Please enter your name.",
      location: "Please enter where you are from.",
      phone: "Please enter a valid 10-digit phone number.",
      mail: "Please enter a valid email address.",
      purpose: "Please select a purpose.",
      general: "Something went wrong. Please try again."
    }
  },
  ta: {
    title: "விருந்தினர் படிவம்",
    name: "உங்கள் பெயர்",
    location: "நீங்கள் எங்கிருந்து வந்தீர்கள்?",
    mail: "மின்னஞ்சல் ஐடி (விருப்பத்தேர்வு)",
    phone: "தொலைபேசி எண்",
    purpose: "காரணத்தை தேர்ந்தெடுக்கவும்",
    purposes: ["சேர்க்கை", "சந்திப்பு", "விருந்தினர் வருகை", "அலுவலக பணி", "நேர்காணல்", "இதர"],
    entry: "வருகை நேரம்",
    exit: "வெளியேறும் நேரம் / கால அளவு",
    submit: "சமர்ப்பிக்கவும்",
    thank: "வருகைக்கு நன்றி!",
    errors: {
      name: "தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.",
      location: "தயவுசெய்து நீங்கள் எங்கிருந்து வந்தீர்கள் என்பதை உள்ளிடவும்.",
      phone: "தயவுசெய்து சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்.",
      mail: "தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
      purpose: "தயவுசெய்து ஒரு காரணத்தை தேர்ந்தெடுக்கவும்.",
      general: "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்."
    }
  }
};

let currentLanguage = 'en';

function showLanguage() {
  document.getElementById("welcome").style.display = "none";
  document.getElementById("language").style.display = "block";
}

function setLanguage(lang) {
  currentLanguage = lang;
  const t = translations[lang];

  document.getElementById("language").style.display = "none";
  document.getElementById("formPage").style.display = "block";

  document.getElementById("formTitle").innerText = t.title;
  document.getElementById("name").placeholder = t.name;
  document.getElementById("location").placeholder = t.location;
  document.getElementById("mail").placeholder = t.mail;
  document.getElementById("phone").placeholder = t.phone;

  const purposeDropdown = document.getElementById("purpose");
  purposeDropdown.innerHTML = `<option value="">${t.purpose}</option>`;
  t.purposes.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    purposeDropdown.appendChild(option);
  });

  document.getElementById("entryTime").placeholder = t.entry;
  document.getElementById("exitTime").placeholder = t.exit;
  document.getElementById("submitBtn").innerText = t.submit;
  document.getElementById("thankYouMessage").innerText = t.thank;

  // Set default entry time to current formatted time
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("entryTime").value = now;
}

async function submitForm() {
  const t = translations[currentLanguage].errors;
  
  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();
  const mail = document.getElementById("mail").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const purpose = document.getElementById("purpose").value;
  const entryTime = document.getElementById("entryTime").value;
  const exitTime = document.getElementById("exitTime").value.trim();

  // Client-side validations
  if (!name) {
    alert(t.name);
    document.getElementById("name").focus();
    return;
  }
  if (!location) {
    alert(t.location);
    document.getElementById("location").focus();
    return;
  }
  
  // Basic email pattern if entered
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    alert(t.mail);
    document.getElementById("mail").focus();
    return;
  }
  
  // Phone validation (10 digits)
  if (!/^\d{10}$/.test(phone)) {
    alert(t.phone);
    document.getElementById("phone").focus();
    return;
  }
  
  if (!purpose) {
    alert(t.purpose);
    document.getElementById("purpose").focus();
    return;
  }

  const visitorData = {
    name,
    location,
    mail,
    phone,
    purpose,
    entryTime,
    exitTime
  };

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = currentLanguage === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Submitting...';

  try {
    const response = await fetch('/api/visitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorData)
    });

    if (response.ok) {
      // Clear form
      document.getElementById("name").value = "";
      document.getElementById("location").value = "";
      document.getElementById("mail").value = "";
      document.getElementById("phone").value = "";
      document.getElementById("purpose").value = "";
      document.getElementById("exitTime").value = "";
      
      // Navigate to thank you screen
      document.getElementById("formPage").style.display = "none";
      document.getElementById("thankyouPage").style.display = "block";
      
      // Return to home welcome screen after 4 seconds
      setTimeout(() => {
        document.getElementById("thankyouPage").style.display = "none";
        document.getElementById("welcome").style.display = "block";
      }, 4000);
    } else {
      const errData = await response.json();
      alert(errData.error || t.general);
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert(t.general);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = translations[currentLanguage].submit;
  }
}
