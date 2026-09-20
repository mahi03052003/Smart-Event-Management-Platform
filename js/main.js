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
renderTicker();
}

function renderDashboard() {
  const registrations = getRegistrations();
  const list = document.getElementById('dashList');
  const empty = document.getElementById('dashEmpty');

  if (registrations.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = registrations.map(r => {
    const event = EVENTS.find(e => e.id === r.eventId) || { title: '(Removed event)', date: '', location: '' };
    return `
      <div class="dash-item">
        <div class="info">
          <b>${event.title}</b>
          <span>${event.date} · ${event.location} · Ref ${r.ref} · ${r.seats} seat(s)</span>
        </div>
        <button class="cancel-btn" data-ref="${r.ref}">Cancel</button>
      </div>`;
  }).join('');
}

document.getElementById('dashList').addEventListener('click', (e) => {
  if (e.target.classList.contains('cancel-btn')) {
    const ref = e.target.getAttribute('data-ref');
    cancelRegistration(ref);
  }
});

function cancelRegistration(ref) {
  const registrations = getRegistrations().filter(r => r.ref !== ref);
  saveRegistrations(registrations);
  renderDashboard(); // re-render so the cancelled item disappears immediately
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

function showDashboard() {
  document.getElementById('events').classList.add('hidden');
  document.getElementById('eventDetails').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showEvents() {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('eventDetails').classList.add('hidden');
  document.getElementById('events').classList.remove('hidden');
}

document.getElementById('navMyInvitations').addEventListener('click', (e) => {
  e.preventDefault();
  showDashboard();
});
document.getElementById('backToEventsFromDash').addEventListener('click', showEvents);

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


function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}


/* CUSTOM EVENT REQUESTS*/
const CUSTOM_STORAGE_KEY = 'aurelia_custom_requests';

function getCustomRequests() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveCustomRequests(list) {
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(list));
}

function openCustomRequest() {
  document.getElementById('customRequestForm').reset();
  document.getElementById('customRequestFormWrap').style.display = 'block';
  document.getElementById('customRequestConfirm').style.display = 'none';
  document.getElementById('customRequestOverlay').classList.add('show');
}
function closeCustomRequest() {
  document.getElementById('customRequestOverlay').classList.remove('show');
}

// Wire the "Request Access" button to open this form
document.getElementById('requestAccessBtn').addEventListener('click', (e) => {
  e.preventDefault();
  openCustomRequest();
});
document.getElementById('closeCustomRequest').addEventListener('click', closeCustomRequest);
document.getElementById('closeCustomConfirm').addEventListener('click', closeCustomRequest);
document.getElementById('customRequestOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'customRequestOverlay') closeCustomRequest();
});

document.getElementById('customRequestForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('cfName').value.trim();
  const email = document.getElementById('cfEmail').value.trim();
  const phone = document.getElementById('cfPhone').value.trim();
  const eventType = document.getElementById('cfEventType').value;
  const date = document.getElementById('cfDate').value;
  const guests = document.getElementById('cfGuests').value.trim();
  const message = document.getElementById('cfMessage').value.trim();

  let valid = true;
  const setFieldError = (fieldId, isOk) => {
    document.getElementById(fieldId).classList.toggle('error', !isOk);
    if (!isOk) valid = false;
  };

  setFieldError('cf-name', name.length > 1);
  setFieldError('cf-email', validEmail(email));   // reused from Module 3
  setFieldError('cf-phone', validPhone(phone));   // reused from Module 3
  setFieldError('cf-guests', /\d/.test(guests));  // must contain at least one digit

  if (!valid) return;

  const ref = 'AU-EV-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const record = { ref, name, email, phone, eventType, date, guests, message, submittedAt: Date.now() };

  const requests = getCustomRequests();
  requests.push(record);
  saveCustomRequests(requests);

  document.getElementById('customRequestFormWrap').style.display = 'none';
  document.getElementById('customRequestConfirm').style.display = 'block';
  document.getElementById('cfConfirmRef').textContent = ref;
  document.getElementById('cfConfirmType').textContent = eventType;
});


/* =========================
   SCROLL REVEAL
   ========================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =========================
   ANIMATED STAT COUNTERS
   ========================= */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statObserver.unobserve(entry.target); // only run once per counter
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));

/* =========================
   ROTATING QUOTES
   ========================= */
const QUOTES = [
  { text: '"Aurelia didn\'t just plan our gala — they made it a night no one will forget."', author: '— Private Host, New York' },
  { text: '"Every detail felt considered. It\'s the closest thing to magic I\'ve seen in event planning."', author: '— Family Office Principal, Geneva' },
  { text: '"We stopped worrying about logistics and just enjoyed being present."', author: '— Corporate Host, Dubai' }
];
let quoteIndex = 0;

setInterval(() => {
  const textEl = document.getElementById('quoteText');
  const authorEl = document.getElementById('quoteAuthor');
  textEl.classList.add('quote-fade');
  authorEl.classList.add('quote-fade');

  setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % QUOTES.length;
    textEl.textContent = QUOTES[quoteIndex].text;
    authorEl.textContent = QUOTES[quoteIndex].author;
    textEl.classList.remove('quote-fade');
    authorEl.classList.remove('quote-fade');
  }, 500);
}, 5000);

/* CARD TILT EFFECT */
document.addEventListener('mousemove', (e) => {
  const card = e.target.closest('.ticket-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rotateX = ((y / rect.height) - 0.5) * -8;
  const rotateY = ((x / rect.width) - 0.5) * 8;
  card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});
document.addEventListener('mouseout', (e) => {
  const card = e.target.closest('.ticket-card');
  if (card) card.style.transform = '';
});

/* =========================
   CTA BANNER BUTTON
   ========================= */
document.getElementById('ctaStartPlanning').addEventListener('click', () => {
  openCustomRequest(); // reuses the Request Access form from the custom-event feature
});


document.getElementById('brandHome').addEventListener('click', (e) => {
  e.preventDefault();
  showEvents();
});

document.getElementById('heroViewEvents').addEventListener('click', () => {
  document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('heroMyInvitations').addEventListener('click', showDashboard);

document.getElementById('ctaStartPlanning').addEventListener('click', openCustomRequest);

/* Mobile nav */
document.getElementById('burgerBtn').addEventListener('click', () => {
  const nav = document.getElementById('mobileNav');
  nav.style.display = nav.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('mobileEvents').addEventListener('click', () => {
  document.getElementById('mobileNav').style.display = 'none';
});
document.getElementById('mobileMyInvitations').addEventListener('click', (e) => {
  e.preventDefault();
  showDashboard();
  document.getElementById('mobileNav').style.display = 'none';
});
document.getElementById('mobileRequestAccess').addEventListener('click', (e) => {
  e.preventDefault();
  openCustomRequest();
  document.getElementById('mobileNav').style.display = 'none';
});

function renderTicker() {
  const board = document.getElementById('boardRows');
  const sorted = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  board.innerHTML = sorted.map((e, i) => `
    <div class="board-row">
      <div class="code">AU-${100 + i}</div>
      <div class="title">${e.title}</div>
      <div class="date">${e.date}</div>
      <div class="loc">${e.location.split(',').pop().trim()}</div>
      <div class="status-pill">RSVP Open</div>
    </div>`).join('');
}


document.getElementById('bespokeEnquireBtn').addEventListener('click', openCustomRequest);