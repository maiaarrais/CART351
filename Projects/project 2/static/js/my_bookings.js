const emailLookup = document.getElementById('emailLookup');
const lookupBtn = document.getElementById('lookupBtn');
const bookingsContainer = document.getElementById('bookingsContainer');
const bookingsList = document.getElementById('bookingsList');
const noBookings = document.getElementById('noBookings');
const toast = document.getElementById('toast');

let classes = [];
let userBookings = [];

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = isError ? 'toast error' : 'toast';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function fmtWeekday(i) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
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
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function isPastDate(dateStr) {
  if (!dateStr) return false;
  const bookingDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDate < today;
}

function classById(id) {
  return classes.find(c => c.id === id) || {};
}

async function fetchClasses() {
  try {
    const res = await fetch('/api/classes');
    classes = await res.json();
  } catch (err) {
    console.error('Failed to fetch classes:', err);
  }
}

async function lookupBookings() {
  const email = emailLookup.value.trim();
  if (!email) {
    showToast('Please enter an email address', true);
    return;
  }

  lookupBtn.disabled = true;
  lookupBtn.classList.add('loading');

  try {
    const res = await fetch(`/api/bookings/email/${encodeURIComponent(email)}`);
    userBookings = await res.json();

    if (userBookings.length === 0) {
      bookingsContainer.classList.add('hidden');
      noBookings.classList.remove('hidden');
    } else {
      noBookings.classList.add('hidden');
      bookingsContainer.classList.remove('hidden');
      renderBookings();
    }
  } catch (err) {
    console.error('Failed to fetch bookings:', err);
    showToast('Failed to load bookings. Please try again.', true);
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.classList.remove('loading');
  }
}

function renderBookings() {
  bookingsList.innerHTML = '';

  // Group bookings: upcoming vs past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcoming = userBookings.filter(b => !isPastDate(b.date));
  const past = userBookings.filter(b => isPastDate(b.date));

  // Sort upcoming by date ascending, past by date descending
  upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  past.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (upcoming.length > 0) {
    const upcomingHeader = document.createElement('h4');
    upcomingHeader.textContent = 'Upcoming Classes';
    upcomingHeader.style.marginTop = '0';
    upcomingHeader.style.marginBottom = '12px';
    upcomingHeader.style.color = 'var(--text)';
    bookingsList.appendChild(upcomingHeader);
    
    upcoming.forEach(booking => renderBookingCard(booking, false));
  }

  if (past.length > 0) {
    const pastHeader = document.createElement('h4');
    pastHeader.textContent = 'Past Classes';
    pastHeader.style.marginTop = upcoming.length > 0 ? '32px' : '0';
    pastHeader.style.marginBottom = '12px';
    pastHeader.style.color = 'var(--muted)';
    bookingsList.appendChild(pastHeader);
    
    past.forEach(booking => renderBookingCard(booking, true));
  }
}

function renderBookingCard(booking, isPast) {
  const cls = classById(booking.class_id);
  const card = document.createElement('div');
  card.className = 'panel';
  card.style.marginBottom = '16px';
  
  if (isPast) {
    card.style.opacity = '0.6';
  }

  const statusClass = booking.status;
  const canCancel = ['pending', 'confirmed', 'waitlist'].includes(booking.status) && !isPast;

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
      <div>
        <h4 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600;">${cls.title || 'Unknown Class'}</h4>
        <div style="color: var(--text-soft); font-size: 14px; margin-bottom: 8px;">
          ${fmtDateOnly(booking.date)} at ${cls.time || ''}
        </div>
      </div>
      <span class="status ${statusClass}">${booking.status}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="color: var(--muted); font-size: 13px;">
        <strong>${booking.name}</strong> • Booked ${fmtDate(booking.ts)}
      </div>
      ${canCancel ? `<button class="btn-light btn-compact" data-booking-id="${booking.id}">Cancel</button>` : ''}
    </div>
  `;

  if (canCancel) {
    const cancelBtn = card.querySelector('[data-booking-id]');
    cancelBtn.addEventListener('click', () => cancelBooking(booking.id));
  }

  bookingsList.appendChild(card);
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    const res = await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (res.ok) {
      showToast('Booking cancelled successfully');
      // Refresh bookings
      await lookupBookings();
    } else {
      showToast('Failed to cancel booking', true);
    }
  } catch (err) {
    console.error('Failed to cancel booking:', err);
    showToast('Network error. Please try again.', true);
  }
}

// Event listeners
lookupBtn.addEventListener('click', lookupBookings);
emailLookup.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    lookupBookings();
  }
});

// Initialize
fetchClasses();