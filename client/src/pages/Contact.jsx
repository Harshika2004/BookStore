import { useState } from 'react';
import axios from '../utils/axiosConfig';
import { useToast } from '../components/Toast';
import './Contact.css';

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/contact', form);
      setSuccess(true);
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page page-wrapper">
      <div className="contact-container">
        {/* Left — Info */}
        <div className="contact-info">
          <span className="contact-label">Get in Touch</span>
          <h1 className="contact-title">
            Let's Start a{' '}
            <span className="contact-title-accent">Conversation</span>
          </h1>
          <p className="contact-description">
            Have a question, suggestion, or simply want to say hello?
            We'd love to hear from you. Drop us a message and we'll
            get back to you shortly.
          </p>

          <div className="contact-details">
            <div className="contact-detail">
              <div className="contact-detail-icon">📧</div>
              <div>
                <span className="contact-detail-label">Email</span>
                <span className="contact-detail-text">brew@thebookcafe.com</span>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-icon">📍</div>
              <div>
                <span className="contact-detail-label">Location</span>
                <span className="contact-detail-text">Punjab, India</span>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-icon">🕐</div>
              <div>
                <span className="contact-detail-label">Hours</span>
                <span className="contact-detail-text">Mon – Sat, 10am – 8pm IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="contact-form-card">
          {success ? (
            <div className="contact-success">
              <div className="contact-success-icon">✓</div>
              <h3 className="contact-success-title">Message Sent!</h3>
              <p className="contact-success-text">
                Thank you for reaching out. We'll respond within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <h2 className="contact-form-title">Send a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form" id="contact-form">
                <div className="float-input-group">
                  <input
                    type="text"
                    name="name"
                    id="contact-name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="contact-name">Your Name</label>
                </div>

                <div className="float-input-group">
                  <input
                    type="email"
                    name="email"
                    id="contact-email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="contact-email">Email Address</label>
                </div>

                <div className="float-input-group">
                  <textarea
                    name="message"
                    id="contact-message"
                    placeholder="Message"
                    value={form.message}
                    onChange={handleChange}
                    rows="4"
                    required
                  />
                  <label htmlFor="contact-message">Your Message</label>
                </div>

                <button type="submit" className="contact-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;
