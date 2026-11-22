'use strict';
const supabaseClient = window.supabase.createClient(
  window.BOOKNEST_SUPABASE_URL,
  window.BOOKNEST_SUPABASE_KEY
);

let products = [
 {id:1,title:"A Court of Thorns and Roses",author:"Sarah J. Maas",category:"Fantasy",price:14.99,cover:"A COURT OF\nTHORNS & ROSES",color:"c1",description:"A richly imagined fantasy of danger, bargains, and a world beyond the wall."},
 {id:2,title:"The Love Hypothesis",author:"Ali Hazelwood",category:"Romance",price:12.50,cover:"THE LOVE\nHYPOTHESIS",color:"c2",description:"A playful contemporary romance with unexpected feelings and scientific sparks."},
 {id:3,title:"The Very Secret Society of Irregular Witches",author:"Sangu Mandanna",category:"Fantasy",price:15.25,cover:"THE VERY\nSECRET SOCIETY\nOF IRREGULAR\nWITCHES",color:"c3",description:"A cosy, warm-hearted magical story about found family and belonging."},
 {id:4,title:"The Silent Patient",author:"Alex Michaelides",category:"Mystery",price:13.00,cover:"THE SILENT\nPATIENT",color:"c4",description:"A psychological mystery built around a painter who has stopped speaking."},
 {id:5,title:"Divine Rivals",author:"Rebecca Ross",category:"Fantasy",price:16.00,cover:"DIVINE\nRIVALS",color:"c5",description:"Two young writers find an unexpected connection in a world touched by conflict."},
 {id:6,title:"Book Lovers",author:"Emily Henry",category:"Romance",price:13.75,cover:"BOOK\nLOVERS",color:"c6",description:"A witty romance about two book-world professionals who keep crossing paths."},
 {id:7,title:"The Inheritance Games",author:"Jennifer Lynn Barnes",category:"Mystery",price:12.99,cover:"THE\nINHERITANCE\nGAMES",color:"c7",description:"A clever puzzle-filled mystery involving a fortune, a mansion, and its heirs."},
 {id:8,title:"Once Upon a Broken Heart",author:"Stephanie Garber",category:"Fantasy",price:14.50,cover:"ONCE UPON\nA BROKEN\nHEART",color:"c8",description:"A fairytale-inspired fantasy of bargains, secrets, and dangerous magic."}
];

products = products.map(p => ({ ...p, id: String(p.id) }));

const $ = id => document.getElementById(id);
const money = amount => `$${Number(amount || 0).toFixed(2)}`;
const readStore = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
};

let cart = readStore('booknestCart', []).map(item => ({
  id: String(item.id),
  qty: Number(item.qty)
}));

let wishlist = readStore('booknestWishlist', []).map(String);
function toggleWishlist(id) {
  const bookId = String(id);

  wishlist = wishlist.includes(bookId)
    ? wishlist.filter(x => x !== bookId)
    : [...wishlist, bookId];

  persist('booknestWishlist', wishlist);
  $('wishlistCount').textContent = wishlist.length;
  renderProducts();
  renderWishlist();
}
let orders = readStore('booknestOrders', []);
let activeCategory = 'All';
let couponApplied = false;
let lastFocusedElement = null;

function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { toast('Your browser storage is full. Some changes may not be saved.'); }
}
function getProduct(id) {
  return products.find(p => String(p.id) === String(id));
}
async function loadBooksFromSupabase() {
  const { data, error } = await supabaseClient
    .from('books')
    .select('id, title, author, description, price, image_url, stock, featured, categories(name)')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error('Book loading error:', error);
    toast('Could not load books from the database.');
    return;
  }

  products = data.map((book, index) => ({
    id: String(book.id),
    title: book.title,
    author: book.author,
    description: book.description || '',
    price: Number(book.price),
    category: book.categories?.name || 'Fiction',
    cover: book.title.toUpperCase(),
    color: `c${(index % 8) + 1}`,
    image_url: book.image_url,
    stock: book.stock
  }));

  cart = cart.filter(item => products.some(p => p.id === item.id));
  wishlist = wishlist.filter(id => products.some(p => p.id === id));

  persist('booknestCart', cart);
  persist('booknestWishlist', wishlist);

  renderProducts();
  renderCart();
  renderWishlist();
}
function subtotal() { return cart.reduce((sum, item) => sum + (getProduct(item.id)?.price || 0) * item.qty, 0); }
function discount() { return couponApplied ? subtotal() * 0.10 : 0; }
function grandTotal() { return Math.max(0, subtotal() - discount()); }
function cartCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }

