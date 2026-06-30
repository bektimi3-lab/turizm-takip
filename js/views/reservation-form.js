/* views/reservation-form.js — Rezervasyon Ekle / Düzenle */

let _guestCount = 1;
let _trc = 0, _frc = 0, _tfc = 0, _htc = 0;

function initFormCounters(res) {
  _guestCount = res?.guestCount || 1;
  _trc = (res?.tours     || []).length;
  _frc = (res?.flights   || []).length;
  _tfc = (res?.transfers || []).length;
  _htc = (res?.hotels    || []).length;
}

/* Kisi basi fiyati otomatik hesapla ve goster */
function updatePerPerson(totalInputEl, perPersonId) {
  const gc = parseInt(document.getElementById('guestCountInput')?.value) || 1;
  const total = parseFloat(totalInputEl.value) || 0;
  const pp = gc > 0 ? (total / gc).toFixed(2) : '0';
  const el = document.getElementById(perPersonId);
  if (el) el.textContent = pp + ' / kisi';
}

function renderReservationForm(res) {
  const isNew = !res;
  const t = res || {
    personal: {}, guests: [], hotel: {},
    tours: [], flights: [], transfers: [], hotels: [],
    balloon: { active:false, count:0, date:'', totalPrice:null, totalCost:null },
    payment: { total:0, paid:0, currency: DB.settings.currency||'EUR', status:'bekliyor' },
    notes: '', days: 1, startDate: todayStr(), guestCount: 1
  };

  const gf = (n) => t.personal[n] || '';

  return `
  <div style="max-width:860px;margin:0 auto">
    <div style="margin-bottom:14px">
      <button class="btn btn-ghost btn-sm" onclick="history.back()">&#8592; Geri</button>
    </div>

    <form id="resForm" onsubmit="saveReservationForm(event,'${res?.id||''}')">

      <!-- Temel Bilgiler -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F4CB; Rezervasyon Bilgileri</div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Grup Adi (Bas Kisi Adi)</label><input name="firstName" type="text" class="form-control" value="${gf('firstName')}" placeholder="Ad"></div>
          <div class="form-group"><label class="form-label">Grup Soyadi</label><input name="lastName" type="text" class="form-control" value="${gf('lastName')}" placeholder="Soyad"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Telefon</label><input name="phone" type="tel" class="form-control" value="${gf('phone')}" placeholder="+90 555..."></div>
          <div class="form-group"><label class="form-label">E-posta</label><input name="email" type="email" class="form-control" value="${gf('email')}" placeholder="ornek@mail.com"></div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Kisi Sayisi</label><input id="guestCountInput" name="guestCount" type="number" min="1" class="form-control" value="${t.guestCount}" onchange="updateGuestRows()"></div>
          <div class="form-group"><label class="form-label">Baslangic Tarihi</label><input name="startDate" type="date" class="form-control" value="${t.startDate}"></div>
          <div class="form-group"><label class="form-label">Gun Sayisi</label><input name="days" type="number" min="1" class="form-control" value="${t.days}"></div>
        </div>
      </div>

      <!-- Yolcular -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F465; Yolcular (Istege Bagli Detaylar)</div>
        </div>
        <div id="guestsContainer">
          ${renderGuestRows(t)}
        </div>
      </div>

      <!-- Balon -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F388; Balon Secenegi</div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Balon Var Mi?</label>
            <select name="balActive" class="form-control" onchange="syncBalloons(this.value === 'true')">
              <option value="false" ${!t.balloon?.active ? 'selected' : ''}>Hayir</option>
              <option value="true" ${t.balloon?.active ? 'selected' : ''}>Evet</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Tarih</label><input name="balDate" type="date" class="form-control" value="${t.balloon?.date||''}"></div>
        </div>
        ${_priceFieldsStatic('bal', t.balloon, t.guestCount)}
      </div>

      <!-- Oteller -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x1F3E8; Oteller</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addHotelRow()">+ Otel Ekle</button>
        </div>
        <div id="hotelRows">${(t.hotels||[]).map((h,i) => _hotelRow(i, h, t.guestCount)).join('') || '<div id="noHotels" style="color:var(--text-muted);font-size:13px">Henuz otel eklenmedi.</div>'}</div>
      </div>

      <!-- Turlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x1F3F7;&#xFE0F; Turlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTourRow()">+ Tur Ekle</button>
        </div>
        <div id="tourRows">${(t.tours||[]).map((tr,i) => _tourRow(i, tr, t.guestCount)).join('') || '<div id="noTours" style="color:var(--text-muted);font-size:13px">Henuz tur eklenmedi.</div>'}</div>
      </div>

      <!-- Ucuslar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x2708;&#xFE0F; Ucuslar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addFlightRow()">+ Ucus Ekle</button>
        </div>
        <div id="flightRows">${(t.flights||[]).map((f,i) => _flightRow(i, f, t.guestCount)).join('') || '<div id="noFlights" style="color:var(--text-muted);font-size:13px">Henuz ucus eklenmedi.</div>'}</div>
      </div>

      <!-- Transferler -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x1F68C; Transferler</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTransferRow()">+ Transfer Ekle</button>
        </div>
        <div id="transferRows">${(t.transfers||[]).map((tf,i) => _transferRow(i, tf, t.guestCount)).join('') || '<div id="noTransfers" style="color:var(--text-muted);font-size:13px">Henuz transfer eklenmedi.</div>'}</div>
      </div>

      <!-- Odeme -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F4B3; Odeme</div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group"><label class="form-label">Toplam Tutar</label><input name="total" type="number" class="form-control" value="${t.payment?.total||''}" placeholder="0" min="0" step="0.01"></div>
          <div class="form-group"><label class="form-label">Para Birimi</label>
            <select name="currency" class="form-control">
              <option value="EUR" ${(t.payment?.currency||'EUR')==='EUR'?'selected':''}>EUR</option>
              <option value="USD" ${t.payment?.currency==='USD'?'selected':''}>USD</option>
              <option value="TRY" ${t.payment?.currency==='TRY'?'selected':''}>TRY</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Genel Durum</label>
            <select name="payStatus" class="form-control">
              <option value="bekliyor" ${t.payment?.status==='bekliyor'?'selected':''}>Bekliyor</option>
              <option value="kismi"    ${t.payment?.status==='kismi'   ?'selected':''}>Kismi Odendi</option>
              <option value="odendi"   ${t.payment?.status==='odendi'  ?'selected':''}>Tamami Odendi</option>
            </select>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          * Tahsilat/Odeme gecmisi kayit islemleri rezervasyon detay (profil) sayfasindan yonetilmektedir.
        </div>
      </div>

      <!-- Notlar -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-group" style="margin:0"><label class="form-label">&#x1F4DD; Notlar</label><textarea name="notes" class="form-control" rows="3">${t.notes||''}</textarea></div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button type="button" class="btn btn-ghost" onclick="history.back()">Iptal</button>
        <button type="submit" class="btn btn-primary">Kaydet</button>
      </div>

    </form>
  </div>`;
}

