import { Server } from 'ws';

const ws: Server = new Server({ port: 1337 });

ws.on('connection', (socket: any) => {
    
    socket.on('message', (msg: any) => {

        console.log(msg);
        
    });

    socket.send('Hello World!');

});