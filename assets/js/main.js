// assets/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const eventGrid = document.querySelector('.event-grid');
  if (!eventGrid) {
    console.error('Event grid container not found');
    return;
  }

  fetch('/api/stream.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.success || !data.streams || !data.streams.length) {
        console.warn('No streams available in stream.json');
        eventGrid.innerHTML = '<p>No live events available.</p>';
        return;
      }

      const now = new Date();
      data.streams.forEach(category => {
        category.streams.forEach(event => {
          // Skip expired events unless always_live
          if (!event.always_live && new Date(event.ends_at) < now) {
            console.log(`Skipping expired event: ${event.name}`);
            return;
          }

          const card = document.createElement('div');
          card.className = 'event-card col';
          card.innerHTML = `
            <div class="card">
              <img src="${event.poster}" class="card-img-top event" alt="${event.name}">
              ${event.always_live || new Date(event.starts_at) <= now && now <= new Date(event.ends_at) ? '<span class="live-badge">LIVE</span>' : ''}
              <div class="card-body">
                <h5 class="card-title">${event.name}</h5>
                <div class="card-text">
                  <span class="event-tag">${event.tag}</span>
                  <span class="event-timer">
                    ${event.always_live || new Date(event.starts_at) > now ? `<span class="countdown" data-time="${event.starts_at}"></span>` : ''}
                    <a href="/live/${event.uri_name}" class="watch-button btn btn-stream">Watch Now</a>
                  </span>
                </div>
              </div>
            </div>
          `;
          eventGrid.appendChild(card);
        });
      });

      // Update countdown timers
      document.querySelectorAll('.countdown').forEach(timer => {
        const startTime = new Date(timer.getAttribute('data-time'));
        const updateTimer = () => {
          const timeLeft = startTime - new Date();
          if (timeLeft <= 0) {
            timer.textContent = 'Live Now';
            return;
          }
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          timer.textContent = `Starts in ${hours}h ${minutes}m`;
        };
        updateTimer();
        setInterval(updateTimer, 60000);
      });
    })
    .catch(error => {
      console.error('Error fetching streams:', error);
      eventGrid.innerHTML = '<p>Failed to load events. Please try again later.</p>';
    });
});
