// Edit hospital details here. The whole website reads from this file.
window.SITE = {
  name: "Amina Community Hospital Centre",
  tagline: "Your health is our concern",
  tel: "+254700636437", telShow: "0700 636437",
  tel2Show: "0703 845 866", tel3Show: "0752 643 933",
  wa: "254700636437",
  email: "enquiry@aminahc.org",
  box: "P.O. Box 404-80302, Taveta",
  web: "www.aminahc.org",

  // STORAGE MODE
  // Leave url/key empty = DEMO mode: data is saved only in the browser of the device used.
  // Fill both (from Supabase > Project Settings > API) = LIVE mode: data is shared on all devices.
  supabase: { url: "", key: "" },

  // Used ONLY in demo mode. In live mode staff sign in with their Supabase email and password.
  adminPass: "change-me-2026",

  departments: [
    { n: "General OPD", i: "🩺", d: "Consultation and treatment for outpatients.", s: "General OPD" },
    { n: "Dental", i: "🦷", d: "Cleaning, fillings, root canals, dentures, braces and more.", s: "Dental" },
    { n: "Maternity & ANC", i: "🤰", d: "Care for expectant mothers and safe delivery.", s: "Maternity / ANC" },
    { n: "Radiology", i: "🩻", d: "X-ray and ultrasound, including OBS scan.", s: "Radiology" },
    { n: "Laboratory", i: "🔬", d: "Blood tests and other routine tests.", s: "Laboratory" },
    { n: "Pharmacy", i: "💊", d: "Medicines prescribed by our doctors.", s: "General OPD" }
  ],
  services: ["General OPD", "Dental", "Maternity / ANC", "Radiology", "Laboratory", "Other"]
};
