// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-app-id"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Authenticate anonymously
auth.signInAnonymously().then(user => {
  console.log('Signed in anonymously:', user.uid);
}).catch(error => {
  console.error('Anonymous auth error:', error);
  document.getElementById('errorContainer').className = 'alert alert-danger error-alert mt-3';
  document.getElementById('errorContainer').innerText = 'Failed to initialize chat: Authentication error';
});

// Get event ID from URL (e.g., /live/daegu-vs-barcelona)
const eventId = window.location.pathname.split('/live/')[1] || 'default-event';
console.log('Chat Event ID:', eventId);

// Chat functionality
document.addEventListener('DOMContentLoaded', () => {
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const messagesList = document.getElementById('messages');
  const chatWindow = document.getElementById('chatWindow');
  const errorContainer = document.getElementById('errorContainer');

  // Prompt for username
  let username = localStorage.getItem('chatUsername');
  if (!username) {
    username = prompt('Enter your username:') || `User${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('chatUsername', username);
  }

  // Send message
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    // Basic profanity filter
    const badWords = ['badword1', 'badword2']; // Add your own list
    if (badWords.some(word => text.toLowerCase().includes(word))) {
      errorContainer.className = 'alert alert-danger error-alert mt-3';
      errorContainer.innerText = 'Inappropriate message detected';
      return;
    }

    try {
      await db.collection('chats').doc(eventId).collection('messages').add({
        username,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Message sent:', text);
      messageInput.value = '';
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);
      errorContainer.className = 'alert alert-danger error-alert mt-3';
      errorContainer.innerText = 'Failed to send message: ' + error.message;
    }
  });

  // Listen for messages in real-time
  db.collection('chats').doc(eventId).collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(50) // Limit to last 50 messages
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const { username, text, timestamp } = change.doc.data();
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="username">${username}</span>
            <span class="timestamp">${timestamp ? new Date(timestamp.toMillis()).toLocaleTimeString() : 'Now'}</span>
            <span class="message-text">${text}</span>
          `;
          messagesList.appendChild(li);
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    }, error => {
      console.error('Error fetching messages:', error);
      errorContainer.className = 'alert alert-danger error-alert mt-3';
      errorContainer.innerText = 'Failed to load chat messages: ' + error.message;
    });
});