function renderProducts() {
  const query = $('searchInput').value.trim().toLowerCase();
  const sort = $('sortSelect').value;
  let shown = products.filter(p => (activeCategory === 'All' || p.category === activeCategory) &&
    [p.title,p.author,p.category].some(value => value.toLowerCase().includes(query)));
  if (sort === 'title-asc') shown.sort((a,b) => a.title.localeCompare(b.title));
  if (sort === 'price-asc') shown.sort((a,b) => a.price-b.price);
  if (sort === 'price-desc') shown.sort((a,b) => b.price-a.price);
  $('productGrid').innerHTML = shown.length ? shown.map(p => `
    <article class="product-card">
      <div class="cover-wrap"><span class="category-tag">${p.category}</span><button class="wishlist-toggle ${wishlist.includes(p.id)?'saved':''}" data-wish="${p.id}" aria-label="${wishlist.includes(p.id)?'Remove':'Save'} ${p.title} ${wishlist.includes(p.id)?'from':'to'} wishlist" aria-pressed="${wishlist.includes(p.id)}">${wishlist.includes(p.id)?'♥':'♡'}</button>
        <button class="detail-trigger" data-detail="${p.id}" aria-label="View details for ${p.title}"><div class="cover ${p.color}">${p.cover}<small>BOOKNEST EDITION</small></div></button></div>
      <button class="product-info detail-trigger" data-detail="${p.id}"><h3 class="product-title">${p.title}</h3><p class="author">by ${p.author}</p></button>
      <div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${p.id}">＋ Add to bag</button></div>
    </article>`).join('') : '<div class="empty-state">No books found. Try another title or category.</div>';
}

function showProduct(id) {
  const p = getProduct(id); if (!p) return;
  lastFocusedElement = document.activeElement;
  $('productDetailContent').innerHTML = `
    <div class="detail-layout"><div class="detail-cover-area"><div class="cover detail-cover ${p.color}">${p.cover}<small>BOOKNEST EDITION</small></div></div>
      <div class="detail-copy"><p class="eyebrow">${p.category.toUpperCase()} · BOOKNEST SHELF</p><h2 id="detailTitle">${p.title}</h2><p class="detail-author">by ${p.author}</p><p class="detail-description">${p.description}</p><p class="detail-price">${money(p.price)}</p>
      <div class="detail-actions"><button class="primary-button" id="detailAdd" type="button">Add to bag <span>＋</span></button><button class="secondary-button" id="detailWish" type="button">${wishlist.includes(p.id)?'♥ Saved':'♡ Save for later'}</button></div></div></div>`;
  $('productModal').classList.add('show'); $('productModal').setAttribute('aria-hidden','false'); $('detailAdd').focus();
  $('detailAdd').addEventListener('click', () => { addToCart(p.id); closeProduct(); });
  $('detailWish').addEventListener('click', () => { toggleWishlist(p.id); $('detailWish').textContent = wishlist.includes(p.id) ? '♥ Saved' : '♡ Save for later'; });
}
function closeProduct() { $('productModal').classList.remove('show'); $('productModal').setAttribute('aria-hidden','true'); if (lastFocusedElement?.focus) lastFocusedElement.focus(); }

function saveCart() { persist('booknestCart', cart); renderCart(); }
function addToCart(id) {
  const bookId = String(id);
  if (!getProduct(bookId)) return;

  const item = cart.find(x => x.id === bookId);
  if (item) {
    item.qty++;
  } else {
    cart.push({ id: bookId, qty: 1 });
  }

  saveCart();
  toast('Added to your bag ✦');
}

function changeQty(id, delta) {
  const bookId = String(id);
  const item = cart.find(x => x.id === bookId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== bookId);
  }

  saveCart();
}

function removeFromCart(id) {
  const bookId = String(id);
  cart = cart.filter(x => x.id !== bookId);
  if (!cart.length) resetCoupon();
  saveCart();
}
function renderCart() {
  const count = cartCount(); $('cartCount').textContent = count; $('drawerCount').textContent = `(${count})`;
  $('subtotal').textContent = money(subtotal()); $('checkoutTotal').textContent = money(grandTotal());
  $('discountRow').hidden = !couponApplied; $('discountAmount').textContent = `−${money(discount())}`;
  $('cartItems').innerHTML = cart.length ? cart.map(item => {
    const p = getProduct(item.id); if (!p) return '';
    return `<div class="cart-line"><div class="mini-cover ${p.color}">${p.cover.split('\n')[0]}</div><div><h3>${p.title}</h3><p>${money(p.price)} each</p><div class="quantity"><button data-qty="${p.id}" data-delta="-1" aria-label="Decrease ${p.title} quantity">−</button><span>${item.qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="Increase ${p.title} quantity">＋</button></div><button class="remove" data-remove="${p.id}">Remove</button></div><span class="line-price">${money(p.price*item.qty)}</span></div>`;
  }).join('') : '<div class="empty-state">Your bag is waiting for a story.</div>';
  $('checkoutButton').disabled = !cart.length;
}
function resetCoupon() { couponApplied = false; $('couponInput').value = ''; $('couponMessage').textContent = ''; }
function applyCoupon() {
  if (!cart.length) { $('couponMessage').textContent = 'Add a book before applying a code.'; return; }
  if ($('couponInput').value.trim().toUpperCase() === 'READ10') { couponApplied = true; $('couponMessage').textContent = 'READ10 applied — you saved 10%!'; }
  else { couponApplied = false; $('couponMessage').textContent = 'That code is not valid. Try READ10 for the demo discount.'; }
  renderCart();
}


