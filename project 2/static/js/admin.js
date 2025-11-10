const bookingsTbody = document.querySelector('#bookingsTable tbody');
const utilizationDiv = document.getElementById('utilization');
const heatmapDiv = document.getElementById('heatmap');
const heatmapLegend = document.getElementById('heatmapLegend');
let classes = [];
let bookings = [];

// Format ISO date string to readable format
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

function classById(id) { return classes.find(c => c.id === id) || {}; }
function weekdayName(i){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]; }

/* ---------- Bookings Table ---------- */
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
        renderHeatmap();
      } else {
        alert('Update failed');
      }
    });
  });
}

/* ---------- Utilization Bars ---------- */
function renderUtilization() {
  const occ = {};
  for (const c of classes) occ[c.id] = { title: c.title, time: c.time, capacity: c.capacity, count: 0 };
  for (const b of bookings) {
    if (b.status === 'pending' || b.status === 'confirmed') {
      if (occ[b.class_id]) occ[b.class_id].count += 1;
    }
  }
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

/* ---------- Weekly Heatmap ---------- */

function renderHeatmap() {
  // Collect row labels (distinct times from classes)
  const timeSet = new Set(classes.map(c => c.time).filter(Boolean));
  const timeRows = Array.from(timeSet).sort((a,b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  const numRows = timeRows.length;
  const numCols = 7;

  // Aggregate occupancy per (weekday, time)
  // For each class id: count bookings (pending+confirmed), know capacity from class
  const classByKey = {}; // key: `${weekday}_${time}` -> {capacity, count}
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

  // SVG sizing
  const cellW = 80, cellH = 28;
  const padL = 120; // room for row labels (times)
  const padT = 26;  // room for weekday labels
  const W = padL + (numCols * cellW) + 1;
  const H = padT + (numRows * cellH) + 1;

  // Build SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.display = 'block';
  svg.style.border = '1px solid rgba(255,255,255,0.06)';
  svg.style.borderRadius = '8px';
  svg.style.background = 'var(--panel)';

  // Axes labels (weekdays at top)
  for (let c = 0; c < numCols; c++) {
    const tx = document.createElementNS(svgNS, 'text');
    tx.setAttribute('x', padL + c*cellW + cellW/2);
    tx.setAttribute('y', padT - 8);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('fill', 'var(--muted)');
    tx.setAttribute('font-size', '12');
    tx.textContent = weekdayName(c);
    svg.appendChild(tx);
  }

  // Row labels (times)
  timeRows.forEach((t, r) => {
    const tx = document.createElementNS(svgNS, 'text');
    tx.setAttribute('x', padL - 8);
    tx.setAttribute('y', padT + r*cellH + cellH/2 + 4);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('fill', 'var(--muted)');
    tx.setAttribute('font-size', '12');
    tx.textContent = t;
    svg.appendChild(tx);
  });

  // Color scale: 0 -> faint, 1 -> bright (teal/blue mix)
  function colorForRatio(r) {
    const clamped = Math.max(0, Math.min(1, r||0));
    // Interpolate light to vivid using HSL (170° teal to 210° blue), keep it in the app palette vibe
    const hue = 170 + (210 - 170) * clamped;
    const sat = 70;
    const light = 18 + (45 * clamped); // 18% -> 63%
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  // Tooltip (native title tags on rects)
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
      const agg = classByKey[key]; // may be undefined
      const cap = agg ? agg.capacity : 0;
      const count = agg ? agg.count : 0;
      const ratio = cap ? count / cap : 0;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', padL + c*cellW + 1);
      rect.setAttribute('y', padT + r*cellH + 1);
      rect.setAttribute('width', cellW - 2);
      rect.setAttribute('height', cellH - 2);
      rect.setAttribute('rx', 6);
      rect.setAttribute('ry', 6);
      rect.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      rect.setAttribute('fill', cap ? colorForRatio(ratio) : 'rgba(255,255,255,0.04)');

      // title tooltip
      const title = document.createElementNS(svgNS, 'title');
      title.textContent = tooltipText(c, time, ratio, count, cap, agg?.title);
      rect.appendChild(title);

      svg.appendChild(rect);
    }
  }

  // Grid lines (optional subtle separators)
  for (let c = 0; c <= numCols; c++) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', padL + c*cellW + 0.5);
    line.setAttribute('y1', padT);
    line.setAttribute('x2', padL + c*cellW + 0.5);
    line.setAttribute('y2', H - 0.5);
    line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
    svg.appendChild(line);
  }
  for (let r = 0; r <= numRows; r++) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', padL);
    line.setAttribute('y1', padT + r*cellH + 0.5);
    line.setAttribute('x2', W - 0.5);
    line.setAttribute('y2', padT + r*cellH + 0.5);
    line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
    svg.appendChild(line);
  }

  heatmapDiv.innerHTML = '';
  heatmapDiv.appendChild(svg);

  // Legend
  const legend = document.createElement('div');
  legend.style.display = 'flex';
  legend.style.alignItems = 'center';
  legend.style.gap = '8px';
  const stepBox = (i, total=10) => {
    const ratio = i/(total-1);
    const box = document.createElement('span');
    box.style.display = 'inline-block';
    box.style.width = '18px';
    box.style.height = '10px';
    box.style.borderRadius = '4px';
    box.style.background = `linear-gradient(90deg, ${colorForRatio(ratio)}, ${colorForRatio(ratio)})`;
    return box;
  };
  const left = document.createElement('span'); left.textContent = '0%';
  left.style.color = 'var(--muted)';
  const right = document.createElement('span'); right.textContent = '100%';
  right.style.color = 'var(--muted)';

  legend.appendChild(left);
  for (let i=0;i<10;i++) legend.appendChild(stepBox(i,10));
  legend.appendChild(right);

  heatmapLegend.innerHTML = '';
  heatmapLegend.appendChild(legend);
}

/* ---------- Fetch Data & Initial Render ---------- */
async function fetchAll() {
  const [clsRes, bRes] = await Promise.all([fetch('/api/classes'), fetch('/api/bookings')]);
  classes = await clsRes.json();
  bookings = await bRes.json();
  renderTable();
  renderUtilization();
  renderHeatmap();
}

fetchAll();
