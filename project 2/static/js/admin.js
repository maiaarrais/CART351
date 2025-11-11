const bookingsTbody = document.querySelector('#bookingsTable tbody');
const utilizationDiv = document.getElementById('utilization');
const heatmapDiv = document.getElementById('heatmap');
const heatmapLegend = document.getElementById('heatmapLegend');
const classesDiv = document.getElementById('classesManagement');
const toast = document.getElementById('toast');

let classes = [];
let bookings = [];

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = isError ? 'toast error' : 'toast';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

function parseTimeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function classById(id) {
  return classes.find(c => c.id === id) || {};
}

function weekdayName(i) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
}

/* ---------- Bookings Table ---------- */
function renderTable() {
  bookingsTbody.innerHTML = '';
  bookings.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));

  for (const b of bookings) {
    const cls = classById(b.class_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(b.ts)}</td>
      <td>${cls.title || b.class_id} (${cls.time || ''})</td>
      <td>${b.name}</td>
      <td>${b.email}</td>
      <td><span class="status ${b.status}">${b.status}</span></td>
      <td>
        <select data-id="${b.id}" class="status-select select" style="font-size: 13px; padding: 6px 10px;">
          ${['pending', 'confirmed', 'completed', 'cancelled', 'waitlist']
            .map(s => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
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
        showToast('Booking updated');
        await fetchAll();
      } else {
        showToast('Update failed', true);
      }
    });
  });
}

