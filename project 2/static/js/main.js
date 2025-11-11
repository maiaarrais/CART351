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
let weekOffset = 0; // 0 = current week, 1 = next week, -1 = last week

/* ---------- Date Utils ---------- */
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getWeekDates(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + (offset * 7));
  const monday = getMonday(today);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isTooFarAhead(date) {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 28); // 4 weeks
  return date > maxDate;
}

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

function seatsRemaining(classId, date) {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return 0;
  const capacity = cls.capacity || 0;
  const occupied = bookings.filter(b =>
    b.class_id === classId && 
    b.date === date &&
    (b.status === 'pending' || b.status === 'confirmed')
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
  const dates = getWeekDates(weekOffset);
  const monday = dates[0];
  const sunday = dates[6];
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
  const weekDates = getWeekDates(weekOffset);
  
  const cols = weekDates.map((date, i) => {
    const col = document.createElement('div');
    col.className = 'day-col';
    
    // Date header with indicator
    const h = document.createElement('h4');
    const dayName = fmtWeekday(i);
    const dayNum = date.getDate();
    
    if (isToday(date)) {
      h.innerHTML = `${dayName} <span style="color:var(--sage);font-weight:700;">${dayNum}</span> <span style="font-size:9px;background:var(--sage);color:white;padding:2px 6px;border-radius:10px;margin-left:4px;">TODAY</span>`;
    } else if (isPast(date)) {
      h.innerHTML = `${dayName} <span style="color:var(--muted);">${dayNum}</span>`;
      col.style.opacity = '0.5';
    } else {
      h.innerHTML = `${dayName} <span style="color:var(--text-soft);">${dayNum}</span>`;
    }
    
    col.appendChild(h);
    calendarEl.appendChild(col);
    return col;
  });

  classes.filter(classMatches).sort(byWeekday).forEach(c => {
    const col = cols[c.weekday % 7];
    const date = weekDates[c.weekday % 7];
    const dateStr = formatDate(date);
    const past = isPast(date);
    const tooFar = isTooFarAhead(date);
    
    const slot = document.createElement('div');
    slot.className = 'slot';
    
    if (past || tooFar) {
      slot.classList.add('full');
      slot.style.cursor = 'not-allowed';
    }
    
    const remain = seatsRemaining(c.id, dateStr);
    const nearFull = remain <= 2 && remain > 0;
    if (remain === 0 && !past && !tooFar) slot.classList.add('full');

    const pct = c.capacity > 0 ? Math.round(((c.capacity - remain) / c.capacity) * 100) : 0;
    
    let statusText = '';
    if (past) {
      statusText = '<span class="pill danger">Past</span>';
    } else if (tooFar) {
      statusText = '<span class="pill danger">Too far</span>';
    } else if (remain === 0) {
      statusText = '<span class="pill danger">Full</span>';
    } else if (nearFull) {
      statusText = `<span class="pill warn">${remain} left</span>`;
    } else {
      statusText = `<span class="pill">${remain} seats</span>`;
    }
    
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
        ${statusText}
        <span class="tag">${inferType(c.title)}</span>
      </div>
    `;
    
    if (!past && !tooFar && remain > 0) {
      slot.addEventListener('click', () => openModal(c, remain, date, dateStr));
    }
    col.appendChild(slot);
  });
}

function renderAgenda() {
  agendaEl.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'agenda-list';
  
  const weekDates = getWeekDates(weekOffset);
  
  classes.filter(classMatches).sort(byWeekday).forEach(c => {
    const date = weekDates[c.weekday % 7];
    const dateStr = formatDate(date);
    const past = isPast(date);
    const tooFar = isTooFarAhead(date);
    
    const remain = seatsRemaining(c.id, dateStr);
    const nearFull = remain <= 2 && remain > 0;
    const pct = c.capacity > 0 ? Math.round(((c.capacity - remain) / c.capacity) * 100) : 0;
    
    const row = document.createElement('div');
    row.className = 'agenda-row';
    
    if (past || tooFar) {
      row.style.opacity = '0.5';
    }
    
    let statusText = '';
    if (past) {
      statusText = '<span class="pill danger">Past</span>';
    } else if (tooFar) {
      statusText = '<span class="pill danger">Too far</span>';
    } else if (remain === 0) {
      statusText = '<span class="pill danger">Full</span>';
    } else if (nearFull) {
      statusText = `<span class="pill warn">${remain} left</span>`;
    } else {
      statusText = `<span class="pill">${remain} seats</span>`;
    }
    
    row.innerHTML = `
      <div class="ag-left">
        <div class="ag-time">${formatDateDisplay(date)} ${c.time}</div>
        <div class="ag-title">${c.title}</div>
      </div>
      <div class="ag-right">
        <div class="meter"><div class="meter-fill" style="width:${pct}%"></div></div>
        ${statusText}
        <button class="btn btn-compact" ${(past || tooFar || remain === 0) ? 'disabled' : ''}>Book</button>
      </div>
    `;
    
    const bookBtn = row.querySelector('button');
    if (!past && !tooFar && remain > 0) {
      bookBtn.addEventListener('click', () => openModal(c, remain, date, dateStr));
    }
    list.appendChild(row);
  });
  agendaEl.appendChild(list);
}

function render() {
  weekLabel.textContent = currentWeekLabel();
  
  // Disable prev week if it would go to past
  const weekDates = getWeekDates(weekOffset - 1);
  const allPast = weekDates.every(d => isPast(d));
  prevWeek.disabled = allPast;
  prevWeek.style.opacity = allPast ? '0.3' : '1';
  
  // Disable next week if it would go beyond 4 weeks
  const nextWeekDates = getWeekDates(weekOffset + 1);
  const allTooFar = nextWeekDates.every(d => isTooFarAhead(d));
  nextWeek.disabled = allTooFar;
  nextWeek.style.opacity = allTooFar ? '0.3' : '1';
  
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
let currentBookingDate = null;

function openModal(cls, remain, date, dateStr) {
  // Reset form
  formEl.reset();
  currentBookingDate = dateStr;
  
  document.getElementById('class_id').value = cls.id;
  document.getElementById('booking_date').value = dateStr;
  
  modalTitle.textContent = cls.title;
  modalMeta.textContent = `${formatDateDisplay(date)} • ${cls.time} • ${remain} seat${remain === 1 ? '' : 's'} available`;

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

  const class_id = document.getElementById('class_id').value;
  const date = document.getElementById('booking_date').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!class_id || !date || !name || !email) {
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
      body: JSON.stringify({ class_id, date, name, email })
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
    icsBtn.onclick = () => {
      const cls = classes.find(c => c.id === class_id);
      downloadICSForClass(cls, date);
    };
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

/* ---------- ICS export ---------- */
function downloadICSForClass(cls, dateStr) {
  if (!cls || !dateStr) return;
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hh, mm] = cls.time.split(':').map(Number);
  
  const start = new Date(year, month - 1, day, hh, mm || 0);
  const end = new Date(start.getTime() + 60 * 60000); // 1 hour duration
  
  const pad = n => String(n).padStart(2, '0');
  const fmt = d =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const uid = `${cls.id}-${dateStr}-${Date.now()}@flowstudio`;
  const now = new Date();
  const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Flow Studio//Bookings//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${cls.title}`,
    'DESCRIPTION:Class booked via Flow Studio',
    'LOCATION:Flow Studio',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${cls.title.replace(/\s+/g, '_')}_${dateStr}.ics`;
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