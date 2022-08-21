import * as Ws from 'ws';
import { sleep } from './utils';

/** 服务器上跑ws服务端 用于接收前端页面的ws请求 所以一个服务端要对应多个ws连接 */
/** 服务端维护连接池，每个连接池再挂载txs */

/** 用于接收前端发送过来的区块链已被签名的交易 */
type SocketStore = {
    // TODO 待补充结构
    lastHeartBeat: number;
};

class TxWsServer {
    private wsServer: Ws.Server; // ws服务端实例
    public connPool: Map<Ws.WebSocket, SocketStore> = new Map();

    constructor(wsServer: Ws.Server) {
        this.wsServer = wsServer;
    }

    public run = () => {
        this.wsServer.on('connection', (socket: Ws.WebSocket) => this.onConnect(socket));
        this.checkHeartbeat();
    };

    private onConnect = async (socket: Ws.WebSocket) => {
        this.connPool.set(socket, { lastHeartBeat: Date.now() });
        socket.on('close', (_) => this.onDisconnect(socket));
        socket.on('ping', (_) => this.onHeartbeat(socket));
        socket.on('message', (msg: Buffer) => this.onMsg(socket, msg));
    };

    private onDisconnect = async (socket: Ws.WebSocket) => this.connPool.delete(socket);
    private onHeartbeat = async (socket: Ws.WebSocket) => {
        this.connPool.set(socket, { lastHeartBeat: Date.now() });
    };
    private onMsg = async (socket: Ws.WebSocket, msg: Buffer) => {
        console.log(msg.toString());
    };

    // 检查心跳 如果超过30秒没有上报心跳 则干掉这个socket
    private checkHeartbeat = async () => {
        await sleep(1000 * 10);
        const now = Date.now();
        this.connPool.forEach((store, socket) => {
            if (now - store.lastHeartBeat > 30 * 1000) {
                console.log('有个socket被干掉了');
                socket.close();
                this.connPool.delete(socket);
            }
        });
        this.checkHeartbeat();
    };
}

const run = async () => {
    const wsServer = new Ws.Server({ port: 1122 });
    const txWsServer = new TxWsServer(wsServer);
    txWsServer.run();

    console.log('ws 服务端已启动 port: 1122');
    while (1) {
        await sleep(1000);
        console.log(txWsServer.connPool.size);
    }
};

run();
