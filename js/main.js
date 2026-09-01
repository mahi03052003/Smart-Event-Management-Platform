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
  console.log('Opening details for:', event.title); // temporary check

  document.getElementById('events').classList.add('hidden');
  document.getElementById('eventDetails').classList.remove('hidden');
}

document.getElementById('backToEvents').addEventListener('click', () => {
  document.getElementById('eventDetails').classList.add('hidden');
  document.getElementById('events').classList.remove('hidden');
});

// Renders a list of events into a target container by id
function renderGrid(containerId, eventList) {
  const container = document.getElementById(containerId);
  container.innerHTML = eventList.map(cardHTML).join('');
}

// Featured = first 3 events; full grid = all events
renderGrid('featuredGrid', EVENTS.slice(0, 3));
renderGrid('eventsGrid', EVENTS);