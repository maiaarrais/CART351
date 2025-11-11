const calendarEl = document.getElementById('calendar');
const agendaEl = document.getElementById('agenda');
const dialogEl = document.getElementById('bookDialog');
const formEl = document.getElementById('bookForm');
const toast = document.getElementById('toast');

const weekLabel = document.getElementById('weekLabel');
const prevWeek = document.getElementById('prevWeek');
const nextWeek = document.getElementById('nextWeek');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const viewGrid = document.getElementById('viewGrid');
const viewAgenda = document.getElementById('viewAgenda');

const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const stepDetails = document.getElementById('stepDetails');
const stepConfirm = document.getElementById('stepConfirm');
const confirmCopy = document.getElementById('confirmCopy');
const confirmBadge = document.getElementById('confirmBadge');
const icsBtn = document.getElementById('icsBtn');
const closeBtn = document.getElementById('closeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBooking');
const modalActions = document.getElementById('modalActions');

/* ---------- State ---------- */
let classes = [];
let bookings = [];
let viewMode = 'grid';
let searchText = '';
let type = 'all';
let weekOffset = 0;

/* ---------- Utils ---------- */
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = isError ? 'toast error' : 'toast';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

const fmtWeekday = i => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];

function byWeekday(a, b) {
  return (a.weekday || 0) - (b.weekday || 0) || timeToMin(a.time) - timeToMin(b.time);
}

function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function seatsRemaining(classId) {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return 0;
  const capacity = cls.capacity || 0;
  const occupied = bookings.filter(b =>
    b.class_id === classId && (b.status === 'pending' || b.status === 'confirmed')
  ).length;
  return Math.max(0, capacity - occupied);
}

function inferType(title = '') {
  const t = title.toLowerCase();
  if (t.includes('pilates')) return 'pilates';
  if (t.includes('yoga')) return 'yoga';
  return 'other';
}

function classMatches(c) {
  const matchType = type === 'all' || inferType(c.title) === type;
  const q = searchText.trim().toLowerCase();
  const matchSearch = !q ||
    c.title.toLowerCase().includes(q) ||
    (c.time || '').includes(q) ||
    fmtWeekday(c.weekday).toLowerCase().includes(q);
  return matchType && matchSearch;
}

