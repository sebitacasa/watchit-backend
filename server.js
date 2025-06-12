// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiCall = require('./apiCall')

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir cualquier origen durante desarrollo
    methods: ['GET', 'POST']
  }
});

// Manejo de conexiones
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado:', socket.id);

  // Unirse a una sala específica
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} se unió a la sala ${roomId}`);
  });

  // Eventos de video sincronizado
  socket.on('video-event', ({ roomId, type, currentTime }) => {
    socket.to(roomId).emit('video-event', { type, currentTime });
  });
  socket.on('change-video', ({ roomId, videoId }) => {
  socket.to(roomId).emit('change-video', { videoId });
});

  // Mensajes de chat
  socket.on('chat-message', ({ roomId, user, message }) => {
  io.to(roomId).emit('chat-message', { user, message }); // reenvía a todos
});

  // Evento de prueba desde el frontend
  socket.on('test-message', (data) => {
    console.log('📥 Mensaje de prueba recibido desde React:', data);
    socket.emit('test-response', 'Hola desde el servidor 54 👋');
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

app.use('/', apiCall)


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor backend en puerto ${PORT}`);
});
