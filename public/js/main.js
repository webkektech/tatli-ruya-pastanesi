// ============================================
// TATLI RÜYA PASTANESİ - Main JS
// ============================================

let settings = {};
let products = [];

// On load
document.addEventListener('DOMContentLoaded', async () => {
  // Preloader
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 800);

  await loadSettings();
  loadProducts();
  loadBlog();

  // Nav scroll
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.classList.toggle('scrolled', window.scrollY > 50);
    revealOnScroll();
  });

  // Mobile nav
  setupMobileNav();

  // Date picker
  const dateInput = document.getElementById('reservationDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Reveal on load
  setTimeout(revealOnScroll, 300);

  // Blog modal
  setupBlogModal();
});

// Load settings
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    settings = await res.json();
    applySettings();
  } catch (e) {
    console.error('Ayarlar yüklenemedi:', e);
  }
}

function applySettings() {
  // Hero
  document.getElementById('heroTitle').innerHTML = settings.heroTitle || 'Tatlı Rüya <span class="accent">Pastanesi</span>';
  document.getElementById('heroSubtitle').textContent = settings.heroSubtitle || '';

  // Hero background image
  if (settings.heroBgImage) {
    document.querySelector('.hero').style.backgroundImage = `url(${settings.heroBgImage})`;
  }

  // WhatsApp links
  const waLink = `https://wa.me/${settings.whatsapp || '905XXXXXXXXX'}`;
  document.querySelectorAll('#heroWhatsapp, #floatingWhatsapp, #footerWhatsapp').forEach(el => {
    el.href = waLink;
  });
  document.getElementById('heroWhatsapp').textContent = '';
  document.getElementById('heroWhatsapp').innerHTML = '<i class="fa-brands fa-whatsapp"></i> WhatsApp Sipariş';

  // Instagram
  const igLink = `https://instagram.com/${settings.instagram || 'tatli.ruya.pastanesi'}`;
  document.querySelectorAll('#footerInstagram').forEach(el => el.href = igLink);

  // Address
  const addr = settings.address || 'Örnek Mah. Lezzet Sok. No:1, İstanbul';
  document.getElementById('mapAddress').textContent = '📍 ' + addr;
  document.getElementById('footerAddress').textContent = '📍 ' + addr;
  document.getElementById('mapLink').href = settings.googleMaps || '#';
  document.getElementById('footerPhone').textContent = 'WhatsApp: +90 ' + (settings.whatsapp || '5XX XXX XX XX');
  document.getElementById('footerPhone').href = waLink;

  // Working hours & status
  const hours = settings.workingHours || { open: '08:00', close: '20:00' };
  document.getElementById('workingHoursDisplay').textContent = `Pazartesi - Pazar: ${hours.open} - ${hours.close}`;
  updateOpenStatus(hours);

  // Special day banner
  if (settings.specialDayBanner && settings.specialDayBanner.active) {
    document.getElementById('heroBadge').textContent = '🎉 ' + settings.specialDayBanner.title;
    document.getElementById('heroBadge').style.background = '#fff3cd';
    document.getElementById('heroBadge').style.borderColor = '#ffc107';
    document.getElementById('heroBadge').style.color = '#856404';
  }
}

function updateOpenStatus(hours) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = (hours.open || '08:00').split(':').map(Number);
  const [closeH, closeM] = (hours.close || '20:00').split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  const statusHTML = `
    <div class="status-widget" style="margin:0 auto">
      <span class="status-dot ${isOpen ? 'open' : 'closed'}"></span>
      ${isOpen ? '🟢 Şu anda AÇIK' : '🔴 Şu anda KAPALI'}
    </div>
  `;
  const heroStatus = document.getElementById('heroStatus');
  const footerStatus = document.getElementById('footerStatus');
  if (heroStatus) heroStatus.innerHTML = statusHTML;
  if (footerStatus) footerStatus.innerHTML = statusHTML;
}

// Load products
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts(products);
    renderCategories(products);
  } catch (e) {
    console.error('Ürünler yüklenemedi:', e);
  }
}

