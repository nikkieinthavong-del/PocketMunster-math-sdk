import React from 'react';
import ReactDOM from 'react-dom/client';
import { PocketMonGameEngine } from './engine/GameEngine';
import { GameUI } from './components/GameUI';
import './styles.css';

const engine = new PocketMonGameEngine();

const App = () => {
    return (
        <div>
            <GameUI engine={engine} />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);