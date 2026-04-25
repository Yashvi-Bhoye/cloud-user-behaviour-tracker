import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ── DATA ────────────────────────────────────────────────────────
const PRODUCTS = [
  { name: "Red Dress",        category: "women", brand: "Zara",         price: 1499, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&q=85" },
  { name: "Gold Jewellery",   category: "women", brand: "Tanishq",      price: 3999, image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=700&q=85" },
  { name: "Women's Footwear", category: "women", brand: "Steve Madden", price: 2199, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=85" },
  { name: "Handbag",          category: "women", brand: "Lavie",        price: 2799, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=85" },
  { name: "Casual Shirt",     category: "men",   brand: "H&M",          price: 899,  image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&q=85" },
  { name: "Sneakers",         category: "men",   brand: "Nike",         price: 4299, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=85" },
  { name: "Men's Watch",      category: "men",   brand: "Titan",        price: 5499, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85" },
  { name: "Chino Pants",      category: "men",   brand: "Levi's",       price: 1799, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&q=85" },
];

// ── TOAST ────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? "✓" : t.type === "danger" ? "✕" : "♡"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [events,    setEvents]    = useState([]);
  const [username,  setUsername]  = useState("");
  const [isLoggedIn,setIsLoggedIn]= useState(false);
  const [category,  setCategory]  = useState("");
  const [cart,      setCart]      = useState([]);
  const [wishlist,  setWishlist]  = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [dark,      setDark]      = useState(false);
  const [toasts,    setToasts]    = useState([]);
  const [page,      setPage]      = useState("login"); // login | home | products | analytics
  const [searchQ,   setSearchQ]   = useState("");
  const [sortBy,    setSortBy]    = useState("default");
  const [filterTag, setFilterTag] = useState("all");

  // Sync dark mode to html element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    fetch("http://13.232.244.100:5000/get-data")
      .then(r => r.json()).then(setEvents).catch(console.error);
  }, []);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const trackEvent = useCallback((type, item) => {
    const user_id = localStorage.getItem("user_id");
    const newEvent = { user_id, event: type, item, time: new Date().toISOString() };
    setEvents(p => [...p, newEvent]);
    if (type === "add_to_cart") {
      setCart(p => p.includes(item) ? p : [...p, item]);
      toast(`${item} added to cart`, "success");
    }
    if (type === "remove_from_cart") {
      setCart(p => p.filter(i => i !== item));
      toast(`${item} removed`, "danger");
    }
    fetch("http://13.232.244.100:5000/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    }).catch(console.error);
  }, [toast]);

  const toggleWishlist = useCallback((name) => {
    setWishlist(p => {
      const has = p.includes(name);
      toast(has ? `Removed from wishlist` : `Added to wishlist ♡`, "wishlist");
      return has ? p.filter(i => i !== name) : [...p, name];
    });
  }, [toast]);

  const handleLogin = () => {
    if (!username.trim()) { toast("Please enter a username", "danger"); return; }
    localStorage.setItem("user_id", username);
    setIsLoggedIn(true);
    setPage("home");
  };

  const analyzeData = () => {
    const r = {};
    events.forEach(e => {
      if (!r[e.item]) r[e.item] = { click: 0, add: 0, remove: 0 };
      if (e.event === "click")           r[e.item].click++;
      if (e.event === "add_to_cart")     r[e.item].add++;
      if (e.event === "remove_from_cart") r[e.item].remove++;
    });
    return r;
  };

  const getInsight = (data) => {
    if (data.add > data.remove)                        return { label: "High Interest",   cls: "status-success" };
    if (data.remove >= data.add && data.add > 0)       return { label: "Low Confidence",  cls: "status-danger"  };
    if (data.click > 0)                                return { label: "Browsing",         cls: "status-neutral" };
    return                                                    { label: "No Activity",      cls: "status-neutral" };
  };

  const analysis = analyzeData();

  // ── FILTERED + SORTED PRODUCTS ──────────────────────────────
  const visibleProducts = PRODUCTS
    .filter(p => category ? p.category === category : true)
    .filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.brand.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(p => filterTag === "all" ? true : filterTag === "wishlist" ? wishlist.includes(p.name) : filterTag === "incart" ? cart.includes(p.name) : true)
    .sort((a, b) => {
      if (sortBy === "price-asc")  return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      return 0;
    });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <ToastContainer toasts={toasts} />

      {/* ── LOGIN ── */}
      {!isLoggedIn && (
        <div className="login-scene">
          <div className="login-bg-shapes">
            <div className="shape shape-1" /><div className="shape shape-2" /><div className="shape shape-3" />
          </div>
          <div className="login-card">
            <div className="login-wordmark">STYLETRACK</div>
            <p className="login-sub">Your personal fashion intelligence</p>
            <div className="login-field-wrap">
              <input
                className="login-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <button className="login-btn" onClick={handleLogin}>
              <span>Enter</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <div className="login-theme-toggle" onClick={() => setDark(d => !d)}>
              {dark ? "☀ Light mode" : "☾ Dark mode"}
            </div>
          </div>
        </div>
      )}

      {/* ── AUTHENTICATED SHELL ── */}
      {isLoggedIn && (
        <>
          <Navbar
            username={username} cart={cart} wishlist={wishlist}
            dark={dark} setDark={setDark}
            page={page} setPage={setPage} setCategory={setCategory}
          />

          {/* HOME PAGE */}
          {page === "home" && (
            <HomePage setPage={setPage} setCategory={setCategory} username={username} />
          )}

          {/* PRODUCTS PAGE */}
          {page === "products" && (
            <div className="page-container animate-in">
              <div className="products-topbar">
                <div className="products-heading">
                  <h1>{category ? (category === "women" ? "Women" : "Men") : "All"} <em>Collection</em></h1>
                  <p>{visibleProducts.length} pieces</p>
                </div>
                <div className="products-controls">
                  <div className="search-wrap">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input className="search-input" placeholder="Search…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                  </div>
                  <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: Low→High</option>
                    <option value="price-desc">Price: High→Low</option>
                    <option value="name">Name A→Z</option>
                  </select>
                  <div className="filter-chips">
                    {["all","wishlist","incart"].map(f => (
                      <button key={f} className={`chip ${filterTag===f?"chip-active":""}`} onClick={() => setFilterTag(f)}>
                        {f === "all" ? "All" : f === "wishlist" ? "♡ Saved" : "🛒 In Cart"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!category && (
                <div className="cat-pills">
                  {["women","men"].map(c => (
                    <button key={c} className={`cat-pill ${category===c?"active":""}`} onClick={() => setCategory(category === c ? "" : c)}>
                      {c === "women" ? "♀ Women" : "♂ Men"}
                    </button>
                  ))}
                </div>
              )}

              <div className="products-grid">
                {visibleProducts.map((item, idx) => (
                  <ProductCard
                    key={idx} item={item} idx={idx}
                    cart={cart} wishlist={wishlist}
                    trackEvent={trackEvent} toggleWishlist={toggleWishlist}
                  />
                ))}
                {visibleProducts.length === 0 && (
                  <div className="no-results">
                    <div className="no-results-icon">◎</div>
                    <p>No products match your filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS PAGE */}
          {page === "analytics" && (
            <div className="page-container animate-in">
              <div className="analytics-hero">
                <h1>Analytics <em>Dashboard</em></h1>
                <p>Tracking {events.length} interactions across {Object.keys(analysis).length} products</p>
              </div>

              {/* STAT STRIP */}
              <div className="stat-strip">
                {[
                  { label: "Total Events",    val: events.length },
                  { label: "Cart Adds",       val: events.filter(e=>e.event==="add_to_cart").length },
                  { label: "Cart Removes",    val: events.filter(e=>e.event==="remove_from_cart").length },
                  { label: "Quick Views",     val: events.filter(e=>e.event==="click").length },
                ].map((s,i) => (
                  <div className="stat-card" key={i}>
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div className="panel" style={{marginBottom:"2rem"}}>
                <div className="panel-header">
                  <h3>Engagement Overview</h3>
                  <div className="chart-legend">
                    <span><i style={{background:"#7C3AED"}}/>Clicks</span>
                    <span><i style={{background:"#059669"}}/>Added</span>
                    <span><i style={{background:"#E11D48"}}/>Removed</span>
                  </div>
                </div>
                {Object.keys(analysis).length > 0
                  ? <BarChart analysis={analysis} dark={dark} />
                  : <EmptyState msg="Interact with products to see data" />
                }
              </div>

              {/* TABLE + INSIGHTS */}
              <div className="analytics-grid">
                <div className="panel">
                  <div className="panel-header"><h3>Recent Events</h3><span className="pill">{events.length} total</span></div>
                  {events.length === 0 ? <EmptyState msg="No events yet" /> : (
                    <table className="data-table">
                      <thead><tr><th>User</th><th>Event</th><th>Item</th><th>Time</th></tr></thead>
                      <tbody>
                        {[...events].reverse().slice(0,12).map((e,i)=>(
                          <tr key={i}>
                            <td className="td-user">{e.user_id}</td>
                            <td><span className={`etag etag-${e.event}`}>{e.event.replace(/_/g," ")}</span></td>
                            <td>{e.item}</td>
                            <td className="td-time">{new Date(e.time).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header"><h3>Product Insights</h3></div>
                  {Object.keys(analysis).length === 0 ? <EmptyState msg="No data yet" /> : (
                    <div className="insights-list">
                      {Object.keys(analysis).map((item,i)=>{
                        const d = analysis[item];
                        const {label,cls} = getInsight(d);
                        return (
                          <div className="insight-row" key={i}>
                            <div className="insight-left">
                              <div className="insight-name">{item}</div>
                              <div className="insight-bars">
                                <MiniBar label="Clicks" val={d.click} color="#7C3AED" max={Math.max(d.click,d.add,d.remove,1)} />
                                <MiniBar label="Added"  val={d.add}   color="#059669" max={Math.max(d.click,d.add,d.remove,1)} />
                                <MiniBar label="Removed" val={d.remove} color="#E11D48" max={Math.max(d.click,d.add,d.remove,1)} />
                              </div>
                            </div>
                            <span className={`badge ${cls}`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WISHLIST PAGE */}
          {page === "wishlist" && (
            <div className="page-container animate-in">
              <div className="products-topbar">
                <div className="products-heading">
                  <h1>Your <em>Wishlist</em></h1>
                  <p>{wishlist.length} saved items</p>
                </div>
              </div>
              <div className="products-grid">
                {PRODUCTS.filter(p => wishlist.includes(p.name)).map((item,idx)=>(
                  <ProductCard key={idx} item={item} idx={idx} cart={cart} wishlist={wishlist} trackEvent={trackEvent} toggleWishlist={toggleWishlist} />
                ))}
                {wishlist.length === 0 && <div className="no-results"><div className="no-results-icon">♡</div><p>Your wishlist is empty.</p></div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── HOME PAGE ────────────────────────────────────────────────────
function HomePage({ setPage, setCategory, username }) {
  return (
    <div className="home animate-in">
      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">New Season · 2026</div>
          <h1 className="hero-title">Fashion<br/><em>Redefined.</em></h1>
          <p className="hero-desc">Curated styles tracking what moves you — and what sells.</p>
          <div className="hero-btns">
            <button className="hero-cta" onClick={()=>{setPage("products");setCategory("women");}}>Shop Women</button>
            <button className="hero-cta hero-cta-outline" onClick={()=>{setPage("products");setCategory("men");}}>Shop Men</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-img-frame">
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=90" alt="fashion hero" className="hero-img" />
            <div className="hero-img-badge">
              <span>New In</span>
              <strong>Spring '26</strong>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="home-section">
        <div className="section-label">Browse Categories</div>
        <div className="home-banners">
          <div className="home-banner women-banner" onClick={()=>{setPage("products");setCategory("women");}}>
            <div className="home-banner-overlay">
              <h2>Women</h2>
              <span>Explore →</span>
            </div>
          </div>
          <div className="home-banner men-banner" onClick={()=>{setPage("products");setCategory("men");}}>
            <div className="home-banner-overlay">
              <h2>Men</h2>
              <span>Explore →</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED STRIP */}
      <section className="home-section">
        <div className="section-label">Featured Picks</div>
        <div className="featured-strip">
          {[
            { label: "Bestseller", name: "Men's Watch",  brand: "Titan",   price: "₹5,499", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
            { label: "Trending",  name: "Red Dress",    brand: "Zara",    price: "₹1,499", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80" },
            { label: "New In",    name: "Handbag",      brand: "Lavie",   price: "₹2,799", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80" },
          ].map((f,i)=>(
            <div className="featured-card" key={i} onClick={()=>setPage("products")}>
              <img src={f.img} alt={f.name} className="featured-img" />
              <div className="featured-tag">{f.label}</div>
              <div className="featured-info">
                <div className="featured-brand">{f.brand}</div>
                <div className="featured-name">{f.name}</div>
                <div className="featured-price">{f.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-inner">
          <div className="cta-text">
            <h2>Track. Analyse. Understand.</h2>
            <p>Every click tells a story. See what your customers love in real time.</p>
          </div>
          <button className="hero-cta" onClick={()=>setPage("analytics")}>View Analytics →</button>
        </div>
      </section>
    </div>
  );
}

// ── NAVBAR ───────────────────────────────────────────────────────
function Navbar({ username, cart, wishlist, dark, setDark, page, setPage, setCategory }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { id: "home",      label: "Home"      },
    { id: "products",  label: "Shop"      },
    { id: "analytics", label: "Analytics" },
    { id: "wishlist",  label: `Saved (${wishlist.length})` },
  ];
  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-logo" onClick={()=>{setPage("home");setCategory("");}}>STYLETRACK</div>
        <nav className="nav-links">
          {navLinks.map(l=>(
            <button key={l.id} className={`nav-lnk ${page===l.id?"nav-lnk-active":""}`}
              onClick={()=>{setPage(l.id);if(l.id!=="products")setCategory("");}}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="nav-right">
          <button className="icon-btn" title="Toggle theme" onClick={()=>setDark(d=>!d)}>
            {dark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button className="icon-btn cart-icon-btn" onClick={()=>setPage("wishlist")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
          </button>
          <button className="icon-btn cart-icon-btn" onClick={()=>setPage("products")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
          </button>
          <div className="nav-avatar">{username[0]?.toUpperCase()}</div>
        </div>
      </div>
    </header>
  );
}

// ── PRODUCT CARD ─────────────────────────────────────────────────
function ProductCard({ item, idx, cart, wishlist, trackEvent, toggleWishlist }) {
  const inCart = cart.includes(item.name);
  const inWish = wishlist.includes(item.name);
  return (
    <div className="pcard" style={{"--delay": `${idx * 60}ms`}}>
      <div className="pcard-img-wrap">
        <img src={item.image} alt={item.name} className="pcard-img" loading="lazy" />
        <div className="pcard-overlay">
          <button className="pcard-quickview" onClick={()=>trackEvent("click", item.name)}>Quick View</button>
        </div>
        <button className={`wish-btn ${inWish ? "wish-active" : ""}`} onClick={()=>toggleWishlist(item.name)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={inWish?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        {inCart && <div className="in-cart-badge">In Cart</div>}
      </div>
      <div className="pcard-body">
        <div className="pcard-brand">{item.brand}</div>
        <div className="pcard-name">{item.name}</div>
        <div className="pcard-footer">
          <div className="pcard-price">₹{item.price.toLocaleString()}</div>
          <div className="pcard-actions">
            <button className={`pcard-btn pcard-add ${inCart?"pcard-added":""}`} onClick={()=>trackEvent("add_to_cart", item.name)}>
              {inCart ? "✓ Added" : "+ Cart"}
            </button>
            {inCart && (
              <button className="pcard-btn pcard-remove" onClick={()=>trackEvent("remove_from_cart", item.name)}>✕</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MINI PROGRESS BAR ────────────────────────────────────────────
function MiniBar({ label, val, color, max }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="minibar">
      <div className="minibar-label">{label}</div>
      <div className="minibar-track"><div className="minibar-fill" style={{width:`${pct}%`, background:color}} /></div>
      <div className="minibar-val">{val}</div>
    </div>
  );
}

// ── BAR CHART ────────────────────────────────────────────────────
function BarChart({ analysis, dark }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const labels  = Object.keys(analysis);
    const clicks  = labels.map(k => analysis[k].click);
    const adds    = labels.map(k => analysis[k].add);
    const removes = labels.map(k => analysis[k].remove);
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const textColor  = dark ? "#A1A1AA" : "#71717A";
    const gridColor  = dark ? "#27272A" : "#F4F4F5";
    const labelColor = dark ? "#E4E4E7" : "#18181B";

    const PL=52,PR=20,PT=20,PB=76;
    const cW=W-PL-PR, cH=H-PT-PB;
    const maxVal = Math.max(...clicks,...adds,...removes,1);
    const gW = cW/labels.length, pad=gW*0.12, bW=(gW-pad*2)/3;
    const COLORS = ["#7C3AED","#059669","#E11D48"];
    const datasets = [clicks,adds,removes];

    // grid
    for(let i=0;i<=5;i++){
      const y=PT+cH-(i/5)*cH;
      ctx.strokeStyle=gridColor; ctx.lineWidth=1; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.moveTo(PL,y); ctx.lineTo(PL+cW,y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=textColor; ctx.font=`11px sans-serif`; ctx.textAlign="right";
      ctx.fillText(Math.round((i/5)*maxVal), PL-8, y+4);
    }

    // bars with animation-like rounded tops
    datasets.forEach((ds,di)=>{
      ctx.fillStyle=COLORS[di];
      ds.forEach((val,gi)=>{
        const bH=Math.max((val/maxVal)*cH,2);
        const x=PL+gi*gW+pad+di*bW, y=PT+cH-bH;
        ctx.globalAlpha=0.9;
        rRect(ctx,x,y,bW-2,bH,4); ctx.fill();
        ctx.globalAlpha=1;
        if(val>0){
          ctx.fillStyle=COLORS[di]; ctx.font="bold 10px sans-serif"; ctx.textAlign="center";
          ctx.fillText(val, x+(bW-2)/2, y-5);
        }
      });
    });

    // x labels
    labels.forEach((lbl,gi)=>{
      const cx=PL+gi*gW+gW/2;
      ctx.fillStyle=labelColor; ctx.font=`11px sans-serif`; ctx.textAlign="center";
      const words=lbl.split(" "); let line="",ly=PT+cH+16;
      words.forEach(w=>{
        const t=line+w+" ";
        if(ctx.measureText(t).width>gW-4&&line){ctx.fillText(line.trim(),cx,ly);line=w+" ";ly+=13;}
        else line=t;
      });
      ctx.fillText(line.trim(),cx,ly);
    });
  }, [analysis, dark]);

  return <canvas ref={canvasRef} style={{width:"100%",height:"280px",display:"block"}} />;
}

function rRect(ctx,x,y,w,h,r){
  r=Math.min(r,h,w/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function EmptyState({ msg }) {
  return <div className="empty-state"><div className="empty-icon">◎</div><p>{msg}</p></div>;
}