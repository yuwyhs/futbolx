// /assets/js/notifications.js
document.addEventListener('DOMContentLoaded', () => {
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'notificationContainer';
  notificationContainer.className = 'notification-container';
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.insertAdjacentElement('afterend', notificationContainer);
  } else {
    console.warn('Hero section not found; appending notification container to main-content');
    document.querySelector('.main-content').prepend(notificationContainer);
  }

  // Function to display a notification
  function showNotification(message) {
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
      <span class="notification-message">${message}</span>
      <span class="notification-close">&times;</span>
    `;
    notificationContainer.appendChild(popup);

    // Auto-close after 30 seconds
    const timer = setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    }, 30000);

    // Manual close with "X" button
    popup.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(timer);
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    });
  }

  // Fetch notification (message1.txt for simplicity)
  fetch('/notifications/message1.txt')
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch notification');
      return response.text();
    })
    .then(message => {
      if (message.trim()) {
        showNotification(message);
      }
    })
    .catch(error => {
      console.error('Error fetching notification:', error);
    });
});
