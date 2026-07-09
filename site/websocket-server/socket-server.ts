import * as http from 'http';
import {dashboardSocketServer} from './connection-socket';

export class WebSocketMidiator{

	private dashboardServer = dashboardSocketServer;

	constructor(server: http.Server) {

		server.on('upgrade', (request, socket, head) => {
			const {pathname} = new URL(request.url ??'', `ws://localhost/`);
			if(pathname === '/connections') this.dashboardServer.handleUpgrade(request, socket, head, ()=>{}); //HACK: not sure if the callback is needed
		})
	}
	
}

