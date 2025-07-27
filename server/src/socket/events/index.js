export const onUserConnected = (socket) => {
  console.log('User connected:', socket.id);
  };
  
export const onUserDisconnected = (socket) => {
  console.log('User disconnected:', socket.id);
  };