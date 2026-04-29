import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import './Cart.css';

function Cart() {
  const [cart, setCart] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    // Migrate old cart items that don't have quantity
    const migratedCart = storedCart.map(item => ({
      ...item,
      quantity: item.quantity || 1,
    }));
    setCart(migratedCart);
    localStorage.setItem('cart', JSON.stringify(migratedCart));
  }, []);

  const syncCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (id, delta) => {
    const updatedCart = cart.map(item => {
      if (item._id === id) {
        const newQty = (item.quantity || 1) + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean);

    syncCart(updatedCart);

    if (delta < 0) {
      const removed = cart.find(item => item._id === id);
      if (removed && (removed.quantity || 1) + delta <= 0) {
        toast.info(`"${removed.title}" removed from cart`);
      }
    }
  };

  const removeFromCart = (id) => {
    const removed = cart.find(item => item._id === id);
    const updatedCart = cart.filter(item => item._id !== id);
    syncCart(updatedCart);
    toast.info(`"${removed?.title}" removed from cart`);
  };

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      toast.warning('Please sign in to proceed to checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart-page page-wrapper">
      <div className="cart-header">
        <h1 className="cart-title">Your Cart</h1>
        <p className="cart-subtitle">
          {cart.length > 0
            ? `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`
            : 'Your cart is waiting to be filled'}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty" id="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2 className="cart-empty-title">Nothing here yet</h2>
          <p className="cart-empty-text">
            Browse our collection and add books that speak to you.
          </p>
          <Link to="/" className="cart-empty-btn">
            Explore Books
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items" id="cart-items">
            {cart.map((item, index) => (
              <div
                className="cart-item"
                key={item._id}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="cart-item-icon">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="cart-item-thumb" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = ''; // Clear src
                        e.target.parentElement.innerHTML = '📖'; // Replace with emoji
                      }}
                    />
                  ) : (
                    '📖'
                  )}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-author">by {item.author}</div>
                </div>

                {/* Quantity Controls */}
                <div className="cart-quantity-controls">
                  <button
                    className="cart-qty-btn"
                    onClick={() => updateQuantity(item._id, -1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="cart-qty-value">{item.quantity || 1}</span>
                  <button
                    className="cart-qty-btn"
                    onClick={() => updateQuantity(item._id, 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-price">₹{item.price * (item.quantity || 1)}</div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item._id)}
                  aria-label="Remove item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary" id="cart-summary">
            <div className="cart-summary-row">
              <span className="cart-summary-label">Items ({totalItems})</span>
              <span className="cart-summary-value">₹{total}</span>
            </div>
            <div className="cart-summary-row">
              <span className="cart-summary-label">Delivery</span>
              <span className="cart-summary-value" style={{ color: 'var(--success)' }}>
                Free
              </span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span className="cart-summary-label">Total</span>
              <span className="cart-summary-value">₹{total}</span>
            </div>
            <button className="cart-checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;