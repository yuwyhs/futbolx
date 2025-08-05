// /assets/js/notifications.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('notifications.js loaded at', new Date().toISOString());

  // Create notification container
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'notificationContainer';
  notificationContainer.className = 'notification-container';
  const mainContent = document.querySelector('.container.pt-2') || document.querySelector('.main-content');
  if (mainContent) {
    console.log('Inserting notification container into main content');
    mainContent.insertBefore(notificationContainer, mainContent.firstChild);
  } else {
    console.error('Main content not found; appending to body');
    document.body.appendChild(notificationContainer);
  }

  // Display hardcoded notification
  console.log('Displaying hardcoded notification');
  const popup = document.createElement('div');
  popup.className = 'notification-popup';
  popup.innerHTML = `
    <span class="notification-message">Test Notification: This should appear!</span>
    <span class="notification-close">&times;</span>
  `;
  notificationContainer.appendChild(popup);

  // Auto-close after 30 seconds
  const timer = setTimeout(() => {
    console.log('Auto-closing notification');
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 500);
  }, 30000);

  // Manual close
  popup.querySelector('.notification-close').addEventListener('click', () => {
    console.log('Notification closed manually');
    clearTimeout(timer);
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 500);
  });
});