/* ---------- Week label ---------- */
function currentWeekLabel() {
  const base = new Date();
  base.setDate(base.getDate() + weekOffset * 7);
  const monday = new Date(base);
  const day = (base.getDay() + 6) % 7;
  monday.setDate(base.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(monday)} — ${fmt(sunday)}`;
}

/* ---------- Renderers ---------- */
function skeletonCalendar() {
  calendarEl.innerHTML = '';
  agendaEl.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const col = document.createElement('div');
    col.className = 'day-col';
    const h = document.createElement('h4');
    h.textContent = fmtWeekday(i);
    col.appendChild(h);
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('div');
      s.className = 'slot skeleton';
      s.style.height = '80px';
      col.appendChild(s);
    }
    calendarEl.appendChild(col);
  }
}

function renderCalendarGrid() {
  calendarEl.innerHTML = '';
  const cols = new Array(7).fill(null).map((_, i) => {
    const col = document.createElement('div');
    col.className = 'day-col';
    const h = document.createElement('h4');
    h.textContent = fmtWeekday(i);
    col.appendChild(h);
    calendarEl.appendChild(col);
    return col;
  });

  classes.filter(classMatches).sort(byWeekday).forEach(c => {
    const col = cols[c.weekday % 7];
    const slot = document.createElement('div');
    slot.className = 'slot';
    const remain = seatsRemaining(c.id);
    const nearFull = remain <= 2 && remain > 0;
    if (remain === 0) slot.classList.add('full');

    const pct = c.capacity > 0 ? Math.round(((c.capacity - remain) / c.capacity) * 100) : 0;
    slot.innerHTML = `
      <div class="slot-top">
        <div>
          <div class="title">${c.title}</div>
          <div class="meta">${c.time} • <span class="muted">Cap ${c.capacity}</span></div>
        </div>
        <div class="meter" aria-label="${pct}% full">
          <div class="meter-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="slot-bottom">
        <span class="pill ${nearFull ? 'warn' : ''} ${remain === 0 ? 'danger' : ''}">
          ${remain === 0 ? 'Full' : nearFull ? `${remain} left` : `${remain} seats`}
        </span>
        <span class="tag">${inferType(c.title)}</span>
      </div>
    `;
    if (remain > 0) {
      slot.addEventListener('click', () => openModal(c, remain));
    }
    col.appendChild(slot);
  });
}

function renderAgenda() {
  agendaEl.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'agenda-list';
  classes.filter(classMatches).sort(byWeekday).forEach(c => {
    const remain = seatsRemaining(c.id);
    const nearFull = remain <= 2 && remain > 0;
    const pct = c.capacity > 0 ? Math.round(((c.capacity - remain) / c.capacity) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'agenda-row';
    row.innerHTML = `
      <div class="ag-left">
        <div class="ag-time">${fmtWeekday(c.weekday)} ${c.time}</div>
        <div class="ag-title">${c.title}</div>
      </div>
      <div class="ag-right">
        <div class="meter"><div class="meter-fill" style="width:${pct}%"></div></div>
        <span class="pill ${nearFull ? 'warn' : ''} ${remain === 0 ? 'danger' : ''}">
          ${remain === 0 ? 'Full' : nearFull ? `${remain} left` : `${remain} seats`}
        </span>
        <button class="btn btn-compact" ${remain === 0 ? 'disabled' : ''}>Book</button>
      </div>
    `;
    const bookBtn = row.querySelector('button');
    if (remain > 0) {
      bookBtn.addEventListener('click', () => openModal(c, remain));
    }
    list.appendChild(row);
  });
  agendaEl.appendChild(list);
}

function render() {
  weekLabel.textContent = currentWeekLabel();
  if (viewMode === 'grid') {
    calendarEl.classList.remove('hidden');
    agendaEl.classList.add('hidden');
    renderCalendarGrid();
  } else {
    agendaEl.classList.remove('hidden');
    calendarEl.classList.add('hidden');
    renderAgenda();
  }
}

/* ---------- Modal / Booking ---------- */
function getEl(id) {
  return document.getElementById(id);
}

function openModal(cls, remain) {
  // Reset form
  formEl.reset();
  getEl('class_id').value = cls.id;
  modalTitle.textContent = cls.title;
  modalMeta.textContent = `${fmtWeekday(cls.weekday)} • ${cls.time} • ${remain} seat${remain === 1 ? '' : 's'} available`;

  // Show booking form, hide confirmation
  stepDetails.classList.remove('hidden');
  stepConfirm.classList.add('hidden');
  modalActions.classList.remove('hidden');
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');

  if (typeof dialogEl.showModal === 'function') {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute('open', '');
  }
}

// Cancel button handler
cancelBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  dialogEl.close();
});

// Form submission
formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const class_id = getEl('class_id').value;
  const name = getEl('name').value.trim();
  const email = getEl('email').value.trim();

  if (!class_id || !name || !email) {
    showToast('Please fill in all fields', true);
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id, name, email })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Error booking. Please try again.', true);
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      return;
    }

    // Refresh bookings
    bookings = await (await fetch('/api/bookings')).json();
    render();

    // Show confirmation
    stepDetails.classList.add('hidden');
    modalActions.classList.add('hidden');
    stepConfirm.classList.remove('hidden');

    const isWaitlist = data.booking.status === 'waitlist';
    confirmBadge.textContent = isWaitlist ? 'Waitlist' : 'Confirmed';
    confirmBadge.className = `pill ${isWaitlist ? 'warn' : ''}`;
    confirmCopy.textContent = isWaitlist
      ? 'This class is currently full. You\'re on the waitlist — we\'ll email you if a spot opens.'
      : 'Your spot is reserved. We\'ll send you a confirmation email shortly.';

    // ICS button
    icsBtn.onclick = () => downloadICSForClass(classById(class_id));
  } catch (err) {
    console.error('Booking error:', err);
    showToast('Network error. Please check your connection.', true);
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});

// Close button
closeBtn?.addEventListener('click', () => {
  dialogEl.close();
});

function classById(id) {
  return classes.find(c => c.id === id);
}

/* ---------- ICS export ---------- */
function nextOccurrence(weekday, timeStr, durationMins = 60) {
  const now = new Date();
  const [hh, mm] = timeStr.split(':').map(Number);
  const delta = ((weekday - now.getDay() + 7) % 7) || 0;
  const start = new Date(now);
  start.setDate(now.getDate() + delta);
  start.setHours(hh, mm || 0, 0, 0);

  if (delta === 0 && start <= now) {
    start.setDate(start.getDate() + 7);
  }

  const end = new Date(start.getTime() + durationMins * 60000);
  const pad = n => String(n).padStart(2, '0');
  const fmt = d =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  return { startLocal: fmt(start), endLocal: fmt(end) };
}

function downloadICSForClass(cls) {
  if (!cls) return;
  const { startLocal, endLocal } = nextOccurrence(cls.weekday, cls.time);
  const uid = `${cls.id}-${Date.now()}@flowstudio`;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Flow Studio//Bookings//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startLocal}`,
    `DTEND:${endLocal}`,
    `SUMMARY:${cls.title}`,
    'DESCRIPTION:Class booked via Flow Studio',
    'LOCATION:Flow Studio',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${cls.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Controls ---------- */
prevWeek.addEventListener('click', () => {
  weekOffset--;
  render();
});

nextWeek.addEventListener('click', () => {
  weekOffset++;
  render();
});

searchInput.addEventListener('input', e => {
  searchText = e.target.value;
  render();
});

typeFilter.addEventListener('change', e => {
  type = e.target.value;
  render();
});

viewGrid.addEventListener('click', () => {
  viewMode = 'grid';
  viewGrid.classList.add('active');
  viewAgenda.classList.remove('active');
  render();
});

viewAgenda.addEventListener('click', () => {
  viewMode = 'agenda';
  viewAgenda.classList.add('active');
  viewGrid.classList.remove('active');
  render();
});

/* ---------- Bootstrap ---------- */
async function fetchAll() {
  skeletonCalendar();
  try {
    const [clsRes, bRes] = await Promise.all([
      fetch('/api/classes'),
      fetch('/api/bookings')
    ]);
    classes = await clsRes.json();
    bookings = await bRes.json();
    render();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    showToast('Failed to load classes. Please refresh the page.', true);
  }
}

fetchAll();