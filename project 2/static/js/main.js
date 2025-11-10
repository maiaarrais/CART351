const calendarEl = document.getElementById('calendar');
const dialogEl = document.getElementById('bookDialog');
const formEl = document.getElementById('bookForm');
const toast = document.getElementById('toast');

let classes = [];
let bookings = [];

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

function fmtWeekday(n) {
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return names[n];
}

function seatsRemaining(classId) {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return 0;
  const capacity = cls.capacity || 0;
  const occupied = bookings.filter(b => b.class_id === classId && (b.status === 'pending' || b.status === 'confirmed')).length;
  return Math.max(0, capacity - occupied);
}

function renderCalendar() {
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

  classes.sort((a,b) => a.weekday - b.weekday).forEach(c => {
    const col = cols[c.weekday % 7];
    const slot = document.createElement('div');
    slot.className = 'slot';
    const remain = seatsRemaining(c.id);
    if (remain === 0) slot.classList.add('full');
    slot.innerHTML = `
      <div class="title">${c.title}</div>
      <div class="meta">${c.time} • Capacity ${c.capacity}</div>
      <span class="pill">${remain} seats left</span>
    `;
    slot.addEventListener('click', () => openModal(c));
    col.appendChild(slot);
  });
}

function openModal(cls) {
  document.getElementById('class_id').value = cls.id;
  document.getElementById('modalTitle').textContent = `Reserve: ${cls.title} (${cls.time})`;
  dialogEl.showModal();
}

async function fetchAll() {
  const [clsRes, bRes] = await Promise.all([fetch('/api/classes'), fetch('/api/bookings')]);
  classes = await clsRes.json();
  bookings = await bRes.json();
  renderCalendar();
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const class_id = document.getElementById('class_id').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const res = await fetch('/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_id, name, email })
  });
  if (!res.ok) return showToast('Error booking.');
  const data = await res.json();
  showToast(data.booking.status === 'waitlist' ? 'Full – you are on the waitlist.' : 'Booked!');
  bookings = await (await fetch('/api/bookings')).json();
  renderCalendar();
  dialogEl.close();
});

fetchAll();
