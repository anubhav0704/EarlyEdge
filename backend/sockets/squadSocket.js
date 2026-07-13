export const handleSquadSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket client connected: ${socket.id}`);

    // Join a specific squad room
    socket.on('join_squad_room', (squadName) => {
      if (squadName) {
        socket.join(squadName);
        console.log(`👤 Client ${socket.id} joined squad room: "${squadName}"`);
      }
    });

    // Leave a specific squad room
    socket.on('leave_squad_room', (squadName) => {
      if (squadName) {
        socket.leave(squadName);
        console.log(`👤 Client ${socket.id} left squad room: "${squadName}"`);
      }
    });

    // Broadcast user joined notification to squad channel
    socket.on('squad_event_notification', ({ squadName, title, message, type }) => {
      if (squadName) {
        // Emit to everyone in the room except the sender
        socket.to(squadName).emit('squad_live_toast', {
          title,
          message,
          type: type || 'info',
          timestamp: Date.now()
        });
      }
    });

    // Handle real-time squad chat messaging
    socket.on('send_squad_message', ({ squadName, senderName, senderEmail, text }) => {
      if (squadName && text) {
        io.to(squadName).emit('receive_squad_message', {
          senderName,
          senderEmail,
          text,
          timestamp: Date.now()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
