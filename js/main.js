console.log("Aurelia scripts loaded.");
// Builds one card's HTML from an event object
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

  document.getElementById('events').classList.add('hidden');
  document.getElementById('eventDetails').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Renders a list of events into a target container by id
function renderGrid(containerId, eventList) {
  const container = document.getElementById(containerId);
  container.innerHTML = eventList.map(cardHTML).join('');
}

// Featured = first 3 events; full grid = all events
renderGrid('featuredGrid', EVENTS.slice(0, 3));
renderGrid('eventsGrid', EVENTS);

function applyFilters() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = EVENTS.filter(event =>
    event.title.toLowerCase().includes(query) ||
    event.location.toLowerCase().includes(query) ||
    event.category.toLowerCase().includes(query)
  );

  renderGrid('eventsGrid', filtered);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);