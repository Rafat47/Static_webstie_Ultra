import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WebsiteDataProvider } from './context/WebsiteDataContext';
import { CartProvider } from './context/CartContext';
import './styles/index.css';
import { initHideNetlifyBadge } from "./utils/hideNetlifyBadge";

initHideNetlifyBadge();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WebsiteDataProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </WebsiteDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
