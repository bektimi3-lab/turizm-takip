/* views/tourist.js — Turist profil görünümü */

function renderTouristProfile(tourist) {
  const { personal, hotel, tours, flights, transfers, payment, notes } = tourist;
  const fn   = personal.firstName || '';
  const ln   = personal.lastName  || '';
  const nm   = `${fn} ${ln}`;
  const col  = avatarColor(nm);
  const ini  = getInitials(fn, ln);
  const flg  = getFlag(personal.nationality);
  const ps   = payStatusBadge(payment);
  const cur  = payment?.currency || DB.settings.currency || 'EUR';
  const can  = Auth.canEdit();

  /* Payment */
  const total   = Number(payment?.total  || 0);
  const paid    = Number(payment?.paid   || 0);
  const remain  = total - paid;
  const pct     = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const pctCol  = pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

  /* Tours timeline */
  const toursHTML = !(tours?.length)
    ? '<div style="color:var(--text-muted);font-size:13px">Tur eklenmemiş.</div>'
    : tours.map(tr => {
        const t = DB.tours.find(x => x.id === tr.tourId);
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
    : transfers.map(tf => `<div class="tl-item">
        <div class="tl-ico transfer">🚌</div>
        <div class="tl-content">
          <div class="tl-title">${tf.from||'—'} → ${tf.to||'—'}</div>
          <div class="tl-meta">${formatDate(tf.date)} ${tf.time||''} ${tf.note ? '· '+tf.note : ''}</div>
        </div>
      </div>`).join('');

  /* Nights stay */
  let nights = '';
  if (hotel?.checkin && hotel?.checkout) {
    const n = Math.round((new Date(hotel.checkout) - new Date(hotel.checkin)) / 86400000);
    nights = `<div style="margin-top:14px;padding:10px 14px;background:var(--surface);border-radius:var(--radius-sm);font-size:13px">🌙 Toplam konaklama: <strong>${n} gece</strong></div>`;
  }

  return `
  <div style="max-width:920px;margin:0 auto">
    <div style="margin-bottom:14px">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">← Geri</button>
    </div>

    <!-- Profile header -->
    <div class="profile-header">
      <div class="profile-avatar" style="background:${col}">${ini}</div>
      <div class="profile-main">
        <div class="profile-name">${nm}</div>
        <div class="profile-sub">${flg} ${personal.nationality||'—'} &nbsp;·&nbsp; 🛂 ${personal.passport||'—'} &nbsp;·&nbsp; 📧 ${personal.email||'—'}</div>
        <div class="profile-bdgs">
          <span class="badge ${ps.cls}">${ps.text}</span>
          ${hotel?.name  ? `<span class="badge badge-purple">🏨 ${hotel.name}</span>` : ''}
          ${tours?.length ? `<span class="badge badge-orange">🏷️ ${tours.length} Tur</span>` : ''}
          ${flights?.length ? `<span class="badge badge-blue">✈️ ${flights.length} Uçuş</span>` : ''}
        </div>
      </div>
      <div class="profile-acts">
        ${can ? `
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/tourist/${tourist.id}/edit')">✏️ Düzenle</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteTourist('${tourist.id}')">🗑️ Sil</button>
        ` : ''}
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="pTabs">
      <button class="tab-btn active" data-tab="kisisel"    onclick="switchProfileTab(this,'kisisel')">👤 Kişisel</button>
      <button class="tab-btn"        data-tab="konaklama"  onclick="switchProfileTab(this,'konaklama')">🏨 Konaklama</button>
      <button class="tab-btn"        data-tab="turlar"     onclick="switchProfileTab(this,'turlar')">🏷️ Turlar</button>
      <button class="tab-btn"        data-tab="ucuslar"    onclick="switchProfileTab(this,'ucuslar')">✈️ Uçuşlar</button>
      <button class="tab-btn"        data-tab="transferler" onclick="switchProfileTab(this,'transferler')">🚌 Transferler</button>
      <button class="tab-btn"        data-tab="odeme"      onclick="switchProfileTab(this,'odeme')">💳 Ödeme</button>
      ${notes ? `<button class="tab-btn" data-tab="notlar" onclick="switchProfileTab(this,'notlar')">📝 Notlar</button>` : ''}
    </div>

    <!-- Tab: Kişisel -->
    <div class="tab-content active card" id="tc-kisisel">
      <div class="info-grid">
        <div><div class="info-lbl">Ad</div><div class="info-val">${fn}</div></div>
        <div><div class="info-lbl">Soyad</div><div class="info-val">${ln}</div></div>
        <div><div class="info-lbl">Doğum Tarihi</div><div class="info-val">${formatDate(personal.dob)}</div></div>
        <div><div class="info-lbl">Uyruk</div><div class="info-val">${flg} ${personal.nationality||'—'}</div></div>
        <div><div class="info-lbl">Pasaport No</div><div class="info-val">${personal.passport||'—'}</div></div>
        <div><div class="info-lbl">Telefon</div><div class="info-val">${personal.phone||'—'}</div></div>
        <div><div class="info-lbl">E-posta</div><div class="info-val">${personal.email||'—'}</div></div>
      </div>
    </div>

    <!-- Tab: Konaklama -->
    <div class="tab-content card" id="tc-konaklama">
      ${hotel ? `
        <div class="info-grid">
          <div><div class="info-lbl">Otel</div><div class="info-val">🏨 ${hotel.name||'—'}</div></div>
          <div><div class="info-lbl">Oda No</div><div class="info-val">${hotel.room||'—'}</div></div>
          <div><div class="info-lbl">Check-in</div><div class="info-val">${formatDate(hotel.checkin)}</div></div>
          <div><div class="info-lbl">Check-out</div><div class="info-val">${formatDate(hotel.checkout)}</div></div>
        </div>
        ${nights}
      ` : '<div style="color:var(--text-muted);font-size:13px">Konaklama bilgisi girilmemiş.</div>'}
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
          <div class="pay-lbl">Toplam</div>
        </div>
        <div class="pay-item">
          <div class="pay-amt" style="color:var(--green)">${formatCurrency(paid, cur)}</div>
          <div class="pay-lbl">Ödenen</div>
        </div>
        <div class="pay-item">
          <div class="pay-amt" style="color:${remain>0?'var(--red)':'var(--green)'}">${formatCurrency(remain, cur)}</div>
          <div class="pay-lbl">Kalan</div>
        </div>
      </div>
      <div class="pay-bar"><div class="pay-fill" style="width:${pct}%;background:${pctCol}"></div></div>
      <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px">${pct.toFixed(0)}% ödendi</div>
      <div class="divider"></div>
      <div class="info-grid">
        <div><div class="info-lbl">Yöntem</div><div class="info-val">${payment?.method||'—'}</div></div>
        <div><div class="info-lbl">Durum</div><div class="info-val"><span class="badge ${ps.cls}">${ps.text}</span></div></div>
        <div><div class="info-lbl">Para Birimi</div><div class="info-val">${cur}</div></div>
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

function confirmDeleteTourist(id) {
  if (!confirm('Bu turist silinecek. Onaylıyor musunuz?')) return;
  DB.deleteTourist(id);
  showNotif('Turist silindi.', 'success');
  Router.navigate('/tourists');
}
