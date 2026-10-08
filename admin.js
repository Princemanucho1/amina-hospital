(function () {
var S = window.SITE, $ = function (i) { return document.getElementById(i); };
var st = { doctors: [], appts: [], patients: [], visits: [] }, tab = 'dash', q = '';
var today = function () { return new Date().toISOString().slice(0, 10); };
function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function wa(p) { p = String(p || '').replace(/\D/g, ''); return p[0] === '0' ? '254' + p.slice(1) : p; }
function fail(e) { if (e && (e.status === 401 || /JWT|expired/i.test(e.message))) { DB.logout(); alert('Session expired. Please sign in again.'); location.reload(); return; } alert('Error: ' + (e && e.message ? e.message : e)); }
var APPT_ST = ['New', 'Confirmed', 'Completed', 'Cancelled'], VISIT_ST = ['Waiting', 'In consultation', 'Completed'];
function sel(name, opts, val, extra) { return '<select ' + (extra || '') + '>' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'; }
// ---------- login ----------
$('mode').innerHTML = DB.live ? 'Sign in with your staff account.' : '<div class="banner"><b>Demo mode.</b> Data is saved in this browser only. Connect Supabase (see README) to use on all devices.</div>';
if (!DB.live) $('el').style.display = 'none';
function show(on) { $('lg').style.display = on ? 'none' : 'grid'; $('app').style.display = on ? 'block' : 'none'; if (on) { $('bn').innerHTML = DB.live ? '' : '<div class="banner"><b>Demo mode:</b> records are stored only in this browser. Do not enter real patient data until Supabase is connected.</div>'; load(); } }
$('lg').onsubmit = async function (e) { e.preventDefault(); $('er').textContent = ''; try { await DB.login($('em').value, $('pw').value); show(true); } catch (x) { $('er').textContent = x.message; } };
$('out').onclick = function () { DB.logout(); location.reload(); };
// ---------- data ----------
async function load() {
  try { var r = await Promise.all(['doctors', 'appointments', 'patients', 'visits'].map(function (t) { return DB.list(t); })); st.doctors = r[0]; st.appts = r[1]; st.patients = r[2]; st.visits = r[3]; render(); } catch (e) { fail(e); }
}
function pname(id) { var p = st.patients.filter(function (x) { return x.id === id; })[0]; return p ? p.name : '?'; }
// ---------- tabs ----------
$('tabs').onclick = function (e) { var t = e.target.dataset.t; if (!t) return; tab = t; q = ''; render(); };
function render() {
  Array.prototype.forEach.call($('tabs').querySelectorAll('[data-t]'), function (b) { b.classList.toggle('on', b.dataset.t === tab); });
  Array.prototype.forEach.call(document.querySelectorAll('.sec'), function (s) { s.classList.toggle('on', s.id === 's-' + tab); });
  $('nb').textContent = st.appts.filter(function (a) { return a.status === 'New'; }).length;
  ({ dash: rDash, appts: rAppts, pats: rPats, docs: rDocs, set: rSet })[tab]();
}
// ---------- dashboard ----------
function rDash() {
  var t = today(), queue = st.visits.filter(function (v) { return v.date === t && v.status !== 'Completed'; });
  var newA = st.appts.filter(function (a) { return a.status === 'New'; });
  $('s-dash').innerHTML = '<div class="st"><div class="fact"><b>' + st.patients.length + '</b><span>Registered patients</span></div><div class="fact"><b>' + st.visits.filter(function (v) { return v.date === t; }).length + '</b><span>Visits today</span></div><div class="fact"><b>' + queue.length + '</b><span>In queue now</span></div><div class="fact"><b>' + newA.length + '</b><span>New appointments</span></div></div>' +
  '<div class="tb"><button class="btn call sm" data-a="newpat">+ Register patient</button></div>' +
  '<h3>Today\'s queue</h3><div class="tw"><table><thead><tr><th>Patient</th><th>Complaint</th><th>Doctor</th><th>Status</th></tr></thead><tbody>' +
  (queue.length ? queue.map(function (v) { return '<tr><td><a href="#" data-a="open" data-id="' + esc(v.patient_id) + '"><b>' + esc(pname(v.patient_id)) + '</b></a></td><td>' + esc(v.complaint) + '</td><td>' + esc(v.doctor) + '</td><td>' + sel('', VISIT_ST, v.status, 'data-vs="' + esc(v.id) + '"') + '</td></tr>'; }).join('') : '<tr><td colspan="4">No patients in the queue.</td></tr>') + '</tbody></table></div>' +
  '<h3 style="margin-top:24px">New appointment requests</h3><div class="tw"><table><tbody>' + (newA.length ? newA.slice(0, 6).map(function (a) { return '<tr><td><b>' + esc(a.name) + '</b><br>' + esc(a.phone) + '</td><td>' + esc(a.service) + (a.doctor ? '<br><small>' + esc(a.doctor) + '</small>' : '') + '</td><td>' + esc(a.date) + '<br>' + esc(a.time) + '</td></tr>'; }).join('') : '<tr><td>No new requests.</td></tr>') + '</tbody></table></div>';
}
// ---------- appointments ----------
function rAppts() {
  $('s-appts').innerHTML = '<div class="tw"><table><thead><tr><th>Ref</th><th>Patient</th><th>Service</th><th>When</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
  (st.appts.length ? st.appts.map(function (a) {
    var m = 'Hello ' + a.name + ', your appointment at Amina Hospital (' + a.ref + ') on ' + a.date + ' is ' + String(a.status).toLowerCase() + '.';
    return '<tr><td>' + esc(a.ref) + '</td><td><b>' + esc(a.name) + '</b><br>' + esc(a.phone) + '</td><td>' + esc(a.service) + (a.doctor ? '<br><small>' + esc(a.doctor) + '</small>' : '') + (a.note ? '<br><small>' + esc(a.note) + '</small>' : '') + '</td><td>' + esc(a.date) + '<br>' + esc(a.time) + '</td><td>' + sel('', APPT_ST, a.status, 'data-as="' + esc(a.id) + '"') + '</td><td><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/' + wa(a.phone) + '?text=' + encodeURIComponent(m) + '">WhatsApp</a> <button class="btn ghost sm" data-a="regpat" data-id="' + esc(a.id) + '">Register</button> <button class="btn ghost sm" data-a="delappt" data-id="' + esc(a.id) + '">Delete</button></td></tr>';
  }).join('') : '<tr><td colspan="6">No appointments yet.</td></tr>') + '</tbody></table></div>';
}
// ---------- patients ----------
function rPats() {
  var l = st.patients.filter(function (p) { return JSON.stringify([p.name, p.pid, p.phone, p.id_no]).toLowerCase().indexOf(q) > -1; });
  $('s-pats').innerHTML = '<div class="tb"><input id="qs" placeholder="Search name, ID, phone..." value="' + esc(q) + '"><button class="btn call sm" data-a="newpat">+ Register patient</button></div><div class="tw"><table><thead><tr><th>Patient ID</th><th>Name</th><th>Phone</th><th>Visits</th><th></th></tr></thead><tbody>' +
  (l.length ? l.map(function (p) { return '<tr><td>' + esc(p.pid) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.phone) + '</td><td>' + st.visits.filter(function (v) { return v.patient_id === p.id; }).length + '</td><td><button class="btn ghost sm" data-a="open" data-id="' + esc(p.id) + '">Open</button></td></tr>'; }).join('') : '<tr><td colspan="5">No patients found.</td></tr>') + '</tbody></table></div>';
  var i = $('qs'); i.oninput = function () { q = i.value.toLowerCase(); var pos = i.selectionStart; rPats(); var n = $('qs'); n.focus(); n.setSelectionRange(pos, pos); };
}
// ---------- doctors ----------
function rDocs() {
  $('s-docs').innerHTML = '<div class="tb"><button class="btn call sm" data-a="newdoc">+ Add doctor</button></div><div class="tw"><table><thead><tr><th>Photo</th><th>Name</th><th>Role</th><th>Department</th><th>Days</th><th>Shown</th><th></th></tr></thead><tbody>' +
  (st.doctors.length ? st.doctors.map(function (d) { return '<tr><td>' + (d.photo ? '<img class="dd" src="' + esc(d.photo) + '" alt="">' : '<div class="dd"></div>') + '</td><td><b>' + esc(d.name) + '</b></td><td>' + esc(d.role) + '</td><td>' + esc(d.dept) + '</td><td>' + esc(d.days) + '</td><td>' + (d.active === false ? 'Hidden' : 'Yes') + '</td><td><button class="btn ghost sm" data-a="editdoc" data-id="' + esc(d.id) + '">Edit</button> <button class="btn ghost sm" data-a="togdoc" data-id="' + esc(d.id) + '">' + (d.active === false ? 'Show' : 'Hide') + '</button> <button class="btn ghost sm" data-a="deldoc" data-id="' + esc(d.id) + '">Delete</button></td></tr>'; }).join('') : '<tr><td colspan="7">No doctors yet. Click "Add doctor".</td></tr>') + '</tbody></table></div><p class="note" style="margin-top:12px">Doctors marked "Shown" appear on the public website with their photo and department.</p>';
}
// ---------- settings ----------
function rSet() {
  $('s-set').innerHTML = '<div class="card"><div class="pad"><h3>Backup and export</h3><p>Download all records as a backup file, or patients as a spreadsheet (CSV).</p><div class="tb"><button class="btn call sm" data-a="bk">Download backup (JSON)</button><button class="btn ghost sm" data-a="csv">Patients CSV</button>' + (DB.live ? '' : '<label class="btn ghost sm" style="cursor:pointer">Restore backup<input type="file" accept=".json" id="rs" style="display:none"></label>') + '</div></div></div>' +
  '<div class="card" style="margin-top:14px"><div class="pad"><h3>Storage mode</h3><p>' + (DB.live ? 'LIVE: connected to Supabase. Data is shared on all staff devices.' : 'DEMO: data is stored only in this browser. Add your Supabase URL and key in assets/data.js to go live.') + '</p></div></div>';
  var r = $('rs'); if (r) r.onchange = function () { var f = r.files[0]; if (!f) return; var fr = new FileReader(); fr.onload = function () { try { var j = JSON.parse(fr.result); ['doctors', 'appointments', 'patients', 'visits'].forEach(function (t) { localStorage.setItem('amina_' + t, JSON.stringify(j[t] || [])); }); load(); alert('Backup restored.'); } catch (e) { alert('Invalid backup file.'); } }; fr.readAsText(f); };
}
// ---------- generic form ----------
function form(title, fields, v, save) {
  v = v || {}; var d = $('fd'); $('ft').textContent = title;
  $('ff').innerHTML = fields.map(function (f) {
    var val = esc(v[f.k] != null ? v[f.k] : (f.def || '')), h = '<label' + (f.w ? ' class="wide"' : '') + '>' + f.l;
    if (f.t === 'select') { var o = f.o.slice(); if (v[f.k] && o.indexOf(v[f.k]) < 0) o.push(v[f.k]); h += '<select name="' + f.k + '">' + o.map(function (x) { return '<option' + (x === (v[f.k] != null ? v[f.k] : f.def) ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; }
    else if (f.t === 'textarea') h += '<textarea name="' + f.k + '" rows="2">' + val + '</textarea>';
    else if (f.t === 'file') h += '<input type="file" name="' + f.k + '" accept="image/*">';
    else h += '<input name="' + f.k + '" type="' + (f.t || 'text') + '" value="' + val + '"' + (f.r ? ' required' : '') + '>';
    return h + '</label>';
  }).join('') + '<div class="wide act"><button type="button" class="btn ghost" id="fc">Cancel</button><button class="btn call" id="fs">Save</button></div>';
  $('fc').onclick = function () { d.close(); };
  $('ff').onsubmit = async function (e) {
    e.preventDefault(); var fd = new FormData(this), o = {}, btn = $('fs'); btn.disabled = true; btn.textContent = 'Saving...';
    fields.forEach(function (f) { var x = fd.get(f.k); o[f.k] = f.t === 'file' ? x : (x === '' ? (f.t === 'date' ? null : '') : x); });
    try { var r = await save(o); d.close(); await load(); if (r && r.__open) openPatient(r.__open); } catch (er) { fail(er); btn.disabled = false; btn.textContent = 'Save'; }
  };
  d.showModal();
}
// ---------- doctors forms ----------
function docForm(d) {
  d = d || {};
  form(d.id ? 'Edit doctor' : 'Add doctor', [
    { k: 'name', l: 'Full name', r: 1, w: 1 }, { k: 'role', l: 'Title / role (e.g. Medical Officer)' },
    { k: 'dept', l: 'Department', t: 'select', o: S.departments.map(function (x) { return x.n; }) },
    { k: 'days', l: 'Days available', w: 1 }, { k: 'photo', l: 'Photo (optional)', t: 'file', w: 1 }], d, async function (o) {
    var row = { name: o.name, role: o.role, dept: o.dept, days: o.days };
    if (o.photo && o.photo.size) row.photo = await DB.upload(await DB.resize(o.photo, 500));
    if (d.id) await DB.update('doctors', d.id, row); else { row.active = true; await DB.insert('doctors', row); }
  });
}
// ---------- patient forms ----------
var PF = [{ k: 'name', l: 'Full name', r: 1, w: 1 }, { k: 'sex', l: 'Sex', t: 'select', o: ['Female', 'Male', 'Other'] }, { k: 'dob', l: 'Date of birth', t: 'date', r: 1 }, { k: 'phone', l: 'Phone', t: 'tel', r: 1 }, { k: 'id_no', l: 'National ID / Passport no.' }, { k: 'insurance', l: 'Insurance (e.g. NHIF no.)' }, { k: 'address', l: 'Address / village' }, { k: 'kin_name', l: 'Next of kin' }, { k: 'kin_phone', l: 'Next of kin phone', t: 'tel' }, { k: 'allergies', l: 'Known allergies', t: 'textarea', w: 1 }];
function patForm(p, prefill) {
  p = p || prefill || {};
  form(p.id ? 'Edit patient' : 'Register patient', PF, p, async function (o) {
    if (p.id) { await DB.update('patients', p.id, o); return { __open: p.id }; }
    o.pid = DB.newPid(); var r = await DB.insert('patients', o); return { __open: r.id };
  });
}
function visitForm(pid, v) {
  v = v || {};
  form(v.id ? 'Edit visit' : 'New visit', [
    { k: 'date', l: 'Date', t: 'date', def: today(), r: 1 }, { k: 'status', l: 'Status', t: 'select', o: VISIT_ST, def: 'Waiting' },
    { k: 'doctor', l: 'Doctor', t: 'select', o: [''].concat(st.doctors.map(function (d) { return d.name; })), w: 1 },
    { k: 'complaint', l: 'Complaint / reason for visit', t: 'textarea', w: 1 },
    { k: 'temp', l: 'Temperature (°C)' }, { k: 'bp', l: 'Blood pressure' }, { k: 'pulse', l: 'Pulse' }, { k: 'weight', l: 'Weight (kg)' },
    { k: 'diagnosis', l: 'Diagnosis', t: 'textarea', w: 1 }, { k: 'treatment', l: 'Treatment / prescription', t: 'textarea', w: 1 },
    { k: 'notes', l: 'Clinical notes', t: 'textarea', w: 1 }, { k: 'followup', l: 'Follow-up date', t: 'date' }], v, async function (o) {
    if (v.id) await DB.update('visits', v.id, o); else { o.patient_id = pid; await DB.insert('visits', o); }
    return { __open: pid };
  });
}
// ---------- patient record ----------
function openPatient(id) {
  var p = st.patients.filter(function (x) { return x.id === id; })[0]; if (!p) return;
  var vs = st.visits.filter(function (v) { return v.patient_id === id; }).sort(function (a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; });
  var f = function (l, k) { return '<div><span>' + l + ':</span> ' + esc(p[k] || '-') + '</div>'; };
  var msg = 'Hello ' + p.name + ', your Amina Hospital Patient ID is ' + p.pid + '. Use it with your date of birth on the patient portal to see your records.';
  $('pd').innerHTML = '<div class="top"><div><h2 style="font-size:1.4rem">' + esc(p.name) + '</h2><span class="badge">' + esc(p.pid) + '</span></div><button class="btn ghost sm" data-a="closepd">Close</button></div>' +
  '<div class="pgrid">' + f('Sex', 'sex') + f('Date of birth', 'dob') + f('Phone', 'phone') + f('ID no.', 'id_no') + f('Insurance', 'insurance') + f('Address', 'address') + f('Next of kin', 'kin_name') + f('Kin phone', 'kin_phone') + '<div style="grid-column:1/-1"><span>Allergies:</span> ' + esc(p.allergies || 'None recorded') + '</div></div>' +
  '<div class="tb"><button class="btn call sm" data-a="newvisit" data-id="' + esc(id) + '">+ New visit</button><button class="btn ghost sm" data-a="editpat" data-id="' + esc(id) + '">Edit</button><button class="btn ghost sm" data-a="print" data-id="' + esc(id) + '">Print summary</button><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/' + wa(p.phone) + '?text=' + encodeURIComponent(msg) + '">Send ID on WhatsApp</a><button class="btn ghost sm" data-a="delpat" data-id="' + esc(id) + '">Delete</button></div>' +
  '<h3>Visit history (' + vs.length + ')</h3>' + (vs.length ? vs.map(function (v) {
    return '<div class="vc"><b>' + esc(v.date) + '</b> · ' + esc(v.doctor || 'No doctor set') + ' · <span class="badge">' + esc(v.status) + '</span>' +
    (v.complaint ? '<p><b>Complaint:</b> ' + esc(v.complaint) + '</p>' : '') + ((v.temp || v.bp || v.pulse || v.weight) ? '<p><b>Vitals:</b> Temp ' + esc(v.temp || '-') + ' · BP ' + esc(v.bp || '-') + ' · Pulse ' + esc(v.pulse || '-') + ' · Weight ' + esc(v.weight || '-') + '</p>' : '') +
    (v.diagnosis ? '<p><b>Diagnosis:</b> ' + esc(v.diagnosis) + '</p>' : '') + (v.treatment ? '<p><b>Treatment:</b> ' + esc(v.treatment) + '</p>' : '') + (v.notes ? '<p><b>Notes:</b> ' + esc(v.notes) + '</p>' : '') + (v.followup ? '<p><b>Follow-up:</b> ' + esc(v.followup) + '</p>' : '') +
    '<button class="btn ghost sm" data-a="editvisit" data-id="' + esc(v.id) + '" data-pid="' + esc(id) + '">Edit</button> <button class="btn ghost sm" data-a="delvisit" data-id="' + esc(v.id) + '" data-pid="' + esc(id) + '">Delete</button></div>';
  }).join('') : '<p class="note">No visits yet.</p>');
  if (!$('pd').open) $('pd').showModal();
}
function printPatient(id) {
  var p = st.patients.filter(function (x) { return x.id === id; })[0], vs = st.visits.filter(function (v) { return v.patient_id === id; });
  var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; }
  w.document.write('<html><head><title>' + esc(p.name) + '</title><style>body{font:14px Arial;margin:30px}h1{margin:0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px;text-align:left;vertical-align:top}</style></head><body><h1>' + esc(S.name) + '</h1><p>' + esc(S.box) + ' · ' + esc(S.telShow) + '</p><h2>Patient summary</h2><p><b>' + esc(p.name) + '</b> · ID ' + esc(p.pid) + '<br>Sex: ' + esc(p.sex) + ' · DOB: ' + esc(p.dob) + ' · Phone: ' + esc(p.phone) + '<br>Allergies: ' + esc(p.allergies || 'None recorded') + '</p><table><tr><th>Date</th><th>Doctor</th><th>Complaint</th><th>Diagnosis</th><th>Treatment</th><th>Follow-up</th></tr>' + vs.map(function (v) { return '<tr><td>' + esc(v.date) + '</td><td>' + esc(v.doctor) + '</td><td>' + esc(v.complaint) + '</td><td>' + esc(v.diagnosis) + '</td><td>' + esc(v.treatment) + '</td><td>' + esc(v.followup) + '</td></tr>'; }).join('') + '</table><script>window.print()<\/script></body></html>');
  w.document.close();
}
function download(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); }
// ---------- actions ----------
document.addEventListener('click', async function (e) {
  var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a, id = b.dataset.id; if (a === 'open') e.preventDefault();
  var get = function (arr) { return st[arr].filter(function (x) { return x.id === id; })[0]; };
  try {
    if (a === 'newpat') patForm();
    else if (a === 'open') openPatient(id);
    else if (a === 'closepd') $('pd').close();
    else if (a === 'editpat') { $('pd').close(); patForm(get('patients')); }
    else if (a === 'newvisit') { $('pd').close(); visitForm(id); }
    else if (a === 'editvisit') { $('pd').close(); visitForm(b.dataset.pid, get('visits')); }
    else if (a === 'delvisit') { if (confirm('Delete this visit?')) { await DB.remove('visits', id); await load(); openPatient(b.dataset.pid); } }
    else if (a === 'delpat') { if (confirm('Delete this patient and ALL their visits? This cannot be undone.')) { await DB.remove('patients', id); $('pd').close(); await load(); } }
    else if (a === 'print') printPatient(id);
    else if (a === 'newdoc') docForm();
    else if (a === 'editdoc') docForm(get('doctors'));
    else if (a === 'togdoc') { var d = get('doctors'); await DB.update('doctors', id, { active: d.active === false }); await load(); }
    else if (a === 'deldoc') { if (confirm('Delete this doctor?')) { await DB.remove('doctors', id); await load(); } }
    else if (a === 'delappt') { if (confirm('Delete this appointment?')) { await DB.remove('appointments', id); await load(); } }
    else if (a === 'regpat') { var ap = get('appts'); patForm(null, { name: ap.name, phone: ap.phone }); }
    else if (a === 'bk') download('amina-backup-' + today() + '.json', JSON.stringify({ doctors: st.doctors, appointments: st.appts, patients: st.patients, visits: st.visits }), 'application/json');
    else if (a === 'csv') { var rows = [['Patient ID', 'Name', 'Sex', 'DOB', 'Phone', 'ID no', 'Insurance', 'Address', 'Allergies']].concat(st.patients.map(function (p) { return [p.pid, p.name, p.sex, p.dob, p.phone, p.id_no, p.insurance, p.address, p.allergies]; })); download('patients.csv', rows.map(function (r) { return r.map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv'); }
  } catch (er) { fail(er); }
});
document.addEventListener('change', async function (e) {
  var t = e.target; try {
    if (t.dataset.as) { await DB.update('appointments', t.dataset.as, { status: t.value }); await load(); }
    else if (t.dataset.vs) { await DB.update('visits', t.dataset.vs, { status: t.value }); await load(); }
  } catch (er) { fail(er); }
});
if (DB.isAuth()) show(true);
})();
