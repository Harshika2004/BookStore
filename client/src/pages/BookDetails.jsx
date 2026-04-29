import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './BookDetails.css';

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

function StarRating({ rating, onRate, interactive = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchBook();
    fetchReviews();
  }, [id]);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/books/${id}`);
      setBook(res.data);
    } catch (err) {
      toast.error('Failed to load book details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/api/reviews/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = () => {
    if (!user) {
      toast.warning('Please sign in to add items to cart');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item._id === book._id);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      toast.success(`Added another copy of "${book.title}"`);
    } else {
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

  const buyNow = () => {
    if (!user) {
      toast.warning('Please sign in to place an order');
      navigate('/login');
      return;
    }

    // Add to cart and navigate to checkout
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item._id === book._id);

    if (existingIndex === -1) {
      cart.push({
        _id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image || '',
        category: book.category || '',
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please sign in to write a review');
      return;
    }
    if (reviewRating === 0) {
      toast.warning('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      toast.warning('Please write a comment');
      return;
    }

    setReviewLoading(true);
    try {
      await axios.post('/api/reviews', {
        bookId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewComment('');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const hasImage = book?.image && !imgError;

  if (loading) {
    return (
      <div className="book-details-page page-wrapper">
        <div className="bd-skeleton">
          <div className="bd-skeleton-image" />
          <div className="bd-skeleton-content">
            <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
            <div className="skeleton-line" style={{ width: '80%', height: '32px', marginTop: '12px' }} />
            <div className="skeleton-line" style={{ width: '50%', height: '16px', marginTop: '8px' }} />
            <div className="skeleton-line" style={{ width: '30%', height: '28px', marginTop: '24px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '60px', marginTop: '24px' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '44px', marginTop: '32px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-details-page page-wrapper">
        <div className="bd-not-found">
          <div className="bd-not-found-icon">📖</div>
          <h2>Book not found</h2>
          <p>This book may have been removed or the link is incorrect.</p>
          <button className="bd-back-btn" onClick={() => navigate('/')}>
            ← Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-details-page page-wrapper">
      <button className="bd-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="bd-main">
        {/* Left — Book Visual */}
        <div className="bd-image-section">
          <div className="bd-image-wrapper">
            {imgError ? (
              <div className="cover-placeholder" style={{ 
                background: getBookGradient(book.title), 
                color: 'white',
                fontSize: '24px',
                padding: '40px'
              }}>
                {book.title}
              </div>
            ) : (
              <>
                {!imgLoaded && (
                  <div className="bd-image-placeholder" style={{ background: getBookGradient(book.title) }}>
                    <span className="bd-image-emoji">{getBookEmoji(book.title)}</span>
                  </div>
                )}
                <img
                  src={book.image}
                  alt={book.title}
                  className={`bd-image ${imgLoaded ? 'loaded' : ''}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                />
              </>
            )}
          </div>
        </div>

        {/* Right — Details */}
        <div className="bd-info-section">
          {book.category && (
            <span className="bd-category">{book.category}</span>
          )}
          <h1 className="bd-title">{book.title}</h1>
          <p className="bd-author">by {book.author}</p>

          {avgRating && (
            <div className="bd-rating-summary">
              <StarRating rating={Math.round(parseFloat(avgRating))} />
              <span className="bd-rating-text">{avgRating} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="bd-price-row">
            <span className="bd-price">₹{book.price}</span>
            <span className={`bd-stock ${book.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {book.stock > 0 ? `✓ In Stock (${book.stock})` : '✕ Out of Stock'}
            </span>
          </div>

          {book.description && (
            <div className="bd-description">
              <h3 className="bd-section-title">About this Book</h3>
              <p>{book.description}</p>
            </div>
          )}

          <div className="bd-actions">
            <button className="bd-btn bd-btn-primary" onClick={addToCart} disabled={book.stock === 0}>
              🛒 Add to Cart
            </button>
            <button className="bd-btn bd-btn-accent" onClick={buyNow} disabled={book.stock === 0}>
              ⚡ Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bd-reviews-section">
        <h2 className="bd-reviews-title">Reviews</h2>

        {/* Write Review Form */}
        {user && (
          <form className="bd-review-form" onSubmit={submitReview}>
            <h3 className="bd-review-form-title">Write a Review</h3>
            <div className="bd-review-rating-row">
              <span className="bd-review-rating-label">Your Rating</span>
              <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
            </div>
            <textarea
              className="bd-review-textarea"
              placeholder="Share your thoughts about this book..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows="3"
            />
            <button className="bd-btn bd-btn-submit" type="submit" disabled={reviewLoading}>
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bd-no-reviews">
            <p>No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="bd-reviews-list">
            {reviews.map((review) => (
              <div className="bd-review-card" key={review._id}>
                <div className="bd-review-header">
                  <div className="bd-review-avatar">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bd-review-meta">
                    <span className="bd-review-name">{review.userName}</span>
                    <span className="bd-review-date">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="bd-review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDetails;
