import { Server } from 'ws';
import { App, launch } from 'carlo';
import Turtle from './Turtle.js'
import { question } from 'readline-sync';

const wss: Server = new Server({ port: 1337 });

/* (async () => {
    const app = await launch();
    
    app.on('exit', () => process.exit());
    
    app.exposeFunction('exec', async (index: number, func: string, ...args: any[]) => {
		if (typeof index === 'string') {
			[index, func, ...args] = JSON.parse(index).args;
		}
		return await queue.add(() => ((turtles[index] as any)[func])(...args));
	});

})(); */



wss.on('connection', async function connection(ws) {

    const turtle = new Turtle(ws);

    while(true) {
        console.log();
        let ans: string = question('(F)orward\n(B)ack\n(U)p\n(D)own\n(L)eft\n(R)ight\n(A)ttack\n(P)lace\n\n');

        switch(ans) {
            case 'F':
                turtle.forward();
                break;
            case 'B':
                turtle.back();
                break;
            case 'U':
                turtle.up();
                break;
            case 'D':
                turtle.down();
                break;
            case 'L':
                turtle.turnLeft();
                break;
            case 'R':
                turtle.turnRight();
                break;
            case 'A':
                turtle.dig(0);
                break;
            case 'P':
                turtle.place(0);
                break;
        }

    }

    ws.on('message', function incoming(message) {
        console.log("received: %s", message);
    });
});