/* views/reservation.js — Rezervasyon profil görünümü */

function renderReservationProfile(res) {
  // Görüntüleme kaydı
  DB.logView(res.id);

  const { personal, guests, guestCount, hotels, tours, balloon, flights, transfers, payment, notes } = res;
  const fn   = personal.firstName || '';
  const ln   = personal.lastName  || '';
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
            <div class="tl-title">${ht?.name || 'Otel'} — Oda: ${h.room||'—'}</div>
            <div class="tl-meta">Check-in: ${formatDate(h.checkin)} · Check-out: ${formatDate(h.checkout)} (${n} gece)</div>
          </div>
        </div>`;
    }).join('');

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
        <div class="profile-bdgs">
          <span class="badge ${ps.cls}">${ps.text}</span>
          ${balloon?.active ? `<span class="badge badge-red">🎈 Balon (${balloon.count} Kişi)</span>` : ''}
          ${hotels?.length ? `<span class="badge badge-purple">🏨 ${hotels.length} Otel</span>` : ''}
          ${tours?.length ? `<span class="badge badge-orange">🏷️ ${tours.length} Tur</span>` : ''}
          ${flights?.length ? `<span class="badge badge-blue">✈️ ${flights.length} Uçuş</span>` : ''}
        </div>
      </div>
      <div class="profile-acts">
        ${can ? `
          ${res.status !== 'kapandi' ? `<button class="btn btn-secondary btn-sm" onclick="toggleResStatus('${res.id}', 'kapandi')">📦 Dosyayı Kapat</button>` : `<button class="btn btn-secondary btn-sm" onclick="toggleResStatus('${res.id}', 'aktif')">📂 Yeniden Aç</button>`}
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/reservation/${res.id}/edit')">✏️ Düzenle</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteReservation('${res.id}')">🗑️ Sil</button>
        ` : ''}
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="pTabs">
      <button class="tab-btn active" data-tab="yolcular"   onclick="switchProfileTab(this,'yolcular')">👥 Yolcular</button>
      <button class="tab-btn"        data-tab="konaklama"  onclick="switchProfileTab(this,'konaklama')">🏨 Konaklama</button>
      <button class="tab-btn"        data-tab="turlar"     onclick="switchProfileTab(this,'turlar')">🏷️ Turlar</button>
      <button class="tab-btn"        data-tab="ucuslar"    onclick="switchProfileTab(this,'ucuslar')">✈️ Uçuşlar</button>
      <button class="tab-btn"        data-tab="transferler" onclick="switchProfileTab(this,'transferler')">🚌 Transferler</button>
      <button class="tab-btn"        data-tab="odeme"      onclick="switchProfileTab(this,'odeme')">💳 Ödeme</button>
      ${notes ? `<button class="tab-btn" data-tab="notlar" onclick="switchProfileTab(this,'notlar')">📝 Notlar</button>` : ''}
    </div>

    <!-- Tab: Yolcular -->
    <div class="tab-content active card" id="tc-yolcular">
      ${guestsHTML}
    </div>

    <!-- Tab: Konaklama -->
    <div class="tab-content card" id="tc-konaklama">
      <div class="timeline">${hotelsHTML}</div>
    </div>

    <!-- Tab: Turlar -->
    <div class="tab-content card" id="tc-turlar">
      <div class="timeline">${toursHTML}</div>
    </div>

    <!-- Tab: Uçuşlar -->
    <div class="tab-content card" id="tc-ucuslar">
      <div class="timeline">${flightsHTML}</div>
    </div>

    <!-- Tab: Transferler -->
    <div class="tab-content card" id="tc-transferler">
      <div class="timeline">${transHTML}</div>
    </div>

    <!-- Tab: Ödeme -->
    <div class="tab-content card" id="tc-odeme">
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
        <div style="font-weight:600;margin-bottom:12px;font-size:14px">Tahsilat / Ödeme Geçmişi</div>
        ${payment?.history?.length ? `
          <div style="overflow-x:auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Yöntem</th>
                  <th>Alan Kişi</th>
                  ${can ? '<th>İşlem</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${payment.history.map(h => `
                  <tr>
                    <td>${formatDate(h.date)}</td>
                    <td style="color:var(--green);font-weight:600">${h.amount} ${cur}</td>
                    <td>${h.method}</td>
                    <td>${h.receiver || '—'}</td>
                    ${can ? `<td><button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:11px" onclick="removePayment('${res.id}', '${h.id}')">Sil</button></td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Henüz tahsilat girilmemiş.</div>'}

        ${can ? `
          <form onsubmit="handleAddPayment(event, '${res.id}')" style="display:flex;gap:8px;margin-top:14px;background:var(--bg);padding:12px;border-radius:var(--radius-sm);align-items:center;flex-wrap:wrap">
            <div style="font-size:12px;font-weight:600;width:100%;margin-bottom:4px">Yeni Tahsilat Ekle</div>
            <input type="date" id="p_date" class="form-control" style="flex:1;min-width:110px" required value="${new Date().toISOString().split('T')[0]}">
            <input type="number" id="p_amt" class="form-control" style="flex:1;min-width:90px" placeholder="Tutar" min="0.01" step="0.01" required>
            <select id="p_method" class="form-control" style="flex:1;min-width:110px">
              <option value="nakit">💵 Nakit</option>
              <option value="kredi kartı">💳 Kredi Kartı</option>
              <option value="transfer">🏦 Transfer</option>
            </select>
            <input type="text" id="p_rec" class="form-control" style="flex:1;min-width:100px" placeholder="Alan Kişi (Opsiyonel)">
            <button type="submit" class="btn btn-primary btn-sm" style="white-space:nowrap">＋ Ekle</button>
          </form>
        ` : ''}
      </div>
    </div>

    <!-- Tab: Notlar -->
    <div class="tab-content card" id="tc-notlar">
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;color:var(--text-sec)">${notes||'—'}</div>
    </div>
  </div>`;
}

function switchProfileTab(btn, tabId) {
  document.querySelectorAll('#pTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
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

function confirmDeleteReservation(id) {
  if (!confirm('Bu rezervasyon silinecek. Onaylıyor musunuz?')) return;
  DB.deleteReservation(id);
  showNotif('Rezervasyon silindi.', 'success');
  Router.navigate('/reservations');
}
