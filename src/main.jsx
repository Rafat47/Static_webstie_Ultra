import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WebsiteDataProvider } from './context/WebsiteDataContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WebsiteDataProvider>
        <CartProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CartProvider>
      </WebsiteDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
