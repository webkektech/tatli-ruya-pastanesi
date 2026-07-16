// ============================================
// TATLI RÜYA PASTANESİ - Cake Designer (API)
// ============================================

let designerData = null;
let currentStep = 0;
let selections = [];

async function initDesigner() {
  try {
    const res = await fetch('/api/designer');
    designerData = await res.json();
    selections = new Array(designerData.steps.length).fill(null);
    renderDesigner();
  } catch (e) {
    console.error('Designer verisi yüklenemedi:', e);
    document.getElementById('designerBox').innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px">Pastanı Tasarla şu anda kullanılamıyor.</p>';
  }
}

function renderDesigner() {
  const box = document.getElementById('designerBox');
  if (!box || !designerData) return;

  const steps = designerData.steps;

  // Steps indicator
  let stepsHTML = '';
  steps.forEach((step, i) => {
    if (i > 0) {
      stepsHTML += `<div class="designer-step-line${selections[i-1] !== null ? ' completed' : ''}"></div>`;
    }
    let cls = '';
    if (i === currentStep) cls = 'active';
    else if (selections[i] !== null) cls = 'completed';
    stepsHTML += `<div class="designer-step ${cls}">${selections[i] !== null ? '✓' : step.icon}</div>`;
  });

  // Options
  const step = steps[currentStep];
  let optionsHTML = step.options.map((opt, i) => `
    <button class="designer-option${selections[currentStep] === i ? ' selected' : ''}" onclick="selectDesignerOption(${i})">
      <span class="opt-icon">${opt.icon}</span>
      ${opt.label}
      <small style="display:block;color:var(--gray);margin-top:4px">+${opt.price}₺</small>
    </button>
  `).join('');

  // Preview
  let previewHTML = '';
  const allSelected = selections.every(s => s !== null);
  if (allSelected) {
    const total = steps.reduce((sum, step, i) => sum + step.options[selections[i]].price, 0);
    const desc = steps.map((step, i) => step.options[selections[i]].label).join(' + ');
    previewHTML = `
      <div class="designer-preview">
        <h4>🍰 Pastanız Hazır!</h4>
        <div class="designer-result">${desc}</div>
        <div class="designer-price">${total.toLocaleString('tr-TR')} ₺</div>
      </div>
    `;
  } else if (selections.some(s => s !== null)) {
    previewHTML = `
      <div class="designer-preview">
        <h4>Seçiminiz</h4>
        <div class="designer-result">${steps.map((step, i) => selections[i] !== null ? step.options[selections[i]].label : '...').join(' + ')}</div>
      </div>
    `;
  } else {
    previewHTML = `
      <div class="designer-preview">
        <h4>Kendi Pastanı Tasarla</h4>
        <p style="color:var(--gray);font-size:0.9rem">Aşağıdan seçimlerini yap, fiyatını gör!</p>
      </div>
    `;
  }

  // Nav buttons
  let navHTML = '';
  if (currentStep > 0) {
    navHTML += `<button class="btn btn-outline btn-sm" onclick="prevDesignerStep()">← Geri</button>`;
  }
  if (currentStep < steps.length - 1) {
    navHTML += `<button class="btn btn-primary btn-sm" onclick="nextDesignerStep()" ${selections[currentStep] === null ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>İleri →</button>`;
  } else if (allSelected) {
    const total = steps.reduce((sum, step, i) => sum + step.options[selections[i]].price, 0);
    const desc = steps.map((step, i) => step.options[selections[i]].label).join(' + ');
    const waMsg = `Merhaba!%20Pastam%C4%B1%20tasarlad%C4%B1m:%20${encodeURIComponent(desc)}.%20Toplam%20fiyat:%20${total}%E2%82%BA.%20Sipari%C5%9F%20vermek%20istiyorum!`;
    navHTML += `<button class="btn btn-outline btn-sm" onclick="prevDesignerStep()">← Geri</button>`;
    navHTML += `<a href="https://wa.me/905XXXXXXXXX?text=${waMsg}" target="_blank" class="btn btn-whatsapp btn-sm" id="designerWaBtn">
      <i class="fa-brands fa-whatsapp"></i> Bu Pastayı İstiyorum!
    </a>`;
  }

  box.innerHTML = `
    <div class="designer-steps">${stepsHTML}</div>
    <p style="text-align:center;color:var(--gray);margin-bottom:16px;position:relative;z-index:1">
      <strong>Adım ${currentStep + 1}/${steps.length}:</strong> ${step.title}
    </p>
    <div class="designer-options">${optionsHTML}</div>
    ${previewHTML}
    <div class="designer-nav">${navHTML}</div>
  `;

  // Update WhatsApp link when settings loaded
  setTimeout(() => {
    const waBtn = document.getElementById('designerWaBtn');
    if (waBtn && typeof settings !== 'undefined' && settings.whatsapp) {
      const total = steps.reduce((sum, step, i) => sum + step.options[selections[i]].price, 0);
      const desc = steps.map((step, i) => step.options[selections[i]].label).join(' + ');
      const waMsg = `Merhaba!%20Pastam%C4%B1%20tasarlad%C4%B1m:%20${encodeURIComponent(desc)}.%20Toplam%20fiyat:%20${total}%E2%82%BA.%20Sipari%C5%9F%20vermek%20istiyorum!`;
      waBtn.href = `https://wa.me/${settings.whatsapp}?text=${waMsg}`;
    }
  }, 800);
}

window.selectDesignerOption = function(index) {
  selections[currentStep] = index;
  renderDesigner();
};

window.nextDesignerStep = function() {
  if (selections[currentStep] !== null && currentStep < designerData.steps.length - 1) {
    currentStep++;
    renderDesigner();
  }
};

window.prevDesignerStep = function() {
  if (currentStep > 0) {
    currentStep--;
    renderDesigner();
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDesigner, 100);
});