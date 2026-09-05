import HamsterCursor from "./HamsterCursor"
import { motion } from "framer-motion"
import "./App.css"

const services = [
  { icon: "📱", title: "Android Development", desc: "Native & cross-platform Android apps engineered for performance and scale.", tags: "Kotlin · Jetpack · Flutter" },
  { icon: "🍎", title: "iOS Development", desc: "Refined iOS apps that feel right at home on Apple — silky, precise, composed.", tags: "Swift · SwiftUI · Xcode" },
  { icon: "🖥️", title: "Desktop Software", desc: "Powerful cross-platform desktop apps trusted by professionals daily.", tags: "Electron · Tauri · .NET" },
  { icon: "🎮", title: "Game Development", desc: "Immersive game experiences across mobile, PC & console platforms.", tags: "Unity · Unreal · Godot" },
  { icon: "💡", title: "IT Consulting", desc: "Strategic tech guidance aligning your digital roadmap with business goals.", tags: "Architecture · Audit · Strategy" },
  { icon: "⚙️", title: "Custom Software", desc: "Bespoke solutions built precisely to your domain — no off-the-shelf compromises.", tags: "Full-stack · SaaS · AI" },
]

const techs = [
  { name: "Android", color: "#3DDC84" },
  { name: "iOS / Swift", color: "#aaa" },
  { name: "Python", color: "#3776AB" },
  { name: "JavaScript", color: "#F7DF1E" },
  { name: "React", color: "#61DAFB" },
  { name: "AI / ML", color: "#00D4FF" },
  { name: "AWS Cloud", color: "#FF9900" },
  { name: "Node.js", color: "#54B435" },
  { name: "Flutter", color: "#02569B" },
  { name: "MySQL", color: "#4479A1" },
  { name: "Unity", color: "#764ABC" },
  { name: "REST / GraphQL", color: "#2563EB" },
]

const features = [
  { num: "01", title: "Scalable Architecture", desc: "From 10 users to 10 million — without a rewrite." },
  { num: "02", title: "Clean & Secure Code", desc: "Security-first with rigorous reviews and zero shortcuts." },
  { num: "03", title: "Modern UI/UX Design", desc: "Interfaces that feel inevitable — accessible at every pixel." },
  { num: "04", title: "High Performance", desc: "Sub-second loads, efficient queries, lean optimized builds." },
  { num: "05", title: "Professional Support", desc: "Dedicated post-launch support with proactive monitoring." },
]

