/* views/reservations-list.js — Rezervasyon listesi (v3 Premium Kart) */

function renderReservationsList() {
  const rs = DB.reservations || [];

  setTimeout(() => {
    const actions = document.getElementById('headerActions');
    if (actions && Auth.canEdit()) {
      actions.innerHTML = `<button class="btn btn-primary" onclick="Router.navigate('/reservation/new')">＋ Yeni Ekle</button>`;
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

  const sorted = [...rs].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  let html = `<div class="tourists-grid">`;

  sorted.forEach((r, i) => {
    const fn  = r.personal.firstName;
    const ln  = r.personal.lastName;
    const nm  = `${fn} ${ln}`;
    const ini = getInitials(fn, ln);
    const col = avatarColor(nm);

    // Başlangıç tarihi parçaları
    const sd    = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
    const day   = sd ? sd.getDate() : '—';
    const mon   = sd ? MONTHS_TR[sd.getMonth()].substring(0, 3) : '';

    // Ödeme stripe rengi
    const status = r.payment?.status || 'bekliyor';
    const stripeClass = status === 'ödendi' ? 'paid' : status === 'kısmi' ? 'partial' : 'pending';

    // Ödeme badge metni ve rengi
    const PAY_LABELS = {
      'ödendi':  { text: '✅ Ödendi',       cls: 'paid'    },
      'kısmi':   { text: '🔶 Kısmi',        cls: 'partial' },
      'bekliyor':{ text: '⏳ Bekliyor',      cls: 'pending' },
    };
    const payLabel = PAY_LABELS[status] || { text: status, cls: 'pending' };

    // Para
    const cur   = r.payment?.currency || DB.settings?.currency || 'EUR';
    const total = formatCurrency(r.payment?.total || 0, cur);
    const paid  = formatCurrency(r.payment?.paid || 0, cur);

    // Etkinlik ikonları
    const icons = [];
    if (r.balloon?.active) icons.push(`<span class="res-card-icon-badge badge-red">🎈 Balon</span>`);
    if (r.tours?.length) {
      const t = DB.tourOptions.find(o => o.id === r.tours[0].tourId);
      if (t) icons.push(`<span class="res-card-icon-badge badge-orange">${t.icon} ${t.name}</span>`);
      if (r.tours.length > 1) icons.push(`<span class="res-card-icon-badge badge-orange">+${r.tours.length-1} tur</span>`);
    }
    if (r.flights?.length) icons.push(`<span class="res-card-icon-badge badge-blue">✈️ ${r.flights.length} Uçuş</span>`);
    if (r.transfers?.length) icons.push(`<span class="res-card-icon-badge badge-green">🚌 ${r.transfers.length} Transfer</span>`);
    if (r.hotels?.length) {
      const h = DB.hotelOptions.find(o => o.id === r.hotels[0].hotelId);
      if (h) icons.push(`<span class="res-card-icon-badge badge-purple">🏨 ${h.name.split(' ')[0]}</span>`);
    }

    // Kişi sayısı göstergesi
    const guestText = `${r.guestCount || 1} Kişi`;
    const dayText   = `${r.days || 1} Gün`;
    const staggerCls = i < 10 ? `stagger-${(i%5)+1}` : '';

    html += `
    <div class="res-card ${staggerCls}" onclick="Router.navigate('/reservation/${r.id}')">
      <div class="res-card-stripe ${stripeClass}"></div>
      <div class="res-card-body">

        <!-- Üst: Avatar + İsim + Tarih -->
        <div class="res-card-top">
          <div class="res-card-avatar" style="background:${col}">${ini}</div>
          <div style="flex:1;min-width:0">
            <div class="res-card-name">${nm}</div>
            <div class="res-card-meta">👥 ${guestText} &nbsp;·&nbsp; 📅 ${dayText}</div>
          </div>
          <div class="res-card-date">
            <div class="res-card-date-day">${day}</div>
            <div class="res-card-date-mon">${mon}</div>
          </div>
        </div>

        <!-- Orta: Etkinlik ikonları -->
        ${icons.length ? `<div class="res-card-icons">${icons.join('')}</div>` : '<div style="margin-bottom:13px"></div>'}

        <!-- Alt: Tutar + Hızlı Ödeme Değiştir -->
        <div class="res-card-footer" onclick="event.stopPropagation()">
          <div>
            <div class="res-card-amount">${total}</div>
            <div class="res-card-amount-sub">${paid} ödendi</div>
          </div>
          ${Auth.canEdit() ? `
          <button class="quick-pay-btn ${stripeClass}" onclick="cyclePayStatus(event,'${r.id}')">
            ${payLabel.text}
          </button>` : `<span class="quick-pay-btn ${stripeClass}">${payLabel.text}</span>`}
        </div>

      </div>
    </div>`;
  });

  html += `</div>`;
  return html;
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