function renderGuestRows(res) {
  const count = res?.guestCount || 1;
  const guests = res?.guests || [];
  let html = '';
  for (let i = 0; i < count; i++) {
    html += _guestRow(i, guests[i] || {});
  }
  return html;
}

function updateGuestRows() {
  const count = parseInt(document.getElementById('guestCountInput')?.value) || 1;
  _guestCount = count;
  const container = document.getElementById('guestsContainer');
  if (!container) return;
  const existing = container.querySelectorAll('.guest-row').length;
  if (count > existing) {
    for (let i = existing; i < count; i++) {
      container.insertAdjacentHTML('beforeend', _guestRow(i, {}));
    }
  } else {
    const rows = container.querySelectorAll('.guest-row');
    for (let i = count; i < rows.length; i++) rows[i].remove();
  }
}

function _guestRow(i, g) {
  return `
  <div class="guest-row" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--text-sec)">Yolcu ${i+1}</div>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;cursor:pointer;background:var(--bg);padding:4px 8px;border-radius:4px">
        <input type="checkbox" name="g_balloon_${i}" class="guest-balloon-cb" value="true" ${g.balloon ? 'checked' : ''}> Balon
      </label>
    </div>
    <div class="form-row form-row-2" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><input type="text" name="g_fn_${i}" class="form-control" value="${g.firstName||''}" placeholder="Ad"></div>
      <div class="form-group" style="margin:0"><input type="text" name="g_ln_${i}" class="form-control" value="${g.lastName||''}" placeholder="Soyad"></div>
    </div>
    <div class="form-row form-row-3" style="margin-bottom:10px">
      <div class="form-group" style="margin:0"><input type="text" name="g_nat_${i}" class="form-control" value="${g.nationality||''}" placeholder="Uyruk (orn: Ingiliz)"></div>
      <div class="form-group" style="margin:0"><input type="text" name="g_pass_${i}" class="form-control" value="${g.passport||''}" placeholder="Pasaport No"></div>
      <div class="form-group" style="margin:0">
        <select name="g_gender_${i}" class="form-control">
          <option value="">Cinsiyet</option>
          <option value="Erkek" ${g.gender==='Erkek'?'selected':''}>Erkek</option>
          <option value="Kadin" ${g.gender==='Kadin'?'selected':''}>Kadin</option>
        </select>
      </div>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Dogum Tarihi</label><input type="date" name="g_dob_${i}" class="form-control" value="${g.dob||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Baslangic</label><input type="date" name="g_pstart_${i}" class="form-control" value="${g.passportStart||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Bitis</label><input type="date" name="g_pend_${i}" class="form-control" value="${g.passportEnd||''}"></div>
    </div>
  </div>`;
}

