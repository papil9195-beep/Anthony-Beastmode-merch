import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, Heart, Leaf, Menu, Minus, Plus,
  Search, ShieldCheck, ShoppingBag, Truck, X,
} from 'lucide-react'
import { products, type StoreProduct } from './products'

type CartLine = { product: StoreProduct; size: string; quantity: number }
type Collection = 'All pieces' | 'Hoodies' | 'T-Shirts' | 'Gift Sets'
type OrderDraft = {
  orderNumber: string
  customerName: string
  email: string
  address: string
  city: string
  zip: string
  items: string[]
  total: number
}
const STORE_EMAIL = 'abeastmode803@gmail.com'
const CASH_APP_TAG = '$shea7132022'
const MAX_RECEIPT_SIZE = 4 * 1024 * 1024
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const orderEmailLink = (order: OrderDraft) => {
  const body = [
    `Order request ${order.orderNumber}`,
    '',
    `Name: ${order.customerName}`,
    `Customer email: ${order.email}`,
    `Shipping address: ${order.address}, ${order.city}, ${order.zip}`,
    '',
    'Items:',
    ...order.items.map((item) => `- ${item}`),
    '',
    `Total: ${money(order.total)}`,
    `Cash App recipient: ${CASH_APP_TAG}`,
    `Payment note: ${order.orderNumber}`,
  ].join('\n')
  return `mailto:${STORE_EMAIL}?subject=${encodeURIComponent(`Order request ${order.orderNumber}`)}&body=${encodeURIComponent(body)}`
}