function renderCategories(products) {
  const categories = [...new Set(products.map(p => p.category))];
  const container = document.getElementById('categoryFilters');
  container.innerHTML = '<button class="category-btn active" data-cat="all">Tümü</button>';
  categories.forEach(cat => {
    container.innerHTML += `<button class="category-btn" data-cat="${cat}">${cat}</button>`;
  });

  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderProducts(cat === 'all' ? products : products.filter(p => p.category === cat));
    });
  });
}

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  if (list.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1">Bu kategoride henüz ürün yok.</p>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card reveal">
      <div class="img-wrapper">
        <img src="${p.image || 'https://placehold.co/400x400/fdf2f7/db2777?text=🍰'}" alt="${p.name}" loading="lazy"
             onerror="this.src='https://placehold.co/400x400/fdf2f7/db2777?text=🍰'">
        <span class="category-tag">${p.category}</span>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="price">${p.price.toLocaleString('tr-TR')} ₺</div>
        <p class="desc">${p.description || ''}</p>
        <div class="card-btns">
          ${p.name === 'Doğum Günü Pastası' ? `
            <a href="#designer" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-palette"></i> Pastanı Tasarla
            </a>
          ` : `
            <a href="https://wa.me/${settings.whatsapp || '905XXXXXXXXX'}?text=Merhaba,%20${encodeURIComponent(p.name)}%20%C3%BCr%C3%BCn%C3%BCnden%20sipari%C5%9F%20vermek%20istiyorum.%20Fiyat%C4%B1:%20${p.price}%E2%82%BA" 
               target="_blank" class="btn btn-whatsapp btn-sm">
              <i class="fa-brands fa-whatsapp"></i> Sipariş Ver
            </a>
          `}
        </div>
      </div>
    </div>
  `).join('');
  setTimeout(revealOnScroll, 200);
}

// Load blog
async function loadBlog() {
  try {
    const res = await fetch('/api/blog');
    const posts = await res.json();
    renderBlog(posts);
  } catch (e) {
    console.error('Blog yüklenemedi:', e);
  }
}

function renderBlog(posts) {
  const grid = document.getElementById('blogGrid');
  if (posts.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1">Henüz blog yazısı eklenmemiş.</p>';
    return;
  }
  grid.innerHTML = posts.map(p => `
    <div class="blog-card reveal" data-id="${p.id}">
      <img src="${p.image || 'https://placehold.co/600x400/fdf2f7/db2777?text=📝'}" alt="${p.title}" loading="lazy"
           onerror="this.src='https://placehold.co/600x400/fdf2f7/db2777?text=📝'">
      <div class="blog-info">
        <div class="blog-date">📅 ${new Date(p.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <h3>${p.title}</h3>
        <p class="blog-summary">${p.summary || ''}</p>
        <span class="read-more" onclick="openBlogModal(${p.id})">Devamını Oku →</span>
      </div>
    </div>
  `).join('');
  setTimeout(revealOnScroll, 200);
}

// Blog modal
function setupBlogModal() {
  const overlay = document.getElementById('blogModalOverlay');
  document.getElementById('closeBlogModal').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
}

window.openBlogModal = async function(id) {
  try {
    const res = await fetch(`/api/blog/${id}`);
    const post = await res.json();
    document.getElementById('blogModalImg').src = post.image || 'https://placehold.co/600x400/fdf2f7/db2777?text=📝';
    document.getElementById('blogModalTitle').textContent = post.title;
    document.getElementById('blogModalDate').textContent = '📅 ' + new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('blogModalContent').innerHTML = post.content || '';
    document.getElementById('blogModalOverlay').classList.add('active');
  } catch (e) {
    console.error('Blog yazısı yüklenemedi:', e);
  }
};

// Toast helper (ana site için)
function showToast(msg, type) {
  if (typeof showToastMain === 'undefined') {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
  const t = document.createElement('div');
  t.className = `toast ${type || 'warning'}`;
  t.innerHTML = `<i class="fa-solid ${icons[type || 'warning']}"></i> ${msg}`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// Reservation
window.handleReservation = function() {
  const date = document.getElementById('reservationDate').value;
  if (!date) {
    showToast('Lütfen bir tarih seçin.', 'warning');
    return;
  }
  const formatted = new Date(date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  const msg = `Merhaba,%20${encodeURIComponent(formatted)}%20tarihi%20i%C3%A7in%20pasta%20sipari%C5%9Fi%20vermek%20istiyorum.%20Detaylar%C4%B1%20g%C3%B6r%C3%BC%C5%9Febilir%20miyiz%3F`;
  window.open(`https://wa.me/${settings.whatsapp || '905XXXXXXXXX'}?text=${msg}`, '_blank');
};

// Mobile nav
function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');

  function closeMenu() {
    toggle.classList.remove('active');
    links.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('active');
    links.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  overlay.addEventListener('click', closeMenu);

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
}

// Scroll reveal
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 80) {
      el.classList.add('visible');
    }
  });
}