function loadTemplateData(select, type, idx) {
  const val = select.value;
  if (!val) return;
  const row = select.closest('[id$="-'+idx+'"]');
  if (!row) return;

  if (type === 'flight') {
    const opt = DB.flightOptions.find(o => o.id === val);
    if(opt) {
      row.querySelector('[name="flNo_'+idx+'"]').value = opt.flightNo;
      row.querySelector('[name="flDir_'+idx+'"]').value = opt.direction;
      row.querySelector('[name="flFrom_'+idx+'"]').value = opt.fromAirport;
      row.querySelector('[name="flTo_'+idx+'"]').value = opt.toAirport;
    }
  } else if (type === 'transfer') {
    const opt = DB.transferOptions.find(o => o.id === val);
    if (opt) {
      const parts = opt.name.split('->');
      if (parts.length === 2) {
        row.querySelector('[name="tfFrom_'+idx+'"]').value = parts[0].trim();
        row.querySelector('[name="tfTo_'+idx+'"]').value = parts[1].trim();
      }
    }
  }
}

/* Toplam fiyat + maliyet alanlari (static — render aninda) */
function _priceFieldsStatic(pfx, obj, gc) {
  const tCost  = obj?.totalCost  != null ? obj.totalCost  : '';
  const tPrice = obj?.totalPrice != null ? obj.totalPrice : '';
  const g = parseInt(gc) || 1;
  const ppCost  = tCost  !== '' ? (parseFloat(tCost)  / g).toFixed(2) + ' / kisi' : '';
  const ppPrice = tPrice !== '' ? (parseFloat(tPrice) / g).toFixed(2) + ' / kisi' : '';
  return `
  <div class="form-row form-row-2" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Maliyet <span style="color:var(--text-muted);font-size:11px">(bos = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalCost" class="form-control" value="${tCost}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-cost-${pfx}')">
        <span id="pp-cost-${pfx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--orange);pointer-events:none">${ppCost}</span>
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Satis <span style="color:var(--text-muted);font-size:11px">(bos = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalPrice" class="form-control" value="${tPrice}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-price-${pfx}')">
        <span id="pp-price-${pfx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--green);pointer-events:none">${ppPrice}</span>
      </div>
    </div>
  </div>`;
}

