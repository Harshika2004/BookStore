import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './Account.css';

function Account() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        axios.get('/api/auth/me'),
        axios.get('/api/orders'),
      ]);
      setProfile(profileRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Logged out successfully');
    setTimeout(() => { window.location.href = '/'; }, 400);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'returned':
        return { label: 'Returned', className: 'status-returned' };
      case 'replaced':
        return { label: 'Replaced', className: 'status-replaced' };
      default:
        return { label: 'Placed', className: 'status-placed' };
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  if (loading) {
    return (
      <div className="account-page page-wrapper">
        <div className="account-skeleton">
          <div className="account-skeleton-header" />
          <div className="account-skeleton-cards">
            <div className="account-skeleton-card" />
            <div className="account-skeleton-card" />
            <div className="account-skeleton-card" />
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const placedCount = orders.filter(o => o.status === 'placed' || !o.status).length;

  return (
    <div className="account-page page-wrapper">
      {/* Header */}
      <div className="account-header">
        <div className="account-avatar-large">
          {profile?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="account-header-info">
          <h1 className="account-name">{profile?.name}</h1>
          <p className="account-joined">
            Member since {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="account-stats">
        <div className="account-stat-card">
          <span className="account-stat-icon">📦</span>
          <span className="account-stat-value">{orders.length}</span>
          <span className="account-stat-label">Total Orders</span>
        </div>
        <div className="account-stat-card">
          <span className="account-stat-icon">✓</span>
          <span className="account-stat-value">{placedCount}</span>
          <span className="account-stat-label">Active Orders</span>
        </div>
        <div className="account-stat-card">
          <span className="account-stat-icon">💰</span>
          <span className="account-stat-value">₹{totalSpent.toLocaleString()}</span>
          <span className="account-stat-label">Total Spent</span>
        </div>
      </div>

      {/* Profile Card */}
      <div className="account-section">
        <h2 className="account-section-title">Profile Details</h2>
        <div className="account-profile-card">
          <div className="account-field">
            <span className="account-field-label">Full Name</span>
            <span className="account-field-value">{profile?.name}</span>
          </div>
          <div className="account-field">
            <span className="account-field-label">Email Address</span>
            <span className="account-field-value">{profile?.email}</span>
          </div>
          <div className="account-field">
            <span className="account-field-label">Phone Number</span>
            <span className="account-field-value">{profile?.phone || 'Not provided'}</span>
          </div>
          <div className="account-field">
            <span className="account-field-label">Account Type</span>
            <span className="account-field-value">{profile?.isAdmin ? 'Administrator' : 'Reader'}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="account-section">
        <div className="account-section-header">
          <h2 className="account-section-title">Recent Orders</h2>
          {orders.length > 0 && (
            <button className="account-view-all" onClick={() => navigate('/orders')}>
              View All →
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="account-empty-orders">
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="account-orders-list">
            {orders.slice(0, 5).map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div className="account-order-row" key={order._id}>
                  <div className="account-order-info">
                    <span className="account-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="account-order-items">
                      {order.items.map(i => i.title).join(', ')}
                    </span>
                  </div>
                  <span className={`account-order-status ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                  <span className="account-order-amount">₹{order.totalAmount}</span>
                  <span className="account-order-date">{formatDate(order.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="account-logout-section">
        <button className="account-logout-btn" onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Account;
