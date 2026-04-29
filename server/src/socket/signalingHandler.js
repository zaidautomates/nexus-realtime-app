const { verifyToken } = require('../utils/jwtHelper');

const rooms = new Map();

function setupSignaling(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} [${socket.id}]`);

    socket.on('room:join', ({ roomId }) => {
      const upperRoomId = roomId.toUpperCase();
      socket.join(upperRoomId);

      if (!rooms.has(upperRoomId)) {
        rooms.set(upperRoomId, new Map());
      }
      const room = rooms.get(upperRoomId);
      room.set(socket.id, {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        displayName: socket.user.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.user.username}`,
      });

      const participants = Array.from(room.values()).filter((p) => p.socketId !== socket.id);
      socket.emit('room:peers', participants);

      socket.to(upperRoomId).emit('room:user-joined', {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        displayName: socket.user.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.user.username}`,
      });

      console.log(`👥 ${socket.user.username} joined room ${upperRoomId}. Total: ${room.size}`);
    });

    socket.on('rtc:offer', ({ to, offer, roomId }) => {
      io.to(to).emit('rtc:offer', {
        from: socket.id,
        offer,
        user: {
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username,
          displayName: socket.user.displayName,
        },
      });
    });

    socket.on('rtc:answer', ({ to, answer }) => {
      io.to(to).emit('rtc:answer', { from: socket.id, answer });
    });

    socket.on('rtc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('rtc:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('chat:message', ({ roomId, message, encrypted }) => {
      const upperRoomId = roomId.toUpperCase();
      const payload = {
        id: `${Date.now()}-${socket.id}`,
        from: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        displayName: socket.user.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.user.username}`,
        message,
        encrypted,
        timestamp: new Date().toISOString(),
      };
      io.to(upperRoomId).emit('chat:message', payload);
    });

    socket.on('file:share', ({ roomId, fileInfo }) => {
      const upperRoomId = roomId.toUpperCase();
      socket.to(upperRoomId).emit('file:shared', {
        ...fileInfo,
        sharedBy: socket.user.displayName,
        sharedBySocketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('file:chunk', ({ to, chunkData }) => {
      io.to(to).emit('file:chunk', chunkData);
    });

    socket.on('whiteboard:draw', ({ roomId, drawData }) => {
      socket.to(roomId.toUpperCase()).emit('whiteboard:draw', drawData);
    });

    socket.on('whiteboard:clear', ({ roomId }) => {
      socket.to(roomId.toUpperCase()).emit('whiteboard:clear');
    });

    socket.on('user:media-state', ({ roomId, audio, video, screensharing }) => {
      socket.to(roomId.toUpperCase()).emit('user:media-state', {
        socketId: socket.id,
        audio,
        video,
        screensharing,
      });
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        const room = rooms.get(roomId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) rooms.delete(roomId);
        }
        socket.to(roomId).emit('room:user-left', { socketId: socket.id });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username} [${socket.id}]`);
    });
  });
}

module.exports = { setupSignaling };
