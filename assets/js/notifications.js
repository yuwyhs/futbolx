// /assets/js/notifications.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('notifications.js loaded at', new Date().toISOString());

  // Create notification container
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'notificationContainer';
  notificationContainer.className = 'notification-container';
  const heroSection = document.querySelector('.hero-background');
  const mainContent = document.querySelector('.container.pt-2');
  if (heroSection && mainContent) {
    console.log('Inserting notification container below hero section');
    mainContent.insertBefore(notificationContainer, mainContent.firstChild);
  } else {
    console.warn('Hero section or main content not found; appending to main-content');
    document.querySelector('.main-content').prepend(notificationContainer);
  }

  // Function to display a notification
  function showNotification(message) {
    console.log('Displaying notification:', message);
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
      <span class="notification-message">${message}</span>
      <span class="notification-close">&times;</span>
    `;
    notificationContainer.appendChild(popup);

    // Auto-close after 30 seconds
    const timer = setTimeout(() => {
      console.log('Auto-closing notification:', message);
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    }, 30000);

    // Manual close with "X" button
    popup.querySelector('.notification-close').addEventListener('click', () => {
      console.log('Notification closed manually:', message);
      clearTimeout(timer);
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    });
  }

  // Fetch the list of notifications
  console.log('Fetching /notifications/notifications.json');
  fetch('/notifications/notifications.json')
    .then(response => {
      console.log('Notifications.json fetch response status:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Failed to fetch notifications.json: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      if (!data.notifications || !Array.isArray(data.notifications)) {
        console.warn('Invalid notifications.json format; expected "notifications" array');
        return;
      }
      console.log('Found notifications:', data.notifications);
      data.notifications.forEach(file => {
        console.log(`Fetching /notifications/${file}`);
        fetch(`/notifications/${file}`)
          .then(response => {
            console.log(`Fetch response for ${file}:`, response.status, response.statusText);
            if (!response.ok) throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
            return response.text();
          })
          .then(message => {
            if (message.trim()) {
              console.log(`Notification content for ${file}:`, message);
              showNotification(message);
            } else {
              console.warn(`Notification content for ${file} is empty`);
            }
          })
          .catch(error => {
            console.error(`Error fetching ${file}:`, error);
          });
      });
    })
    .catch(error => {
      console.error('Error fetching notifications.json:', error);
    });
});
