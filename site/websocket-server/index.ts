import express from 'express';
import { handler } from '../build/handler.js';
import { WebSocketMidiator } from './socket-server.js';

const port = 3000;
const app = express();

app.use(handler);
const server = app.listen(port);

new WebSocketMidiator(server);