function renderWishlist() {
  $('wishlistItems').innerHTML = wishlist.length ? wishlist.map(id => {
    const p = getProduct(id); if (!p) return '';
    return `<div class="cart-line"><div class="mini-cover ${p.color}">${p.cover.split('\n')[0]}</div><div><h3>${p.title}</h3><p>${money(p.price)}</p><button class="remove" data-wish-remove="${p.id}">Remove</button></div><button class="add-button" data-wish-add="${p.id}">Add</button></div>`;
  }).join('') : '<div class="empty-state">Your saved shelf is empty. Tap ♡ on a book to keep it here.</div>';
  $('wishlistCount').textContent = wishlist.length;
}
function openCart() { $('wishlistDrawer').classList.remove('open'); $('cartDrawer').classList.add('open'); $('overlay').classList.add('show'); $('cartDrawer').setAttribute('aria-hidden','false'); $('openCart').focus(); }
function closeCart() { $('cartDrawer').classList.remove('open'); $('overlay').classList.remove('show'); $('cartDrawer').setAttribute('aria-hidden','true'); }
function openWishlist() { $('cartDrawer').classList.remove('open'); $('wishlistDrawer').classList.add('open'); $('overlay').classList.add('show'); $('wishlistDrawer').setAttribute('aria-hidden','false'); }
function closeWishlist() { $('wishlistDrawer').classList.remove('open'); $('overlay').classList.remove('show'); $('wishlistDrawer').setAttribute('aria-hidden','true'); }
function openOrders() { renderOrders(); $('ordersModal').classList.add('show'); $('ordersModal').setAttribute('aria-hidden','false'); }
function closeOrders() { $('ordersModal').classList.remove('show'); $('ordersModal').setAttribute('aria-hidden','true'); }
function renderOrders() {
  $('ordersList').innerHTML = orders.length ? [...orders].reverse().map(order => `<article class="order-card"><div class="order-card-head"><strong>${order.id}</strong><span>${new Date(order.date).toLocaleString()}</span></div><p>${order.items.map(item => `${item.title} × ${item.qty}`).join(' · ')}</p><strong>Total: ${money(order.total)}</strong><small>Demo order — not sent to a seller or payment provider.</small></article>`).join('') : '<div class="empty-state">No orders yet. Your future book hauls will appear here.</div>';
}
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => $('toast').classList.remove('show'),2200); }
async function placeDemoOrder(event) {
  event.preventDefault();

  if (!cart.length) return;

  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    toast('Please sign in or create an account first.');
    return;
  }

  const form = new FormData(event.currentTarget);

  const customerName = String(form.get('name')).trim();
  const phone = String(form.get('phone')).trim();
  const deliveryAddress = String(form.get('address')).trim();
  const city = String(form.get('city')).trim();

  if (!customerName || !phone || !deliveryAddress || !city) {
    toast('Please complete all delivery details.');
    return;
  }

  const items = cart.map(item => ({
    book_id: item.id,
    quantity: item.qty
  }));

  const { data, error } = await supabaseClient.rpc('place_order', {
    p_customer_name: customerName,
    p_phone: phone,
    p_delivery_address: deliveryAddress,
    p_city: city,
    p_items: items
  });

  if (error) {
    console.error('Order error:', error);
    toast(error.message);
    return;
  }

  const orderId = typeof data === 'string'
    ? data
    : data?.id || 'Confirmed';

  $('successMessage').textContent =
    `Thank you, ${customerName}. Your order has been recorded successfully.`;

  $('receiptDetails').innerHTML =
    `<strong>Order reference: ${orderId}</strong>
     <p>Your order has been saved to the BookNest database.</p>
     <small>Payment is not collected online.</small>`;

  cart = [];
  couponApplied = false;
  persist('booknestCart', cart);
  renderCart();

  event.currentTarget.reset();
  $('checkoutModal').classList.remove('show');
  $('successModal').classList.add('show');
  $('successModal').setAttribute('aria-hidden', 'false');

  await loadBooksFromSupabase();
}
function addCheckoutFields() {
  const form = $('checkoutForm');

  if (form.querySelector('[name="phone"]')) return;

  const address = form.querySelector('[name="address"]');

  address.insertAdjacentHTML('afterend', `
    <label>Phone number
      <input name="phone" type="tel" required placeholder="Your phone number">
    </label>
    <label>City
      <input name="city" required placeholder="Your city">
    </label>
    <label>Account password
      <input name="password" type="password" minlength="6"
        required placeholder="At least 6 characters">
    </label>
    <div>
      <button type="button" id="signInButton">Sign in</button>
      <button type="button" id="signUpButton">Create account</button>
      <p id="authMessage"></p>
    </div>
  `);

  $('signInButton').addEventListener('click', () => authenticateCustomer(false));
  $('signUpButton').addEventListener('click', () => authenticateCustomer(true));
}
async function authenticateCustomer(createAccount) {
  const email = $('checkoutForm').querySelector('[name="email"]').value.trim();
  const password = $('checkoutForm').querySelector('[name="password"]').value;

  if (!email || !password) {
    $('authMessage').textContent = 'Enter your email and password first.';
    return;
  }

  const result = createAccount
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });

  if (result.error) {
    $('authMessage').textContent = result.error.message;
    return;
  }

  $('authMessage').textContent = result.data.session
    ? 'Account connected successfully. You can place your order.'
    : 'Check your email to confirm your account before signing in.';
}
$('filters').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; activeCategory = button.dataset.category; document.querySelectorAll('.filter').forEach(el => el.classList.toggle('active',el === button)); renderProducts(); });
$('searchInput').addEventListener('input',renderProducts); $('sortSelect').addEventListener('change',renderProducts);
$('productGrid').addEventListener('click',event => { const add = event.target.closest('[data-add]'); const detail = event.target.closest('[data-detail]'); const wish = event.target.closest('[data-wish]'); if (add) addToCart(add.dataset.add); else if (detail) showProduct(detail.dataset.detail); else if (wish) toggleWishlist(wish.dataset.wish); });
$('cartItems').addEventListener('click',event => { const qty = event.target.closest('[data-qty]'); const remove = event.target.closest('[data-remove]'); if (qty) changeQty(qty.dataset.qty,Number(qty.dataset.delta)); if (remove) removeFromCart(remove.dataset.remove); });
$('wishlistItems').addEventListener('click',event => { const remove = event.target.closest('[data-wish-remove]'); const add = event.target.closest('[data-wish-add]'); if (remove) toggleWishlist(remove.dataset.wishRemove); if (add) { addToCart(add.dataset.wishAdd); } });
$('openCart').addEventListener('click',openCart); $('closeCart').addEventListener('click',closeCart); $('overlay').addEventListener('click',() => { closeCart(); closeWishlist(); });
$('openWishlist').addEventListener('click',openWishlist); $('closeWishlist').addEventListener('click',closeWishlist);
$('openOrders').addEventListener('click',openOrders); $('closeOrders').addEventListener('click',closeOrders);
$('checkoutButton').addEventListener('click',() => { if (!cart.length) return; closeCart(); $('checkoutModal').classList.add('show'); $('checkoutModal').setAttribute('aria-hidden','false'); $('checkoutModal').querySelector('input').focus(); });
// Ensure the checkout modal always has a working close button
const checkoutModal = document.getElementById('checkoutModal');

