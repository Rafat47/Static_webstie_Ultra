import React, { createContext, useContext, useState, useEffect } from 'react';
import { metaEvents } from '../utils/metaPixel';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('regrow_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('regrow_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const qty = Math.max(1, parseInt(quantity) || 1);

    setCartItems(prev => {
      const prodId = product._id || product.slug;
      const existingIdx = prev.findIndex(item => (item.productId === prodId || item.slug === product.slug));

      if (existingIdx !== -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        // Check stock boundary if available
        const maxStock = product.stock > 0 ? product.stock : 999;
        updated[existingIdx].quantity = Math.min(newQty, maxStock);
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: String(prodId),
            slug: product.slug,
            productName: product.name,
            image: product.images?.[0] || '',
            unitPrice: product.salePrice,
            regularPrice: product.regularPrice,
            stock: product.stock,
            quantity: Math.min(qty, product.stock > 0 ? product.stock : 999)
          }
        ];
      }
    });

    // Fire Meta AddToCart event
    metaEvents.addToCart(product, qty);
    setIsCartOpen(true);
  };

  const buyNow = (product, quantity = 1, navigate) => {
    addToCart(product, quantity);
    setIsCartOpen(false);
    if (navigate) {
      navigate('/checkout');
    }
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId || item.slug === productId) {
          const newQty = item.quantity + delta;
          const maxStock = item.stock > 0 ? item.stock : 999;
          if (newQty <= 0) return null;
          return { ...item, quantity: Math.min(newQty, maxStock) };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId && item.slug !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.unitPrice || 0) * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        buyNow,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

