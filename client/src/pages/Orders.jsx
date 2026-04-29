import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (orderId) => {
    setActionLoading(orderId + '-return');
    try {
      const res = await axios.post(`/api/orders/${orderId}/return`);
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? res.data : o))
      );
      toast.success('Order returned successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturnItem = async (orderId, itemId) => {
    setActionLoading(itemId + '-return');
    try {
      const res = await axios.post(`/api/orders/${orderId}/return-item`, { itemId });
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? res.data : o))
      );
      toast.success('Item returned successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplaceItem = (orderId, itemId) => {
    navigate(`/?replaceOrder=${orderId}&replaceItem=${itemId}`);
    toast.info('Select a book to replace with');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateId = (id) => {
    return `#${id.slice(-8).toUpperCase()}`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'returned':
        return { label: 'Returned', className: 'status-returned', icon: '↩' };
      case 'replaced':
        return { label: 'Replaced', className: 'status-replaced', icon: '🔄' };
      case 'fulfilled':
        return { label: 'Fulfilled', className: 'status-fulfilled', icon: '✓' };
      case 'pending':
        return { label: 'Pending', className: 'status-pending', icon: '⏳' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'status-cancelled', icon: '✕' };
      default:
        return { label: 'Placed', className: 'status-placed', icon: '✓' };
    }
  };

  // Only show completed/fulfilled orders (and returned/replaced for history)
  const displayOrders = orders.filter(o =>
    ['fulfilled', 'placed', 'returned', 'replaced'].includes(o.status || 'placed')
  );

  return (
    <div className="orders-page page-wrapper">
      <div className="orders-header">
        <h1 className="orders-title">My Orders</h1>
        <p className="orders-subtitle">
          {loading
            ? 'Loading your order history...'
            : `${displayOrders.length} order${displayOrders.length !== 1 ? 's' : ''} in history`}
        </p>
      </div>

      {loading ? (
        <div className="orders-loading">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Fetching your orders...
          </span>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="orders-empty" id="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2 className="orders-empty-title">No orders yet</h2>
          <p className="orders-empty-text">
            When you place an order, it will appear here.
          </p>
          <Link to="/" className="orders-empty-btn">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-timeline" id="orders-timeline">
          {displayOrders.map((order, index) => {
            const statusConfig = getStatusConfig(order.status);
            const canManage = order.status === 'fulfilled' || order.status === 'placed';

            return (
              <div
                className="order-card"
                key={order._id}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={`order-dot ${statusConfig.className}`} />

                <div className="order-card-header">
                  <div className="order-header-left">
                    <span className="order-id">{truncateId(order._id)}</span>
                    <span className={`order-status-badge ${statusConfig.className}`}>
                      <span className="order-status-icon">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </span>
                  </div>
                  <span className="order-date">
                    <span className="order-date-icon">🕐</span>
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item, i) => {
                    const isReplacedItem = item.status === 'replaced';
                    const isNewReplacement = order.replacementHistory?.some(h => h.newBook.title === item.title && h.replacedAt >= (order.createdAt || 0));

                    return (
                      <div className={`order-item ${isReplacedItem ? 'item-replaced' : ''}`} key={i}>
                        <div className="order-item-main">
                          <span className="order-item-title">
                            {item.title}
                            {(item.quantity || 1) > 1 && (
                              <span className="order-item-qty"> × {item.quantity}</span>
                            )}
                          </span>
                          <div className="order-item-badges">
                            {isReplacedItem && <span className="item-badge badge-replaced">Replaced</span>}
                            {isNewReplacement && <span className="item-badge badge-new">New</span>}
                            {item.status === 'returned' && <span className="item-badge badge-returned">Returned</span>}
                          </div>
                        </div>
                        <div className="order-item-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span className="order-item-price">₹{item.price * (item.quantity || 1)}</span>
                          {canManage && item.status === 'active' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!isReplacedItem && !isNewReplacement && (
                                <button 
                                  className="order-replace-item-btn"
                                  onClick={() => handleReplaceItem(order._id, item.itemId)}
                                >
                                  🔄 Replace
                                </button>
                              )}
                              <button 
                                className="order-replace-item-btn"
                                style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-color)' }}
                                onClick={() => handleReturnItem(order._id, item.itemId)}
                                disabled={actionLoading === item.itemId + '-return'}
                              >
                                {actionLoading === item.itemId + '-return' ? '...' : '↩ Return'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Replacement History */}
                {order.replacementHistory && order.replacementHistory.length > 0 && (
                  <div className="order-replacement-history">
                    <h4 className="history-title">Replacement History</h4>
                    {order.replacementHistory.map((history, idx) => (
                      <div key={idx} className="history-item">
                        <span className="history-icon">🔄</span>
                        <span className="history-text">
                          Replaced <strong>{history.originalBook.title}</strong> with <strong>{history.newBook.title}</strong> on {formatDate(history.replacedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipping info if available */}
                {order.shippingAddress && order.shippingAddress.fullName && (
                  <div className="order-shipping">
                    <span className="order-shipping-label">Ships to</span>
                    <span className="order-shipping-value">
                      {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}
                      {order.shippingAddress.pincode && ` — ${order.shippingAddress.pincode}`}
                    </span>
                  </div>
                )}

                <div className="order-footer">
                  <div className="order-total">
                    <span className="order-total-label">Total</span>
                    <span className="order-total-value">₹{order.totalAmount}</span>
                  </div>

                  {order.paymentMethod && (
                    <div className="order-payment-info">
                      <span className="order-payment-badge">
                        {order.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'}
                      </span>
                      {order.paymentMethod === 'online' && order.paymentDetails?.paymentStatus === 'completed' && (
                        <span className="order-payment-success">✓ Paid via Razorpay</span>
                      )}
                    </div>
                  )}

                  {canManage && (
                    <div className="order-actions">
                      <button
                        className="order-action-btn order-return-btn"
                        onClick={() => handleReturn(order._id)}
                        disabled={actionLoading === order._id + '-return'}
                      >
                        {actionLoading === order._id + '-return' ? '...' : '↩ Return Order'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;