import { useState } from 'react';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './AddBook.css';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Self-Help', 'Technology', 'Finance', 'Biography'];

function AddBook() {
  const [form, setForm] = useState({
    title: '',
    author: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/books', form);
      toast.success(`"${form.title}" has been added to the catalog`);
      setForm({ title: '', author: '', price: '', description: '', stock: '', category: '', image: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addbook-page page-wrapper">
      <div className="addbook-card" id="addbook-card">
        <div className="addbook-header">
          <div className="addbook-icon">✦</div>
          <h1 className="addbook-title">Add New Book</h1>
          <p className="addbook-subtitle">Add a new title to the The The Book Cafe catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="addbook-form" id="addbook-form">
          <div className="float-input-group">
            <input
              type="text"
              name="title"
              id="input-book-title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <label htmlFor="input-book-title">Book Title</label>
          </div>

          <div className="float-input-group">
            <input
              type="text"
              name="author"
              id="input-book-author"
              placeholder="Author"
              value={form.author}
              onChange={handleChange}
              required
            />
            <label htmlFor="input-book-author">Author Name</label>
          </div>

          <div className="input-row">
            <div className="float-input-group">
              <input
                type="number"
                name="price"
                id="input-book-price"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                required
              />
              <label htmlFor="input-book-price">Price (₹)</label>
            </div>

            <div className="float-input-group">
              <input
                type="number"
                name="stock"
                id="input-book-stock"
                placeholder="Stock"
                value={form.stock}
                onChange={handleChange}
                required
              />
              <label htmlFor="input-book-stock">Stock Quantity</label>
            </div>
          </div>

          {/* Category Select */}
          <div className="select-group">
            <label className="select-label" htmlFor="input-book-category">Category</label>
            <select
              name="category"
              id="input-book-category"
              value={form.category}
              onChange={handleChange}
              className="select-input"
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="float-input-group">
            <input
              type="url"
              name="image"
              id="input-book-image"
              placeholder="Image URL"
              value={form.image}
              onChange={handleChange}
            />
            <label htmlFor="input-book-image">Cover Image URL (optional)</label>
          </div>

          <div className="float-input-group">
            <textarea
              name="description"
              id="input-book-description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              rows="3"
            />
            <label htmlFor="input-book-description">Description</label>
          </div>

          <button type="submit" className="addbook-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add to Catalog'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBook;