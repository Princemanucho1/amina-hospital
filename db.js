// Data layer: same code works in DEMO mode (browser storage) and LIVE mode (Supabase).
(function () {
  var S = window.SITE, C = S.supabase || {}, LIVE = !!(C.url && C.key), P = 'amina_', TK = 'amina_token';
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2); }
  function lget(t) { try { return JSON.parse(localStorage.getItem(P + t) || '[]'); } catch (e) { return []; } }
  function lput(t, a) { localStorage.setItem(P + t, JSON.stringify(a)); }
  function tok() { try { return sessionStorage.getItem(TK); } catch (e) { return null; } }
  async function sb(path, o) {
    o = o || {};
    var h = { apikey: C.key, Authorization: 'Bearer ' + (tok() || C.key) };
    if (o.type) h['Content-Type'] = o.type; else if (o.body) h['Content-Type'] = 'application/json';
    if (o.prefer) h.Prefer = o.prefer;
    var r = await fetch(C.url + path, { method: o.m || 'GET', headers: h, body: o.raw ? o.body : (o.body ? JSON.stringify(o.body) : undefined) });
    var t = await r.text();
    if (!r.ok) { var er = new Error(t || String(r.status)); er.status = r.status; throw er; }
    return t ? JSON.parse(t) : null;
  }
  var DB = {
    live: LIVE,
    uid: uid,
    newPid: function () {
      var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', b = new Uint8Array(6);
      crypto.getRandomValues(b); for (var i = 0; i < 6; i++) s += a[b[i] % a.length];
      return 'AMN-' + s;
    },
    isAuth: function () { return !!tok(); },
    logout: function () { sessionStorage.removeItem(TK); },
    login: async function (email, pass) {
      if (!LIVE) { if (pass === S.adminPass) { sessionStorage.setItem(TK, 'demo'); return true; } throw new Error('Wrong password'); }
      var r = await fetch(C.url + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: pass }) });
      var j = await r.json();
      if (!r.ok || !j.access_token) throw new Error(j.error_description || j.msg || 'Sign in failed');
      sessionStorage.setItem(TK, j.access_token); return true;
    },
    list: async function (t) {
      if (LIVE) return sb('/rest/v1/' + t + '?select=*&order=created_at.desc');
      return lget(t);
    },
    insert: async function (t, row) {
      if (LIVE) { var r = await sb('/rest/v1/' + t, { m: 'POST', body: row, prefer: 'return=representation' }); return r && r[0]; }
      row = Object.assign({ id: uid(), created_at: new Date().toISOString() }, row);
      var a = lget(t); a.unshift(row); lput(t, a); return row;
    },
    update: async function (t, id, patch) {
      if (LIVE) { var r = await sb('/rest/v1/' + t + '?id=eq.' + encodeURIComponent(id), { m: 'PATCH', body: patch, prefer: 'return=representation' }); return r && r[0]; }
      var a = lget(t), out = null;
      a = a.map(function (x) { if (x.id === id) { out = Object.assign(x, patch); } return x; }); lput(t, a); return out;
    },
    remove: async function (t, id) {
      if (LIVE) return sb('/rest/v1/' + t + '?id=eq.' + encodeURIComponent(id), { m: 'DELETE' });
      lput(t, lget(t).filter(function (x) { return x.id !== id; }));
      if (t === 'patients') lput('visits', lget('visits').filter(function (v) { return v.patient_id !== id; }));
    },
    resize: function (file, max) {
      max = max || 500;
      return new Promise(function (res, rej) {
        var img = new Image(), u = URL.createObjectURL(file);
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { URL.revokeObjectURL(u); b ? res(b) : rej(new Error('Image error')); }, 'image/jpeg', 0.82);
        };
        img.onerror = function () { rej(new Error('Could not read image')); }; img.src = u;
      });
    },
    upload: async function (blob) {
      if (!LIVE) return new Promise(function (res) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.readAsDataURL(blob); });
      var name = uid() + '.jpg';
      await sb('/storage/v1/object/doctors/' + name, { m: 'POST', raw: true, body: blob, type: 'image/jpeg' });
      return C.url + '/storage/v1/object/public/doctors/' + name;
    },
    lookup: async function (pid, dob) {
      pid = String(pid).trim().toUpperCase();
      if (LIVE) return sb('/rest/v1/rpc/patient_lookup', { m: 'POST', body: { p_pid: pid, p_dob: dob } });
      var p = lget('patients').filter(function (x) { return String(x.pid).toUpperCase() === pid && x.dob === dob; })[0];
      if (!p) return null;
      return { patient: { name: p.name, pid: p.pid }, visits: lget('visits').filter(function (v) { return v.patient_id === p.id; }).sort(function (a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; }) };
    }
  };
  window.DB = DB;
})();
