import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { watchForUpdates } from './update.js';

createRoot(document.getElementById('root')).render(<App />);

watchForUpdates();