/* ---------- Utilization Bars ---------- */
function renderUtilization() {
  const occ = {};
  for (const c of classes) {
    occ[c.id] = { title: c.title, time: c.time, capacity: c.capacity, count: 0 };
  }
  for (const b of bookings) {
    if (b.status === 'pending' || b.status === 'confirmed') {
      if (occ[b.class_id]) occ[b.class_id].count += 1;
    }
  }

  utilizationDiv.innerHTML = '';
  Object.values(occ).forEach(o => {
    const pct = o.capacity ? Math.min(100, Math.round((o.count / o.capacity) * 100)) : 0;
    const wrap = document.createElement('div');
    wrap.style.margin = '12px 0';
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <strong style="color:var(--text);">${o.title}</strong>
        <span style="color:var(--text-soft);font-size:14px;">${o.count}/${o.capacity}</span>
      </div>
      <div style="height:10px;background:var(--bg-alt);border-radius:10px;overflow:hidden;">
        <div style="height:10px;width:${pct}%;background:linear-gradient(90deg,var(--sage),var(--accent-soft));transition:width 0.3s ease;"></div>
      </div>`;
    utilizationDiv.appendChild(wrap);
  });
}

/* ---------- Weekly Heatmap ---------- */
function renderHeatmap() {
  const timeSet = new Set(classes.map(c => c.time).filter(Boolean));
  const timeRows = Array.from(timeSet).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  const numRows = timeRows.length;
  const numCols = 7;

  const classByKey = {};
  for (const c of classes) {
    const key = `${c.weekday}_${c.time}`;
    if (!classByKey[key]) classByKey[key] = { capacity: 0, count: 0, title: c.title };
    classByKey[key].capacity += Number(c.capacity || 0);
  }

  for (const b of bookings) {
    if (b.status === 'pending' || b.status === 'confirmed') {
      const cls = classById(b.class_id);
      if (cls && cls.time != null && typeof cls.weekday === 'number') {
        const key = `${cls.weekday}_${cls.time}`;
        if (!classByKey[key]) classByKey[key] = { capacity: 0, count: 0, title: cls.title };
        classByKey[key].count += 1;
      }
    }
  }

  const cellW = 80, cellH = 28;
  const padL = 120;
  const padT = 26;
  const W = padL + (numCols * cellW) + 1;
  const H = padT + (numRows * cellH) + 1;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.display = 'block';
  svg.style.border = '1px solid rgba(156,139,122,0.12)';
  svg.style.borderRadius = '12px';
  svg.style.background = 'var(--panel)';

  // Weekday labels
  for (let c = 0; c < numCols; c++) {
    const tx = document.createElementNS(svgNS, 'text');
    tx.setAttribute('x', padL + c * cellW + cellW / 2);
    tx.setAttribute('y', padT - 8);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('fill', 'var(--muted)');
    tx.setAttribute('font-size', '12');
    tx.textContent = weekdayName(c);
    svg.appendChild(tx);
  }

  // Time labels
  timeRows.forEach((t, r) => {
    const tx = document.createElementNS(svgNS, 'text');
    tx.setAttribute('x', padL - 8);
    tx.setAttribute('y', padT + r * cellH + cellH / 2 + 4);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('fill', 'var(--muted)');
    tx.setAttribute('font-size', '12');
    tx.textContent = t;
    svg.appendChild(tx);
  });

  function colorForRatio(r) {
    const clamped = Math.max(0, Math.min(1, r || 0));
    const hue = 170 + (210 - 170) * clamped;
    const sat = 70;
    const light = 18 + (45 * clamped);
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  function tooltipText(weekday, time, ratio, count, capacity, title) {
    const label = `${weekdayName(weekday)} ${time}`;
    if (!capacity) return `${label}\nNo class`;
    const pct = Math.round((ratio || 0) * 100);
    const t = title ? `\n${title}` : '';
    return `${label}${t}\n${count}/${capacity} filled (${pct}%)`;
  }

  // Cells
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const time = timeRows[r];
      const key = `${c}_${time}`;
      const agg = classByKey[key];
      const cap = agg ? agg.capacity : 0;
      const count = agg ? agg.count : 0;
      const ratio = cap ? count / cap : 0;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', padL + c * cellW + 1);
      rect.setAttribute('y', padT + r * cellH + 1);
      rect.setAttribute('width', cellW - 2);
      rect.setAttribute('height', cellH - 2);
      rect.setAttribute('rx', 6);
      rect.setAttribute('ry', 6);
      rect.setAttribute('stroke', 'rgba(156,139,122,0.12)');
      rect.setAttribute('fill', cap ? colorForRatio(ratio) : 'rgba(156,139,122,0.04)');

      const title = document.createElementNS(svgNS, 'title');
      title.textContent = tooltipText(c, time, ratio, count, cap, agg?.title);
      rect.appendChild(title);

      svg.appendChild(rect);
    }
  }

  // Grid lines
  for (let c = 0; c <= numCols; c++) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', padL + c * cellW + 0.5);
    line.setAttribute('y1', padT);
    line.setAttribute('x2', padL + c * cellW + 0.5);
    line.setAttribute('y2', H - 0.5);
    line.setAttribute('stroke', 'rgba(156,139,122,0.06)');
    svg.appendChild(line);
  }
  for (let r = 0; r <= numRows; r++) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', padL);
    line.setAttribute('y1', padT + r * cellH + 0.5);
    line.setAttribute('x2', W - 0.5);
    line.setAttribute('y2', padT + r * cellH + 0.5);
    line.setAttribute('stroke', 'rgba(156,139,122,0.06)');
    svg.appendChild(line);
  }

  heatmapDiv.innerHTML = '';
  heatmapDiv.appendChild(svg);

  // Legend
  const legend = document.createElement('div');
  legend.style.display = 'flex';
  legend.style.alignItems = 'center';
  legend.style.gap = '8px';
  legend.style.marginTop = '12px';

  const stepBox = (i, total = 10) => {
    const ratio = i / (total - 1);
    const box = document.createElement('span');
    box.style.display = 'inline-block';
    box.style.width = '18px';
    box.style.height = '10px';
    box.style.borderRadius = '4px';
    box.style.background = colorForRatio(ratio);
    return box;
  };

  const left = document.createElement('span');
  left.textContent = '0%';
  left.style.color = 'var(--muted)';
  left.style.fontSize = '12px';

  const right = document.createElement('span');
  right.textContent = '100%';
  right.style.color = 'var(--muted)';
  right.style.fontSize = '12px';

  legend.appendChild(left);
  for (let i = 0; i < 10; i++) legend.appendChild(stepBox(i, 10));
  legend.appendChild(right);

  heatmapLegend.innerHTML = '';
  heatmapLegend.appendChild(legend);
}

/* ---------- Classes Management ---------- */
function renderClassesManagement() {
  classesDiv.innerHTML = '<h3 style="margin-bottom: 16px;">Class Management</h3>';

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Title</th>
        <th>Day</th>
        <th>Time</th>
        <th>Capacity</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  classes.sort((a, b) => a.weekday - b.weekday || parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  classes.forEach(cls => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cls.title}</td>
      <td>${weekdayName(cls.weekday)}</td>
      <td>${cls.time}</td>
      <td>${cls.capacity}</td>
      <td>
        <button class="btn-light btn-compact edit-class" data-id="${cls.id}">Edit</button>
        <button class="btn-light btn-compact delete-class" data-id="${cls.id}" style="margin-left: 6px;">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  table.querySelectorAll('.edit-class').forEach(btn => {
    btn.addEventListener('click', () => editClass(btn.dataset.id));
  });

  table.querySelectorAll('.delete-class').forEach(btn => {
    btn.addEventListener('click', () => deleteClass(btn.dataset.id));
  });

  classesDiv.appendChild(table);

  // Add class button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn';
  addBtn.textContent = '+ Add New Class';
  addBtn.style.marginTop = '16px';
  addBtn.addEventListener('click', addNewClass);
  classesDiv.appendChild(addBtn);
}

function addNewClass() {
  const title = prompt('Class title:');
  if (!title) return;

  const weekday = prompt('Weekday (0=Sun, 1=Mon ... 6=Sat):');
  if (weekday === null) return;

  const time = prompt('Time (HH:MM):');
  if (!time) return;

  const capacity = prompt('Capacity:');
  if (!capacity) return;

  fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      weekday: parseInt(weekday),
      time,
      capacity: parseInt(capacity)
    })
  })
    .then(res => res.json())
    .then(() => {
      showToast('Class added successfully');
      fetchAll();
    })
    .catch(() => showToast('Failed to add class', true));
}

function editClass(id) {
  const cls = classById(id);
  if (!cls) return;

  const title = prompt('Class title:', cls.title);
  if (title === null) return;

  const weekday = prompt('Weekday (0=Sun ... 6=Sat):', cls.weekday);
  if (weekday === null) return;

  const time = prompt('Time (HH:MM):', cls.time);
  if (time === null) return;

  const capacity = prompt('Capacity:', cls.capacity);
  if (capacity === null) return;

  fetch(`/api/classes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      weekday: parseInt(weekday),
      time,
      capacity: parseInt(capacity)
    })
  })
    .then(res => res.json())
    .then(() => {
      showToast('Class updated successfully');
      fetchAll();
    })
    .catch(() => showToast('Failed to update class', true));
}

function deleteClass(id) {
  if (!confirm('Are you sure you want to delete this class? This will not delete associated bookings.')) {
    return;
  }

  fetch(`/api/classes/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => {
      showToast('Class deleted successfully');
      fetchAll();
    })
    .catch(() => showToast('Failed to delete class', true));
}

/* ---------- Fetch Data & Initial Render ---------- */
async function fetchAll() {
  try {
    const [clsRes, bRes] = await Promise.all([
      fetch('/api/classes'),
      fetch('/api/bookings')
    ]);
    classes = await clsRes.json();
    bookings = await bRes.json();
    renderTable();
    renderUtilization();
    renderHeatmap();
    renderClassesManagement();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showToast('Failed to load data', true);
  }
}

fetchAll();
