import { Server } from 'socket.io';

export default function SocketHandler(req, res) {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new Server(res.socket.server, {
            path: '/api/socketio',
            addTrailingSlash: false,
        });
        res.socket.server.io = io;

        io.on('connection', socket => {
            socket.on('postMessage', msg => {
                socket.broadcast.emit('newMessage', msg);
            });
        });
    }
    res.end();
}

export const config = {
    api: {
        bodyParser: false
    }
};