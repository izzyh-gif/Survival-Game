import { Game } from './core/Game';

const container = document.getElementById('game');
if (!container) throw new Error('Missing #game container');

new Game(container).start();
