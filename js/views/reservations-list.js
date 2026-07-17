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

  const sortOpt = localStorage.getItem('turTakipResSort') || 'date_asc';

  let activeRs = rs.filter(r => r.status !== 'kapandi');
  let closedRs = rs.filter(r => r.status === 'kapandi');
  
  const applySort = (arr, isClosed) => {
    return arr.sort((a, b) => {
      let r = 0;
      if (sortOpt === 'date_asc') r = new Date(a.startDate) - new Date(b.startDate);
      else if (sortOpt === 'date_desc') r = new Date(b.startDate) - new Date(a.startDate);
      else if (sortOpt === 'name_asc') {
        const nA = `${a.personal?.firstName||''} ${a.personal?.lastName||''}`.trim().toLowerCase();
        const nB = `${b.personal?.firstName||''} ${b.personal?.lastName||''}`.trim().toLowerCase();
        r = nA.localeCompare(nB);
      }
      else if (sortOpt === 'name_desc') {
        const nA = `${a.personal?.firstName||''} ${a.personal?.lastName||''}`.trim().toLowerCase();
        const nB = `${b.personal?.firstName||''} ${b.personal?.lastName||''}`.trim().toLowerCase();
        r = nB.localeCompare(nA);
      }
      else if (sortOpt === 'amount_desc') r = (b.payment?.total||0) - (a.payment?.total||0);
      else if (sortOpt === 'amount_asc') r = (a.payment?.total||0) - (b.payment?.total||0);
      
      // Default fallback if default sorting is needed but not matched
      if (r === 0) {
        return isClosed ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.startDate) - new Date(b.startDate);
      }
      return r;
    });
  };

  activeRs = applySort(activeRs, false);
  closedRs = applySort(closedRs, true);

  const buildGrid = (list) => {
    if (list.length === 0) return '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">Kayıt bulunamadı.</div>';
    
    let gHtml = prefView === 'grid' ? `<div class="tourists-grid">` : `<div>`;
    list.forEach((r, i) => {
      const fn  = r.personal?.firstName || '';
      const ln  = r.personal?.lastName || '';
      const nm  = `${fn} ${ln}`.trim() || 'İsimsiz';
      const ini = getInitials(fn, ln) || '?';
      const col = avatarColor(nm);
      
      const pax = r.guestCount || 1;
      const days = r.days || 1;
      const sd = formatDate(r.startDate);
      
      const cur = r.payment?.currency || DB.settings?.currency || 'EUR';
      const rawTotal = r.payment?.total || 0;
      const total = rawTotal > 0 ? formatCurrency(rawTotal, cur) : '—';
      const rawPaid = r.payment?.paid || 0;
      const paid = rawPaid > 0 ? formatCurrency(rawPaid, cur) : '0';
      const rawRemain = rawTotal - rawPaid;
      const remain = rawRemain > 0 ? formatCurrency(rawRemain, cur) : null;
      
      let stripeClass = 'gray';
      let payLabel = { text:'Bekliyor', c:'var(--text-muted)' };
      if (r.payment?.total > 0) {
        if (rawPaid >= r.payment.total) { stripeClass = 'paid'; payLabel = { text:'Ödendi', c:'var(--green)' }; }
        else if (rawPaid > 0)           { stripeClass = 'partial'; payLabel = { text:'Kısmi', c:'var(--orange)' }; }
      }

      // Icon badges for grid
      let icons = [];
      const hasExtra = r.balloon?.isExtra || r.tours?.some(t => t.isExtra);
      if (hasExtra) icons.push(`<span class="res-card-icon-badge badge-orange" style="border:1px solid var(--orange)">🌟 Ekstra Satış</span>`);
      if (r.isPrivate) icons.push(`<span class="res-card-icon-badge badge-purple">👑 VIP Tur</span>`);
      if (r.tours?.length) {
        const t = DB.tourOptions.find(o => o.id === r.tours[0].tourId);
        if (t) icons.push(`<span class="res-card-icon-badge badge-orange">${t.icon} ${t.name.split(' ')[0]}</span>`);
        if (r.tours.length > 1) icons.push(`<span class="res-card-icon-badge badge-orange">+${r.tours.length-1} tur</span>`);
      }
      if (r.flights?.length) icons.push(`<span class="res-card-icon-badge badge-blue">✈️ ${r.flights.length} Uçuş</span>`);
      if (r.balloon?.active) icons.push(`<span class="res-card-icon-badge badge-red">🎈 Balon</span>`);
      if (r.transfers?.length) icons.push(`<span class="res-card-icon-badge badge-green">🚌 ${r.transfers.length} Trnsf</span>`);
      if (r.hotels?.length) {
        const h = DB.hotelOptions.find(o => o.id === r.hotels[0].hotelId);
        if (h) icons.push(`<span class="res-card-icon-badge badge-purple">🏨 ${h.name.split(' ')[0]}</span>`);
      }

      // Simple emojis for list view
      let badges = '';
      if (hasExtra) badges += `<span class="badge badge-orange" title="Ekstra Satış" style="margin-right:4px;border:1px solid var(--orange)">🌟 Ek Satış</span>`;
      if (r.isPrivate) badges += `<span class="badge badge-purple" title="Private Tur" style="margin-right:4px">👑 VIP</span>`;
      if (r.tours?.length) badges += `<span title="${r.tours.length} Tur" style="margin-right:4px">🚩</span>`;
      if (r.balloon?.active) badges += `<span title="Balon" style="margin-right:4px">🎈</span>`;
      if (r.flights?.length) badges += `<span title="${r.flights.length} Uçuş" style="margin-right:4px">✈️</span>`;
      if (r.hotels?.length) badges += `<span title="${r.hotels.length} Otel" style="margin-right:4px">🏨</span>`;

      const searchStr = `${nm} ${r.personal?.phone||''} ${(r.guests||[]).map(g=>g.passport).join(' ')}`.toLowerCase();
      const staggerCls = i < 10 ? `stagger-${(i%5)+1}` : '';

      if (prefView === 'grid') {
        const sDateObj = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
        const isValidDate = sDateObj && !isNaN(sDateObj.getTime());
        const day = isValidDate ? sDateObj.getDate() : '—';
        const mon = isValidDate ? MONTHS_TR[sDateObj.getMonth()].substring(0, 3) : '';

        gHtml += `
        <div class="res-card ${staggerCls} searchable-item" data-search="${searchStr}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="res-card-stripe ${stripeClass}"></div>
          <div class="res-card-body">
            <div class="res-card-top">
              <div class="res-card-avatar" style="background:${col}">${ini}</div>
              <div style="flex:1;min-width:0">
                <div class="res-card-name" title="${nm}">${nm}</div>
                <div class="res-card-meta">👥 ${pax} Kişi &nbsp;·&nbsp; 📅 ${days} Gün</div>
              </div>
              <div class="res-card-date">
                <div class="res-card-date-day">${day}</div>
                <div class="res-card-date-mon">${mon}</div>
              </div>
            </div>
            ${icons.length ? `<div class="res-card-icons">${icons.join('')}</div>` : '<div style="margin-bottom:13px"></div>'}
            <div class="res-card-footer" onclick="event.stopPropagation()">
              <div>
                <div class="res-card-amount">${total}</div>
                <div class="res-card-amount-sub" style="color:var(--green)">${paid} ödendi</div>
                ${remain ? `<div class="res-card-amount-sub" style="color:var(--red);font-weight:600">${remain} kalan</div>` : ''}
              </div>
              ${Auth.canEdit() ? `
              <button class="quick-pay-btn ${stripeClass}" onclick="cyclePayStatus(event,'${r.id}')">
                ${payLabel.text}
              </button>` : `<span class="quick-pay-btn ${stripeClass}">${payLabel.text}</span>`}
            </div>
          </div>
        </div>`;
      } else {
        gHtml += `
        <div class="res-list-row ${staggerCls} searchable-item" data-search="${searchStr}" onclick="Router.navigate('/reservation/${r.id}')">
          <div class="rlr-avatar" style="background:${col}">${ini}</div>
          <div class="rlr-name">${nm} <span class="rlr-sub">• ${pax} kişi • ${days} gün</span></div>
          <div class="rlr-date">${sd}</div>
          <div class="rlr-badges">${badges}</div>
          <div class="rlr-pay">
            <span class="badge badge-${stripeClass === 'paid' ? 'green' : stripeClass === 'partial' ? 'orange' : 'gray'}" style="margin-right:8px;cursor:pointer" ${Auth.canEdit() ? `onclick="cyclePayStatus(event,'${r.id}')"` : ''}>${payLabel.text}</span>
            <span style="font-weight:600">${total}</span>
            ${remain ? `<span style="font-size:11px;color:var(--red);font-weight:600;display:block;margin-top:1px">${remain} kalan</span>` : ''}
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