if (checkoutModal) {
  let closeButton = document.getElementById('closeCheckout');

  if (!closeButton) {
    closeButton = document.createElement('button');
    closeButton.id = 'closeCheckout';
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close checkout');
    checkoutModal.prepend(closeButton);
  }

  closeButton.addEventListener('click', () => {
    checkoutModal.classList.remove('show');
    checkoutModal.setAttribute('aria-hidden', 'true');
  });
}
addCheckoutFields();
$('checkoutForm').addEventListener('submit', placeDemoOrder); $('continueShopping').addEventListener('click',() => { $('successModal').classList.remove('show'); $('successModal').setAttribute('aria-hidden','true'); });
$('closeProduct').addEventListener('click',closeProduct); $('applyCoupon').addEventListener('click',applyCoupon);
$('newsletterForm').addEventListener('submit',event => { event.preventDefault(); const email = $('newsletterEmail').value.trim(); const subscribers = readStore('booknestNewsletter',[]); if (!subscribers.includes(email)) { subscribers.push(email); persist('booknestNewsletter',subscribers); } toast('Thanks for joining our demo reader list!'); event.currentTarget.reset(); });
document.addEventListener('keydown',event => { if (event.key === 'Escape') { closeCart(); closeWishlist(); closeOrders(); closeProduct(); $('checkoutModal').classList.remove('show'); $('successModal').classList.remove('show'); } });

renderProducts();
renderCart();
renderWishlist();
loadBooksFromSupabase();
