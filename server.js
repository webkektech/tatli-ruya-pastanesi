const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data paths
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BLOG_FILE = path.join(DATA_DIR, 'blog.json');
const DESIGNER_FILE = path.join(DATA_DIR, 'designer.json');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Ensure data files exist with defaults
function ensureFile(file, defaults) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
}
ensureFile(PRODUCTS_FILE, []);
ensureFile(REVIEWS_FILE, []);
ensureFile(SETTINGS_FILE, {
  whatsapp: '905XXXXXXXXX',
  instagram: 'tatli.ruya.pastanesi',
  address: 'Örnek Mah. Lezzet Sok. No:1, İstanbul',
  googleMaps: 'https://maps.google.com/?q=İstanbul',
  workingHours: { open: '08:00', close: '20:00' },
  specialDayBanner: { active: false, title: '', message: '' },
  heroTitle: 'Tatlı Rüya Pastanesi',
  heroSubtitle: 'El yapımı, taptaze lezzetler',
  aboutText: '2010 yılından beri el emeğiyle hazırladığımız pasta, börek ve tatlı çeşitlerimizle sizleri ağırlıyoruz. Her ürünümüz günlük taze malzemelerle, hijyenik koşullarda üretilir.',
  heroBgImage: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1920'
});
ensureFile(BLOG_FILE, []);
ensureFile(DESIGNER_FILE, {
  steps: [
    {
      id: 1,
      title: 'Kek Seçimi',
      icon: '🍞',
      options: [
        { id: 1, label: 'Çikolatalı', icon: '🍫', price: 200 },
        { id: 2, label: 'Vanilyalı', icon: '🍦', price: 180 },
        { id: 3, label: 'Havuçlu', icon: '🥕', price: 220 },
        { id: 4, label: 'Kırmızı Kadife', icon: '❤️', price: 250 },
        { id: 5, label: 'Muzlu', icon: '🍌', price: 210 },
        { id: 6, label: 'Limonlu', icon: '🍋', price: 190 }
      ]
    },
    {
      id: 2,
      title: 'Krema Seçimi',
      icon: '🧁',
      options: [
        { id: 1, label: 'Çikolatalı Krem', icon: '🍫', price: 80 },
        { id: 2, label: 'Krem Şanti', icon: '☁️', price: 50 },
        { id: 3, label: 'Meyveli Krem', icon: '🍓', price: 90 },
        { id: 4, label: 'Karamelli Krem', icon: '🍯', price: 85 },
        { id: 5, label: 'Fıstık Kreması', icon: '🥜', price: 100 }
      ]
    },
    {
      id: 3,
      title: 'Süsleme',
      icon: '✨',
      options: [
        { id: 1, label: 'Meyveli', icon: '🍓🍇', price: 70 },
        { id: 2, label: 'Çikolata Kaplı', icon: '🍫', price: 100 },
        { id: 3, label: 'Doğum Günü Yazılı', icon: '🎂', price: 60 },
        { id: 4, label: 'Çiçekli Tasarım', icon: '🌸', price: 120 },
        { id: 5, label: 'Makaronlu', icon: '🍬', price: 140 },
        { id: 6, label: 'Altın Varaklı', icon: '✨', price: 180 }
      ]
    }
  ]
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(session({
  secret: 'tatli-ruya-pastanesi-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Redirect /admin to login page
app.get('/admin', (req, res) => {
  res.redirect('/login.html');
});

// ---- AUTH ----
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Hatalı kullanıcı adı veya şifre' });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
}

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.isAdmin });
});

// ---- PRODUCTS CRUD ----
app.get('/api/products', (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
  res.json(product);
});

app.post('/api/products', requireAdmin, upload.single('image'), (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  const product = {
    id,
    name: req.body.name,
    category: req.body.category || 'Pasta',
    price: parseFloat(req.body.price) || 0,
    description: req.body.description || '',
    image: req.file ? '/uploads/' + req.file.filename : (req.body.image || ''),
    featured: req.body.featured === 'true',
    createdAt: new Date().toISOString()
  };
  products.push(product);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true, product });
});