/* Toplam fiyat + maliyet alanlari (dinamik — satir eklendiginde) */
function _priceFields(pfx, idx, obj, gc) {
  const tCost  = obj?.totalCost  != null ? obj.totalCost  : '';
  const tPrice = obj?.totalPrice != null ? obj.totalPrice : '';
  const g = parseInt(gc) || _guestCount || 1;
  const ppCost  = tCost  !== '' ? (parseFloat(tCost)  / g).toFixed(2) + ' / kisi' : '';
  const ppPrice = tPrice !== '' ? (parseFloat(tPrice) / g).toFixed(2) + ' / kisi' : '';
  return `
  <div class="form-row form-row-2" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Maliyet <span style="color:var(--text-muted);font-size:11px">(bos = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalCost_${idx}" class="form-control" value="${tCost}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-cost-${pfx}-${idx}')">
        <span id="pp-cost-${pfx}-${idx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--orange);pointer-events:none">${ppCost}</span>
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Satis <span style="color:var(--text-muted);font-size:11px">(bos = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalPrice_${idx}" class="form-control" value="${tPrice}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-price-${pfx}-${idx}')">
        <span id="pp-price-${pfx}-${idx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--green);pointer-events:none">${ppPrice}</span>
      </div>
    </div>
  </div>`;
}

