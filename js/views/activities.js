/* views/activities.js — Yaklaşan Aktiviteler */

function renderActivitiesView() {
  const rs = DB.reservations;
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayMs = today.getTime();

  // Helper to parse dates
  const parseDate = (dStr) => {
    if (!dStr) return 0;
    // Attempt to parse YYYY-MM-DD or YYYY-MM-DDTHH:MM
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // 1. Balonlar
  const balloons = [];
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    if (r.balloon && r.balloon.active && r.balloon.date) {
      const ms = parseDate(r.balloon.date);
      if (ms >= todayMs) {
        // Collect guests with balloon = true
        const activeGuests = (r.guests || []).filter(g => g.balloon).map(g => `${g.firstName} ${g.lastName}`);
        if (activeGuests.length > 0) {
          balloons.push({
            time: ms,
            dateStr: r.balloon.date,
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            guests: activeGuests
          });
        }
      }
    }
  });
  balloons.sort((a,b) => a.time - b.time);

  // 2. Turlar
  const tours = [];
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    (r.tours || []).forEach(t => {
      if (t.date) {
        const ms = parseDate(t.date);
        if (ms >= todayMs) {
          const opt = DB.tourOptions.find(o => o.id === t.tourId);
          tours.push({
            time: ms,
            dateStr: t.date,
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            tourName: opt ? `${opt.icon} ${opt.name}` : 'Bilinmeyen Tur',
            pax: r.guestCount || 1
          });
        }
      }
    });
  });
  tours.sort((a,b) => a.time - b.time);

  // 3. Uçuşlar
  const flights = [];
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    (r.flights || []).forEach(f => {
      const timeStr = f.direction === 'giriş' ? f.arrivalTime : f.departureTime;
      if (timeStr) {
        const ms = parseDate(timeStr);
        if (ms >= todayMs) {
          flights.push({
            time: ms,
            dateStr: timeStr.replace('T', ' '),
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            flightNo: f.flightNo,
            route: `${f.fromAirport} → ${f.toAirport}`,
            dir: f.direction === 'giriş' ? '🛬 Varış' : '🛫 Kalkış',
            pax: r.guestCount || 1
          });
        }
      }
    });
  });
  flights.sort((a,b) => a.time - b.time);

  // 4. Oteller
  const hotels = [];
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    (r.hotels || []).forEach(h => {
      const opt = DB.hotelOptions.find(o => o.id === h.hotelId);
      const hName = opt ? opt.name : 'Bilinmeyen Otel';
      
      if (h.checkin) {
        const inMs = parseDate(h.checkin);
        if (inMs >= todayMs) {
          hotels.push({
            time: inMs,
            dateStr: h.checkin,
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            hotelName: hName,
            type: 'Giriş (Check-in)',
            color: 'var(--green)'
          });
        }
      }
      if (h.checkout) {
        const outMs = parseDate(h.checkout);
        if (outMs >= todayMs) {
          hotels.push({
            time: outMs,
            dateStr: h.checkout,
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            hotelName: hName,
            type: 'Çıkış (Check-out)',
            color: 'var(--red)'
          });
        }
      }
    });
  });
  hotels.sort((a,b) => a.time - b.time);

  // 5. Transferler
  const transfers = [];
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    (r.transfers || []).forEach(tf => {
      if (tf.date) {
        const ms = parseDate(tf.date + (tf.time ? 'T'+tf.time : ''));
        if (ms >= todayMs) {
          transfers.push({
            time: ms,
            dateStr: tf.date + (tf.time ? ' ' + tf.time : ''),
            resId: r.id,
            resName: `${r.personal.firstName} ${r.personal.lastName}`,
            route: `${tf.from} → ${tf.to}`,
            note: tf.note,
            pax: r.guestCount || 1
          });
        }
      }
    });
  });
  transfers.sort((a,b) => a.time - b.time);

  // HTML Üretimi
  const renderCard = (content) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:12px;box-shadow:var(--shadow-sm);transition:transform var(--ease);cursor:default" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      ${content}
    </div>
  `;

  const emptyMsg = '<div style="font-size:13px;color:var(--text-muted);padding:10px;text-align:center;background:var(--card);border-radius:var(--radius-sm);border:1px dashed var(--border)">Yaklaşan kayıt bulunamadı. 🎉</div>';

  const balloonHTML = balloons.length ? balloons.map((b,i) => renderCard(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;animation:fadeUp 0.3s ease-out forwards;animation-delay:${i*0.05}s;opacity:0">
      <div style="font-weight:700;color:var(--text);font-size:15px">🎈 ${formatDate(b.dateStr)}</div>
      <a href="#/reservation/${b.resId}" class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--orange);padding:4px 8px">Grup: ${b.resName} →</a>
    </div>
    <div style="font-size:13px;color:var(--text-sec)">
      <strong>Uçacak Kişiler (${b.guests.length}):</strong><br>
      ${b.guests.join(', ')}
    </div>
  `)).join('') : emptyMsg;

  const tourHTML = tours.length ? tours.map((t,i) => renderCard(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;animation:fadeUp 0.3s ease-out forwards;animation-delay:${i*0.05}s;opacity:0">
      <div style="font-weight:700;color:var(--text);font-size:15px">${t.tourName}</div>
      <a href="#/reservation/${t.resId}" class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--orange);padding:4px 8px">Grup: ${t.resName} →</a>
    </div>
    <div style="font-size:13px;color:var(--text-sec)">
      📅 Tarih: <strong>${formatDate(t.dateStr)}</strong> &nbsp; | &nbsp; 👥 Kişi: <strong>${t.pax}</strong>
    </div>
  `)).join('') : emptyMsg;

  const flightHTML = flights.length ? flights.map((f,i) => renderCard(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;animation:fadeUp 0.3s ease-out forwards;animation-delay:${i*0.05}s;opacity:0">
      <div style="font-weight:700;color:var(--text);font-size:15px">${f.dir} - ${f.flightNo}</div>
      <a href="#/reservation/${f.resId}" class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--orange);padding:4px 8px">Grup: ${f.resName} →</a>
    </div>
    <div style="font-size:13px;color:var(--text-sec)">
      📅 Zaman: <strong>${f.dateStr}</strong><br>
      ✈️ Rota: <strong>${f.route}</strong> &nbsp; | &nbsp; 👥 Kişi: <strong>${f.pax}</strong>
    </div>
  `)).join('') : emptyMsg;

  const hotelHTML = hotels.length ? hotels.map((h,i) => renderCard(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;animation:fadeUp 0.3s ease-out forwards;animation-delay:${i*0.05}s;opacity:0">
      <div style="font-weight:700;color:${h.color};font-size:15px">${h.type}</div>
      <a href="#/reservation/${h.resId}" class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--orange);padding:4px 8px">Grup: ${h.resName} →</a>
    </div>
    <div style="font-size:13px;color:var(--text-sec)">
      🏨 Otel: <strong>${h.hotelName}</strong><br>
      📅 Tarih: <strong>${formatDate(h.dateStr)}</strong>
    </div>
  `)).join('') : emptyMsg;

  const transferHTML = transfers.length ? transfers.map((t,i) => renderCard(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;animation:fadeUp 0.3s ease-out forwards;animation-delay:${i*0.05}s;opacity:0">
      <div style="font-weight:700;color:var(--text);font-size:15px">🚌 ${t.route}</div>
      <a href="#/reservation/${t.resId}" class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--orange);padding:4px 8px">Grup: ${t.resName} →</a>
    </div>
    <div style="font-size:13px;color:var(--text-sec)">
      📅 Zaman: <strong>${t.dateStr}</strong> &nbsp; | &nbsp; 👥 Kişi: <strong>${t.pax}</strong>
      ${t.note ? `<br>📝 Not: <em style="color:var(--text-muted)">${t.note}</em>` : ''}
    </div>
  `)).join('') : emptyMsg;

  return `
  <div style="max-width:960px;margin:0 auto;padding-bottom:50px">
    
    <div class="tabs" id="actTabs">
      <button class="tab-btn active" data-tab="act-balon" onclick="switchActTab(this,'act-balon')">🎈 Balonlar</button>
      <button class="tab-btn" data-tab="act-tur" onclick="switchActTab(this,'act-tur')">🏷️ Turlar</button>
      <button class="tab-btn" data-tab="act-ucus" onclick="switchActTab(this,'act-ucus')">✈️ Uçuşlar</button>
      <button class="tab-btn" data-tab="act-otel" onclick="switchActTab(this,'act-otel')">🏨 Oteller</button>
      <button class="tab-btn" data-tab="act-transfer" onclick="switchActTab(this,'act-transfer')">🚌 Transferler</button>
    </div>

    <style>
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>

    <!-- Sekmeler -->
    <div class="tab-content active" id="tc-act-balon">
      <div class="sec-title" style="margin-bottom:16px">Yaklaşan Balon Uçuşları (Bugün ve Sonrası)</div>
      ${balloonHTML}
    </div>

    <div class="tab-content" id="tc-act-tur">
      <div class="sec-title" style="margin-bottom:16px">Yaklaşan Turlar (Bugün ve Sonrası)</div>
      ${tourHTML}
    </div>

    <div class="tab-content" id="tc-act-ucus">
      <div class="sec-title" style="margin-bottom:16px">Yaklaşan Uçuşlar (Bugün ve Sonrası)</div>
      ${flightHTML}
    </div>

    <div class="tab-content" id="tc-act-otel">
      <div class="sec-title" style="margin-bottom:16px">Yaklaşan Otel Giriş/Çıkışları (Bugün ve Sonrası)</div>
      ${hotelHTML}
    </div>

    <div class="tab-content" id="tc-act-transfer">
      <div class="sec-title" style="margin-bottom:16px">Yaklaşan Transferler (Bugün ve Sonrası)</div>
      ${transferHTML}
    </div>

  </div>
  `;
}

function switchActTab(btn, tabId) {
  document.querySelectorAll('#actTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('[id^="tc-act-"]').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}