app.put('/api/products/:id', requireAdmin, upload.single('image'), (req, res) => {
  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const product = { ...products[idx] };
  if (req.body.name) product.name = req.body.name;
  if (req.body.category) product.category = req.body.category;
  if (req.body.price !== undefined) product.price = parseFloat(req.body.price);
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.file) product.image = '/uploads/' + req.file.filename;
  else if (req.body.image) product.image = req.body.image;
  if (req.body.featured !== undefined) product.featured = req.body.featured === 'true';

  products[idx] = product;
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true, product });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (product && product.image && product.image.startsWith('/uploads/')) {
    const imgPath = path.join(__dirname, product.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  products = products.filter(p => p.id !== id);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true });
});

// ---- REVIEWS (Happy Customers Gallery) ----
app.get('/api/reviews', (req, res) => {
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  res.json(reviews);
});

app.post('/api/reviews', requireAdmin, upload.single('image'), (req, res) => {
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  const id = reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
  const review = {
    id,
    customerName: req.body.customerName || 'Müşterimiz',
    comment: req.body.comment || '',
    image: req.file ? '/uploads/' + req.file.filename : '',
    date: new Date().toISOString()
  };
  reviews.push(review);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  res.json({ success: true, review });
});

app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
  let reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  const id = parseInt(req.params.id);
  const review = reviews.find(r => r.id === id);
  if (review && review.image) {
    const imgPath = path.join(__dirname, review.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  reviews = reviews.filter(r => r.id !== id);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  res.json({ success: true });
});

// ---- SETTINGS ----
app.get('/api/settings', (req, res) => {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  res.json(settings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  let settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  settings = { ...settings, ...req.body };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  res.json({ success: true, settings });
});

// ---- BLOG ----
app.get('/api/blog', (req, res) => {
  const posts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  res.json(posts);
});

app.get('/api/blog/:id', (req, res) => {
  const posts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı' });
  res.json(post);
});

app.post('/api/blog', requireAdmin, upload.single('image'), (req, res) => {
  const posts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  const id = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
  const post = {
    id,
    title: req.body.title,
    summary: req.body.summary || '',
    content: req.body.content || '',
    image: req.file ? '/uploads/' + req.file.filename : (req.body.image || ''),
    date: new Date().toISOString()
  };
  posts.push(post);
  fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2));
  res.json({ success: true, post });
});

app.put('/api/blog/:id', requireAdmin, upload.single('image'), (req, res) => {
  let posts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  const idx = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Yazı bulunamadı' });
  const post = { ...posts[idx] };
  if (req.body.title) post.title = req.body.title;
  if (req.body.summary !== undefined) post.summary = req.body.summary;
  if (req.body.content !== undefined) post.content = req.body.content;
  if (req.file) post.image = '/uploads/' + req.file.filename;
  else if (req.body.image) post.image = req.body.image;
  posts[idx] = post;
  fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2));
  res.json({ success: true, post });
});

app.delete('/api/blog/:id', requireAdmin, (req, res) => {
  let posts = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  const id = parseInt(req.params.id);
  const post = posts.find(p => p.id === id);
  if (post && post.image && post.image.startsWith('/uploads/')) {
    const imgPath = path.join(__dirname, post.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  posts = posts.filter(p => p.id !== id);
  fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2));
  res.json({ success: true });
});

// ---- DESIGNER ----
app.get('/api/designer', (req, res) => {
  const designer = JSON.parse(fs.readFileSync(DESIGNER_FILE, 'utf-8'));
  res.json(designer);
});

app.put('/api/designer', requireAdmin, (req, res) => {
  let designer = JSON.parse(fs.readFileSync(DESIGNER_FILE, 'utf-8'));
  designer = { ...designer, ...req.body };
  fs.writeFileSync(DESIGNER_FILE, JSON.stringify(designer, null, 2));
  res.json({ success: true, designer });
});

// ---- STATS ----
app.get('/api/stats', requireAdmin, (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  const blog = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf-8'));
  res.json({
    productCount: products.length,
    reviewCount: reviews.length,
    blogCount: blog.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍰 Tatlı Rüya Pastanesi sunucusu çalışıyor: http://localhost:${PORT}`);
});