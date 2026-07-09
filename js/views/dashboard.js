/* views/dashboard.js — Ana Sayfa (Dashboard) */

function renderDashboardView() {
  const today = todayStr();
  const evList = DB.getEventsForDate(today);

  // Bugün İstatistikleri
  const tourCnt     = evList.filter(e => e.events.some(ev => ev.type === 'tour')).length;
  const flightCnt   = evList.filter(e => e.events.some(ev => ev.type === 'flight')).length;
  const transferCnt = evList.filter(e => e.events.some(ev => ev.type === 'transfer')).length;
  const totalGuests = evList.reduce((sum, e) => sum + (e.reservation.guestCount || 1), 0);

  const cur = DB.settings.currency || 'EUR';
  const rs = DB.reservations;

  let todayEventsHTML = '';
  if (evList.length === 0) {
    todayEventsHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Bugün için planlanmış etkinlik yok.</div>`;
  } else {
    todayEventsHTML = evList.map(({reservation, events}) => {
      const nm = `${reservation.personal?.firstName||''} ${reservation.personal?.lastName||''}`.trim() || 'İsimsiz';
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

  // Ortak (Bugün kartı)
  const todayCard = `
    <div class="card stagger-3" style="margin-bottom:20px">
      <div class="sec-title" style="display:flex;justify-content:space-between">
        <span>Bugünün Etkinlikleri</span>
        <a href="#" onclick="Router.navigate('/day/${today.replace(/-/g,'/')}')" style="color:var(--orange);font-size:11px">Tümünü Gör</a>
      </div>
      <div class="dash-event-list">${todayEventsHTML}</div>
    </div>
  `;

  if (Auth.isOwner()) {
    // PATRON GÖRÜNÜMÜ
    const now = new Date();
    const d = new Date();
    let weekIncome = 0;
    let pendingCount = 0;
    
    // Bu ay tahsil edilen
    let monthPaid = 0;
    // Toplam alacak
    let totalPending = 0;

    rs.forEach(r => {
      if (r.status === 'kapandi') return;
      const sd = new Date(r.startDate + 'T00:00:00');
      const diff = (sd - new Date(today + 'T00:00:00')) / 86400000;
      if (diff >= 0 && diff <= 7) {
        weekIncome += (r.payment?.total || 0);
        if (r.payment?.status !== 'ödendi') pendingCount++;
      }
      
      const rTot = r.payment?.total || 0;
      const rPaid = r.payment?.paid || 0;
      if (rTot - rPaid > 0) {
        totalPending += (rTot - rPaid);
      }

      // Bu ay ödenenleri geçmişten bul
      if (r.payment?.history) {
        r.payment.history.forEach(h => {
          if (!h.date) return;
          const hDate = new Date(h.date + 'T00:00:00');
          if (hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear()) {
            monthPaid += h.amount;
          }
        });
      }
    });

    const recent = [...rs].filter(r => r.status !== 'kapandi').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5);
    const recentHTML = recent.map(r => `
      <div class="dash-event-item" onclick="Router.navigate('/reservation/${r.id}')">
        <div class="dei-name">${r.personal?.firstName} ${r.personal?.lastName}</div>
        <div class="dei-badges">${formatDate(r.startDate)} — ${r.days} Gün</div>
      </div>
    `).join('');

    return `
    <div style="max-width:960px;margin:0 auto;padding-bottom:50px">
      <!-- Finansal Kartlar -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:20px;margin-bottom:30px">
        <div class="dash-stat-card stagger-1" style="background:linear-gradient(135deg, var(--card) 0%, rgba(34,197,94,.08) 100%)">
          <div class="dsc-title">💰 Bu Hafta (Öngörülen Ciro)</div>
          <div class="dsc-main" style="color:var(--green)">${formatCurrency(weekIncome, cur)}</div>
          <div class="dsc-icons">${pendingCount} Bekleyen</div>
        </div>
        <div class="dash-stat-card stagger-1" style="background:linear-gradient(135deg, var(--card) 0%, rgba(34,197,94,.08) 100%)">
          <div class="dsc-title">💼 Bu Ay Tahsil Edilen</div>
          <div class="dsc-main" style="color:var(--green)">${formatCurrency(monthPaid, cur)}</div>
          <div class="dsc-icons">Nakit Akışı</div>
        </div>
        <div class="dash-stat-card stagger-2" style="background:linear-gradient(135deg, var(--card) 0%, rgba(239,68,68,.08) 100%)">
          <div class="dsc-title">⚠️ Toplam Alacak (Bekleyen)</div>
          <div class="dsc-main" style="color:var(--red)">${formatCurrency(totalPending, cur)}</div>
          <div class="dsc-icons">Açık Hesaplar</div>
        </div>
      </div>

      <!-- Borçlu & Yaklaşan Aktivite Uyarısı -->
      ${(() => {
        const now14 = new Date(); now14.setDate(now14.getDate() + 14);
        const todayDt = new Date(); todayDt.setHours(0,0,0,0);
        const debtWarnings = rs.filter(r => {
          if (r.status === 'kapandi') return false;
          const remaining = (r.payment?.total || 0) - (r.payment?.paid || 0);
          if (remaining <= 0) return false;
          return (r.tours||[]).some(t => { const d = t.date ? new Date(t.date+'T00:00:00') : null; return d && d >= todayDt && d <= now14; }) ||
            (r.balloon?.active && r.balloon?.date && (() => { const d = new Date(r.balloon.date+'T00:00:00'); return d >= todayDt && d <= now14; })());
        }).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        if (!debtWarnings.length) return '';
        return `<div style="background:var(--red-dim);border:1px solid var(--red);border-left:4px solid var(--red);border-radius:var(--radius);padding:16px 20px;margin-bottom:24px">
          <div style="font-size:15px;font-weight:700;color:var(--red);margin-bottom:12px">⚠️ Borçlu &amp; Yaklaşan Aktivite (${debtWarnings.length} Rezervasyon)</div>
          ${debtWarnings.map(r => {
            const remaining = (r.payment?.total||0) - (r.payment?.paid||0);
            const cur2 = r.payment?.currency || 'EUR';
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(239,68,68,.2);cursor:pointer" onclick="Router.navigate(\'/reservation/' + r.id + '\')">' +
              '<div><div style="font-weight:600;font-size:14px">' + r.personal?.firstName + ' ' + r.personal?.lastName + '</div>' +
              '<div style="font-size:12px;color:var(--text-sec)">Başlangıç: ' + formatDate(r.startDate) + ' · ' + r.guestCount + ' Kişi</div></div>' +
              '<div style="font-weight:700;color:var(--red);font-size:15px">' + formatCurrency(remaining, cur2) + '</div>' +
              '</div>';
          }).join('')}
        </div>`;
      })()}

      <!-- Ortak Listeler -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:20px">
        <div>${todayCard}</div>
        <div class="card stagger-4">
          <div class="sec-title">Son Eklenen Rezervasyonlar</div>
          <div class="dash-event-list">${recentHTML}</div>
        </div>
      </div>
    </div>`;

  } else if (Auth.canEdit()) {
    // EDİTÖR GÖRÜNÜMÜ
    const now = new Date();
    const weekStart = new Date(now); 
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart); 
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    
    // Bu Hafta Gelenler
    const thisWeekReservations = rs.filter(r => {
      if (r.status === 'kapandi') return false;
      const sd = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
      return sd && sd >= weekStart && sd <= weekEnd;
    }).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

    const thisWeekHTML = thisWeekReservations.length === 0 ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Bu hafta gelen yeni rezervasyon yok.</div>` : thisWeekReservations.map(r => `
      <div class="dash-event-item" onclick="Router.navigate('/reservation/${r.id}')">
        <div class="dei-name">${r.personal?.firstName} ${r.personal?.lastName}</div>
        <div class="dei-badges">${formatDate(r.startDate)} (${r.guestCount} Kişi)</div>
      </div>
    `).join('');

    // Yaklaşan Transferler
    const upcomingTransfers = rs.filter(r => r.status !== 'kapandi')
      .flatMap(r => (r.transfers||[]).map(tf => ({ ...tf, resId: r.id, resName: r.personal?.firstName + ' ' + r.personal?.lastName })))
      .filter(tf => {
        if (!tf.date) return false;
        const d = new Date(tf.date + 'T00:00:00');
        return d >= weekStart && d <= weekEnd;
      })
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(0, 7);

    const transfersHTML = upcomingTransfers.length === 0 ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Bu hafta transfer yok.</div>` : upcomingTransfers.map(tf => {
      const tOption = DB.transferOptions.find(x => x.id === tf.transferId);
      const tfName = tOption ? tOption.name : (tf.from + ' -> ' + tf.to);
      return `
      <div class="dash-event-item" onclick="Router.navigate('/reservation/${tf.resId}')">
        <div class="dei-name">${tf.resName}</div>
        <div class="dei-badges">🚌 ${tfName} — ${formatDate(tf.date)} ${tf.time||''}</div>
      </div>`;
    }).join('');

    return `
    <div style="max-width:960px;margin:0 auto;padding-bottom:50px">
      ${todayCard}
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:20px">
        <div class="card stagger-4">
          <div class="sec-title">Bu Hafta Gelenler</div>
          <div class="dash-event-list">${thisWeekHTML}</div>
        </div>
        <div class="card stagger-5">
          <div class="sec-title">Yaklaşan Transferler (Bu Hafta)</div>
          <div class="dash-event-list">${transfersHTML}</div>
        </div>
      </div>
    </div>`;

  } else {
    // VİEWER GÖRÜNÜMÜ
    return `
    <div style="max-width:700px;margin:0 auto;padding-bottom:50px">
      ${todayCard}
    </div>`;
  }
}
