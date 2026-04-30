import './About.css';

function About() {
  return (
    <div className="about-page page-wrapper">
      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-label">Our Story</span>
          <h1 className="about-title">
            Where Words Meet{' '}
            <span className="about-title-accent">Wonder</span>
          </h1>
          <p className="about-intro">
            The The Book Cafe was born from a simple belief: that the right book at the right time
            can change everything. We curate stories that matter, for readers who care.
          </p>
        </div>
      </section>

      {/* ── Sections ── */}
      <div className="about-sections">
        <section className="about-section" style={{ animationDelay: '0.1s' }}>
          <span className="about-section-number">01 — ORIGIN</span>
          <h2 className="about-section-title">A Love Letter to Reading</h2>
          <p className="about-section-text">
            Founded in 2024, The The Book Cafe began as a quiet rebellion against the noise of modern life.
            In a world drowning in infinite scrolls, we wanted to build a sanctuary for the
            written word — a place where every book feels like a discovery, not just a transaction.
          </p>
          <p className="about-section-text">
            Our name, The The Book Cafe, comes from the Latin word for "leaf" — as in the leaf of a page.
            Each volume in our collection has been chosen not by algorithms, but by people who
            read, discuss, and genuinely love literature.
          </p>
        </section>

        <section className="about-section" style={{ animationDelay: '0.2s' }}>
          <span className="about-section-number">02 — MISSION</span>
          <h2 className="about-section-title">Curating Knowledge, One Page at a Time</h2>
          <p className="about-section-text">
            We don't just sell books — we curate journeys. From the latest in technology
            to timeless works of fiction, from financial wisdom to biographies of extraordinary
            lives, every title in our catalog has earned its place through merit, not marketing.
          </p>
          <p className="about-section-text">
            Our mission is to make quality reading accessible, beautiful, and personal.
            We believe that a well-designed bookstore experience can reignite the joy of
            browsing, the thrill of discovery, and the deep satisfaction of holding
            knowledge in your hands.
          </p>
        </section>

        <section className="about-quote" style={{ animationDelay: '0.3s' }}>
          <p className="about-quote-text">
            A reader lives a thousand lives before he dies. The man who never reads lives only one.
          </p>
          <span className="about-quote-author">— George R.R. Martin</span>
        </section>

        <section className="about-section" style={{ animationDelay: '0.4s' }}>
          <span className="about-section-number">03 — VALUES</span>
          <h2 className="about-section-title">What We Stand For</h2>
          <div className="about-values">
            <div className="about-value-card">
              <div className="about-value-icon">✦</div>
              <h3 className="about-value-title">Curation Over Quantity</h3>
              <p className="about-value-text">
                Every book is handpicked. We choose quality over volume, meaning over mediocrity.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">◈</div>
              <h3 className="about-value-title">Design as Experience</h3>
              <p className="about-value-text">
                Browsing books should feel like wandering through a beautiful library, not a warehouse.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">◇</div>
              <h3 className="about-value-title">Readers First</h3>
              <p className="about-value-text">
                Every feature we build, every decision we make, starts and ends with our readers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
