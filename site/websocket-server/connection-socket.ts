import WebSocket, { WebSocketServer } from 'ws';

class ConnectionSocketServer {
	private server = new WebSocketServer({ noServer: true });
	private connectionInfo: Map<WebSocket, StatusCommandInfo> = new Map();
	private links: Map<string, Date> = new Map();

	constructor() {
		this.server.on('connection', (ws) => {
			ws.on('message', (data) => {
				const command: ConnectionCommand = JSON.parse(data.toString());
				// console.log('socket message:', data.toString());
				this.handleCommand(ws, command);
			});
			ws.on('close', () => {
				this.connectionInfo.delete(ws);
				this.browdCastSessionInfo();
				console.log('closing connection: ', this.connectionInfo.size);
			});
			ws.on('error', (error)=> console.error(error));
		});

		this.server.on('error', console.error);
	}

	public handleUpgrade: WebSocketServer['handleUpgrade'] = (request, socket, head) => {
		this.server.handleUpgrade(request, socket, head, (ws) => {
			this.server.emit('connection', ws, request);
		});
	};

	private browdCastSessionInfo(isBinary: boolean = false) {
		this.server.clients.forEach((client) => {
			if (client.readyState !== WebSocket.OPEN) return;
			const sessionInfostring: string = JSON.stringify([...this.connectionInfo.values()]);
			client.send(sessionInfostring, { binary: isBinary });
		});
	}

	private handleCommand(webSocket: WebSocket, command: ConnectionCommand) {
		if (command.status) this.addSessionInfo(webSocket, command.status);
		if (command.goTo) this.sendGoTo(command.goTo);
		if (command.link) this.handleLink(command.link);
	}

	private addSessionInfo(webSocket: WebSocket, sessionInfo: StatusCommandInfo) {
		this.connectionInfo.set(webSocket, sessionInfo);
		console.log('new connetion: ', this.connectionInfo.size);
		this.browdCastSessionInfo(false);
	}

	private sendGoTo(command: NonNullable<ConnectionCommand['goTo']>) {
		this.connectionInfo.entries().forEach(([webSocket, info]) => {
			if (info.sessionToken === command?.targetToken) {
				webSocket.send(JSON.stringify({ goTo: command }));
			}
		});
	}

	private handleLink({ origin, linkTarget, isLinked }: NonNullable<ConnectionCommand['link']>) {
		const linkInitDate = this.links.get(linkTarget);
		if (isLinked === false) {
			return;
		}
		if (linkInitDate == null) {
			const newDate = new Date();
			this.links.set(linkTarget, newDate);
			this.sendCommandToConnection(origin,{ goTo: { targetToken: origin, screen: 'loading' } } );
			return;
		}
		const timePasted = (new Date()).getTime() - linkInitDate.getTime();
		if ( timePasted > 3000 && timePasted < 4800 ) {
			console.dir('link after 3s: ', this.links.values());
			this.sendCommandToConnection(origin,{ goTo: { targetToken: origin, screen: 'loot' } } );
		}
	}

	private sendCommandToConnection(token: string, command: ConnectionCommand) {
		this.connectionInfo.entries().forEach(([WebSocket, info]) => {
			if (info.sessionToken === token) {
				WebSocket.send(
					JSON.stringify(command)
				);
			}
		});

	}
}

export const dashboardSocketServer = new ConnectionSocketServer();

export type ConnectionCommand = {
	status?: StatusCommandInfo;
	goTo?: {
		targetToken: string;
		screen: Screen;
		data?: Record<string, unknown>;
	};
	link?: {
		origin: string,
		linkTarget: string,
		isLinked: boolean,
	};
};

export type Command = keyof ConnectionCommand;

export const Screens = {
	loading: 'loading',
	loot: 'loot',
	virus: 'virus',
} as const;
export type Screen = (typeof Screens)[keyof typeof Screens];

export type WebStatusCommandInfo = {
	sessionToken: string;
	connectionType: 'Web';
};

export type CYDStatusCommandInfo = {
	sessionToken: string;
	connectionType: 'CYD';
	wifiStrength: number;
};
export type StatusCommandInfo = WebStatusCommandInfo | CYDStatusCommandInfo;
