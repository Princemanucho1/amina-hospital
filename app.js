(function () {
var S = window.SITE, $ = function (i) { return document.getElementById(i); };
function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
// mobile menu
$('mb').onclick = function () { var o = $('menu').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
$('menu').onclick = function (e) { if (e.target.tagName === 'A') this.classList.remove('open'); };
// lightbox
var lb = $('lb');
document.addEventListener('click', function (e) {
  var t = e.target;
  if (t.tagName === 'IMG' && t.closest('.gal,.card:not(.dc),.split')) { lb.querySelector('img').src = t.src; lb.querySelector('img').alt = t.alt; lb.showModal(); }
  else if (t === lb) lb.close();
  var sv = t.closest && t.closest('[data-svc]'); if (sv) pick(sv.dataset.svc);
});
// booking form
S.services.forEach(function (s) { $('sv').add(new Option(s, s)); });
function pick(svc, dr) { for (var i = 0; i < $('sv').options.length; i++) if ($('sv').options[i].text === svc) $('sv').selectedIndex = i; if (dr) $('ds').value = dr; }
var d = $('d'), today = new Date().toISOString().slice(0, 10); d.min = today; d.value = today;
$('bk').onsubmit = async function (e) {
  e.preventDefault();
  var f = new FormData(this), ref = 'APT-' + Date.now().toString(36).toUpperCase().slice(-5);
  var rec = { ref: ref, name: f.get('n'), phone: f.get('p'), service: f.get('s'), doctor: f.get('dr') || '', date: f.get('d'), time: f.get('t'), note: f.get('x'), status: 'New' };
  var saved = true; try { await DB.insert('appointments', rec); } catch (x) { saved = false; }
  var msg = 'Hello Amina Hospital, I would like to book an appointment.\nRef: ' + ref + '\nName: ' + rec.name + '\nPhone: ' + rec.phone + '\nService: ' + rec.service + (rec.doctor ? '\nDoctor: ' + rec.doctor : '') + '\nDate: ' + rec.date + ' (' + rec.time + ')' + (rec.note ? '\nNotes: ' + rec.note : '');
  var ok = $('ok'); ok.style.display = 'block';
  ok.innerHTML = (saved ? '<b>Request recorded.</b> ' : '<b>We could not record this online.</b> ') + 'Your reference: <b>' + ref + '</b>.<br>Send it on WhatsApp so we can confirm your time:<br><br><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/' + S.wa + '?text=' + encodeURIComponent(msg) + '">Send on WhatsApp</a>';
  this.reset(); d.value = today; ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
// departments
$('dp').innerHTML = S.departments.map(function (x, i) { return '<div class="card"><div class="pad"><span class="ic">' + x.i + '</span><h3>' + esc(x.n) + '</h3><p>' + esc(x.d) + '</p><a class="btn ghost sm" href="#book" data-svc="' + esc(x.s) + '" style="margin-top:12px">Book</a></div></div>'; }).join('');
// doctors (from database)
DB.list('doctors').then(function (D) {
  D = (D || []).filter(function (x) { return x.active !== false; }).sort(function (a, b) { return String(a.name).localeCompare(b.name); });
  if (!D.length) { $('dr').remove(); $('dh').style.display = 'none'; return; }
  $('dl').style.display = 'grid';
  $('dr').innerHTML = D.map(function (x) {
    var ini = String(x.name).replace(/^dr\.?\s*/i, '').split(' ').map(function (w) { return w[0] || ''; }).slice(0, 2).join('').toUpperCase();
    $('ds').add(new Option(x.name, x.name));
    return '<div class="card dc"><div class="av">' + (x.photo ? '<img src="' + esc(x.photo) + '" alt="' + esc(x.name) + '" loading="lazy">' : '<span>' + esc(ini) + '</span>') + '</div><div class="pad"><h3>' + esc(x.name) + '</h3><p><b>' + esc(x.role) + '</b></p><p>' + esc(x.dept) + '</p>' + (x.days ? '<p>' + esc(x.days) + '</p>' : '') + '<a class="btn call sm" href="#book" data-dr="' + esc(x.name) + '" data-svc="' + esc(/dental/i.test(x.dept) ? 'Dental' : 'General OPD') + '" style="margin-top:12px">Book with doctor</a></div></div>';
  }).join('');
  $('dr').onclick = function (e) { var a = e.target.closest('[data-dr]'); if (a) pick(a.dataset.svc, a.dataset.dr); };
}).catch(function () { $('dr').remove(); $('dh').style.display = 'none'; });
// information assistant (information only, no medical diagnosis)
var KB = [
 [/emergency|accident|urgent|bleeding|unconscious|faint|can.?t breathe|chest pain|severe/, 'For an emergency, call now: ' + S.telShow + '. We are open 24 hours. Please do not wait for a reply here.'],
 [/open|hours|time|closed|close/, 'We are open 24 hours, every day of the week.'],
 [/where|location|address|map|direction|find you|taveta/, 'We are in Taveta. P.O. Box 404-80302, Taveta. Use the "Open in Maps" button in the Find us section.'],
 [/phone|number|call|contact|whatsapp|email/, 'Phone: ' + S.telShow + ', ' + S.tel2Show + ' or ' + S.tel3Show + '.\nWhatsApp: ' + S.telShow + '\nEmail: ' + S.email],
 [/dental|tooth|teeth|braces|denture|implant/, 'Dental services: cleaning, fillings, root canals, extractions, dentures, crowns and bridges, implants, dental X-ray and braces. You can book in the Book section.'],
 [/x-?ray|imaging/, 'We have an X-ray unit. Your doctor will tell you if you need one.'],
 [/ultrasound|scan|obs|pregnan|anc|maternity|deliver|antenatal/, 'We offer ultrasound (including OBS scan), ANC and maternity care. Call ' + S.telShow + ' for details and current prices.'],
 [/pharmacy|medicine|drug/, 'Our pharmacy stocks medicines prescribed by our doctors. For a specific medicine, please call ' + S.telShow + '.'],
 [/lab|test|blood/, 'Our laboratory does blood tests and other routine tests. Call ' + S.telShow + ' to ask about a specific test.'],
 [/insurance|nhif|cic|apa|minet|britam|cover/, 'We accept NHIF, CIC Life Assurance, APA, Minet, and Britam for county government workers. Please confirm your card at reception.'],
 [/price|cost|fee|how much|offer/, 'Prices change by service and current offers. Please call ' + S.telShow + ' for today\'s price.'],
 [/portal|record|history|results/, 'Patients can open the Patient portal (top menu) using their Patient ID and date of birth to see visit history.'],
 [/book|appointment|schedule/, 'Use the "Book an appointment" form, then send the request on WhatsApp to confirm your time.'],
 [/hello|hi|hey|good (morning|afternoon|evening)/, 'Hello! I can help with services, opening hours, location, insurance and appointments.']
];
function add(t, c) { var m = document.createElement('div'); m.className = 'm ' + c; m.textContent = t; $('msgs').appendChild(m); $('msgs').scrollTop = 1e9; }
function ask(t) { add(t, 'u'); var r = null; for (var i = 0; i < KB.length; i++) if (KB[i][0].test(t.toLowerCase())) { r = KB[i][1]; break; } add(r || 'Sorry, I could not find an answer. Please call ' + S.telShow + ' or message us on WhatsApp. I cannot give medical advice.', 'b'); }
['Opening hours', 'Dental services', 'Insurance', 'Location', 'Book appointment'].forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x; b.onclick = function () { ask(x); }; $('qk').appendChild(b); });
add('Hello! I am the Amina Hospital information assistant. I cannot diagnose illness. I can help with services, hours, location and appointments.', 'b');
$('cb').onclick = function () { $('chat').classList.toggle('open'); }; $('cx').onclick = function () { $('chat').classList.remove('open'); };
$('cf').onsubmit = function (e) { e.preventDefault(); var v = $('ci').value.trim(); if (v) { ask(v); $('ci').value = ''; } };
})();
