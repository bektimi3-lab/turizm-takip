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
  
  if (el) {
    if (isNaN(total) || total <= 0) {
      el.textContent = '';
    } else {
      el.textContent = pp + ' / kişi';
    }
  }
  
  // Eger bu input "Satis" fiyatiysa genel toplami da otomatik hesapla
  if (totalInputEl && totalInputEl.name && totalInputEl.name.includes('TotalPrice')) {
    autoCalcTotal();
  }
}

function autoCalcTotal() {
  const autoCb = document.getElementById('autoCalcCb');
  if (autoCb && !autoCb.checked) return; // Kullanici manuel'e almissa hesaplama
  
  let sum = 0;
  document.querySelectorAll('input[name$="TotalPrice"], input[name*="TotalPrice_"]').forEach(inp => {
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val > 0) sum += val;
  });
  
  const totalInp = document.querySelector('input[name="total"]');
  if (totalInp) {
    totalInp.value = sum.toFixed(2);
  }
}

function calcFormDays() {
  const s = document.getElementById('startDateInput')?.value;
  const e = document.getElementById('endDateInput')?.value;
  if(s && e) {
    const ds = new Date(s), de = new Date(e);
    let diff = Math.ceil((de - ds) / (1000*60*60*24));
    if(diff < 1) diff = 1; // en az 1 gun
    document.getElementById('daysInput').value = diff;
    document.getElementById('daysDisplay').textContent = '(Toplam: ' + diff + ' Gün)';
  }
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
    <div style="margin-bottom:14px; position:sticky; top:10px; z-index:900; background:var(--surface); padding:12px 16px; border-radius:var(--radius-sm); border:1px solid var(--border); box-shadow:0 8px 24px rgba(0,0,0,0.15); display:flex; justify-content:space-between; align-items:center;">
      <button type="button" class="btn btn-ghost btn-sm" onclick="if(window._isFormDirty && !confirm('Kaydedilmemiş değişiklikleriniz var, çıkmak istediğinize emin misiniz?')) return; history.back()">&#8592; Geri</button>
      <div style="font-weight:600; font-size:15px;">${isNew ? 'Yeni Rezervasyon' : 'Rezervasyonu Düzenle'}</div>
      <button type="button" class="btn btn-primary" onclick="document.getElementById('resForm').requestSubmit()">💾 Kaydet</button>
    </div>

    <form id="resForm" novalidate oninput="window._isFormDirty=true" onchange="window._isFormDirty=true" onsubmit="saveReservationForm(event,'${res?.id||''}')">

      <!-- Temel Bilgiler -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F4CB; Rezervasyon Bilgileri</div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Grup Adı (Baş Kişi Adı)</label><input name="firstName" type="text" class="form-control" value="${gf('firstName')}" placeholder="Ad"></div>
          <div class="form-group"><label class="form-label">Grup Soyadı</label><input name="lastName" type="text" class="form-control" value="${gf('lastName')}" placeholder="Soyad"></div>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group"><label class="form-label">Telefon</label><input name="phone" type="tel" class="form-control" value="${gf('phone')}" placeholder="+90 555..."></div>
          <div class="form-group" style="display:flex;gap:16px;">
            <div style="flex:1"><label class="form-label">Satışçı İsim</label><input name="salesperson" type="text" class="form-control" value="${gf('salesperson')}" placeholder="Örn: Ahmet Bey"></div>
            <div style="display:flex;align-items:flex-end;padding-bottom:10px;">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600;color:var(--purple);background:var(--purple-dim);padding:8px 12px;border-radius:var(--radius-sm)">
                <input type="checkbox" name="isPrivate" value="true" ${t.isPrivate?'checked':''}> 👑 VIP (Private)
              </label>
            </div>
          </div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:20px;">
          <div class="form-group"><label class="form-label">Kişi Sayısı</label><input id="guestCountInput" name="guestCount" type="number" min="1" class="form-control" value="${t.guestCount}" onchange="updateGuestRows()"></div>
          <div class="form-group"><label class="form-label">Başlangıç Tarihi</label><input id="startDateInput" name="startDate" type="date" class="form-control" value="${t.startDate}" onchange="calcFormDays()"></div>
          <div class="form-group"><label class="form-label">Bitiş Tarihi</label>
            ${(() => {
              let eStr = '';
              if (t.startDate) {
                const sd = new Date(t.startDate);
                sd.setDate(sd.getDate() + (t.days || 1));
                eStr = sd.toISOString().split('T')[0];
              }
              return `<input id="endDateInput" name="endDate" type="date" class="form-control" value="${eStr}" onchange="calcFormDays()">`;
            })()}
          </div>
          <div class="form-group" style="display:flex;align-items:center;padding-top:28px">
            <span id="daysDisplay" style="font-size:13px;font-weight:600;color:var(--text-sec);white-space:nowrap">(Toplam: ${t.days||1} Gün)</span>
            <input type="hidden" id="daysInput" name="days" value="${t.days||1}">
          </div>
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
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F388; Balon Seçeneği</div>
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
        <div id="hotelRows">${(t.hotels||[]).map((h,i) => _hotelRow(i, h, t.guestCount)).join('') || '<button type="button" id="noHotels" class="empty-add-btn" style="width:100%" onclick="addHotelRow()">+ İlk Oteli Ekle</button>'}</div>
      </div>

      <!-- Turlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x1F3F7;&#xFE0F; Turlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTourRow()">+ Tur Ekle</button>
        </div>
        <div id="tourRows">${(t.tours||[]).map((tr,i) => _tourRow(i, tr, t.guestCount)).join('') || '<button type="button" id="noTours" class="empty-add-btn" style="width:100%" onclick="addTourRow()">+ İlk Turu Ekle</button>'}</div>
      </div>

      <!-- Uçuşlar -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x2708;&#xFE0F; Uçuşlar</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addFlightRow()">+ Uçuş Ekle</button>
        </div>
        <div id="flightRows">${(t.flights||[]).map((f,i) => _flightRow(i, f, t.guestCount)).join('') || '<button type="button" id="noFlights" class="empty-add-btn" style="width:100%" onclick="addFlightRow()">+ İlk Uçuşu Ekle</button>'}</div>
      </div>

      <!-- Transferler -->
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="sec-title" style="margin:0;border:none;padding:0">&#x1F68C; Transferler</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addTransferRow()">+ Transfer Ekle</button>
        </div>
        <div id="transferRows">${(t.transfers||[]).map((tf,i) => _transferRow(i, tf, t.guestCount)).join('') || '<button type="button" id="noTransfers" class="empty-add-btn" style="width:100%" onclick="addTransferRow()">+ İlk Transferi Ekle</button>'}</div>
      </div>

      <!-- Ödeme -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-section-highlight">
          <div class="sec-title" style="border:none;padding:0;margin-bottom:10px">&#x1F4B3; Ödeme</div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center">
              Toplam Tutar 
              <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-weight:500;text-transform:none;font-size:11px;color:var(--text-muted)">
                <input type="checkbox" id="autoCalcCb" checked onchange="if(this.checked) autoCalcTotal()"> Oto
              </label>
            </label>
            <input name="total" type="number" class="form-control" value="${t.payment?.total||''}" placeholder="0" min="0" step="0.01" oninput="document.getElementById('autoCalcCb').checked = false">
          </div>
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
              <option value="kısmi"    ${t.payment?.status==='kısmi'   ?'selected':''}>Kısmi Ödendi</option>
              <option value="ödendi"   ${t.payment?.status==='ödendi'  ?'selected':''}>Tamamı Ödendi</option>
            </select>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          * Tahsilat/Ödeme geçmişi kayıt işlemleri rezervasyon detay (profil) sayfasından yönetilmektedir.
        </div>
      </div>

      <!-- Notlar -->
      <div class="card" style="margin-bottom:14px">
        <div class="form-group" style="margin:0"><label class="form-label">&#x1F4DD; Notlar</label><textarea name="notes" class="form-control" rows="3">${t.notes||''}</textarea></div>
      </div>

      <div class="sticky-form-footer">
        <button type="button" class="btn btn-ghost" onclick="history.back()">İptal</button>
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
      <div class="form-group" style="margin:0"><input type="text" name="g_nat_${i}" class="form-control" value="${g.nationality||''}" placeholder="Uyruk (örn: İngiliz)"></div>
      <div class="form-group" style="margin:0"><input type="text" name="g_pass_${i}" class="form-control" value="${g.passport||''}" placeholder="Pasaport No"></div>
      <div class="form-group" style="margin:0">
        <select name="g_gender_${i}" class="form-control">
          <option value="">Cinsiyet</option>
          <option value="Erkek" ${g.gender==='Erkek'?'selected':''}>Erkek</option>
          <option value="Kadın" ${g.gender==='Kadın'?'selected':''}>Kadın</option>
        </select>
      </div>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Doğum Tarihi</label><input type="date" name="g_dob_${i}" class="form-control" value="${g.dob||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Başlangıç</label><input type="date" name="g_pstart_${i}" class="form-control" value="${g.passportStart||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label" style="font-size:11px">Pasaport Bitiş</label><input type="date" name="g_pend_${i}" class="form-control" value="${g.passportEnd||''}"></div>
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
  const ppCost  = tCost  !== '' ? (parseFloat(tCost)  / g).toFixed(2) + ' / kişi' : '';
  const ppPrice = tPrice !== '' ? (parseFloat(tPrice) / g).toFixed(2) + ' / kişi' : '';
  return `
  <div class="form-row form-row-2" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Maliyet <span style="color:var(--text-muted);font-size:11px">(boş = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalCost" class="form-control" value="${tCost}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-cost-${pfx}')">
        <span id="pp-cost-${pfx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--orange);pointer-events:none">${ppCost}</span>
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Satış <span style="color:var(--text-muted);font-size:11px">(boş = girilmedi)</span></label>
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
  const ppCost  = tCost  !== '' ? (parseFloat(tCost)  / g).toFixed(2) + ' / kişi' : '';
  const ppPrice = tPrice !== '' ? (parseFloat(tPrice) / g).toFixed(2) + ' / kişi' : '';
  return `
  <div class="form-row form-row-2" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Maliyet <span style="color:var(--text-muted);font-size:11px">(boş = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalCost_${idx}" class="form-control" value="${tCost}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-cost-${pfx}-${idx}')">
        <span id="pp-cost-${pfx}-${idx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--orange);pointer-events:none">${ppCost}</span>
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Toplam Satış <span style="color:var(--text-muted);font-size:11px">(boş = girilmedi)</span></label>
      <div style="position:relative">
        <input type="number" name="${pfx}TotalPrice_${idx}" class="form-control" value="${tPrice}" placeholder="---" min="0"
          oninput="updatePerPerson(this,'pp-price-${pfx}-${idx}')">
        <span id="pp-price-${pfx}-${idx}" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--green);pointer-events:none">${ppPrice}</span>
      </div>
    </div>
  </div>`;
}

function toggleAcBody(btn) {
  const body = btn.closest('.activity-card').querySelector('.ac-body');
  if(body.style.display === 'none') {
    body.style.display = 'block';
    btn.innerHTML = 'Daralt 🔼';
  } else {
    body.style.display = 'none';
    btn.innerHTML = 'Genişlet 🔽';
  }
}

function _hotelRow(idx, h={}, gc) {
  const opts = DB.hotelOptions.map(o => '<option value="'+o.id+'" '+(o.id===h.hotelId?'selected':'')+'>'+o.name+'</option>').join('');
  return '<div class="h-row activity-card ac-hotel" id="hr-'+idx+'">'
    +'<div class="ac-header"><div><span style="font-weight:600;font-size:13px;color:var(--text-sec)">🏨 Otel Kaydı</span></div>'
    +'<div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleAcBody(this)">Daralt 🔼</button>'
    +'<button type="button" class="btn btn-danger btn-sm" style="margin-left:6px" onclick="document.getElementById(\'hr-'+idx+'\').remove()">Kaldır</button></div></div>'
    +'<div class="ac-body">'
    +'<div class="form-group" style="margin-bottom:12px">'
    +'<select name="hotelId_'+idx+'" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'hotel\',\''+idx+'\')"><option value="">Otel Seç</option>'+opts+'</select></div>'
    +'<div class="form-row form-row-2">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Check-in</label><input type="date" name="hIn_'+idx+'" class="form-control" value="'+(h.checkin||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Check-out</label><input type="date" name="hOut_'+idx+'" class="form-control" value="'+(h.checkout||'')+'"></div>'
    +'</div>'
    +_priceFields('h', idx, h, gc)
    +'</div></div>';
}

function _tourRow(idx, tr={}, gc) {
  const opts = DB.tourOptions.map(t => '<option value="'+t.id+'" '+(t.id===tr.tourId?'selected':'')+'>'+t.icon+' '+t.name+'</option>').join('');
  return '<div class="t-row activity-card ac-tour" id="tr-'+idx+'">'
    +'<div class="ac-header"><div><span style="font-weight:600;font-size:13px;color:var(--text-sec)">🏷️ Tur Kaydı</span></div>'
    +'<div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleAcBody(this)">Daralt 🔼</button>'
    +'<button type="button" class="btn btn-danger btn-sm" style="margin-left:6px" onclick="document.getElementById(\'tr-'+idx+'\').remove()">Kaldır</button></div></div>'
    +'<div class="ac-body">'
    +'<div class="form-row form-row-2" style="margin-bottom:4px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Tur</label>'
    +'<select name="tourId_'+idx+'" class="form-control"><option value="">Seç</option>'+opts+'</select></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Tarih</label>'
    +'<input type="date" name="tourDate_'+idx+'" class="form-control" value="'+(tr.date||'')+'"></div>'
    +'</div>'
    +_priceFields('t', idx, tr, gc)
    +'</div></div>';
}

function _flightRow(idx, f={}, gc) {
  const opts = DB.flightOptions.map(o => '<option value="'+o.id+'">'+o.flightNo+' ('+o.fromAirport+'->'+o.toAirport+')</option>').join('');
  return '<div class="f-row activity-card ac-flight" id="fr-'+idx+'">'
    +'<div class="ac-header"><div><span style="font-weight:600;font-size:13px;color:var(--text-sec)">✈️ Uçuş Kaydı</span></div>'
    +'<div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleAcBody(this)">Daralt 🔼</button>'
    +'<button type="button" class="btn btn-danger btn-sm" style="margin-left:6px" onclick="document.getElementById(\'fr-'+idx+'\').remove()">Kaldır</button></div></div>'
    +'<div class="ac-body">'
    +'<div class="form-group" style="margin-bottom:12px">'
    +'<select class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'flight\',\''+idx+'\')"><option value="">Şablondan Doldur</option>'+opts+'</select></div>'
    +'<div class="form-row form-row-3" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Uçuş No</label><input type="text" name="flNo_'+idx+'" class="form-control" value="'+(f.flightNo||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Yön</label>'
    +'<select name="flDir_'+idx+'" class="form-control">'
    +'<option value="giriş" '+(f.direction==='giriş'?'selected':'')+'>Giriş (Varış)</option>'
    +'<option value="çıkış" '+(f.direction==='çıkış'?'selected':'')+'>Çıkış (Kalkış)</option>'
    +'</select></div><div></div></div>'
    +'<div class="form-row form-row-2" style="margin-bottom:10px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Kalkış Havalimanı</label><input type="text" name="flFrom_'+idx+'" class="form-control" value="'+(f.fromAirport||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Varış Havalimanı</label><input type="text" name="flTo_'+idx+'" class="form-control" value="'+(f.toAirport||'')+'"></div>'
    +'</div>'
    +'<div class="form-row form-row-2" style="margin-bottom:4px">'
    +'<div class="form-group" style="margin:0"><label class="form-label">Kalkış Zamanı</label><input type="datetime-local" name="flDep_'+idx+'" class="form-control" value="'+(f.departureTime||'')+'"></div>'
    +'<div class="form-group" style="margin:0"><label class="form-label">Varış Zamanı</label><input type="datetime-local" name="flArr_'+idx+'" class="form-control" value="'+(f.arrivalTime||'')+'"></div>'
    +'</div>'
    +_priceFields('fl', idx, f, gc)
    +'</div></div>';
}

function _transferRow(idx, tf={}, gc) {
  const opts = DB.transferOptions.map(o => '<option value="'+o.id+'" '+(o.id===tf.transferId?'selected':'')+'>'+o.name+'</option>').join('');
  return '<div class="tf-row activity-card ac-transfer" id="tfr-'+idx+'">'
    +'<div class="ac-header"><div><span style="font-weight:600;font-size:13px;color:var(--text-sec)">🚌 Transfer Kaydı</span></div>'
    +'<div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleAcBody(this)">Daralt 🔼</button>'
    +'<button type="button" class="btn btn-danger btn-sm" style="margin-left:6px" onclick="document.getElementById(\'tfr-'+idx+'\').remove()">Kaldır</button></div></div>'
    +'<div class="ac-body">'
    +'<div class="form-group" style="margin-bottom:12px">'
    +'<select name="transferId_'+idx+'" class="form-control" style="max-width:300px" onchange="loadTemplateData(this,\'transfer\',\''+idx+'\')"><option value="">Şablondan Doldur / Seç</option>'+opts+'</select></div>'
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
    +'</div></div>';
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
  try {
    const form = document.getElementById('resForm');

  // Custom Validation Highlights removed completely to allow saving without mandatory fields.

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
    return {
      hotelId: g('hotelId_'+i),
      checkin: g('hIn_'+i),
      checkout: g('hOut_'+i),
      totalCost: gn('hTotalCost_'+i),
      totalPrice: gn('hTotalPrice_'+i)
    };
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

  const res = {
    id: existingId || uuid(),
    personal: {
      firstName: g('firstName'),
      lastName: g('lastName'),
      phone: g('phone'),
      salesperson: g('salesperson')
    },
    guestCount: guestCount,
    startDate: g('startDate'),
    endDate: g('endDate'),
    days: parseInt(g('days')) || ((new Date(g('endDate')) - new Date(g('startDate'))) / (1000 * 60 * 60 * 24)) || 1,
    balloon: { 
      active: g('balActive')==='true', 
      count: balCount, 
      date: g('balDate'),
      totalCost:  balTotalCost,
      totalPrice: balTotalPrice,
      cost:  (balCount > 0 && balTotalCost  != null) ? balTotalCost  / balCount : null,
      price: (balCount > 0 && balTotalPrice != null) ? balTotalPrice / balCount : null
    },
    guests, hotels, tours, flights, transfers,
    payment: { 
      total: parseFloat(g('total'))||0, 
      currency: g('currency')||'EUR', 
      status: g('payStatus'),
      history: existingId ? (DB.getReservation(existingId)?.payment?.history || []) : [],
      paid: existingId ? (DB.getReservation(existingId)?.payment?.paid || 0) : 0
    },
    status: existingId ? (DB.getReservation(existingId)?.status || 'aktif') : 'aktif',
    notes: g('notes'),
    isPrivate: fd.get('isPrivate') === 'true'
  };

  // Prevent negative inputs
  if (res.payment.total < 0) {
    showNotif('Toplam tutar negatif olamaz!', 'error'); return;
  }
  if (balTotalCost < 0 || balTotalPrice < 0) {
    showNotif('Balon maliyet veya satış fiyatı negatif olamaz!', 'error'); return;
  }
  for (let cat of [hotels, tours, flights, transfers]) {
    for (let item of cat) {
      if ((item.totalCost && item.totalCost < 0) || (item.totalPrice && item.totalPrice < 0)) {
        showNotif('Aktivite fiyatları negatif olamaz!', 'error'); return;
      }
    }
  }

  if (existingId) {
    DB.updateReservation(existingId, res);
    window._isFormDirty = false;
    showNotif('Rezervasyon güncellendi!', 'success');
    Router.navigate('/reservation/' + existingId);
  } else {
    const nr = DB.addReservation(res);
    window._isFormDirty = false;
    showNotif('Rezervasyon eklendi!', 'success');
    Router.navigate('/reservation/' + nr.id);
  }
  } catch (err) {
    alert('HATA: ' + err.message + '\nSatır: ' + err.lineNumber + '\n' + err.stack);
    console.error(err);
  }
}
