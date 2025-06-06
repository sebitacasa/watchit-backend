// testClient.js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor con ID:', socket.id);
  socket.emit('join-room', 'sala1');
});

socket.on('video-event', (data) => {
  console.log('🎬 Evento de video recibido:', data);
});

socket.on('chat-message', (data) => {
  console.log('💬 Mensaje recibido:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});
