/* views/reservations-list.js — Rezervasyon listesi (v3 Premium Kart) */

function renderReservationsList() {
  const rs = DB.reservations || [];
  const prefView = localStorage.getItem('turTakipResView') || 'grid';

  setTimeout(() => {
    const actions = document.getElementById('headerActions');
    if (actions) {
      let html = `<button class="btn btn-ghost btn-sm" onclick="toggleResView()" style="margin-right:8px">${prefView === 'list' ? '∷ Grid' : '☰ Liste'}</button>`;
      if (Auth.canEdit()) {
        html += `<button class="btn btn-primary" onclick="Router.navigate('/reservation/new')">＋ Yeni Ekle</button>`;
      }
      actions.innerHTML = html;
    }
  }, 0);

  if (rs.length === 0) {
    return `
    <div class="empty-state">
      <div class="empty-ico">👥</div>
      <div class="empty-title">Henüz rezervasyon yok</div>
      <div class="empty-desc">Sisteme yeni bir grup ekleyerek başlayabilirsiniz.</div>
      ${Auth.canEdit() ? `<button class="btn btn-primary" style="margin-top:16px" onclick="Router.navigate('/reservation/new')">＋ Yeni Rezervasyon</button>` : ''}
    </div>`;
  }

  const activeRs = rs.filter(r => r.status !== 'kapandi').sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const closedRs = rs.filter(r => r.status === 'kapandi').sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // newest first

  const buildGrid = (list) => {
    if (list.length === 0) return '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">Kayıt bulunamadı.</div>';
    
    let gHtml = prefView === 'grid' ? `<div class="tourists-grid">` : `<div>`;
    list.forEach((r, i) => {
      const fn  = r.personal.firstName || '';
      const ln  = r.personal.lastName || '';
      const nm  = `${fn} ${ln}`.trim() || 'İsimsiz';
      const ini = getInitials(fn, ln) || '?';
      const col = avatarColor(nm);
      
      const pax = r.guestCount || 1;
      const days = r.days || 1;
      const sd = formatDate(r.startDate);
      
      const cur = r.payment?.currency || DB.settings?.currency || 'EUR';
      const total = r.payment?.total > 0 ? formatCurrency(r.payment.total, cur) : '—';
      const paid = r.payment?.paid || 0;
      
      let stripeClass = 'gray';
      let payLabel = { text:'Bekliyor', c:'var(--text-muted)' };
      if (r.payment?.total > 0) {
        if (paid >= r.payment.total) { stripeClass = 'paid'; payLabel = { text:'Ödendi', c:'var(--green)' }; }
        else if (paid > 0)           { stripeClass = 'partial'; payLabel = { text:'Kısmi', c:'var(--orange)' }; }
      }

      let badges = '';
      if (r.isPrivate) badges += `<span class="badge badge-purple" title="Private Tur" style="margin-right:4px">👑 VIP</span>`;
      if (r.tours?.length) badges += `<span title="${r.tours.length} Tur" style="margin-right:4px">🚩</span>`;
      if (r.balloon?.active) badges += `<span title="Balon" style="margin-right:4px">🎈</span>`;
      if (r.flights?.length) badges += `<span title="${r.flights.length} Uçuş" style="margin-right:4px">✈️</span>`;
      if (r.hotels?.length) badges += `<span title="${r.hotels.length} Otel" style="margin-right:4px">🏨</span>`;

      const searchStr = `${nm} ${r.personal.phone||''} ${(r.guests||[]).map(g=>g.passport).join(' ')}`.toLowerCase();

      if (prefView === 'grid') {
        gHtml += `
        <div class="tourist-card searchable-item card-clickable" data-search="${searchStr}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="tc-stripe ${stripeClass}"></div>
          <div class="tc-header">
            <div class="tc-avatar" style="background:${col}">${ini}</div>
            <div class="tc-info">
              <div class="tc-name" title="${nm}">${nm}</div>
              <div class="tc-meta">${pax} Kişi • ${days} Gün</div>
            </div>
          </div>
          <div class="tc-body">
            <div class="tc-date">${sd}</div>
            <div class="tc-badges">${badges}</div>
            <div class="tc-price">
              <span class="badge badge-${stripeClass === 'paid' ? 'green' : stripeClass === 'partial' ? 'orange' : 'gray'}" style="margin-right:6px;cursor:pointer" ${Auth.canEdit() ? `onclick="cyclePayStatus(event,'${r.id}')"` : ''}>${payLabel.text}</span>
              ${total}
            </div>
          </div>
        </div>`;
      } else {
        gHtml += `
        <div class="res-list-row searchable-item" data-search="${searchStr}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="rlr-avatar" style="background:${col}">${ini}</div>
          <div class="rlr-name">${nm} <span class="rlr-sub">• ${pax} kişi • ${days} gün</span></div>
          <div class="rlr-date">${sd}</div>
          <div class="rlr-badges">${badges}</div>
          <div class="rlr-pay">
            <span class="badge badge-${stripeClass === 'paid' ? 'green' : stripeClass === 'partial' ? 'orange' : 'gray'}" style="margin-right:8px;cursor:pointer" ${Auth.canEdit() ? `onclick="cyclePayStatus(event,'${r.id}')"` : ''}>${payLabel.text}</span>
            <span style="font-weight:600">${total}</span>
          </div>
          <div class="rlr-arrow">›</div>
        </div>`;
      }
    });
    gHtml += `</div>`;
    return gHtml;
  };

  return `
  <div style="max-width:1200px;margin:0 auto">
    <div style="display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap">
      <div class="tabs" id="listTabs" style="margin-bottom:0; flex:1; min-width:300px">
        <button class="tab-btn active" data-tab="list-aktif" onclick="switchListTab(this,'list-aktif')">🟢 Aktif Dosyalar (${activeRs.length})</button>
        <button class="tab-btn" data-tab="list-arsiv" onclick="switchListTab(this,'list-arsiv')">📦 Arşiv / Kapananlar (${closedRs.length})</button>
      </div>
      <div style="flex-shrink:0; position:relative; display:flex; align-items:center; gap:8px;">
        <select class="form-control" style="height:42px; border-radius:var(--radius-md); min-width:140px; cursor:pointer;" onchange="localStorage.setItem('turTakipResSort', this.value); document.getElementById('pageContent').innerHTML = renderReservationsList();">
          <option value="date_asc" ${sortOpt==='date_asc'?'selected':''}>Tarih (Yakın-Uzak)</option>
          <option value="date_desc" ${sortOpt==='date_desc'?'selected':''}>Tarih (Uzak-Yakın)</option>
          <option value="name_asc" ${sortOpt==='name_asc'?'selected':''}>İsim (A-Z)</option>
          <option value="name_desc" ${sortOpt==='name_desc'?'selected':''}>İsim (Z-A)</option>
          <option value="amount_desc" ${sortOpt==='amount_desc'?'selected':''}>Tutar (Yüksek-Düşük)</option>
          <option value="amount_asc" ${sortOpt==='amount_asc'?'selected':''}>Tutar (Düşük-Yüksek)</option>
        </select>
        <div style="position:relative; display:flex; align-items:center;">
          <span style="position:absolute; left:12px; font-size:14px; pointer-events:none;">🔍</span>
          <input type="text" id="searchInput" class="form-control" placeholder="İsim, telefon, pasaport ara..." oninput="filterReservations(this.value); document.getElementById('clearSearchBtn').style.display=this.value?'block':'none'" style="padding-left:36px; padding-right:30px; min-width:240px; height:42px; border-radius:var(--radius-md)">
          <button id="clearSearchBtn" onclick="document.getElementById('searchInput').value=''; filterReservations(''); this.style.display='none'" style="display:none; position:absolute; right:12px; background:none; border:none; font-size:12px; color:var(--text-sec); cursor:pointer; padding:4px;">✖</button>
        </div>
      </div>
    </div>
    
    <div class="tab-content active" id="tc-list-aktif">
      ${buildGrid(activeRs)}
    </div>
    
    <div class="tab-content" id="tc-list-arsiv">
      ${buildGrid(closedRs)}
    </div>
  </div>`;
}

function filterReservations(q) {
  const query = (q || '').toLowerCase().trim();
  const items = document.querySelectorAll('.searchable-item');
  items.forEach(el => {
    const text = el.getAttribute('data-search') || '';
    if (text.includes(query)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

function toggleResView() {
  const cur = localStorage.getItem('turTakipResView') || 'grid';
  localStorage.setItem('turTakipResView', cur === 'grid' ? 'list' : 'grid');
  document.getElementById('pageContent').innerHTML = renderReservationsList();
}

function switchListTab(btn, tabId) {
  document.querySelectorAll('#listTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('[id^="tc-list-"]').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}

/* Ödeme durumunu listeden tıkla değiştir */
function cyclePayStatus(event, resId) {
  event.stopPropagation();
  const cycle = { 'bekliyor': 'kısmi', 'kısmi': 'ödendi', 'ödendi': 'bekliyor' };
  const res   = DB.getReservation(resId);
  if (!res) return;
  const next  = cycle[res.payment?.status] || 'bekliyor';
  DB.updateReservation(resId, { payment: { ...res.payment, status: next } });
  // Sayfayı yeniden çiz
  document.getElementById('pageContent').innerHTML = renderReservationsList();
  showNotif(`Ödeme durumu: ${next}`, 'success');
}