function _hotelRow(idx, h={}, gc) {
  const opts = DB.hotelOptions.map(o => '<option value="'+o.id+'" '+(o.id===h.hotelId?'selected':'')+'>'+o.name+'</option>').join('');
  return '<div class="h-row" id="hr-'+idx+'" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<select name="hotelId_'+idx+'" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'hotel\',\''+idx+'\')"><option value="">Otel Sec</option>'+opts+'</select>'
    +'<button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById(\'hr-'+idx+'\').remove()">Kaldir</button></div>'
    +'<div class="form-row form-row-3">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Oda No</label><input type="text" name="hRoom_'+idx+'" class="form-control" value="'+(h.room||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Check-in</label><input type="date" name="hIn_'+idx+'" class="form-control" value="'+(h.checkin||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Check-out</label><input type="date" name="hOut_'+idx+'" class="form-control" value="'+(h.checkout||'')+'"></div>'
    +'</div>'
    +_priceFields('h', idx, h, gc)
    +'</div>';
}

function _tourRow(idx, tr={}, gc) {
  const opts = DB.tourOptions.map(t => '<option value="'+t.id+'" '+(t.id===tr.tourId?'selected':'')+'>'+t.icon+' '+t.name+'</option>').join('');
  return '<div class="t-row" id="tr-'+idx+'" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">'
    +'<div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:4px">'
    +'<div class="form-group" style="margin:0;flex:2"><label class="form-label">Tur</label>'
    +'<select name="tourId_'+idx+'" class="form-control"><option value="">Sec</option>'+opts+'</select></div>'
    +'<div class="form-group" style="margin:0;flex:1"><label class="form-label">Tarih</label>'
    +'<input type="date" name="tourDate_'+idx+'" class="form-control" value="'+(tr.date||'')+'"></div>'
    +'<button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById(\'tr-'+idx+'\').remove()" style="margin-bottom:1px">&#x1F5D1;&#xFE0F;</button>'
    +'</div>'
    +_priceFields('t', idx, tr, gc)
    +'</div>';
}

function _flightRow(idx, f={}, gc) {
  const opts = DB.flightOptions.map(o => '<option value="'+o.id+'">'+o.flightNo+' ('+o.fromAirport+'->'+o.toAirport+')</option>').join('');
  return '<div class="f-row" id="fr-'+idx+'" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<select class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'flight\',\''+idx+'\')"><option value="">Sablondan Doldur</option>'+opts+'</select>'
    +'<button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById(\'fr-'+idx+'\').remove()">Kaldir</button></div>'
    +'<div class="form-row form-row-3" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Ucus No</label><input type="text" name="flNo_'+idx+'" class="form-control" value="'+(f.flightNo||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Yon</label>'
    +'<select name="flDir_'+idx+'" class="form-control">'
    +'<option value="giris" '+(f.direction==='giris'?'selected':'')+'>Giris (Varis)</option>'
    +'<option value="cikis" '+(f.direction==='cikis'?'selected':'')+'>Cikis (Kalkis)</option>'
    +'</select></div><div></div></div>'
    +'<div class="form-row form-row-2" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Kalkis Havalimani</label><input type="text" name="flFrom_'+idx+'" class="form-control" value="'+(f.fromAirport||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Varis Havalimani</label><input type="text" name="flTo_'+idx+'" class="form-control" value="'+(f.toAirport||'')+'"></div>'
    +'</div>'
    +'<div class="form-row form-row-2" style="margin-bottom:4px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Kalkis Zamani</label><input type="datetime-local" name="flDep_'+idx+'" class="form-control" value="'+(f.departureTime||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Varis Zamani</label><input type="datetime-local" name="flArr_'+idx+'" class="form-control" value="'+(f.arrivalTime||'')+'"></div>'
    +'</div>'
    +_priceFields('fl', idx, f, gc)
    +'</div>';
}

function _transferRow(idx, tf={}, gc) {
  const opts = DB.transferOptions.map(o => '<option value="'+o.id+'" '+(o.id===tf.transferId?'selected':'')+'>'+o.name+'</option>').join('');
  return '<div class="tf-row" id="tfr-'+idx+'" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<select name="transferId_'+idx+'" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'transfer\',\''+idx+'\')"><option value="">Sablondan Doldur / Sec</option>'+opts+'</select>'
    +'<button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById(\'tfr-'+idx+'\').remove()">Kaldir</button></div>'
    +'<div class="form-row form-row-2" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Nereden</label><input type="text" name="tfFrom_'+idx+'" class="form-control" value="'+(tf.from||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Nereye</label><input type="text" name="tfTo_'+idx+'" class="form-control" value="'+(tf.to||'')+'"></div>'
    +'</div>'
    +'<div class="form-row form-row-2" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Tarih</label><input type="date" name="tfDate_'+idx+'" class="form-control" value="'+(tf.date||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Saat</label><input type="time" name="tfTime_'+idx+'" class="form-control" value="'+(tf.time||'')+'"></div>'
    +'</div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Not</label><input type="text" name="tfNote_'+idx+'" class="form-control" value="'+(tf.note||'')+'"></div>'
    +_priceFields('tf', idx, tf, gc)
    +'</div>';
}

function addHotelRow()    { document.getElementById('noHotels')?.remove();    document.getElementById('hotelRows').insertAdjacentHTML('beforeend',_hotelRow(_htc++, {}, _guestCount)); }
function addTourRow()     { document.getElementById('noTours')?.remove();     document.getElementById('tourRows').insertAdjacentHTML('beforeend',_tourRow(_trc++, {}, _guestCount)); }
function addFlightRow()   { document.getElementById('noFlights')?.remove();   document.getElementById('flightRows').insertAdjacentHTML('beforeend',_flightRow(_frc++, {}, _guestCount)); }
function addTransferRow() { document.getElementById('noTransfers')?.remove(); document.getElementById('transferRows').insertAdjacentHTML('beforeend',_transferRow(_tfc++, {}, _guestCount)); }

function syncBalloons(isActive) {
  document.querySelectorAll('.guest-balloon-cb').forEach(cb => cb.checked = isActive);
}

function saveReservationForm(e, existingId) {
  e.preventDefault();
  const form = document.getElementById('resForm');
  const fd   = new FormData(form);
  const g    = n => fd.get(n) || '';
  const gn   = n => { const v = fd.get(n); return v !== null && v !== '' ? parseFloat(v) : null; };

  const guestCount = parseInt(g('guestCount')) || 1;
  const guests = [];
  for(let i=0; i<guestCount; i++) {
    guests.push({
      firstName: g('g_fn_'+i), lastName: g('g_ln_'+i),
      nationality: g('g_nat_'+i), passport: g('g_pass_'+i), dob: g('g_dob_'+i),
      passportStart: g('g_pstart_'+i), passportEnd: g('g_pend_'+i),
      gender: g('g_gender_'+i),
      balloon: fd.get('g_balloon_'+i) === 'true'
    });
  }

  const hotels = Array.from(form.querySelectorAll('.h-row')).map(row => {
    const i = row.id.split('-')[1];
    return { hotelId: g('hotelId_'+i), room: g('hRoom_'+i), checkin: g('hIn_'+i), checkout: g('hOut_'+i),
      totalCost: gn('hTotalCost_'+i), totalPrice: gn('hTotalPrice_'+i) };
  }).filter(x => x.hotelId);

  for (let h of hotels) {
    if (h.checkin && h.checkout && new Date(h.checkout) < new Date(h.checkin)) {
      showNotif('Hata: Otel cikis tarihi giris tarihinden once olamaz!', 'error'); return;
    }
  }

  const flights = Array.from(form.querySelectorAll('.f-row')).map(row => {
    const i = row.id.split('-')[1];
    return { id: uuid(), flightNo: g('flNo_'+i), direction: g('flDir_'+i), fromAirport: g('flFrom_'+i),
      toAirport: g('flTo_'+i), departureTime: g('flDep_'+i), arrivalTime: g('flArr_'+i),
      totalCost: gn('flTotalCost_'+i), totalPrice: gn('flTotalPrice_'+i) };
  }).filter(x => x.flightNo);

  for (let f of flights) {
    if (f.departureTime && f.arrivalTime && new Date(f.arrivalTime) < new Date(f.departureTime)) {
      showNotif('Hata: Ucus varis zamani kalkis zamanindan once olamaz!', 'error'); return;
    }
  }

  const tours = Array.from(form.querySelectorAll('.t-row')).map(row => {
    const i = row.id.split('-')[1];
    return { tourId: g('tourId_'+i), date: g('tourDate_'+i),
      totalCost: gn('tTotalCost_'+i), totalPrice: gn('tTotalPrice_'+i) };
  }).filter(x => x.tourId);

  const transfers = Array.from(form.querySelectorAll('.tf-row')).map(row => {
    const i = row.id.split('-')[1];
    return { transferId: g('transferId_'+i), from: g('tfFrom_'+i), to: g('tfTo_'+i),
      date: g('tfDate_'+i), time: g('tfTime_'+i), note: g('tfNote_'+i),
      totalCost: gn('tfTotalCost_'+i), totalPrice: gn('tfTotalPrice_'+i) };
  }).filter(x => x.from || x.to || x.transferId);

  const balTotalCost  = gn('balTotalCost');
  const balTotalPrice = gn('balTotalPrice');
  const balCount = guests.filter(x => x.balloon).length;

  const data = {
    personal: { firstName: g('firstName'), lastName: g('lastName'), phone: g('phone'), email: g('email') },
    guestCount, guests,
    startDate: g('startDate'), days: parseInt(g('days'))||1,
    balloon: { 
      active: g('balActive')==='true', 
      count: balCount, 
      date: g('balDate'),
      totalCost:  balTotalCost,
      totalPrice: balTotalPrice,
      cost:  (balCount > 0 && balTotalCost  != null) ? balTotalCost  / balCount : null,
      price: (balCount > 0 && balTotalPrice != null) ? balTotalPrice / balCount : null
    },
    hotels, tours, flights, transfers,
    payment: { 
      total: parseFloat(g('total'))||0, 
      currency: g('currency')||'EUR', 
      status: g('payStatus'),
      history: existingId ? (DB.getReservation(existingId)?.payment?.history || []) : [],
      paid: existingId ? (DB.getReservation(existingId)?.payment?.paid || 0) : 0
    },
    status: existingId ? (DB.getReservation(existingId)?.status || 'aktif') : 'aktif',
    notes: g('notes')
  };

  if (existingId) {
    DB.updateReservation(existingId, data);
    showNotif('Rezervasyon guncellendi!', 'success');
    Router.navigate('/reservation/' + existingId);
  } else {
    const nr = DB.addReservation(data);
    showNotif('Rezervasyon eklendi!', 'success');
    Router.navigate('/reservation/' + nr.id);
  }
}
