/* views/dashboard.js — Ana Sayfa (Dashboard) */

function renderDashboardView() {
  const today = todayStr();
  const evList = DB.getEventsForDate(today);

  // Bugün İstatistikleri
  const tourCnt     = evList.filter(e => e.events.some(ev => ev.type === 'tour')).length;
  const flightCnt   = evList.filter(e => e.events.some(ev => ev.type === 'flight')).length;
  const transferCnt = evList.filter(e => e.events.some(ev => ev.type === 'transfer')).length;
  const totalGuests = evList.reduce((sum, e) => sum + (e.reservation.guestCount || 1), 0);

  // Bu hafta finans tahmini (Bugünden itibaren 7 gün)
  const d = new Date();
  let weekIncome = 0;
  let pendingPayments = 0;
  for(let i=0; i<7; i++) {
    const ds = d.toISOString().split('T')[0];
    const dayEvs = DB.getEventsForDate(ds);
    
    // Her rezervasyon haftada 1 kez sayılmalı finans için.
    // Kolaylık olsun diye: başlangıç tarihi bu hafta içinde olanların gelirleri.
    // Daha doğru bir analiz için tüm rezervasyonlar taranabilir.
  }
  
  // Sadece tüm rezervasyonları tarayalım
  const rs = DB.reservations;
  rs.forEach(r => {
    const sd = new Date(r.startDate + 'T00:00:00');
    const diff = (sd - new Date(today + 'T00:00:00')) / 86400000;
    if (diff >= 0 && diff <= 7) {
      weekIncome += (r.payment?.total || 0);
      if (r.payment?.status !== 'ödendi') pendingPayments++;
    }
  });

  const cur = DB.settings.currency || 'EUR';

  let todayEventsHTML = '';
  if (evList.length === 0) {
    todayEventsHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Bugün için planlanmış etkinlik yok.</div>`;
  } else {
    todayEventsHTML = evList.map(({reservation, events}) => {
      const nm = `${reservation.personal.firstName} ${reservation.personal.lastName}`;
      const badges = events.map(ev => {
        if (ev.type === 'tour') return `🏷️ Tur`;
        if (ev.type === 'balloon') return `🎈 Balon`;
        if (ev.type === 'flight') return `✈️ Uçuş`;
        if (ev.type === 'transfer') return `🚌 Transfer`;
        if (ev.type === 'checkin') return `🏨 Giriş`;
        if (ev.type === 'checkout') return `🏨 Çıkış`;
        return '';
      }).join(' ');
      return `
      <div class="dash-event-item" onclick="Router.navigate('/reservation/${reservation.id}')">
        <div class="dei-name">${nm} <span style="color:var(--text-muted);font-size:11px;margin-left:6px">${reservation.guestCount||1} Kişi</span></div>
        <div class="dei-badges">${badges}</div>
      </div>`;
    }).join('');
  }

  // Son Eklenen 5 Rezervasyon
  const recent = [...rs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5);
  let recentHTML = recent.map(r => `
    <div class="dash-event-item" onclick="Router.navigate('/reservation/${r.id}')">
      <div class="dei-name">${r.personal.firstName} ${r.personal.lastName}</div>
      <div class="dei-badges">${formatDate(r.startDate)} — ${r.days} Gün</div>
    </div>
  `).join('');

  return `
  <div style="max-width:960px;margin:0 auto;padding-bottom:50px">
    
    <!-- Top Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:20px;margin-bottom:30px">
      
      <!-- Bugün -->
      <div class="dash-stat-card stagger-1" style="background:linear-gradient(135deg, var(--card) 0%, rgba(249,115,22,.08) 100%)">
        <div class="dsc-title">📅 Bugün</div>
        <div class="dsc-main">${evList.length} <span class="dsc-sub">Grup</span> · ${totalGuests} <span class="dsc-sub">Kişi</span></div>
        <div class="dsc-icons">✈️ ${flightCnt} &nbsp;&nbsp; 🚌 ${transferCnt} &nbsp;&nbsp; 🏷️ ${tourCnt}</div>
      </div>

      <!-- Finans (Sadece Patron Görür) -->
      ${Auth.isOwner() ? `
      <div class="dash-stat-card stagger-2" style="background:linear-gradient(135deg, var(--card) 0%, rgba(34,197,94,.08) 100%)">
        <div class="dsc-title">💰 Bu Hafta (Öngörülen Ciro)</div>
        <div class="dsc-main" style="color:var(--green)">${formatCurrency(weekIncome, cur)}</div>
        <div class="dsc-icons">${pendingPayments} Bekleyen Ödeme</div>
      </div>
      ` : ''}
    </div>

    <!-- Lists -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:20px">
      
      <div class="card stagger-3">
        <div class="sec-title" style="display:flex;justify-content:space-between">
          <span>Bugünün Etkinlikleri</span>
          <a href="#" onclick="Router.navigate('/day/${today.replace(/-/g,'/')}')" style="color:var(--orange);font-size:11px">Tümünü Gör</a>
        </div>
        <div class="dash-event-list">${todayEventsHTML}</div>
      </div>

      <div class="card stagger-4">
        <div class="sec-title">Son Eklenen Rezervasyonlar</div>
        <div class="dash-event-list">${recentHTML}</div>
      </div>

    </div>

  </div>`;
}
