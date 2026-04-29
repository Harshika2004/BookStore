import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import BookList from '../components/BookList';
import { useToast } from '../components/Toast';
import './Home.css';

const CATEGORIES = ['All', 'Fiction', 'Non-Fiction', 'Self-Help', 'Technology', 'Finance', 'Biography'];

function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const replaceOrderId = searchParams.get('replaceOrder');
  const replaceItemId = searchParams.get('replaceItem');
  const replaceMode = !!(replaceOrderId && replaceItemId);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(`/api/books?t=${Date.now()}`);
      setBooks(res.data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || book.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {};
  books.forEach(book => {
    const cat = book.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // (Bookshelf sections removed)

  const handleReplace = async (book) => {
    try {
      await axios.post(`/api/orders/${replaceOrderId}/replace-item`, {
        itemId: replaceItemId,
        newBook: { title: book.title, price: book.price, bookId: book._id, image: book.image },
      });
      toast.success(`Replaced with "${book.title}"`);
      setSearchParams({});
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to replace item');
    }
  };

  const cancelReplace = () => {
    setSearchParams({});
    toast.info('Replacement cancelled');
  };

  const SkeletonGrid = () => (
    <div className="skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
            <div className="skeleton-line price" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-page page-wrapper">
      {/* ── Replace Mode Banner ── */}
      {replaceMode && (
        <div className="replace-banner">
          <div className="replace-banner-content">
            <span className="replace-banner-icon">🔄</span>
            <div className="replace-banner-text">
              <strong>Select Replacement</strong>
              <span>Choose a new book to replace your returned item</span>
            </div>
            <button className="replace-banner-cancel" onClick={cancelReplace}>
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Hero Section ── */}
      {!replaceMode && (
        <section className="hero" id="hero-section">
          <div className="hero-decoration hero-decoration-left">📖</div>
          <div className="hero-decoration hero-decoration-right">📚</div>

          <div className="hero-content">
            <span className="hero-label">Curated Collection</span>
            <h1 className="hero-title">
              Discover Your Next{' '}
              <span className="hero-title-accent">Story</span>
            </h1>
            <p className="hero-subtitle">
              Explore our handpicked selection of books that inspire, educate, and transform.
            </p>

            <div className="search-wrapper" id="search-wrapper">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="book-search-input"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Mobile Category Filter ── */}
      <div className="mobile-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`mobile-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      {loading ? (
        <div className="books-main">
          <section className="books-section">
            <SkeletonGrid />
          </section>
        </div>
      ) : error ? (
        <div className="books-main">
          <section className="books-section">
            <div className="error-container">
              <div className="error-icon">⚠</div>
              <h3 className="error-title">Something went wrong</h3>
              <p className="error-text">{error}</p>
              <button className="error-retry" onClick={fetchBooks}>Try Again</button>
            </div>
          </section>
        </div>
      ) : (
        /* ── Main Grid View ── */
        <div className="books-main">
          <aside className="sidebar" id="sidebar">
            <h3 className="sidebar-title">Categories</h3>
            <div className="sidebar-list">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`sidebar-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span>{cat}</span>
                  <span className="sidebar-item-count">
                    {cat === 'All' ? books.length : (categoryCounts[cat] || 0)}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="books-section" id="books-section">
            <div className="section-header">
              <h2 className="section-title">
                {replaceMode
                  ? 'Select Replacement'
                  : search
                    ? 'Search Results'
                    : activeCategory === 'All'
                      ? 'Our Collection'
                      : activeCategory}
              </h2>
              <span className="section-count">
                {`${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            <BookList
              books={filteredBooks}
              user={user}
              replaceMode={replaceMode}
              onReplace={handleReplace}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default Home;