export default function App() {
  return (
    <div className="app">
      <HamsterCursor />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen bg-[#060812] text-white overflow-x-hidden"
      >
        {/* ── NAVBAR ── */}
        <nav className="navbar fixed top-0 left-0 right-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
            <a href="#home" className="flex items-center gap-2.5">
              <img src="/logo_nav_icon.png" alt="" className="w-9 h-9 rounded-full nav-icon" />
              <span className="font-bold text-lg tracking-wide nav-brand">BlueFluteX</span>
            </a>
            <div className="hidden md:flex items-center gap-1">
              <a href="#home" className="nav-link">Home</a>
              <a href="#services" className="nav-link">Services</a>
              <a href="#technology" className="nav-link">Technology</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
              <a href="#contact" className="nav-cta">Get in Touch</a>
            </div>
            <button className="md:hidden text-white/70 hover:text-white transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="home" className="hero-section relative min-h-screen flex items-center">
          <div className="hero-bg-orb orb-1"></div>
          <div className="hero-bg-orb orb-2"></div>
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full pt-24">
            <div>
              <div className="hero-pill">✦ Next-gen Software Studio · Pune, India</div>
              <h1 className="hero-title">
                Code with <span className="hero-gradient">Harmony</span>
              </h1>
              <p className="hero-desc">
                We craft precision software that resonates — from AI-powered systems to beautiful mobile apps. BlueFluteX turns your boldest ideas into technology that endures.
              </p>
              <div className="hero-buttons">
                <a href="#services" className="btn-glow">Explore Services →</a>
                <a href="#contact" className="btn-ghost">Contact Us</a>
              </div>
              <div className="hero-stats">
                <div className="stat-item"><span className="stat-num">50+</span><span className="stat-label">Projects</span></div>
                <div className="stat-sep"></div>
                <div className="stat-item"><span className="stat-num">12+</span><span className="stat-label">Countries</span></div>
                <div className="stat-sep"></div>
                <div className="stat-item"><span className="stat-num">99%</span><span className="stat-label">Satisfaction</span></div>
              </div>
            </div>
            <div className="hero-visual relative flex items-center justify-center min-h-[400px]">
              <div className="glow-ring ring-1"></div>
              <div className="glow-ring ring-2"></div>
              <div className="glow-ring ring-3"></div>
              <img src="/logo_clean.png" alt="BlueFluteX" className="hero-logo-img relative z-10" />
              <div className="hero-chip chip-pos-1"><span>⚡</span> High Performance</div>
              <div className="hero-chip chip-pos-2"><span>🛡</span> Secure by Design</div>
              <div className="hero-chip chip-pos-3"><span>🎯</span> Pixel Perfect</div>
            </div>
          </div>
          <div className="hero-bottom-fade"></div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="section-sec py-24 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className="section-tag">What We Build</div>
              <h2 className="section-title">Services for <span className="text-gradient">modern ambitions</span></h2>
              <p className="section-desc">End-to-end software delivery — every layer, every detail, every interaction.</p>
            </div>
            <div className="services-grid">
              {services.map((s, i) => (
                <div key={i} className="service-card" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="service-icon">{s.icon}</div>
                  <h3 className="service-title">{s.title}</h3>
                  <p className="service-desc">{s.desc}</p>
                  <div className="service-tag">{s.tags}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECHNOLOGY ── */}
        <section id="technology" className="py-24 px-6 relative section-alt">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className="section-tag">Our Stack</div>
              <h2 className="section-title">Technology that <span className="text-gradient">powers everything</span></h2>
              <p className="section-desc">Battle-tested tools wielded by experts who never stop learning.</p>
            </div>
            <div className="tech-wrap">
              {techs.map((t, i) => (
                <div key={i} className="tech-item">
                  <span className="tech-dot" style={{ background: t.color }}></span>
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY US ── */}
        <section id="why" className="py-24 px-6 relative border-t border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
              <div className="section-tag">Why BlueFluteX</div>
              <h2 className="section-title">Built different.<br/><span className="text-gradient">Built to last.</span></h2>
              <p className="section-desc mb-6">We don't ship mediocre software. Every project is a statement of craft — deliberate, precise, and made to endure.</p>
              <a href="#contact" className="btn-glow inline-flex">Start a Project →</a>
            </div>
            <div className="lg:col-span-3 flex flex-col gap-3">
              {features.map((f, i) => (
                <div key={i} className="feature-row">
                  <span className="feature-num">{f.num}</span>
                  <div>
                    <h4 className="feature-title">{f.title}</h4>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 px-6 relative section-alt">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className="section-tag">Our Story</div>
              <h2 className="section-title">Software as an <span className="text-gradient">art form</span></h2>
              <p className="section-desc max-w-xl mx-auto">
                Founded in Pune, India — BlueFluteX was born from a simple belief: great technology should feel like music.
              </p>
            </div>
            <div className="about-grid">
              <div className="about-card"><div className="about-emoji">🎯</div><h4>Our Mission</h4><p>Making enterprise-grade quality accessible to teams of every scale.</p></div>
              <div className="about-card"><div className="about-emoji">🌍</div><h4>Global Reach</h4><p>Based in Pune — serving clients in 12+ countries worldwide.</p></div>
              <div className="about-card"><div className="about-emoji">🔬</div><h4>Our Approach</h4><p>Research-led, detail-obsessed, collaboration-first on every project.</p></div>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="py-24 px-6 relative border-t border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="section-tag">Get in Touch</div>
              <h2 className="section-title">Let's build <span className="text-gradient">something great</span></h2>
              <p className="section-desc mb-8">Tell us about your vision. We respond within 24 hours.</p>
              <div className="contact-info">
                <div className="contact-item"><span className="ci-icon">📍</span><div><small>Location</small><strong>Pune, India</strong></div></div>
                <div className="contact-item"><span className="ci-icon">✉️</span><div><small>Email</small><strong>vikasshu7@gmail.com</strong></div></div>
              </div>
            </div>
            <div className="contact-form-wrap">
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input type="text" placeholder="Alex Johnson" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="alex@company.com" required />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea rows={5} placeholder="Tell us about your project..." required></textarea>
                </div>
                <button type="submit" className="btn-glow w-full justify-center text-base">Send Message ✦</button>
              </form>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 bg-[#050710]">
          <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <img src="/logo_clean.png" alt="BlueFluteX" className="footer-logo mb-4" />
              <p className="footer-tagline">Building software that resonates — one line at a time.</p>
              <div className="social-links">
                <a href="#" className="social-btn" aria-label="Twitter"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></a>
                <a href="#" className="social-btn" aria-label="LinkedIn"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/></svg></a>
                <a href="#" className="social-btn" aria-label="GitHub"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></a>
                <a href="#" className="social-btn" aria-label="Instagram"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
              </div>
            </div>
            <div>
              <h5 className="footer-heading">Services</h5>
              <a href="#services" className="footer-link">Android Apps</a>
              <a href="#services" className="footer-link">iOS Apps</a>
              <a href="#services" className="footer-link">Desktop Software</a>
              <a href="#services" className="footer-link">Game Dev</a>
              <a href="#services" className="footer-link">IT Consulting</a>
            </div>
            <div>
              <h5 className="footer-heading">Company</h5>
              <a href="#about" className="footer-link">About Us</a>
              <a href="#why" className="footer-link">Why Us</a>
              <a href="#technology" className="footer-link">Technology</a>
              <a href="#contact" className="footer-link">Contact</a>
            </div>
            <div>
              <h5 className="footer-heading">Contact</h5>
              <a href="mailto:vikasshu7@gmail.com" className="footer-link">vikasshu7@gmail.com</a>
              <a href="#" className="footer-link">Pune, India</a>
              <a href="#" className="footer-link">LinkedIn</a>
              <a href="#" className="footer-link">GitHub</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 BlueFluteX. All rights reserved.</span>
            <span>Crafted with precision in Pune 🇮🇳</span>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}
