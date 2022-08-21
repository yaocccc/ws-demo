import * as Ws from 'ws';
import { sleep } from './utils';

const run = async () => {
    const ws = new Ws('ws://127.0.0.1:1122');
    ws.on('open', (_) => {
        ws.send("hello");
    })
    ws.on('close', (_) => console.log('老子被干掉了'));

    while (1) {
        await sleep(5000);
        ws.ping(); // heartbeat
    }
};

run();
