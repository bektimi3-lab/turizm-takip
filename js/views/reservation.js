/* views/reservation.js — Rezervasyon profil görünümü */

function renderReservationProfile(res) {
  // Görüntüleme kaydı
  DB.logView(res.id);

  const { personal, guests, guestCount, hotels, tours, balloon, flights, transfers, payment, notes } = res;
  const fn   = personal?.firstName || '';
  const ln   = personal?.lastName  || '';
  const nm   = `${fn} ${ln}`;
  const col  = avatarColor(nm);
  const ini  = getInitials(fn, ln);
  const ps   = payStatusBadge(payment);
  const cur  = payment?.currency || DB.settings.currency || 'EUR';
  const can  = Auth.canEdit();

  /* Payment */
  const total   = Number(payment?.total  || 0);
  const paid    = Number(payment?.paid   || 0);
  const remain  = total - paid;
  const pct     = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const pctCol  = pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

  /* Kişiler Listesi */
  const guestsHTML = guests?.length 
    ? guests.map((g, i) => `
      <div class="info-grid" style="padding-bottom:12px; border-bottom:1px solid var(--border); margin-bottom:12px">
        <div style="grid-column:1/-1;font-weight:600;font-size:13.5px">${g.firstName} ${g.lastName}</div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;margin-top:2px">
          ${g.nationality ? `<span>🌍 ${g.nationality}</span>` : ''}
          ${g.gender ? `<span>🚻 ${g.gender}</span>` : ''}
          ${g.passport ? `<span>🛂 ${g.passport}</span>` : ''}
          ${g.dob ? `<span>🎂 ${formatDate(g.dob)}</span>` : ''}
        </div>
        <div><div class="info-lbl">Doğum Tarihi</div><div class="info-val">${formatDate(g.dob)}</div></div>
        <div><div class="info-lbl">Pasaport Başlangıç</div><div class="info-val">${formatDate(g.passportStart)}</div></div>
        <div><div class="info-lbl">Pasaport Bitiş</div><div class="info-val">${formatDate(g.passportEnd)}</div></div>
      </div>`).join('')
    : '<div style="color:var(--text-muted);font-size:13px">Yolcu detayı girilmemiş.</div>';

  /* Tours timeline */
  const toursHTML = !(tours?.length)
    ? '<div style="color:var(--text-muted);font-size:13px">Tur eklenmemiş.</div>'
    : tours.map(tr => {
        const t = DB.tourOptions.find(x => x.id === tr.tourId);
        return `<div class="tl-item">
          <div class="tl-ico tour">${t?.icon || '🏷️'}</div>
          <div class="tl-content">
            <div class="tl-title">${t?.name || 'Bilinmeyen Tur'}</div>
            <div class="tl-meta">${formatDate(tr.date)}</div>
          </div>
        </div>`;
      }).join('');

  /* Flights timeline */
  const flightsHTML = !(flights?.length)
    ? '<div style="color:var(--text-muted);font-size:13px">Uçuş eklenmemiş.</div>'
    : flights.map(f => `<div class="tl-item">
        <div class="tl-ico flight">${f.direction==='giriş'?'🛬':'🛫'}</div>
        <div class="tl-content">
          <div class="tl-title">${f.flightNo||'—'} — ${f.direction==='giriş'?'Giriş':'Çıkış'}</div>
          <div class="tl-meta">
            ${f.fromAirport||'—'} → ${f.toAirport||'—'}<br>
            Kalkış: ${formatDateTime(f.departureTime)} &nbsp;·&nbsp; Varış: ${formatDateTime(f.arrivalTime)}
          </div>
        </div>
      </div>`).join('');

  /* Transfers timeline */
  const transHTML = !(transfers?.length)
    ? '<div style="color:var(--text-muted);font-size:13px">Transfer eklenmemiş.</div>'
    : transfers.map(tf => {
        const t = DB.transferOptions.find(x => x.id === tf.transferId);
        return `<div class="tl-item">
          <div class="tl-ico transfer">🚌</div>
          <div class="tl-content">
            <div class="tl-title">${t?.name || 'Transfer'}</div>
            <div class="tl-meta">${formatDate(tf.date)} ${tf.time||''} ${tf.note ? '· '+tf.note : ''}</div>
          </div>
        </div>`;
    }).join('');

  /* Hotels timeline */
  const hotelsHTML = !(hotels?.length)
    ? '<div style="color:var(--text-muted);font-size:13px">Otel eklenmemiş.</div>'
    : hotels.map(h => {
        const ht = DB.hotelOptions.find(x => x.id === h.hotelId);
        const n = (h.checkin && h.checkout) ? Math.round((new Date(h.checkout) - new Date(h.checkin)) / 86400000) : 0;
        return `<div class="tl-item">
          <div class="tl-ico checkin">🏨</div>
          <div class="tl-content">
            <div class="tl-title">${ht?.name || 'Otel'}</div>
            <div class="tl-meta">Check-in: ${formatDate(h.checkin)} · Check-out: ${formatDate(h.checkout)} (${n} gece)</div>
          </div>
        </div>`;
    }).join('');

  /* Unified Timeline */
  const tlEvents = [];
  
  if (tours?.length) {
    tours.forEach(tr => {
      const t = DB.tourOptions.find(x => x.id === tr.tourId);
      tlEvents.push({
        date: tr.date ? new Date(tr.date + 'T00:00:00') : null,
        dateStr: formatDate(tr.date),
        ico: t?.icon || '🏷️',
        cls: 'tour',
        title: t?.name || 'Bilinmeyen Tur',
        meta: formatDate(tr.date)
      });
    });
  }

  if (flights?.length) {
    flights.forEach(f => {
      const d = f.departureTime || f.arrivalTime;
      tlEvents.push({
        date: d ? new Date(d) : null,
        dateStr: d ? formatDateTime(d) : '—',
        ico: f.direction==='giriş'?'🛬':'🛫',
        cls: 'flight',
        title: `${f.flightNo||'—'} — ${f.direction==='giriş'?'Giriş':'Çıkış'}`,
        meta: `${f.fromAirport||'—'} → ${f.toAirport||'—'}<br>Kalkış: ${formatDateTime(f.departureTime)} &nbsp;·&nbsp; Varış: ${formatDateTime(f.arrivalTime)}`
      });
    });
  }

  if (transfers?.length) {
    transfers.forEach(tf => {
      const t = DB.transferOptions.find(x => x.id === tf.transferId);
      let dt = null;
      if (tf.date) {
        dt = new Date(tf.date + 'T' + (tf.time || '00:00') + ':00');
      }
      tlEvents.push({
        date: dt,
        dateStr: formatDate(tf.date) + (tf.time ? ' ' + tf.time : ''),
        ico: '🚌',
        cls: 'transfer',
        title: t?.name || 'Transfer',
        meta: `${formatDate(tf.date)} ${tf.time||''} ${tf.note ? '· '+tf.note : ''}`
      });
    });
  }

  if (hotels?.length) {
    hotels.forEach(h => {
      const ht = DB.hotelOptions.find(x => x.id === h.hotelId);
      const n = (h.checkin && h.checkout) ? Math.round((new Date(h.checkout) - new Date(h.checkin)) / 86400000) : 0;
      tlEvents.push({
        date: h.checkin ? new Date(h.checkin + 'T00:00:00') : null,
        dateStr: formatDate(h.checkin),
        ico: '🏨',
        cls: 'checkin',
        title: `${ht?.name || 'Otel'} (Giriş)`,
        meta: `Check-in: ${formatDate(h.checkin)} · Check-out: ${formatDate(h.checkout)} (${n} gece)`
      });
      if (h.checkout) {
        tlEvents.push({
          date: new Date(h.checkout + 'T00:00:00'),
          dateStr: formatDate(h.checkout),
          ico: '🏨',
          cls: 'checkout',
          title: `${ht?.name || 'Otel'} (Çıkış)`,
          meta: `Check-in: ${formatDate(h.checkin)} · Check-out: ${formatDate(h.checkout)} (${n} gece)`
        });
      }
    });
  }

  if (balloon?.active) {
    tlEvents.push({
      date: balloon.date ? new Date(balloon.date + 'T00:00:00') : null,
      dateStr: formatDate(balloon.date),
      ico: '🎈',
      cls: 'balloon',
      title: `Balon Turu (${balloon.count} Kişi)`,
      meta: formatDate(balloon.date)
    });
  }

  // Sort by date (nulls last)
  tlEvents.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date - b.date;
  });

  const timelineHTML = tlEvents.length === 0
    ? '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">Zaman çizelgesine eklenecek etkinlik bulunamadı.</div>'
    : tlEvents.map(e => `
      <div class="tl-item">
        <div class="tl-ico ${e.cls}">${e.ico}</div>
        <div class="tl-content">
          <div class="tl-title">${e.title}</div>
          <div class="tl-meta">${!e.date ? '<span style="color:var(--text-muted);font-size:11px">(tarih girilmedi)</span>' : e.meta}</div>
        </div>
      </div>
    `).join('');

  const actT = localStorage.getItem('turTakipActiveTab') || 'timeline';
  const isActive = (t) => actT === t ? 'active' : '';

  return `
  <div style="max-width:920px;margin:0 auto">
    <div style="margin-bottom:14px">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">← Geri</button>
    </div>

    <!-- Profile header -->
    <div class="profile-header">
      <div class="profile-avatar" style="background:${col}">${ini}</div>
      <div class="profile-main">
        <div class="profile-name">${nm} ${res.status === 'kapandi' ? '<span class="badge badge-red" style="margin-left:8px">📦 Arşivlendi</span>' : ''}</div>
        <div class="profile-sub">${guestCount} Kişi &nbsp;·&nbsp; ${res.days} Gün &nbsp;·&nbsp; Başlangıç: ${formatDate(res.startDate)}</div>
        <div class="profile-bdgs" style="margin-bottom:8px">
          ${res.personal?.salesperson ? `<span class="badge" style="background:var(--surface);border:1px solid var(--border);color:var(--text-sec)">Satışçı: ${res.personal?.salesperson}</span>` : ''}
          ${res.personal?.phone ? `<span class="badge" style="background:var(--surface);border:1px solid var(--border);color:var(--text-sec)">📞 ${res.personal?.phone}</span>` : ''}
        </div>
        <div class="profile-bdgs">
          <span class="badge ${ps.cls}">${ps.text}</span>
          ${balloon?.active ? `<span class="badge badge-red">🎈 Balon (${balloon.count} Kişi)</span>` : ''}
          ${hotels?.length ? `<span class="badge badge-purple">🏨 ${hotels.length} Otel</span>` : ''}
          ${tours?.length ? `<span class="badge badge-orange">🏷️ ${tours.length} Tur</span>` : ''}
          ${flights?.length ? `<span class="badge badge-blue">✈️ ${flights.length} Uçuş</span>` : ''}
        </div>
      </div>
      <div class="profile-acts" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="exportSgk('${res.id}')">📄 SGK Çıktısı</button>
          <button class="btn btn-secondary btn-sm" onclick="exportTour('${res.id}')">✈️ Tur Çıktısı</button>
        </div>
        <div style="display:flex;gap:6px">
        ${can ? `
          ${res.status !== 'kapandi' ? `<button class="btn btn-secondary btn-sm" onclick="toggleResStatus('${res.id}', 'kapandi')">📦 Dosyayı Kapat</button>` : `<button class="btn btn-secondary btn-sm" onclick="toggleResStatus('${res.id}', 'aktif')">📂 Yeniden Aç</button>`}
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/reservation/${res.id}/edit')">✏️ Düzenle</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteReservation('${res.id}')">🗑️ Sil</button>
        ` : ''}
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="pTabs">
      <button class="tab-btn ${isActive('timeline')}" data-tab="timeline"    onclick="switchProfileTab(this,'timeline')">📅 Zaman Cetveli</button>
      <button class="tab-btn ${isActive('yolcular')}"        data-tab="yolcular"   onclick="switchProfileTab(this,'yolcular')">👥 Yolcular</button>
      <button class="tab-btn ${isActive('konaklama')}"        data-tab="konaklama"  onclick="switchProfileTab(this,'konaklama')">🏨 Konaklama</button>
      <button class="tab-btn ${isActive('turlar')}"        data-tab="turlar"     onclick="switchProfileTab(this,'turlar')">🏷️ Turlar</button>
      <button class="tab-btn ${isActive('ucuslar')}"        data-tab="ucuslar"    onclick="switchProfileTab(this,'ucuslar')">✈️ Uçuşlar</button>
      <button class="tab-btn ${isActive('transferler')}"        data-tab="transferler" onclick="switchProfileTab(this,'transferler')">🚌 Transferler</button>
      <button class="tab-btn ${isActive('odeme')}"        data-tab="odeme"      onclick="switchProfileTab(this,'odeme')">💳 Ödeme</button>
      ${notes ? `<button class="tab-btn ${isActive('notlar')}" data-tab="notlar" onclick="switchProfileTab(this,'notlar')">📝 Notlar</button>` : ''}
    </div>

    <!-- Tab: Zaman Cetveli -->
    <div class="tab-content ${isActive('timeline')} card" id="tc-timeline">
      <div class="timeline">${timelineHTML}</div>
    </div>

    <!-- Tab: Yolcular -->
    <div class="tab-content ${isActive('yolcular')} card" id="tc-yolcular">
      ${guestsHTML}
    </div>

    <!-- Tab: Konaklama -->
    <div class="tab-content ${isActive('konaklama')} card" id="tc-konaklama">
      <div class="timeline">${hotelsHTML}</div>
    </div>

    <!-- Tab: Turlar -->
    <div class="tab-content ${isActive('turlar')} card" id="tc-turlar">
      <div class="timeline">${toursHTML}</div>
    </div>

    <!-- Tab: Uçuşlar -->
    <div class="tab-content ${isActive('ucuslar')} card" id="tc-ucuslar">
      <div class="timeline">${flightsHTML}</div>
    </div>

    <!-- Tab: Transferler -->
    <div class="tab-content ${isActive('transferler')} card" id="tc-transferler">
      <div class="timeline">${transHTML}</div>
    </div>

    <!-- Tab: Ödeme -->
    <div class="tab-content ${isActive('odeme')} card" id="tc-odeme">
      <div class="pay-grid">
        <div class="pay-item">
          <div class="pay-amt">${formatCurrency(total, cur)}</div>
          <div class="pay-lbl">Toplam Tutar</div>
        </div>
        <div class="pay-item">
          <div class="pay-amt" style="color:var(--green)">${formatCurrency(paid, cur)}</div>
          <div class="pay-lbl">Toplam Tahsil Edilen</div>
        </div>
        <div class="pay-item">
          <div class="pay-amt" style="color:${remain>0?'var(--red)':'var(--green)'}">${formatCurrency(remain, cur)}</div>
          <div class="pay-lbl">Kalan Bakiye (Cari)</div>
        </div>
      </div>
      <div class="pay-bar"><div class="pay-fill" style="width:${pct}%;background:${pctCol}"></div></div>
      <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px">${pct.toFixed(0)}% tahsil edildi</div>
      
      <div style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px">
        <div style="font-weight:700;margin-bottom:14px;font-size:15px;display:flex;align-items:center;gap:8px">
          💳 Tahsilat / Ödeme Geçmişi
          ${payment?.history?.length ? `<span style="background:var(--green-dim);color:var(--green);border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600">${payment.history.length} kayıt</span>` : ''}
        </div>
        ${payment?.history?.length ? `
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
            ${payment.history.map((h, idx) => `
              <div style="display:flex;align-items:center;gap:14px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;transition:all var(--ease)" 
                   onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--green-dim)'" 
                   onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg)'">
                <div style="width:38px;height:38px;border-radius:50%;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
                  ${h.method==='nakit'?'💵':h.method==='kredi kartı'?'💳':'🏦'}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:15px;color:var(--green)">+${h.amount.toLocaleString('tr-TR')} ${cur}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
                    📅 ${formatDate(h.date)} &nbsp;·&nbsp; 
                    ${h.method.charAt(0).toUpperCase()+h.method.slice(1)}
                    ${h.receiver ? `&nbsp;·&nbsp; 👤 ${h.receiver}` : ''}
                  </div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);flex-shrink:0">#${idx+1}</div>
                ${can ? `
                  <button class="btn btn-danger btn-sm" style="flex-shrink:0;padding:5px 12px;font-size:12px" 
                          onclick="removePayment('${res.id}', '${h.id}')">🗑 Sil</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;padding:16px;text-align:center;background:var(--bg);border-radius:var(--radius)">Henüz tahsilat girilmemiş.</div>'}

        ${can ? `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:4px">
            <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text-sec)">+ Yeni Tahsilat Ekle</div>
            <form onsubmit="handleAddPayment(event, '${res.id}')" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:10px;align-items:end">
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Tarih</label>
                <input type="date" id="p_date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Tutar (${cur})</label>
                <input type="number" id="p_amt" class="form-control" placeholder="0.00" min="0.01" step="0.01" required>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Yöntem</label>
                <select id="p_method" class="form-control">
                  <option value="nakit">💵 Nakit</option>
                  <option value="kredi kartı">💳 Kredi Kartı</option>
                  <option value="transfer">🏦 Transfer</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:4px">Alan Kişi</label>
                <input type="text" id="p_rec" class="form-control" placeholder="Opsiyonel">
              </div>
              <button type="submit" class="btn btn-primary" style="white-space:nowrap;height:42px">＋ Ekle</button>
            </form>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Tab: Notlar -->
    <div class="tab-content ${isActive('notlar')} card" id="tc-notlar">
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;color:var(--text-sec)">${notes||'—'}</div>
    </div>
  </div>`;
}

function switchProfileTab(btn, tabId) {
  document.querySelectorAll('#pTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
  localStorage.setItem('turTakipActiveTab', tabId);
}

function toggleResStatus(id, newStatus) {
  DB.updateReservation(id, { status: newStatus });
  showNotif(newStatus === 'kapandi' ? 'Dosya arşive kaldırıldı.' : 'Dosya yeniden aktif edildi.', 'success');
  Router.navigate('/reservation/' + id);
}

function handleAddPayment(e, id) {
  e.preventDefault();
  const amt = parseFloat(document.getElementById('p_amt').value) || 0;
  if (amt <= 0) return;
  
  const res = DB.getReservation(id);
  if (!res) return;
  
  const history = res.payment?.history || [];
  history.push({
    id: uuid(),
    date: document.getElementById('p_date').value,
    amount: amt,
    method: document.getElementById('p_method').value,
    receiver: document.getElementById('p_rec').value
  });
  
  const totalPaid = history.reduce((sum, h) => sum + h.amount, 0);
  const total = res.payment?.total || 0;
  
  // Update status based on payments
  let payStatus = res.payment?.status || 'bekliyor';
  if (totalPaid >= total && total > 0) payStatus = 'ödendi';
  else if (totalPaid > 0) payStatus = 'kısmi';

  DB.updateReservation(id, {
    payment: {
      ...res.payment,
      history,
      paid: totalPaid,
      status: payStatus
    }
  });
  
  showNotif('Tahsilat eklendi', 'success');
  Router.navigate('/reservation/' + id);
  setTimeout(() => document.querySelector('[data-tab="odeme"]').click(), 50);
}

function removePayment(resId, paymentId) {
  if (!confirm('Bu tahsilat kaydını silmek istediğinize emin misiniz?')) return;
  const res = DB.getReservation(resId);
  if (!res) return;
  
  const history = res.payment?.history?.filter(h => h.id !== paymentId) || [];
  const totalPaid = history.reduce((sum, h) => sum + h.amount, 0);
  const total = res.payment?.total || 0;
  
  let payStatus = res.payment?.status || 'bekliyor';
  if (totalPaid >= total && total > 0) payStatus = 'ödendi';
  else if (totalPaid > 0) payStatus = 'kısmi';
  else payStatus = 'bekliyor';

  DB.updateReservation(resId, {
    payment: {
      ...res.payment,
      history,
      paid: totalPaid,
      status: payStatus
    }
  });
  showNotif('Tahsilat silindi', 'success');
  Router.navigate('/reservation/' + resId);
  setTimeout(() => document.querySelector('[data-tab="odeme"]').click(), 50);
}

/* ============================================================
   DIŞA AKTARIM (EXPORT) MODAL & FONKSIYONLARI
   ============================================================ */
function showExportModal(title, text) {
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  m.innerHTML = `
    <div class="card" style="width:100%;max-width:600px;background:var(--surface);display:flex;flex-direction:column;gap:12px;box-shadow:0 10px 40px rgba(0,0,0,0.4)">
      <div style="font-size:16px;font-weight:700;display:flex;justify-content:space-between;align-items:center">
        <span>${title}</span>
        <button style="background:none;border:none;color:var(--text-sec);cursor:pointer;font-size:18px" onclick="this.closest('.card').parentElement.remove()">×</button>
      </div>
      <textarea id="expText" style="width:100%;height:320px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;font-family:monospace;font-size:13px;resize:none;line-height:1.5" readonly>${text}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px">
        <button class="btn btn-secondary" onclick="this.closest('.card').parentElement.remove()">Kapat</button>
        <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('expText').value); showNotif('Panoya kopyalandı!','success');">Kopyala</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
}

function exportSgk(id) {
  const r = DB.getReservation(id);
  if (!r) return;
  const tStart = formatDate(r.startDate);
  // Use endDate if exists, otherwise fallback to startDate + days
  let tEnd = '';
  if (r.endDate) {
    tEnd = formatDate(r.endDate);
  } else if (r.startDate) {
    const d = new Date(r.startDate);
    if (!isNaN(d)) {
      d.setDate(d.getDate() + (r.days || 1));
      tEnd = formatDate(d.toISOString().split('T')[0]);
    }
  }
  
  let out = 'Adı\tSoyadı\tDoğum Tarihi\tPasaport No\n';
  r.guests.forEach(g => {
    out += `${g.firstName||''}\t${g.lastName||''}\t${formatDate(g.dob)||''}\t${g.passport||''}\n`;
  });
  showExportModal("SGK Çıktısı (Kopyalayıp Excel'e Yapıştırın)", out);
}

function exportTour(id) {
  const r = DB.getReservation(id);
  if (!r) return;
  
  let out = `Satış Temsilcisi: ${r.personal?.salesperson || 'Belirtilmemiş'}\n\n`;
  
  const evs = [];
  (r.flights||[]).forEach(f => {
    const tStr = f.direction === 'giriş' ? f.arrivalTime : f.departureTime;
    if (tStr) {
      const d = new Date(tStr);
      evs.push({
        time: d.getTime(),
        dateStr: d.toLocaleDateString('tr-TR', {day:'numeric', month:'long'}),
        text: `${f.fromAirport||'XXX'}-${f.toAirport||'XXX'} ${f.flightNo||''} ${f.direction === 'giriş' ? 'Arr' : 'Dep'} ${d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`
      });
    }
  });
  (r.tours||[]).forEach(t => {
    if (t.date) {
      const d = new Date(t.date);
      const to = DB.tourOptions.find(o=>o.id===t.tourId);
      evs.push({
        time: d.getTime(),
        dateStr: d.toLocaleDateString('tr-TR', {day:'numeric', month:'long'}),
        text: to ? to.name : 'Tur'
      });
    }
  });
  
  evs.sort((a,b)=>a.time - b.time);
  
  const groups = {};
  evs.forEach(e => {
    if (!groups[e.dateStr]) groups[e.dateStr] = [];
    groups[e.dateStr].push(e.text);
  });
  
  for (const dateStr in groups) {
    out += `${dateStr}: ${groups[dateStr].join(' - ')}\n`;
  }
  
  out += `\nYOLCU LİSTESİ VE PASAPORT BİLGİLERİ\n-----------------------------------\n`;
  r.guests.forEach(g => {
    out += `${g.firstName} ${g.lastName} | Uyruk: ${g.nationality||'-'} | Pasaport: ${g.passport||'-'} | D.Tarihi: ${formatDate(g.dob)}\n`;
  });
  
  showExportModal('Tur / Operasyon Çıktısı', out);
}

function confirmDeleteReservation(id) {
  if (!confirm('Bu rezervasyon silinecek. Onaylıyor musunuz?')) return;
  DB.deleteReservation(id);
  showNotif('Rezervasyon silindi.', 'success');
  Router.navigate('/reservations');
}
