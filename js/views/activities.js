/* views/activities.js — Yaklaşan Aktiviteler (Kanban Board) */

let activitiesStartDate = todayStr(); // Global state for the date picker

function changeActivitiesDate(val) {
  activitiesStartDate = val || todayStr();
  Router.navigate('/activities'); // Refresh the view
}

function renderActivitiesView() {
  const rs = DB.reservations;
  
  const startDt = new Date(activitiesStartDate + 'T00:00:00');
  
  // Create an array of 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDt);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().split('T')[0], // YYYY-MM-DD
      dateObj: d,
      events: []
    });
  }

  // Collect events and push to corresponding day
  rs.forEach(r => {
    if (r.status === 'kapandi') return;
    
    // 1. Balloons
    if (r.balloon && r.balloon.active && r.balloon.date) {
      const activeGuests = (r.guests || []).filter(g => g.balloon).map(g => `${g.firstName} ${g.lastName}`);
      if (activeGuests.length > 0) {
        const idx = days.findIndex(d => d.dateStr === r.balloon.date);
        if (idx !== -1) {
          days[idx].events.push({
            type: 'balloon', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${activeGuests.length} Kişi Uçuş`,
            time: '05:00', // Balon sabah erken
            ico: '🎈', color: 'var(--red)',
            resId: r.id
          });
        }
      }
    }
    
    // 2. Tours
    (r.tours || []).forEach(t => {
      if (t.date) {
        const idx = days.findIndex(d => d.dateStr === t.date);
        if (idx !== -1) {
          const opt = DB.tourOptions.find(o => o.id === t.tourId);
          days[idx].events.push({
            type: 'tour', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${opt ? opt.name : 'Tur'} · ${r.guestCount} Kişi`,
            time: '09:00',
            ico: opt ? opt.icon : '🏷️', color: 'var(--orange)',
            resId: r.id
          });
        }
      }
    });

    // 3. Flights
    (r.flights || []).forEach(f => {
      const timeStr = f.direction === 'giriş' ? f.arrivalTime : f.departureTime;
      if (timeStr) {
        const tDate = timeStr.split('T')[0];
        const tTime = timeStr.split('T')[1] || '';
        const idx = days.findIndex(d => d.dateStr === tDate);
        if (idx !== -1) {
          days[idx].events.push({
            type: 'flight', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${f.flightNo||''} ${f.fromAirport||''}→${f.toAirport||''} (${f.direction === 'giriş' ? 'Varış' : 'Kalkış'})`,
            time: tTime.substring(0,5),
            ico: f.direction === 'giriş' ? '🛬' : '🛫', color: 'var(--blue)',
            resId: r.id
          });
        }
      }
    });

    // 4. Hotels
    (r.hotels || []).forEach(h => {
      const opt = DB.hotelOptions.find(o => o.id === h.hotelId);
      const hName = opt ? opt.name : 'Otel';
      
      if (h.checkin) {
        const idx = days.findIndex(d => d.dateStr === h.checkin);
        if (idx !== -1) {
          days[idx].events.push({
            type: 'checkin', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${hName} (Check-in)`,
            time: '14:00',
            ico: '🏨', color: 'var(--green)',
            resId: r.id
          });
        }
      }
      if (h.checkout) {
        const idx = days.findIndex(d => d.dateStr === h.checkout);
        if (idx !== -1) {
          days[idx].events.push({
            type: 'checkout', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${hName} (Check-out)`,
            time: '12:00',
            ico: '🏨', color: 'var(--red)',
            resId: r.id
          });
        }
      }
    });

    // 5. Transfers
    (r.transfers || []).forEach(tf => {
      if (tf.date) {
        const idx = days.findIndex(d => d.dateStr === tf.date);
        if (idx !== -1) {
          days[idx].events.push({
            type: 'transfer', title: `${r.personal.firstName} ${r.personal.lastName}`,
            subtitle: `${tf.from} → ${tf.to}`,
            time: tf.time || '10:00',
            ico: '🚌', color: 'var(--purple)',
            resId: r.id
          });
        }
      }
    });
  });

  // Sort events inside each day by time
  days.forEach(d => {
    d.events.sort((a,b) => (a.time||'').localeCompare(b.time||''));
  });

  // Render HTML
  const colsHtml = days.map(d => {
    const dayName = d.dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
    const dayNum = d.dateObj.getDate();
    const monthName = d.dateObj.toLocaleDateString('tr-TR', { month: 'short' });
    
    const evsHtml = d.events.map(e => `
      <div class="kanban-card" onclick="Router.navigate('/reservation/${e.resId}')">
        <div class="kc-title">
          <span>${e.title}</span>
        </div>
        <div class="kc-sub">
          <span style="display:inline-block;width:14px;text-align:center">${e.ico}</span>
          <span style="font-weight:600;color:${e.color}">${e.time||'—'}</span>
        </div>
        <div style="font-size:11px;color:var(--text-sec);padding-left:18px">${e.subtitle}</div>
      </div>
    `).join('') || '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:30px 0;font-style:italic;opacity:0.6">Kayıt yok.</div>';

    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>${dayNum} ${monthName} - ${dayName}</span>
          <span style="background:var(--bg);padding:2px 8px;border-radius:10px;font-size:12px;color:var(--text-muted)">${d.events.length}</span>
        </div>
        <div class="kanban-col-body">
          ${evsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
  <div style="max-width:1800px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:14px">
      <div class="sec-title" style="margin:0;border:0;padding:0">📋 Yaklaşan Aktiviteler</div>
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-size:13px;font-weight:600;color:var(--text-sec)">Başlangıç:</label>
        <input type="date" class="form-control" style="width:auto" value="${activitiesStartDate}" onchange="changeActivitiesDate(this.value)">
        <button class="btn btn-secondary btn-sm" onclick="changeActivitiesDate('${todayStr()}')">Bugün</button>
      </div>
    </div>
    <div class="kanban-board">
      ${colsHtml}
    </div>
  </div>`;
}
