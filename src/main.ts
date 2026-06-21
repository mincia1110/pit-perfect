import './ui/styles/app.css';
import { GameController, LocalScoreRepository } from './core';
import { bootGame } from './game/GameBootstrap';
import { AppOverlay } from './ui/screens/AppOverlay';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = '<main id="game" aria-label="PIT//PERFECT game canvas"></main><aside id="overlay" aria-label="Game controls"></aside>';

const gameRoot = document.querySelector<HTMLElement>('#game');
const overlayRoot = document.querySelector<HTMLElement>('#overlay');
if (!gameRoot || !overlayRoot) throw new Error('Missing game roots');

const controller = new GameController(new LocalScoreRepository());
bootGame(gameRoot, controller);
new AppOverlay(overlayRoot, controller).mount();
