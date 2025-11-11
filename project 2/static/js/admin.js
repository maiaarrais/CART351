const bookingsTbody = document.querySelector('#bookingsTable tbody');
const utilizationDiv = document.getElementById('utilization');
const heatmapDiv = document.getElementById('heatmap');
const heatmapLegend = document.getElementById('heatmapLegend');
const classesDiv = document.getElementById('classesManagement');
const dateRangeDiv = document.getElementById('dateRangeFilter');
const toast = document.getElementById('toast');

let classes = [];
let allBookings = [];
let filteredBookings = [];

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

function fmtDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
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

function getDateRangeDefaults() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7); // Last week
  const end = new Date(today);
  end.setDate(today.getDate() + 28); // 4 weeks ahead
  
  const fmt = d => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return { start: fmt(start), end: fmt(end) };
}

/* ---------- Date Range Filter ---------- */
function renderDateRangeFilter() {
  const defaults = getDateRangeDefaults();
  
  dateRangeDiv.innerHTML = `
    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <label style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px;">From</span>
        <input type="date" id="startDate" class="input" value="${defaults.start}" style="min-width: 160px;" />
      </label>
      <label style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px;">To</span>
        <input type="date" id="endDate" class="input" value="${defaults.end}" style="min-width: 160px;" />
      </label>
      <button id="applyFilter" class="btn" style="margin-top: 20px;">Apply Filter</button>
      <button id="resetFilter" class="btn-light" style="margin-top: 20px;">Reset</button>
    </div>
  `;
  
  document.getElementById('applyFilter').addEventListener('click', applyDateFilter);
  document.getElementById('resetFilter').addEventListener('click', resetDateFilter);
  
  // Apply default filter on load
  applyDateFilter();
}

async function applyDateFilter() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (!startDate || !endDate) {
    showToast('Please select both start and end dates', true);
    return;
  }
  
  if (startDate > endDate) {
    showToast('Start date must be before end date', true);
    return;
  }
  
  try {
    const res = await fetch(`/api/bookings?start_date=${startDate}&end_date=${endDate}`);
    filteredBookings = await res.json();
    renderTable();
    renderUtilization();
  } catch (err) {
    console.error('Failed to filter bookings:', err);
    showToast('Failed to filter bookings', true);
  }
}

function resetDateFilter() {
  const defaults = getDateRangeDefaults();
  document.getElementById('startDate').value = defaults.start;
  document.getElementById('endDate').value = defaults.end;
  applyDateFilter();
}

/* ---------- Bookings Table ---------- */
function renderTable() {
  bookingsTbody.innerHTML = '';
  
  // Sort by date descending, then timestamp
  filteredBookings.sort((a, b) => {
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    return (b.ts || '').localeCompare(a.ts || '');
  });

  for (const b of filteredBookings) {
    const cls = classById(b.class_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDateOnly(b.date)}</td>
      <td>${cls.title || b.class_id}<br/><span style="font-size:12px;color:var(--muted);">${cls.time || ''}</span></td>
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
        await applyDateFilter(); // Refresh with current filter
        renderUtilization();
      } else {
        showToast('Update failed', true);
      }
    });
  });
}

/* ---------- Utilization Bars ---------- */
function renderUtilization() {
  // Create a map of class_id + date -> counts
  const occByClassDate = {};
  
  for (const c of classes) {
    for (const b of filteredBookings) {
      if (b.class_id === c.id) {
        const key = `${c.id}_${b.date}`;
        if (!occByClassDate[key]) {
          occByClassDate[key] = { 
            classId: c.id,
            title: c.title, 
            date: b.date,
            capacity: c.capacity, 
            count: 0 
          };
        }
        if (b.status === 'pending' || b.status === 'confirmed') {
          occByClassDate[key].count += 1;
        }
      }
    }
  }
  
  // Get unique classes that have bookings
  const classesWithBookings = {};
  Object.values(occByClassDate).forEach(item => {
    if (!classesWithBookings[item.classId]) {
      classesWithBookings[item.classId] = {
        title: item.title,
        capacity: item.capacity,
        totalBooked: 0,
        dates: []
      };
    }
    classesWithBookings[item.classId].totalBooked += item.count;
    classesWithBookings[item.classId].dates.push({
      date: item.date,
      count: item.count
    });
  });

  utilizationDiv.innerHTML = '';
  
  if (Object.keys(classesWithBookings).length === 0) {
    utilizationDiv.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No bookings in selected date range</p>';
    return;
  }
  
  Object.values(classesWithBookings).forEach(o => {
    const avgPct = o.dates.length > 0 
      ? Math.round((o.totalBooked / (o.capacity * o.dates.length)) * 100)
      : 0;
    
    const wrap = document.createElement('div');
    wrap.style.margin = '12px 0';
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <strong style="color:var(--text);">${o.title}</strong>
        <span style="color:var(--text-soft);font-size:14px;">${o.totalBooked} bookings across ${o.dates.length} date${o.dates.length === 1 ? '' : 's'}</span>
      </div>
      <div style="height:10px;background:var(--bg-alt);border-radius:10px;overflow:hidden;">
        <div style="height:10px;width:${avgPct}%;background:linear-gradient(90deg,var(--sage),var(--accent-soft));transition:width 0.3s ease;"></div>
      </div>`;
    utilizationDiv.appendChild(wrap);
  });
}

/* ---------- Weekly Heatmap ---------- */
function renderHeatmap() {
  // For heatmap, we'll show a weekly template based on filtered bookings
  const timeSet = new Set(classes.map(c => c.time).filter(Boolean));
  const timeRows = Array.from(timeSet).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  const numRows = timeRows.length;
  const numCols = 7;

  const classByKey = {};
  for (const c of classes) {
    const key = `${c.weekday}_${c.time}`;
    if (!classByKey[key]) classByKey[key] = { capacity: 0, count: 0, title: c.title, classId: c.id };
    classByKey[key].capacity += Number(c.capacity || 0);
  }

  // Count bookings by weekday/time across all dates in range
  for (const b of filteredBookings) {
    if (b.status === 'pending' || b.status === 'confirmed') {
      const cls = classById(b.class_id);
      if (cls && cls.time != null && typeof cls.weekday === 'number') {
        const key = `${cls.weekday}_${cls.time}`;
        if (!classByKey[key]) classByKey[key] = { capacity: 0, count: 0, title: cls.title, classId: cls.id };
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
    return `${label}${t}\n${count} total bookings / ${capacity} capacity (avg ${pct}%)`;
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
  left.textContent = 'Low';
  left.style.color = 'var(--muted)';
  left.style.fontSize = '12px';

  const right = document.createElement('span');
  right.textContent = 'High';
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
    const clsRes = await fetch('/api/classes');
    classes = await clsRes.json();
    
    renderDateRangeFilter();
    renderHeatmap();
    renderClassesManagement();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showToast('Failed to load data', true);
  }
}

fetchAll();