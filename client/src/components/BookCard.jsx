import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useToast } from './Toast';
import './BookCard.css';

function getBookGradient(title) {
  const gradients = [
    'linear-gradient(135deg, #2C1810 0%, #4A2C1A 40%, #8B5E3C 100%)',
    'linear-gradient(135deg, #1A1A2E 0%, #2D2B55 40%, #4A3F6B 100%)',
    'linear-gradient(135deg, #1B2A1B 0%, #2E4A2E 40%, #3D6B3D 100%)',
    'linear-gradient(135deg, #2A1A1A 0%, #4A2A2A 40%, #6B4040 100%)',
    'linear-gradient(135deg, #1A2A2A 0%, #2A4A4A 40%, #3D6B6B 100%)',
    'linear-gradient(135deg, #2A2A1A 0%, #4A4A2A 40%, #6B6B3D 100%)',
    'linear-gradient(135deg, #1A1A1A 0%, #3D3020 40%, #6B5535 100%)',
    'linear-gradient(135deg, #201520 0%, #3D2840 40%, #5A3D5E 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getBookEmoji(title) {
  const emojis = ['📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return emojis[Math.abs(hash) % emojis.length];
}

function BookCard({ book, user, index = 0, replaceMode = false, onReplace, shelfMode = false }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = book.image && !imgError;

  const addToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      toast.warning('Please sign in to add items to cart');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Find existing item by _id
    const existingIndex = cart.findIndex(item => item._id === book._id);

    if (existingIndex !== -1) {
      // Increment quantity instead of rejecting
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      toast.success(`Added another copy of "${book.title}"`);
    } else {
      // Add new item with quantity 1
      cart.push({
        _id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image || '',
        category: book.category || '',
        quantity: 1,
      });
      toast.success(`"${book.title}" added to cart`);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const deleteBook = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await axios.delete(`/api/books/${book._id}`);
      toast.success('Book deleted successfully');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error('Failed to delete book');
      console.error(error);
    }
  };

  const handleCardClick = () => {
    if (replaceMode && onReplace) {
      onReplace(book);
    } else {
      navigate(`/book/${book._id}`);
    }
  };

  const cardClassName = [
    'book-card',
    replaceMode ? 'replace-mode' : '',
    shelfMode ? 'book-card-shelf' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      style={{ animationDelay: `${index * 0.05}s` }}
      id={`book-card-${book._id}`}
      onClick={handleCardClick}
    >
      {replaceMode && (
        <div className="book-card-replace-overlay">
          <span className="replace-select-label">Select</span>
        </div>
      )}

      <div className="book-card-image">
        {imgError ? (
          <div className="cover-placeholder" style={{ background: getBookGradient(book.title), color: 'white' }}>
            {book.title}
          </div>
        ) : (
          <>
            {!imgLoaded && (
              <div
                className="book-card-image-inner book-card-shimmer"
                style={{ background: getBookGradient(book.title) }}
              />
            )}
            <img
              src={book.image}
              alt={book.title}
              className={`book-card-cover ${imgLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
        <div className="book-card-image-overlay" />

        {/* Quick Actions Overlay (shelf mode) */}
        {shelfMode && !replaceMode && (
          <div className="book-card-quick-actions">
            <button
              className="quick-action-btn quick-action-view"
              onClick={(e) => { e.stopPropagation(); navigate(`/book/${book._id}`); }}
            >
              View
            </button>
            <button
              className="quick-action-btn quick-action-cart"
              onClick={addToCart}
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="book-card-body">
        {book.category && !shelfMode && (
          <span className="book-card-category">{book.category}</span>
        )}
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">by {book.author}</p>

        <div className="book-card-footer">
          <span className="book-card-price">₹{book.price}</span>

          {!replaceMode && !shelfMode && (
            <div className="book-card-actions">
              <button className="btn-add-cart" onClick={addToCart}>
                Add to Cart
              </button>
              {user?.isAdmin && (
                <button className="btn-delete" onClick={deleteBook}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookCard;