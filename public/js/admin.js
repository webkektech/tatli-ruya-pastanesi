// ============================================
// TATLI RÜYA PASTANESİ - Admin Panel JS
// Toast + Görsel Designer + Düz Metin Blog
// ============================================

// Toast helper
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}
function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toastContainer';
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}

// Auth check
async function checkAuth() {
  try {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    if (!data.authenticated) window.location.href = '/login.html';
  } catch (e) { window.location.href = '/login.html'; }
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadDashboard();
  loadProducts();
  loadBlog();
  loadSettings();

  document.querySelectorAll('.admin-sidebar nav a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.admin-sidebar nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      const section = this.dataset.section;
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById('section-' + section);
      if (sec) sec.classList.add('active');
      if (section === 'designer') loadDesignerEditor();
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/logout');
    window.location.href = '/login.html';
  });

  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
  document.getElementById('blogForm').addEventListener('submit', handleBlogSubmit);
});

// ========= DASHBOARD =========
async function loadDashboard() {
  try {
    const res = await fetch('/api/products');
    const p = await res.json();
    const blogRes = await fetch('/api/blog');
    const b = await blogRes.json();
    const cards = document.querySelectorAll('#statsCards .stat-num');
    if (cards.length >= 2) { cards[0].textContent = p.length; cards[1].textContent = b.length; }
  } catch (e) { console.error(e); }
}

// ========= PRODUCTS =========
async function loadProducts() {
  try { renderProductsTable(await (await fetch('/api/products')).json()); } catch (e) { console.error(e); }
}
function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray)">Henüz ürün eklenmemiş.</td></tr>'; return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image || 'https://placehold.co/50/fdf2f7/db2777?text=🍰'}" alt="" onerror="this.src='https://placehold.co/50/fdf2f7/db2777?text=🍰'"></td>
      <td>${p.name}</td><td>${p.category}</td><td>${p.price.toLocaleString('tr-TR')} ₺</td>
      <td>${p.featured ? '⭐ Evet' : '—'}</td>
      <td>
        <button class="btn btn-outline btn-sm" style="margin-right:6px" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-danger" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}
function showAddProduct() {
  ['productId','prodName','prodPrice','prodDesc','prodImage'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prodCategory').value = 'Pasta';
  document.getElementById('prodFeatured').checked = false;
  document.getElementById('productFormTitle').textContent = 'Yeni Ürün Ekle';
  document.getElementById('productFormCard').style.display = 'block';
  document.getElementById('productFormCard').scrollIntoView({ behavior: 'smooth' });
}
function hideProductForm() { document.getElementById('productFormCard').style.display = 'none'; }
async function editProduct(id) {
  try {
    const p = await (await fetch(`/api/products/${id}`)).json();
    document.getElementById('productId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('prodFeatured').checked = p.featured;
    document.getElementById('productFormTitle').textContent = 'Ürünü Düzenle';
    document.getElementById('productFormCard').style.display = 'block';
    document.getElementById('productFormCard').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Ürün yüklenirken hata oluştu.', 'error'); }
}
async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('prodName').value);
  formData.append('category', document.getElementById('prodCategory').value);
  formData.append('price', document.getElementById('prodPrice').value);
  formData.append('description', document.getElementById('prodDesc').value);
  formData.append('featured', document.getElementById('prodFeatured').checked);
  const imgFile = document.getElementById('prodImage').files[0];
  if (imgFile) formData.append('image', imgFile);
  try {
    const res = await fetch(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      showToast(id ? '✅ Ürün güncellendi!' : '✅ Ürün eklendi!');
      hideProductForm(); loadProducts(); loadDashboard();
    }
  } catch (e) { showToast('Bağlantı hatası!', 'error'); }
}
async function deleteProduct(id) {
  if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
  try { await fetch(`/api/products/${id}`, { method: 'DELETE' }); showToast('Ürün silindi.'); loadProducts(); loadDashboard(); }
  catch (e) { showToast('Silme hatası!', 'error'); }
}

// ========= BLOG (Düz Metin) =========
async function loadBlog() {
  try { renderBlogTable(await (await fetch('/api/blog')).json()); } catch (e) { console.error(e); }
}
function renderBlogTable(posts) {
  const tbody = document.getElementById('blogTableBody');
  if (posts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray)">Henüz blog yazısı eklenmemiş.</td></tr>'; return;
  }
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td>${p.image ? `<img src="${p.image}" alt="" onerror="this.style.display='none'" style="width:50px;height:50px;object-fit:cover;border-radius:8px">` : '—'}</td>
      <td>${p.title}</td><td>${new Date(p.date).toLocaleDateString('tr-TR')}</td>
      <td>
        <button class="btn btn-outline btn-sm" style="margin-right:6px" onclick="editBlog(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-danger" onclick="deleteBlog(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}
function showAddBlog() {
  ['blogId','blogTitle','blogSummary','blogContent','blogImage'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('blogFormTitle').textContent = 'Yeni Blog Yazısı';
  document.getElementById('blogFormCard').style.display = 'block';
  document.getElementById('blogFormCard').scrollIntoView({ behavior: 'smooth' });
}
function hideBlogForm() { document.getElementById('blogFormCard').style.display = 'none'; }
async function editBlog(id) {
  try {
    const p = await (await fetch(`/api/blog/${id}`)).json();
    document.getElementById('blogId').value = p.id;
    document.getElementById('blogTitle').value = p.title;
    document.getElementById('blogSummary').value = p.summary || '';
    document.getElementById('blogContent').value = (p.content || '').replace(/<p>/g,'').replace(/<\/p>/g,'\n').replace(/<h4>/g,'## ').replace(/<\/h4>/g,'\n').replace(/<ul>/g,'').replace(/<\/ul>/g,'').replace(/<li>/g,'- ').replace(/<\/li>/g,'\n').replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'').trim();
    document.getElementById('blogFormTitle').textContent = 'Blog Yazısını Düzenle';
    document.getElementById('blogFormCard').style.display = 'block';
    document.getElementById('blogFormCard').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Yazı yüklenirken hata!', 'error'); }
}
function plainToHTML(text) {
  if (!text) return '';
  return text.split('\n').filter(line => line.trim()).map(line => {
    line = line.trim();
    if (line.startsWith('## ')) return `<h4>${line.slice(3)}</h4>`;
    if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
    return `<p>${line}</p>`;
  }).join('');
}
async function handleBlogSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('blogId').value;
  const formData = new FormData();
  formData.append('title', document.getElementById('blogTitle').value);
  formData.append('summary', document.getElementById('blogSummary').value);
  formData.append('content', plainToHTML(document.getElementById('blogContent').value));
  const imgFile = document.getElementById('blogImage').files[0];
  if (imgFile) formData.append('image', imgFile);
  try {
    const res = await fetch(id ? `/api/blog/${id}` : '/api/blog', { method: id ? 'PUT' : 'POST', body: formData });
    const data = await res.json();
    if (data.success) { showToast(id ? '✅ Blog yazısı güncellendi!' : '✅ Blog yazısı eklendi!'); hideBlogForm(); loadBlog(); loadDashboard(); }
  } catch (e) { showToast('Hata!', 'error'); }
}
async function deleteBlog(id) {
  if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
  try { await fetch(`/api/blog/${id}`, { method: 'DELETE' }); showToast('Yazı silindi.'); loadBlog(); loadDashboard(); }
  catch (e) { showToast('Silme hatası!', 'error'); }
}

// ========= DESIGNER VISUAL EDITOR =========
let designerStepsData = [];
async function loadDesignerEditor() {
  try {
    const res = await fetch('/api/designer');
    const data = await res.json();
    designerStepsData = data.steps || [];
    renderDesignerEditor();
  } catch (e) { console.error(e); }
}
function renderDesignerEditor() {
  const container = document.getElementById('designerStepsContainer');
  container.innerHTML = designerStepsData.map((step, si) => `
    <div class="designer-step-card">
      <div class="flex-between" style="margin-bottom:12px">
        <h4 style="margin:0">Adım ${si + 1}</h4>
        <button class="btn-danger" onclick="deleteDesignerStep(${si})"><i class="fa-solid fa-trash"></i> Adımı Sil</button>
      </div>
      <div class="step-header-inputs">
        <input type="text" value="${step.title}" placeholder="Adım Başlığı" onchange="updateDesignerStep(${si},'title',this.value)" style="width:200px">
        <input type="text" value="${step.icon}" placeholder="İkon (emoji)" onchange="updateDesignerStep(${si},'icon',this.value)" style="width:100px">
      </div>
      <div style="margin-top:10px">
        <strong style="font-size:0.85rem;color:var(--gray)">Seçenekler:</strong>
        ${(step.options || []).map((opt, oi) => `
          <div class="designer-option-row">
            <input type="text" class="opt-name" value="${opt.label}" placeholder="Seçenek Adı" onchange="updateDesignerOption(${si},${oi},'label',this.value)">
            <input type="text" class="opt-icon" value="${opt.icon}" placeholder="İkon" onchange="updateDesignerOption(${si},${oi},'icon',this.value)">
            <input type="number" class="opt-price" value="${opt.price}" placeholder="Fiyat" onchange="updateDesignerOption(${si},${oi},'price',parseInt(this.value))">
            <span>₺</span>
            <button class="btn-danger" onclick="deleteDesignerOption(${si},${oi})"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join('')}
        <button class="btn btn-outline btn-sm" onclick="addDesignerOption(${si})" style="margin-top:8px"><i class="fa-solid fa-plus"></i> Seçenek Ekle</button>
      </div>
    </div>
  `).join('');
}
function updateDesignerStep(si, field, value) { designerStepsData[si][field] = value; }
function updateDesignerOption(si, oi, field, value) { designerStepsData[si].options[oi][field] = value; }
function addDesignerOption(si) {
  const maxId = designerStepsData[si].options.length > 0 ? Math.max(...designerStepsData[si].options.map(o => o.id)) : 0;
  designerStepsData[si].options.push({ id: maxId + 1, label: 'Yeni Seçenek', icon: '🍰', price: 0 });
  renderDesignerEditor();
}
function deleteDesignerOption(si, oi) {
  designerStepsData[si].options.splice(oi, 1);
  renderDesignerEditor();
}
function addDesignerStep() {
  const maxId = designerStepsData.length > 0 ? Math.max(...designerStepsData.map(s => s.id)) : 0;
  designerStepsData.push({ id: maxId + 1, title: 'Yeni Adım', icon: '🍰', options: [{ id: 1, label: 'Seçenek 1', icon: '🍰', price: 100 }] });
  renderDesignerEditor();
}
function deleteDesignerStep(si) {
  if (!confirm('Bu adımı silmek istediğinize emin misiniz?')) return;
  designerStepsData.splice(si, 1);
  renderDesignerEditor();
}
async function saveDesigner() {
  try {
    const res = await fetch('/api/designer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: designerStepsData })
    });
    const data = await res.json();
    if (data.success) showToast('✅ Pastanı Tasarla ayarları kaydedildi!');
    else showToast('Hata!', 'error');
  } catch (e) { showToast('Bağlantı hatası!', 'error'); }
}

// ========= SETTINGS =========
async function loadSettings() {
  try {
    const s = await (await fetch('/api/settings')).json();
    document.getElementById('setWhatsapp').value = s.whatsapp || '';
    document.getElementById('setInstagram').value = s.instagram || '';
    document.getElementById('setAddress').value = s.address || '';
    document.getElementById('setGoogleMaps').value = s.googleMaps || '';
    document.getElementById('setOpen').value = (s.workingHours && s.workingHours.open) || '08:00';
    document.getElementById('setClose').value = (s.workingHours && s.workingHours.close) || '20:00';
    document.getElementById('setHeroTitle').value = s.heroTitle || '';
    document.getElementById('setHeroSubtitle').value = s.heroSubtitle || '';
    document.getElementById('setHeroBg').value = s.heroBgImage || '';
    document.getElementById('setAboutText').value = s.aboutText || '';
    if (s.specialDayBanner) {
      document.getElementById('setBannerActive').checked = s.specialDayBanner.active || false;
      document.getElementById('setBannerTitle').value = s.specialDayBanner.title || '';
      document.getElementById('setBannerMessage').value = s.specialDayBanner.message || '';
    }
  } catch (e) { console.error(e); }
}
async function saveSettings() {
  const settings = {
    whatsapp: document.getElementById('setWhatsapp').value,
    instagram: document.getElementById('setInstagram').value,
    address: document.getElementById('setAddress').value,
    googleMaps: document.getElementById('setGoogleMaps').value,
    workingHours: { open: document.getElementById('setOpen').value, close: document.getElementById('setClose').value },
    heroTitle: document.getElementById('setHeroTitle').value,
    heroSubtitle: document.getElementById('setHeroSubtitle').value,
    heroBgImage: document.getElementById('setHeroBg').value,
    aboutText: document.getElementById('setAboutText').value,
    specialDayBanner: { active: document.getElementById('setBannerActive').checked, title: document.getElementById('setBannerTitle').value, message: document.getElementById('setBannerMessage').value }
  };
  try {
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const data = await res.json();
    if (data.success) showToast('✅ Ayarlar başarıyla kaydedildi!');
  } catch (e) { showToast('Bağlantı hatası!', 'error'); }
}