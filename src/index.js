import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; 

// Find the root DOM element
const container = document.getElementById('root');

if (container) {
    const root = ReactDOM.createRoot(container);
    
    // Render the application
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    // This message is helpful if the index.html file is ever corrupted
    console.error("Root element with id 'root' not found in index.html. React cannot start.");
}