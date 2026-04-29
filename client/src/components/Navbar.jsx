import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navbar.css';

function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  } catch {
    return 0;
  }
}



function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(getCartCount());
  const [cartBounce, setCartBounce] = useState(false);
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const handleCartUpdate = () => {
      const newCount = getCartCount();
      setCartCount(newCount);
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 400);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Sync cart count on location change 
  useEffect(() => {
    setCartCount(getCartCount());
  }, [location]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar" id="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/book_cafe_logo_transparent.png" alt="Book Cafe Logo" className="brand-logo-img" style={{ height: "60px", width: "auto" }} />
        <span>Book Cafe</span>
      </Link>

      <button
        className="nav-mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>
          Home
        </Link>
        <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>
          About
        </Link>
        <Link to="/contact" className={isActive('/contact')} onClick={() => setMenuOpen(false)}>
          Contact
        </Link>

        {user ? (
          <>
            <Link to="/cart" className={`${isActive('/cart')} nav-cart-link`} onClick={() => setMenuOpen(false)}>
              <span className="nav-cart-icon">🛒</span>
              <span>Cart</span>
              {cartCount > 0 && (
                <span className={`cart-badge ${cartBounce ? 'bounce' : ''}`}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link to="/orders" className={isActive('/orders')} onClick={() => setMenuOpen(false)}>
              Orders
            </Link>
            {user.isAdmin && (
              <Link to="/add-book" className={isActive('/add-book')} onClick={() => setMenuOpen(false)}>
                Add Book
              </Link>
            )}
            <Link to="/account" className={`nav-user-link ${location.pathname === '/account' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <span className="nav-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="nav-user-name">{user.name}</span>
            </Link>
          </>
        ) : (
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            <button className="nav-btn nav-btn-primary">Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
