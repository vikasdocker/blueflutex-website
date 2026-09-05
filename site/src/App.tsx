import { useRef, useState, useEffect } from "react"
import useThreejs from "./ThreeJSCanvas"
import { motion } from "framer-motion"
import "./App.css"

export default function App() {
  const threeRef = useRef<HTMLDivElement | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    threeRef.current = useThreejs().current
    setShowContent(true)

    return () => {
      threeRef.current = null
    }
  }, [])

  return (
    <div className="app">
      {showContent && (
        <motion.div
          initial="in"
          animate="in"
          exit="out"
          className="flex min-h-screen flex-col overflow-hidden bg-black text-white"
        >
          <div className="flex h-64 items-center justify-center pointer-events-none">
            <div
              ref={threeRef}
              className="absolute inset-0 pointer-events-none"
            />
          </div>

          <main className="flex-1 p-8 relative z-10">
            <nav className="fixed top-0 left-0 right-0 z-20 bg-[rgba(8,12,24,0.8)] backdrop-blur border-b border-white/7 transition-colors">
              <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
                <a href="#home" className="text-2xl font-bold tracking-wider uppercase text-[#00d4ff]">
                  BlueFluteX
                </a>
                <div className="hidden md:block">
                  <div className="flex gap-6">
                    <a href="#services" className="text-white hover:text-[#00d4ff] transition-colors">Services</a>
                    <a href="#technology" className="text-white hover:text-[#00d4ff] transition-colors">Technology</a>
                    <a href="#about" className="text-white hover:text-[#00d4ff] transition-colors">About</a>
                    <a href="#contact" className="text-white hover:text-[#00d4ff] transition-colors">Contact</a>
                  </div>
                  <a href="#contact" className="btn-primary px-4 py-2 rounded-full">
                    Get in Touch
                  </a>
                </div>
                <button className="md:hidden text-white">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>
            </nav>

            <section id="home" className="hero min-h-screen flex flex-col items-center justify-center py-12 px-6 relative">
              <div className="text-center">
                <div className="pill text-white mb-6">
                  Next-gen Software Studio · Pune, India
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-4">
                  <span className="text-white">Code with</span>
                  <span className="text-[#00d4ff]">Harmony</span>
                </h1>
                <p className="text-lg md:text-xl text-[#8899BB] max-w-2xl mx-auto mb-8 leading-relaxed">
                  We craft precision software that resonates — from AI-powered systems to beautiful mobile apps. BlueFluteX turns your boldest ideas into technology that endures.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <a href="#services" className="btn-primary px-6 py-3 rounded-full text-white">
                    Explore Services →
                  </a>
                  <a href="#contact" className="btn-outline px-6 py-3 rounded-full text-[#8899BB]">
                    Contact Us
                  </a>
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-6 -left-6 w-64 h-64 bg-gradient-to-bl rounded-full blur-3xl from-[rgba(0,212,255,0.1)] to-transparent opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-gradient-to-tr rounded-full blur-3xl from-[rgba(37,99,235,0.1)] to-transparent opacity-70 animate-pulse"></div>
              </div>
            </section>

            <section id="services" className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <div className="sec-tag mb-4">What We Build</div>
                  <h2 className="sec-h font-black">Services for <span className="text-[#00d4ff]">modern ambitions</span></h2>
                  <p className="text-base text-[#8899BB] max-w-2xl mx-auto">
                    End-to-end software delivery — every layer, every detail, every interaction.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <rect x="5" y="2" width="18" height="24" rx="3" stroke="#00D4FF" stroke-width="1.5"/>
                        <circle cx="14" cy="22" r="1.5" fill="#00D4FF"/>
                        <rect x="10" y="6" width="8" height="1.5" rx=".75" fill="#00D4FF" opacity=".4"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Android Development</h3>
                    <p>Native & cross-platform Android apps engineered for performance and scale.</p>
                    <div className="tag">Kotlin · Jetpack · Flutter</div>
                  </div>

                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <rect x="8" y="2" width="12" height="20" rx="3" stroke="#00D4FF" stroke-width="1.5"/>
                        <circle cx="14" cy="19" r="1.5" fill="#00D4FF"/>
                        <path d="M11 5h6" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">iOS Development</h3>
                    <p>Refined iOS apps that feel right at home on Apple — silky, precise, composed.</p>
                    <div className="tag">Swift · SwiftUI · Xcode</div>
                  </div>

                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <rect x="3" y="6" width="22" height="14" rx="2" stroke="#00D4FF" stroke-width="1.5"/>
                        <path d="M10 23h8M14 20v3" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Desktop Software</h3>
                    <p>Powerful cross-platform desktop apps trusted by professionals daily.</p>
                    <div className="tag">Electron · Tauri · .NET</div>
                  </div>

                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <path d="M7 22L14 7l7 15" stroke="#00D4FF" stroke-width="1.5" stroke-linejoin="round"/>
                        <path d="M9 18h10" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
                        <circle cx="20" cy="9" r="3" stroke="#00D4FF" stroke-width="1.5"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Game Development</h3>
                    <p>Immersive game experiences across mobile, PC & console platforms.</p>
                    <div className="tag">Unity · Unreal · Godot</div>
                  </div>

                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="10" stroke="#00D4FF" stroke-width="1.5"/>
                        <path d="M9 14l4 4 6-6" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">IT Consulting</h3>
                    <p>Strategic tech guidance aligning your digital roadmap with business goals.</p>
                    <div className="tag">Architecture · Audit · Strategy</div>
                  </div>

                  <div className="card reveal-c group">
                    <div className="card-ico">
                      <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                        <path d="M5 9l9-5 9 5v10l-9 5-9-5V9z" stroke="#00D4FF" stroke-width="1.5" stroke-linejoin="round"/>
                        <path d="M14 4v20M5 9l9 5 9-5" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Custom Software</h3>
                    <p>Bespoke solutions built precisely to your domain — no off-the-shelf compromises.</p>
                    <div className="tag">Full-stack · SaaS · AI</div>
                  </div>
                </div>
              </div>
            </section>

            <section id="technology" className="py-24 px-6 bg-[rgba(8,12,24,0.8)] relative">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <div className="sec-tag mb-4">Our Stack</div>
                  <h2 className="sec-h font-black">Technology that <span className="text-[#00d4ff]">powers everything</span></h2>
                  <p className="text-base text-[#8899BB] max-w-2xl mx-auto">
                    Battle-tested tools wielded by experts who never stop learning.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <span className="tech-pill">Android</span>
                  <span className="tech-pill">iOS / Swift</span>
                  <span className="tech-pill">Python</span>
                  <span className="tech-pill">JavaScript</span>
                  <span className="tech-pill">React</span>
                  <span className="tech-pill">AI / ML</span>
                  <span className="tech-pill">AWS Cloud</span>
                  <span className="tech-pill">Node.js</span>
                  <span className="tech-pill">Flutter</span>
                  <span className="tech-pill">MySQL</span>
                  <span className="tech-pill">Unity</span>
                  <span className="tech-pill">REST / GraphQL</span>
                </div>
              </div>
            </section>

            <section id="about" className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <div className="sec-tag">Our Story</div>
                  <h2 className="sec-h font-black">Software as an <span className="text-[#00d4ff]">art form</span></h2>
                  <p className="text-base text-[#8899BB] max-w-2xl mx-auto">
                    Founded in Pune, India — BlueFluteX was born from a simple belief: great technology should feel like music.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="acard reveal-c">
                    <div className="aico">🎯</div>
                    <h4>Our Mission</h4>
                    <p>Making enterprise-grade quality accessible to teams of every scale.</p>
                  </div>
                  <div className="acard reveal-c">
                    <div className="aico">🌍</div>
                    <h4>Global Reach</h4>
                    <p>Based in Pune — serving clients in 12+ countries worldwide.</p>
                  </div>
                  <div className="acard reveal-c">
                    <div className="aico">🔬</div>
                    <h4>Our Approach</h4>
                    <p>Research-led, detail-obsessed, collaboration-first on every project.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="contact" className="py-24 px-6 bg-[rgba(8,12,24,0.8)] relative">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
                <div className="w-full md:w-1/2">
                  <div className="sec-tag mb-4">Get in Touch</div>
                  <h2 className="sec-h font-black">Let's build <span className="text-[#00d4ff]">something great</span></h2>
                  <p className="text-base text-[#8899BB] mb-8">
                    Tell us about your vision. We respond within 24 hours.
                  </p>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Your Name</label>
                      <input 
                        type="text" 
                        placeholder="Alex Johnson" 
                        required 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="alex@company.com" 
                        required 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00d4ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Message</label>
                      <textarea 
                        rows={5} 
                        placeholder="Tell us about your project..." 
                        required 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-[#00d4ff] font-sm"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full btn-primary py-3 rounded-full text-white font-medium"
                    >
                      Send Message ✦
                    </button>
                  </form>
                </div>

                <div className="w-full md:w-1/2 flex items-center justify-center">
                  <div className="contact-right reveal-c">
                    <div className="cinfo">
                      <div className="ci">
                        <div className="ci-ico">📍</div>
                        <div>
                          <small>Location</small>
                          <strong>Pune, India</strong>
                        </div>
                      </div>
                      <div className="ci">
                        <div className="ci-ico">✉️</div>
                        <div>
                          <small>Email</small>
                          <strong>vikasshu7@gmail.com</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer id="footer" className="bg-[rgba(8,12,24,0.9)] border-t border-white/7">
            <div className="foot-top max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="foot-brand">
                  <img src="/logo_clean.png" alt="BlueFluteX" className="foot-logo mb-4" />
                  <p>Building software that resonates — one line at a time.</p>
                  <div className="socials">
                    <a href="#" aria-label="Twitter" className="social-link">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="LinkedIn" className="social-link">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="GitHub" className="social-link">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </a>
                    <a href="#" aria-label="Instagram" className="social-link">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="foot-links">
                  <div className="fcol">
                    <h5>Services</h5>
                    <a href="#services">Android Apps</a>
                    <a href="#services">iOS Apps</a>
                    <a href="#services">Desktop Software</a>
                    <a href="#services">Game Dev</a>
                    <a href="#services">IT Consulting</a>
                  </div>
                  <div className="fcol">
                    <h5>Company</h5>
                    <a href="#about">About Us</a>
                    <a href="#why">Why Us</a>
                    <a href="#technology">Technology</a>
                    <a href="#contact">Contact</a>
                  </div>
                  <div className="fcol">
                    <h5>Contact</h5>
                    <a href="mailto:vikasshu7@gmail.com">vikasshu7@gmail.com</a>
                    <a href="#">Pune, India</a>
                    <a href="#">LinkedIn</a>
                    <a href="#">GitHub</a>
                  </div>
                </div>
              </div>

              <div className="foot-bot px-6 py-6 flex justify-between items-center">
                <span>© 2025 BlueFluteX. All rights reserved.</span>
                <span className="visitor-counter flex items-center gap-2">
                  <span className="vc-dot"></span>
                  <span className="vc-label">Total Visitors:</span>
                  <span className="vc-num" id="visit-count">—</span>
                </span>
                <span>Crafted with precision in Pune 🇮🇳</span>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  )
}