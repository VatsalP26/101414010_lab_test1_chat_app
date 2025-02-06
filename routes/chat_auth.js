const jwt = require('jsonwebtoken');
const GroupMessage = require('../models/GroupMessage');
const PrivateMessage = require('../models/PrivateMessage');

let usersInRoom = {};      
let onlineUsers = {};       

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New user connected');

        socket.on('authenticate', (token, callback) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;

               
                onlineUsers[socket.user.username] = socket.id;
                callback({ success: true });
                console.log(`Socket authenticated: ${socket.user.username}`);
            } catch (err) {
                callback({ success: false, message: 'Token is not valid' });
                socket.disconnect(); // Disconnect if the token is invalid
            }
        });

        socket.on('joinRoom', (room) => {
            if (!socket.user) {
                return socket.emit('error', 'Authentication required');
            }
            socket.join(room);
            usersInRoom[socket.id] = room;
            console.log(`User ${socket.user.username} joined room: ${room}`);
            io.to(room).emit('receiveMessage', {
                message: `${socket.user.username} has joined the room`,
                room: room,
                from_user: 'System'
            });
        });

        socket.on('sendMessage', async (data) => {
            if (!socket.user) return socket.emit('error', 'Authentication required');

            try {
                if (data.room) {
                    const newMessage = new GroupMessage({
                        from_user: socket.user.username,
                        room: data.room,
                        message: data.message,
                    });
                    await newMessage.save();
                    io.to(data.room).emit('receiveMessage', {
                        message: data.message,
                        room: data.room,
                        from_user: socket.user.username,
                    });
                } else if (data.to_user) {
                    const newMessage = new PrivateMessage({
                        from_user: socket.user.username,
                        to_user: data.to_user,
                        message: data.message,
                    });
                    await newMessage.save();

                    const targetSocketId = onlineUsers[data.to_user];
                    if (targetSocketId) {
                        io.to(targetSocketId).emit('receiveMessage', {
                            message: data.message,
                            from_user: socket.user.username,
                        });
                    } else {
                        console.log(`User ${data.to_user} is offline. Message saved.`);
                    }
                }
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on('typing', (data) => {
            if (!socket.user) return socket.emit('error', 'Authentication required');
            io.to(data.room).emit('showTyping', { user: socket.user.username });
        });

        socket.on('leaveRoom', () => {
            if (!socket.user) return socket.emit('error', 'Authentication required');
            const room = usersInRoom[socket.id];
            if (room) {
                socket.leave(room);
                console.log(`User ${socket.user.username} left room: ${room}`);
                io.to(room).emit('receiveMessage', {
                    message: `${socket.user.username} has left the room`,
                    room: room,
                    from_user: 'System',
                });
                delete usersInRoom[socket.id];
            }
        });

        socket.on('disconnect', () => {
            if (socket.user) {
                console.log(`User disconnected: ${socket.user.username}`);
                delete onlineUsers[socket.user.username];
            } else {
                console.log("An unauthenticated socket disconnected");
            }
            delete usersInRoom[socket.id];
        });
    });
};
