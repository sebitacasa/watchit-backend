// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiCall = require('./apiCall');

const app = express();
app.use(cors());

// Rutas de API existentes
app.use('/', apiCall);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir cualquier origen durante desarrollo
    methods: ['GET', 'POST']
  }
});

// Manejo de conexiones
io.on('connection', (socket) => {
  console.log('✅ Nuevo usuario conectado:', socket.id);

  // Unirse a una sala específica
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 ${socket.id} se unió a la sala ${roomId}`);
  });

  // --- NUEVA LÓGICA DE SINCRONIZACIÓN (HANDSHAKE) ---

  // 1. El usuario nuevo pide sincronización al entrar
  socket.on('ask-sync', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    
    // Si hay alguien más en la sala (además del que acaba de entrar)
    if (room && room.size > 1) {
      // Buscamos un usuario que NO sea el que acaba de entrar (el "Veterano")
      const veteranId = [...room].find(id => id !== socket.id);
      if (veteranId) {
        console.log(`🔄 Pidiendo tiempo a ${veteranId} para sincronizar a ${socket.id}`);
        // Le pedimos la hora a ese veterano
        io.to(veteranId).emit('get-time', socket.id); 
      }
    } else {
      // Si está solo en la sala, le damos luz verde para empezar desde 0
      console.log(`🟢 Usuario ${socket.id} es el primero. Inicia en 0.`);
      // Nota: Aquí podrías enviar un videoId por defecto si quisieras, o null
      io.to(socket.id).emit('set-time', { time: 0, state: -1, videoId: null }); 
    }
  });

  // 2. El "Veterano" responde con la hora actual Y EL VIDEO
  // CORRECCIÓN AQUÍ: Agregamos videoId
  socket.on('sync-response', ({ requesterId, time, state, videoId }) => {
    console.log(`✅ Sync recibido. Enviando a ${requesterId}: Video ${videoId} - Tiempo ${time}s`);
    // Se lo enviamos SOLAMENTE al usuario que lo pidió, pasando el videoId
    io.to(requesterId).emit('set-time', { time, state, videoId });
  });

  // --- FIN LÓGICA DE SINCRONIZACIÓN ---

  // Eventos de video sincronizado (Play, Pause, Seek)
  socket.on('video-event', ({ roomId, type, currentTime }) => {
    // Reenvía a todos en la sala EXCEPTO al que lo envió
    socket.to(roomId).emit('video-event', { type, currentTime });
  });

  // Cambio de video
  socket.on('change-video', ({ roomId, videoId }) => {
    // Esto se envía a TODOS en la sala
    io.in(roomId).emit('change-video', { videoId });
  });

  // Mensajes de chat
  socket.on('chat-message', ({ roomId, user, message }) => {
    io.to(roomId).emit('chat-message', { user, message }); // reenvía a todos
  });

  // Evento de prueba desde el frontend
  socket.on('test-message', (data) => {
    console.log('📥 Mensaje de prueba recibido desde React:', data);
    socket.emit('test-response', 'Hola desde el servidor 👋');
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});