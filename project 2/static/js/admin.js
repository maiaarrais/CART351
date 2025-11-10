const bookingsTbody = document.querySelector('#bookingsTable tbody');
const utilizationDiv = document.getElementById('utilization');
let classes = [];
let bookings = [];

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

function classById(id) { return classes.find(c => c.id === id) || {}; }

function renderTable() {
  bookingsTbody.innerHTML = '';
  bookings.sort((a,b) => (b.ts||'').localeCompare(a.ts||''));
  for (const b of bookings) {
    const cls = classById(b.class_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(b.ts)}</td>
      <td>${cls.title||b.class_id} (${cls.time||''})</td>
      <td>${b.name}</td>
      <td>${b.email}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td>
        <select data-id="${b.id}" class="status-select">
          ${['pending','confirmed','completed','cancelled','waitlist']
            .map(s => `<option value="${s}" ${s===b.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>`;
    bookingsTbody.appendChild(tr);
  }

  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const status = e.target.value;
      const res = await fetch(`/api/booking/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        bookings = await (await fetch('/api/bookings')).json();
        renderTable();
        renderUtilization();
      }
    });
  });
}

function renderUtilization() {
  const occ = {};
  for (const c of classes) occ[c.id] = { title: c.title, time: c.time, capacity: c.capacity, count: 0 };
  for (const b of bookings) if (['pending','confirmed'].includes(b.status)) occ[b.class_id].count += 1;

  utilizationDiv.innerHTML = '';
  Object.values(occ).forEach(o => {
    const pct = o.capacity ? Math.min(100, Math.round((o.count/o.capacity)*100)) : 0;
    const wrap = document.createElement('div');
    wrap.style.margin = '8px 0';
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <strong>${o.title}</strong> <span>${o.count}/${o.capacity}</span>
      </div>
      <div style="height:10px;background:#222;border-radius:999px;overflow:hidden;">
        <div style="height:10px;width:${pct}%;background:linear-gradient(90deg,#6ee7b7,#60a5fa);"></div>
      </div>`;
    utilizationDiv.appendChild(wrap);
  });
}

async function fetchAll() {
  const [clsRes, bRes] = await Promise.all([fetch('/api/classes'), fetch('/api/bookings')]);
  classes = await clsRes.json();
  bookings = await bRes.json();
  renderTable();
  renderUtilization();
}

fetchAll();
