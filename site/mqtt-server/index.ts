import express from 'express';
import { handler } from '../build/handler.js';
import { connectionCoordinator } from './connection-coordinator.js';

const port = 3000;
const app = express();

app.use(handler);
app.listen(port);

connectionCoordinator.connect();
