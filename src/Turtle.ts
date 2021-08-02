import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

export enum BlockDirection { FORWARD, UP, DOWN }
export enum Direction { NORTH, EAST, SOUTH, WEST }
export enum Side { LEFT, RIGHT }

interface Slot {
    count: number;
    name: string;
    damage: number;
}

const nonces = new Set();
function getNonce(): string {
	let nonce = '';
	while (nonce === '' || nonces.has(nonce)) {
		nonce = randomBytes(4).toString('hex');
	}
	nonces.add(nonce);
	return nonce;
}

export default class Turtle extends EventEmitter {

    id: number = 0;
    label: string = '';
    fuel: number = 0;
    maxFuel: number = 1;
    selectedSlot: number = 1;
    inventory: (Slot | null)[] = [];
    ws: WebSocket;
    x: number = 0;
    y: number = 0;
    z: number = 0;
    d: Direction = 0;

    constructor(ws: WebSocket) {

        super();
        this.ws = ws;

    }

    exec<T>(command: string): Promise<T> {
        return new Promise(r => {
            const nonce = getNonce();
            this.ws.send(JSON.stringify({
                type: 'eval',
				function: `return ${command}`,
				nonce
			}));

            const listener = (resp: string) => {
                try {
                    let res = JSON.parse(resp);
                    if(res?.nonce === nonce) {
                        r(res.data);
                        this.ws.off('message', listener);
                    }
                } catch(e) {}
            }
        });
    }

    async forward(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.forward()');
		if (r) {
			this.fuel--;
			await this.updatePosition('forward');
		}
		return r;
	}

    async back(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.back()');
		if (r) {
			this.fuel--;
			await this.updatePosition('back');
		}
		return r;
	}

    async up(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.up()');
		if (r) {
			this.fuel--;
			await this.updatePosition('up');
		}
		return r;
	}

    async down(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.down()');
		if (r) {
			this.fuel--;
			await this.updatePosition('down');
		}
		return r;
	}

    async turnLeft(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.turnLeft()');
		if (r) {
			await this.updatePosition('left');
		}
		return r;
	}

    async turnRight(): Promise<boolean> {
		let r = await this.exec<boolean>('turtle.turnRight()');
		if (r) {
			await this.updatePosition('right');
		}
		return r;
	}

    private parseDirection(prefix: string, direction: BlockDirection): string {
		switch (direction) {
			case BlockDirection.FORWARD:
				return prefix;
			case BlockDirection.UP:
				return prefix + 'Up';
			case BlockDirection.DOWN:
				return prefix + 'Down';
		}
	}

    private async updateInventory() {
		this.inventory = await this.exec<Slot[]>('{' + new Array(16).fill(0).map((_, i) => `turtle.getItemDetail(${i + 1})`).join(', ') + '}');
		while (this.inventory.length < 16) {
			this.inventory.push(null);
		}
		this.emit('update');
	}

    private async updateFuel() {
		this.emit('update');
	}

    private getDirectionDelta(dir: Direction): [number, number] {
		if (dir === Direction.NORTH) return [0, -1];
		else if (dir === Direction.EAST) return [1, 0];
		else if (dir === Direction.SOUTH) return [0, 1];
		else if (dir === Direction.WEST) return [-1, 0];
		return [0, 0];
	}

    private async updatePosition(move: string) {
		let deltas = this.getDirectionDelta(this.d);
		switch (move) {
			case 'up':
				this.y++;
				break;
			case 'down':
				this.y--;
				break;
			case 'forward':
				this.x += deltas[0];
				this.z += deltas[1];
				break;
			case 'back':
				this.x -= deltas[0];
				this.z -= deltas[1];
				break;
			case 'left':
				this.d += 3;
				this.d %= 4;
				break;
			case 'right':
				this.d++;
				this.d %= 4;
				break;
		await this.updateBlock();
		this.emit('update');
	    }
    }

    private async updateBlock() {
		let deltas = this.getDirectionDelta(this.d);
		let { forward, up, down } = await this.exec<{ forward: any, up: any, down: any }>('{down=select(2,turtle.inspectDown()), up=select(2,turtle.inspectUp()), forward=select(2,turtle.inspect())}');
	}

    async dig(direction: BlockDirection) {
		let r = await this.exec<boolean>(`turtle.${this.parseDirection('dig', direction)}()`);
		await this.updateInventory();
		await this.updateBlock();
		return r;
	}
	async place(direction: BlockDirection, signText?: string) {
		let r = await this.exec<boolean>(`turtle.${this.parseDirection('place', direction)}(${signText ? ('"' + signText + '"') : ''})`);
		await this.updateInventory();
		await this.updateBlock();
		return r;
	}

}