function App() {
  const [collection, setCollection] = useState<Collection>('All pieces')
  const [savedOnly, setSavedOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort, setSort] = useState('featured')
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('beastmode-cart-v2') || '[]') as CartLine[] } catch { return [] }
  })
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('beastmode-saved-v2') || '[]') as number[] } catch { return [] }
  })
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [size, setSize] = useState('M')
  const [toast, setToast] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null)
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [cashAppDetailsOpen, setCashAppDetailsOpen] = useState(false)
  const [receiptSubmitted, setReceiptSubmitted] = useState(false)
  const [receiptSubmitting, setReceiptSubmitting] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)

  useEffect(() => { localStorage.setItem('beastmode-cart-v2', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('beastmode-saved-v2', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCollection = collection === 'All pieces' || product.category === collection
      const matchesSearch = `${product.title} ${product.category} ${product.brand}`.toLowerCase().includes(query.trim().toLowerCase())
      return matchesCollection && matchesSearch && (!savedOnly || favorites.includes(product.id))
    })
    if (sort === 'price-low') return filtered.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') return filtered.sort((a, b) => b.price - a.price)
    if (sort === 'name') return filtered.sort((a, b) => a.title.localeCompare(b.title))
    return filtered
  }, [products, collection, query, sort, savedOnly, favorites])

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 8

  const addToBag = (product: StoreProduct, selectedSize = 'M') => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id && line.size === selectedSize)
      if (existing) return current.map((line) => line.product.id === product.id && line.size === selectedSize ? { ...line, quantity: line.quantity + 1 } : line)
      return [...current, { product, size: selectedSize, quantity: 1 }]
    })
    setToast(`${product.title} added to your bag`)
    setActiveProduct(null)
    setDrawerOpen(true)
  }

  const changeQuantity = (productId: number, itemSize: string, amount: number) => {
    setCart((current) => current.map((line) => line.product.id === productId && line.size === itemSize ? { ...line, quantity: line.quantity + amount } : line).filter((line) => line.quantity > 0))
  }
  const toggleFavorite = (productId: number) => setFavorites((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
  const goToCollection = (next: Collection) => {
    setCollection(next)
    setMobileMenuOpen(false)
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
  }
  const startCheckout = () => { setDrawerOpen(false); setOrderDraft(null); setPaymentReceipt(null); setCashAppDetailsOpen(false); setReceiptSubmitted(false); setReceiptSubmitting(false); setReceiptError(''); setCheckoutOpen(true) }
  const submitCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const orderNumber = `AB-${Date.now().toString().slice(-6)}`
    setPaymentReceipt(null)
    setCashAppDetailsOpen(false)
    setReceiptSubmitted(false)
    setReceiptError('')
    setOrderDraft({
      orderNumber,
      customerName: `${form.get('firstName')} ${form.get('lastName')}`,
      email: String(form.get('email')),
      address: String(form.get('address')),
      city: String(form.get('city')),
      zip: String(form.get('zip')),
      items: cart.map((line) => `${line.quantity} × ${line.product.title} (size ${line.size}) — ${money(line.product.price * line.quantity)}`),
      total: subtotal + shipping,
    })
  }
  const continueWithCashApp = () => {
    setCashAppDetailsOpen((open) => !open)
  }
  const selectPaymentReceipt = (file: File | undefined, input: HTMLInputElement) => {
    setReceiptError('')
    if (!file) { setPaymentReceipt(null); return }
    if (!file.type.startsWith('image/')) {
      input.value = ''
      setPaymentReceipt(null)
      setReceiptError('Choose a receipt image file.')
      return
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      input.value = ''
      setPaymentReceipt(null)
      setReceiptError('The receipt image must be 4 MB or smaller.')
      return
    }
    setPaymentReceipt(file)
  }
  const submitPaymentReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!paymentReceipt || !orderDraft || receiptSubmitting) return
    setReceiptError('')
    setReceiptSubmitting(true)
    try {
      const response = await fetch('/api/receipt', { method: 'POST', body: new FormData(event.currentTarget) })
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null
      if (!response.ok || result?.success !== true) throw new Error(result?.error || 'The receipt could not be sent. Please try again.')
      setReceiptSubmitted(true)
      setPaymentReceipt(null)
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : 'The receipt could not be sent. Please try again.')
    } finally {
      setReceiptSubmitting(false)
    }
  }
  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (newsletterEmail.trim()) setNewsletterDone(true) }

  return (
    <>
      <div className="announcement"><span>Independent merch. Made to stand out.</span><span className="announcement-right">Complimentary shipping on orders over $150 <ArrowRight size={13} /></span></div>
      <header className="site-header">
        <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Menu size={21} /></button>
        <nav className={`nav-left ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <button onClick={() => goToCollection('Hoodies')}>Hoodies</button>
          <button onClick={() => goToCollection('T-Shirts')}>T-Shirts</button>
          <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>Our story</button>
        </nav>
        <a className="wordmark" href="#top" aria-label="Anthony Beastmode Merch home">ANTHONY<small>BEASTMODE MERCH</small></a>
        <div className="nav-right">
          {searchOpen && <label className="header-search"><Search size={16} /><input autoFocus aria-label="Search pieces" placeholder="Find your piece" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)} /></label>}
          <button className="icon-button search-toggle" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
          <button className={`icon-button saved-button ${savedOnly ? 'saved-active' : ''}`} aria-label="View saved pieces" onClick={() => { if (!favorites.length && !savedOnly) { setToast('Tap a heart to save a piece for later'); return }; setCollection('All pieces'); setQuery(''); setSavedOnly(!savedOnly); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }) }}><Heart size={19} fill={savedOnly ? 'currentColor' : 'none'} /><span className="saved-count">{favorites.length || ''}</span></button>
          <button className="bag-button" onClick={() => setDrawerOpen(true)} aria-label={`Open bag, ${cartCount} items`}><span>Bag</span><ShoppingBag size={19} /><span className="bag-count">{cartCount}</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> REBEL FAMILY WEARS</div>
            <h1>Wear your<br /><em>own rules.</em></h1>
            <p>Custom hoodies. Bold graphic tees. Made for the ones who live loud.</p>
            <button className="button button-dark" onClick={() => goToCollection('All pieces')}>Explore the collection <ArrowRight size={16} /></button>
            <span className="hero-note"><span>01 / 07</span> · MADE FOR YOUR CREW</span>
          </div>
          <div className="hero-image-wrap">
            <img className="hero-image" src={products[1].image} alt="Outlaw Bloodline graphic shirts in three colorways" />
            <div className="hero-image-caption"><span>01 — OUTLAW BLOODLINE</span><span>SHOP THE DROP <ArrowUpRight size={14} /></span></div>
            <div className="hero-seal"><span>BUILT FOR<br />YOUR CREW</span><ArrowDown size={14} /></div>
          </div>
          <div className="hero-vertical">BUILT FOR YOUR CREW</div>
        </section>

        <section className="ticker" aria-label="Rebel Family wears"><div>BEASTMODE MERCH <span>✳</span> OUTLAW BLOODLINE <span>✳</span> WILD HEARTS DYNASTY <span>✳</span> BEASTMODE MERCH <span>✳</span> OUTLAW BLOODLINE <span>✳</span> WILD HEARTS DYNASTY <span>✳</span></div></section>

        <section className="collection-section section-wrap" id="collection">
          <div className="section-heading">
            <div><span className="eyebrow"><span className="eyebrow-line" /> THE BEASTMODE COLLECTION</span><h2>Made to<br /><em>stand out.</em></h2></div>
            <div className="heading-aside"><p>Custom hoodies, statement tees, and gift sets made for your people. Pick your piece and rep your crew.</p><a href="#story" className="text-link">Meet the Rebel Family <ArrowRight size={15} /></a></div>
          </div>
          <div className="shop-toolbar">
            <div className="collection-tabs">{(['All pieces', 'Hoodies', 'T-Shirts', 'Gift Sets'] as Collection[]).map((tab) => <button key={tab} className={collection === tab ? 'active' : ''} onClick={() => setCollection(tab)}>{tab}</button>)}</div>
            <div className="toolbar-right"><span className="item-count">{visibleProducts.length} pieces</span><label className="sort-select">Sort by <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label></div>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product, index) => <article className="product-card" key={product.id}>
              <div className="product-image-wrap" onClick={() => { setActiveProduct(product); setSize('M') }} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setActiveProduct(product)} aria-label={`View ${product.title}`}>
                <img src={product.image} alt={product.title} loading={index < 4 ? 'eager' : 'lazy'} />
                <button className={`favorite-button ${favorites.includes(product.id) ? 'is-favorite' : ''}`} aria-label={favorites.includes(product.id) ? 'Remove from saved pieces' : 'Save piece'} onClick={(event) => { event.stopPropagation(); toggleFavorite(product.id) }}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="product-info"><div><h3>{product.title}</h3><span className="product-subtitle">{product.brand} · {product.category}</span></div><strong>{money(product.price)}</strong></div>
              <div className="product-meta"><span>{product.tag || 'Made for your crew'}</span><span>Sizes S–XL</span></div>
              <button className="product-buy-button" onClick={() => addToBag(product)}>Quick add · M <ArrowRight size={14} /></button>
            </article>)}
            {visibleProducts.length === 0 && <div className="empty-results"><span className="eyebrow">{savedOnly ? 'YOUR SAVED EDIT' : 'NO MATCHES JUST YET'}</span><h3>{savedOnly ? 'Your next favorite is out there.' : 'Nothing here by that name.'}</h3><p>{savedOnly ? 'Tap a heart to save a piece for later.' : 'Try another search or explore the full collection.'}</p><button className="text-link" onClick={() => { setQuery(''); setCollection('All pieces'); setSavedOnly(false) }}>{savedOnly ? 'Explore all pieces' : 'Clear filters'} <ArrowRight size={15} /></button></div>}
          </div>
          <div className="center-cta"><button className="button button-outline" onClick={() => setToast('That’s the full drop. Keep repping your crew.')}>That’s the whole drop <ArrowDown size={15} /></button></div>
          <p className="catalog-caption">Every piece shown uses artwork from the Rebel Family collection.</p>
        </section>

        <section className="editorial" id="story">
          <div className="editorial-photo"><img src={products[4].image} alt="The Rebel Family hoodie and matching gift set" loading="lazy" /><span>THE REBEL FAMILY GIFT SET</span></div>
          <div className="editorial-copy"><span className="eyebrow"><span className="eyebrow-line" /> MADE FOR YOUR PEOPLE</span><h2>Your crew.<br /><em>Your colors.</em></h2><p>From custom hoodies to bold graphic tees, Rebel Family gear is made to put your name, your style, and your people front and center.</p><p>Pick a colorway. Add your own mark. Make it yours.</p><a href="#collection" className="text-link">Find your gear <ArrowRight size={15} /></a><span className="editorial-mark">B<span>®</span></span></div>
        </section>

        <section className="promise-strip"><div><span className="promise-icon"><Truck size={21} /></span><span><strong>Free shipping</strong><small>Complimentary over $150</small></span></div><div><span className="promise-icon"><ShieldCheck size={21} /></span><span><strong>Made for you</strong><small>Custom graphics available</small></span></div><div><span className="promise-icon"><Leaf size={21} /></span><span><strong>Rep your crew</strong><small>Built around your style</small></span></div></section>

        <section className="newsletter">
          <span className="eyebrow">THE REBEL FAMILY CLUB</span><h2>Get in the <em>family.</em></h2><p>Get the word on new drops, custom designs, and merch for your crew.</p>
          {newsletterDone ? <div className="newsletter-success"><Check size={17} /> You’re on the demo list. Thanks for stopping by.</div> : <form className="newsletter-form" onSubmit={submitNewsletter}><input type="email" required placeholder="Your email address" aria-label="Your email address" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} /><button aria-label="Join newsletter"><ArrowRight size={19} /></button></form>}
          <small>This newsletter form is a preview and does not submit your email.</small>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-top"><a className="wordmark footer-wordmark" href="#top" aria-label="Anthony Beastmode Merch home">ANTHONY<small>BEASTMODE MERCH</small></a><p>Rebel Family wears.<br />Built for your crew.</p><div className="footer-links"><div><strong>SHOP THE DROP</strong><a href="#collection">Shop all</a><a href="#collection" onClick={() => setCollection('Hoodies')}>Hoodies</a><a href="#collection" onClick={() => setCollection('T-Shirts')}>T-Shirts</a></div><div><strong>A LITTLE HELP</strong><button onClick={() => setToast('Free shipping over $150 · Easy 30-day returns')}>Shipping & returns</button><a href={`mailto:${STORE_EMAIL}`}>{STORE_EMAIL}</a><button onClick={() => setToast('Custom orders available.')}>Custom orders</button></div><div><strong>FOLLOW ALONG</strong><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a><a href="https://www.pinterest.com/" target="_blank" rel="noreferrer">Pinterest <ArrowUpRight size={12} /></a></div></div></div><div className="footer-bottom"><span>© 2026 ANTHONY BEASTMODE MERCH. REBEL FAMILY WEARS.</span><span>BUILT FOR YOUR CREW.</span><div><button onClick={() => setToast('Privacy policy coming soon')}>Privacy</button><button onClick={() => setToast('Terms coming soon')}>Terms</button></div></div></footer>

      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}

      {drawerOpen && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setDrawerOpen(false)}><aside className="cart-drawer" aria-label="Shopping bag"><div className="drawer-header"><div><span className="eyebrow">YOUR GOOD THINGS</span><h2>Your bag <small>({cartCount})</small></h2></div><button className="icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close bag"><X size={20} /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((line) => <div className="cart-line" key={`${line.product.id}-${line.size}`}><img src={line.product.image} alt={line.product.title} /><div className="cart-line-info"><h3>{line.product.title}</h3><span>Size {line.size}</span><strong>{money(line.product.price)}</strong><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => changeQuantity(line.product.id, line.size, -1)}><Minus size={13} /></button><span>{line.quantity}</span><button aria-label="Increase quantity" onClick={() => changeQuantity(line.product.id, line.size, 1)}><Plus size={13} /></button></div></div><button className="remove-item" aria-label={`Remove ${line.product.title}`} onClick={() => changeQuantity(line.product.id, line.size, -line.quantity)}><X size={15} /></button></div>)}</div><div className="drawer-bottom"><div className="shipping-progress"><span>{subtotal >= 150 ? 'You’ve got complimentary shipping!' : `You’re ${money(150 - subtotal)} away from free shipping`}</span><div><i style={{ width: `${Math.min(100, subtotal / 150 * 100)}%` }} /></div></div><div className="subtotal"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="subtotal fine-print"><span>Shipping</span><span>{shipping ? money(shipping) : 'Complimentary'}</span></div><button className="button button-dark checkout-button" onClick={startCheckout}>Continue to checkout <ArrowRight size={16} /></button><p className="secure-note"><ShieldCheck size={13} /> Cash App payment · Email order details</p></div></> : <div className="empty-bag"><div className="empty-bag-icon"><ShoppingBag size={25} /></div><h3>Room for something good.</h3><p>Your bag is taking a little breather. Come find your next favorite.</p><button className="button button-dark" onClick={() => { setDrawerOpen(false); goToCollection('All pieces') }}>Explore the collection <ArrowRight size={15} /></button></div>}</aside></div>}

      {activeProduct && <div className="overlay modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setActiveProduct(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={activeProduct.title}><button className="modal-close icon-button" onClick={() => setActiveProduct(null)} aria-label="Close product details"><X size={20} /></button><div className="modal-photo"><img src={activeProduct.image} alt={activeProduct.title} /></div><div className="modal-details"><span className="eyebrow"><span className="eyebrow-line" /> {activeProduct.brand.toUpperCase()} · REBEL FAMILY</span><h2>{activeProduct.title}</h2><div className="modal-price">{money(activeProduct.price)} <span>· made for your crew</span></div><p>{activeProduct.description}</p><div className="size-heading"><strong>Choose your size</strong><button onClick={() => setToast('Need another size? Ask us about a custom order.')}>Size guide</button></div><div className="size-options">{['XS', 'S', 'M', 'L', 'XL'].map((option) => <button key={option} className={size === option ? 'selected' : ''} onClick={() => setSize(option)}>{option}</button>)}</div><button className="button button-dark modal-add" onClick={() => addToBag(activeProduct, size)}>Add to bag · {money(activeProduct.price)} <ArrowRight size={16} /></button><div className="modal-benefits"><span><Truck size={15} /> Free shipping over $150</span><span><ShieldCheck size={15} /> Easy 30-day returns</span></div><div className="modal-note">REBEL FAMILY MERCH · Bold graphics, made for your crew.</div></div></section></div>}

      {checkoutOpen && (
        <div className="overlay modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setCheckoutOpen(false)}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Checkout">
            <button className="modal-close icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X size={20} /></button>
            {receiptSubmitted ? (
              <div className="order-success">
                <div className="success-mark"><Check size={27} /></div>
                <span className="eyebrow">{orderDraft ? `ORDER ${orderDraft.orderNumber}` : 'CASH APP RECEIPT'}</span>
                <h2>Receipt<br /><em>submitted.</em></h2>
                <p>Your receipt and order details were emailed to {STORE_EMAIL}. We’ll review the payment and follow up by email.</p>
                <button className="button button-dark checkout-button" onClick={() => setCheckoutOpen(false)}>Back to the store <ArrowRight size={16} /></button>
              </div>
            ) : orderDraft ? (
              <div className="order-success">
                <div className="success-mark"><Check size={27} /></div>
                <span className="eyebrow">ORDER {orderDraft.orderNumber}</span>
                <h2>Choose how to<br /><em>continue.</em></h2>
                <p>Order total: <strong>{money(orderDraft.total)}</strong></p>
                <a className="button button-outline checkout-button payment-choice" href={orderEmailLink(orderDraft)}>
                  Continue with email <ArrowRight size={16} />
                </a>
                <button
                  className="button button-dark checkout-button payment-choice"
                  aria-expanded={cashAppDetailsOpen}
                  aria-controls="cash-app-payment-details"
                  onClick={continueWithCashApp}
                >
                  Continue with Cash App <ArrowDown size={16} />
                </button>
                <div className="receipt-step" id="cash-app-payment-details" hidden={!cashAppDetailsOpen}>
                    <p>Send <strong>{money(orderDraft.total)}</strong> to <strong>{CASH_APP_TAG}</strong> in Cash App. Use {orderDraft.orderNumber} as the payment note.</p>
                    <form className="checkout-form receipt-form" method="POST" encType="multipart/form-data" onSubmit={submitPaymentReceipt}>
                      <label className="receipt-honeypot" aria-hidden="true">Leave this field blank<input name="_honeypot" tabIndex={-1} autoComplete="off" /></label>
                      <input type="hidden" name="_subject" value={'Payment receipt for ' + orderDraft.orderNumber} />
                      <input type="hidden" name="_replyto" value={orderDraft.email} />
                      <input type="hidden" name="Order number" value={orderDraft.orderNumber} />
                      <input type="hidden" name="Customer name" value={orderDraft.customerName} />
                      <input type="hidden" name="Customer email" value={orderDraft.email} />
                      <input type="hidden" name="Shipping address" value={orderDraft.address + ', ' + orderDraft.city + ', ' + orderDraft.zip} />
                      <input type="hidden" name="Order items" value={orderDraft.items.join('; ')} />
                      <input type="hidden" name="Order total" value={money(orderDraft.total)} />
                      <input type="hidden" name="Cash App recipient" value={CASH_APP_TAG} />
                      <label>
                        Payment receipt image
                        <input
                          type="file"
                          name="attachment"
                          accept="image/*"
                          required
                          onChange={(event) => selectPaymentReceipt(event.currentTarget.files?.[0], event.currentTarget)}
                        />
                      </label>
                      {paymentReceipt && <p className="receipt-file">Selected receipt: {paymentReceipt.name}</p>}
                      {receiptError && <p className="receipt-error" role="alert">{receiptError}</p>}
                      <p className="receipt-note">Your receipt will be securely sent to {STORE_EMAIL}. Images must be 4 MB or smaller.</p>
                      <button className="button button-dark checkout-button" disabled={!paymentReceipt || receiptSubmitting}>
                        {receiptSubmitting ? 'Sending receipt…' : 'Payment completed'} <ArrowRight size={16} />
                      </button>
                    </form>
                </div>
              </div>
            ) : (
              <>
                <span className="eyebrow">A FEW LAST DETAILS</span>
                <h2>Checkout</h2>
                <p className="checkout-description">Add your contact and shipping details, then choose how to pay.</p>
                <form className="checkout-form" onSubmit={submitCheckout}>
                  <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
                  <div className="form-row">
                    <label>First name<input name="firstName" required placeholder="First name" /></label>
                    <label>Last name<input name="lastName" required placeholder="Last name" /></label>
                  </div>
                  <label>Shipping address<input name="address" required placeholder="Street address" /></label>
                  <div className="form-row">
                    <label>City<input name="city" required placeholder="City" /></label>
                    <label>ZIP code<input name="zip" required placeholder="ZIP code" /></label>
                  </div>
                  <div className="checkout-summary">
                    <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
                    <div><span>Shipping</span><span>{shipping ? money(shipping) : 'Complimentary'}</span></div>
                    <div className="summary-total"><strong>Total</strong><strong>{money(subtotal + shipping)}</strong></div>
                  </div>
                  <button className="button button-dark checkout-button">Continue to payment options <ArrowRight size={16} /></button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default App
