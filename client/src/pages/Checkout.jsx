import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (storedCart.length === 0) {
      toast.warning('Your cart is empty');
      navigate('/cart');
      return;
    }
    setCart(storedCart);

    // Pre-fill name from user data
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(form.phone)) newErrors.phone = 'Enter a valid phone number';
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!form.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{4,8}$/.test(form.pincode)) newErrors.pincode = 'Enter a valid pincode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map(item => ({
        bookId: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image || '',
      }));

      const orderData = {
        items: orderItems,
        totalAmount: total,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          pincode: form.pincode,
        },
        paymentMethod: form.paymentMethod,
      };

      if (form.paymentMethod === 'online') {
        setPaymentStatusText('Initializing payment...');
        // 1. Create Razorpay order from backend
        const { data: { orderId, amount, currency, keyId } } = await axios.post('/api/payment/create-order', {
          amount: total
        });

        // 2. Open Razorpay Checkout popup
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "The Book Cafe",
          description: "Order Payment",
          order_id: orderId,
          handler: async function (response) {
            try {
              setPaymentStatusText('Verifying payment...');
              // 3. Verify payment signature
              const verifyRes = await axios.post('/api/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data.verified) {
                setPaymentStatusText('Placing order...');
                // 4. Place order with payment details
                orderData.paymentDetails = {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                };

                await axios.post('/api/orders', orderData);

                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Payment successful & Order placed!');
                navigate('/orders');
              }
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Payment verification failed');
              setLoading(false);
              setPaymentStatusText('');
            }
          },
          prefill: {
            name: form.fullName,
            contact: form.phone,
          },
          theme: {
            color: "#C9A96E"
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setPaymentStatusText('');
              toast.info('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(`Payment Failed: ${response.error.description}`);
          setLoading(false);
          setPaymentStatusText('');
        });
        rzp.open();
      } else {
        setPaymentStatusText('Placing order...');
        // COD logic
        await axios.post('/api/orders', orderData);

        // Clear cart
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));

        toast.success('Order placed successfully!');
        navigate('/orders');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to place order');
      setLoading(false);
      setPaymentStatusText('');
    }
  };

  return (
    <div className="checkout-page page-wrapper">
      <button className="checkout-back-btn" onClick={() => navigate('/cart')}>
        ← Back to Cart
      </button>

      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-subtitle">Complete your order details</p>
      </div>

      <div className="checkout-layout">
        {/* Shipping Form */}
        <form className="checkout-form" onSubmit={handleSubmit} id="checkout-form">
          <div className="checkout-section">
            <h2 className="checkout-section-title">
              <span className="checkout-section-num">1</span>
              Shipping Details
            </h2>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`checkout-input ${errors.fullName ? 'error' : ''}`}
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.fullName && <span className="checkout-error">{errors.fullName}</span>}
            </div>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`checkout-input ${errors.phone ? 'error' : ''}`}
                value={form.phone}
                onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value.replace(/\D/g, '') } })}
                placeholder="10-digit phone number"
                maxLength={15}
              />
              {errors.phone && <span className="checkout-error">{errors.phone}</span>}
            </div>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="addressLine1">Address Line 1 *</label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                className={`checkout-input ${errors.addressLine1 ? 'error' : ''}`}
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="House number, street, locality"
              />
              {errors.addressLine1 && <span className="checkout-error">{errors.addressLine1}</span>}
            </div>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="addressLine2">Address Line 2</label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                className="checkout-input"
                value={form.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, landmark (optional)"
              />
            </div>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="pincode">Pincode *</label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                className={`checkout-input ${errors.pincode ? 'error' : ''}`}
                value={form.pincode}
                onChange={(e) => handleChange({ target: { name: 'pincode', value: e.target.value.replace(/\D/g, '') } })}
                placeholder="Area pincode"
                maxLength={8}
              />
              {errors.pincode && <span className="checkout-error">{errors.pincode}</span>}
            </div>
          </div>

          <div className="checkout-section">
            <h2 className="checkout-section-title">
              <span className="checkout-section-num">2</span>
              Payment Method
            </h2>

            <div className="checkout-payment-options">
              <label className={`checkout-payment-option ${form.paymentMethod === 'cod' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={form.paymentMethod === 'cod'}
                  onChange={handleChange}
                />
                <span className="payment-radio" />
                <div className="payment-info">
                  <span className="payment-icon">💵</span>
                  <div>
                    <span className="payment-name">Cash on Delivery</span>
                    <span className="payment-desc">Pay when you receive your books</span>
                  </div>
                </div>
              </label>

              <label className={`checkout-payment-option ${form.paymentMethod === 'online' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={form.paymentMethod === 'online'}
                  onChange={handleChange}
                />
                <span className="payment-radio" />
                <div className="payment-info">
                  <span className="payment-icon">💳</span>
                  <div>
                    <span className="payment-name">Online Payment</span>
                    <span className="payment-desc">Pay securely via UPI, Card, or NetBanking</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="checkout-place-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="checkout-loading">
                <span className="checkout-spinner" />
                {paymentStatusText || 'Processing...'}
              </span>
            ) : (
              `Place Order — ₹${total}`
            )}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <h2 className="checkout-summary-title">Order Summary</h2>

          <div className="checkout-summary-items">
            {cart.map(item => (
              <div className="checkout-summary-item" key={item._id}>
                <div className="checkout-summary-item-info">
                  <span className="checkout-summary-item-title">{item.title}</span>
                  <span className="checkout-summary-item-qty">Qty: {item.quantity || 1}</span>
                </div>
                <span className="checkout-summary-item-price">
                  ₹{item.price * (item.quantity || 1)}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-summary-row">
            <span>Subtotal ({totalItems} items)</span>
            <span>₹{total}</span>
          </div>
          <div className="checkout-summary-row">
            <span>Delivery</span>
            <span className="checkout-free">Free</span>
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-summary-row checkout-summary-total">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
