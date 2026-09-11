console.log("Aurelia scripts loaded.");

/* ===================== STATE ===================== */
let activeCategory = 'All';
let pendingEventId = null; // tracks which event the open registration form is for
const STORAGE_KEY = 'aurelia_registrations';

/* ===================== STORAGE HELPERS ===================== */
function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isDuplicate(eventId, email) {
  const registrations = getRegistrations();
  return registrations.some(r =>
    r.eventId === eventId && r.email.toLowerCase() === email.toLowerCase()
  );
}

/* ===================== VALIDATION ===================== */
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return /^[+\d][\d\s-]{6,}$/.test(value);
}

/* ===================== CARD RENDERING ===================== */
function cardHTML(event) {
  return `
    <div class="ticket-card" onclick="openDetails('${event.id}')">
      <div class="card-art">
        <span class="glyph">${event.glyph}</span>
        <span class="card-tag">${event.category}</span>
      </div>
      <div class="card-body">
        <h3>${event.title}</h3>
        <div class="card-meta">
          <span>${event.date}</span>
          <span>${event.seats} seats left</span>
        </div>
      </div>
    </div>`;
}

function renderGrid(containerId, eventList) {
  const container = document.getElementById(containerId);
  container.innerHTML = eventList.map(cardHTML).join('');
}

/* ===================== EVENT DETAILS ===================== */
function openDetails(id) {
  const event = EVENTS.find(e => e.id === id);
  if (!event) return;

  document.getElementById('detailGlyph').textContent = event.glyph;
  document.getElementById('detailTag').textContent = event.category;
  document.getElementById('detailTitle').textContent = event.title;
  document.getElementById('detailDate').textContent = event.date;
  document.getElementById('detailLoc').textContent = event.location;
  document.getElementById('detailSeats').textContent = event.seats;
  document.getElementById('detailDesc').textContent = event.desc;

  document.getElementById('reserveBtn').onclick = () => openRegister(event.id);

  document.getElementById('events').classList.add('hidden');
  document.getElementById('eventDetails').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('backToEvents').addEventListener('click', () => {
  document.getElementById('eventDetails').classList.add('hidden');
  document.getElementById('events').classList.remove('hidden');
});

/* ===================== SEARCH & FILTER ===================== */
function applyFilters() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  let filtered = EVENTS.filter(event =>
    activeCategory === 'All' || event.category === activeCategory
  );

  if (query) {
    filtered = filtered.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.category.toLowerCase().includes(query)
    );
  }

  const grid = document.getElementById('eventsGrid');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
  } else {
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    renderGrid('eventsGrid', filtered);
  }
}

document.getElementById('searchInput').addEventListener('input', applyFilters);

function renderChips() {
  const categories = ['All', ...new Set(EVENTS.map(e => e.category))];
  const container = document.getElementById('categoryChips');

  container.innerHTML = categories.map(cat => `
    <button class="chip ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
      ${cat}
    </button>`
  ).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  renderChips();
  applyFilters();
}

/* ===================== REGISTRATION MODAL ===================== */
function openRegister(id) {
  pendingEventId = id;
  const event = EVENTS.find(e => e.id === id);
  document.getElementById('regEventTitle').textContent = event.title;
  document.getElementById('registerForm').reset();

  document.getElementById('registerFormWrap').style.display = 'block';
  document.getElementById('registerConfirm').style.display = 'none';

  document.getElementById('registerOverlay').classList.add('show');
}

function closeRegister() {
  document.getElementById('registerOverlay').classList.remove('show');
}

document.getElementById('closeRegister').addEventListener('click', closeRegister);
document.getElementById('closeConfirm').addEventListener('click', closeRegister);

// Close when clicking the dark background, not the modal itself
document.getElementById('registerOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'registerOverlay') closeRegister();
});

document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const seats = document.getElementById('regSeats').value;

  let valid = true;
  const setFieldError = (fieldId, isOk) => {
    document.getElementById(fieldId).classList.toggle('error', !isOk);
    if (!isOk) valid = false;
  };
  setFieldError('f-name', name.length > 1);
  setFieldError('f-email', validEmail(email));
  setFieldError('f-phone', validPhone(phone));
  if (!valid) return;

  if (isDuplicate(pendingEventId, email)) {
    alert('This email is already registered for this event.');
    return;
  }

  const ref = 'AU-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const record = { eventId: pendingEventId, name, email, phone, seats, ref, registeredAt: Date.now() };

  const registrations = getRegistrations();
  registrations.push(record);
  saveRegistrations(registrations);

  document.getElementById('registerFormWrap').style.display = 'none';
  document.getElementById('registerConfirm').style.display = 'block';
  document.getElementById('confirmRef').textContent = ref;
  document.getElementById('confirmSeats').textContent = seats;
});

/* ===================== INITIAL RENDER (runs once, on load) ===================== */
renderGrid('featuredGrid', EVENTS.slice(0, 3));
renderGrid('eventsGrid', EVENTS);
renderChips();