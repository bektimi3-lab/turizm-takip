/* views/stats.js — İstatistikler ve Denetim Kayıtları (Sadece Patron) */

function renderStatsView() {
  if (!Auth.canEdit()) {
    setTimeout(() => Router.navigate('/dashboard'), 0);
    return '';
  }

  const rs = DB.reservations;
  const cur = DB.settings.currency || 'EUR';

  // Finans
  let total = 0, paid = 0;
  let balloonSales = 0, balloonCost = 0;
  let tourSales = 0, tourCost = 0;
  let hotelSales = 0, hotelCost = 0;
  let flightSales = 0, flightCost = 0;
  let transferSales = 0, transferCost = 0;
  
  let extraSalesAmount = 0;
  let extraSalesCount = 0;
  let extraSalesDetails = [];

  rs.forEach(r => { 
    total += (r.payment?.total||0); 
    paid  += (r.payment?.paid||0); 

    // Balon
    if (r.balloon && r.balloon.active) {
      balloonSales += (r.balloon.totalPrice != null ? r.balloon.totalPrice : (r.balloon.price||0) * (r.balloon.count||1));
      balloonCost  += (r.balloon.totalCost  != null ? r.balloon.totalCost  : (r.balloon.cost||0)  * (r.balloon.count||1));
    }
    // Turlar
    (r.tours||[]).forEach(t => {
      if (t.totalPrice != null) tourSales += t.totalPrice;
      if (t.totalCost  != null) tourCost  += t.totalCost;
    });
    // Oteller
    (r.hotels||[]).forEach(h => {
      if (h.totalPrice != null) hotelSales += h.totalPrice;
      if (h.totalCost  != null) hotelCost  += h.totalCost;
    });
    // Ucuslar
    (r.flights||[]).forEach(f => {
      if (f.totalPrice != null) flightSales += f.totalPrice;
      if (f.totalCost  != null) flightCost  += f.totalCost;
    });
    // Transferler
    (r.transfers||[]).forEach(tf => {
      if (tf.totalPrice != null) transferSales += tf.totalPrice;
      if (tf.totalCost  != null) transferCost  += tf.totalCost;
    });
    
    // Ekstra Satışlar
    let hasExtra = false;
    let extraRevenue = 0;
    if (r.balloon?.isExtra) {
      hasExtra = true;
      const bPrice = r.balloon.totalPrice != null ? r.balloon.totalPrice : (r.balloon.price||0) * (r.balloon.count||1);
      extraRevenue += bPrice;
      extraSalesDetails.push({ name: `${r.personal?.firstName} ${r.personal?.lastName}`, item: 'Balon', amount: bPrice, resId: r.id });
    }
    (r.tours||[]).forEach(t => {
      if (t.isExtra) {
        hasExtra = true;
        const tPrice = t.totalPrice || 0;
        extraRevenue += tPrice;
        const opt = DB.tourOptions.find(o => o.id === t.tourId);
        extraSalesDetails.push({ name: `${r.personal?.firstName} ${r.personal?.lastName}`, item: opt?.name || 'Tur', amount: tPrice, resId: r.id });
      }
    });
    if (hasExtra) {
      extraSalesCount++;
      extraSalesAmount += extraRevenue;
    }
  });
  const remain = total - paid;
  const balloonProfit  = balloonSales  - balloonCost;
  const tourProfit     = tourSales     - tourCost;
  const hotelProfit    = hotelSales    - hotelCost;
  const flightProfit   = flightSales   - flightCost;
  const transferProfit = transferSales - transferCost;

  // Toplam aktivite maliyet/gelir (girilen)
  const activitySalesTotal = balloonSales + tourSales + hotelSales + flightSales + transferSales;
  const activityCostTotal  = balloonCost  + tourCost  + hotelCost  + flightCost  + transferCost;
  const activityProfit     = activitySalesTotal - activityCostTotal;
  
  // Basit SVG Donut
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const strokeDash = `${pct} 100`;

  const donutSVG = `
    <svg viewBox="0 0 36 36" style="width:140px;height:140px">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" stroke-width="3" />
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#donut-grad)" stroke-width="3" stroke-dasharray="0 100" style="animation: dash ${pct > 0 ? '1.5s' : '0s'} ease-out forwards;" />
      <defs>
        <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--orange)" />
          <stop offset="100%" stop-color="var(--yellow)" />
        </linearGradient>
      </defs>
      <style>@keyframes dash { to { stroke-dasharray: ${pct} 100; } }</style>
      <text x="18" y="20.5" text-anchor="middle" fill="var(--text)" font-size="7" font-weight="800">%${pct.toFixed(0)}</text>
    </svg>
  `;

  // Tur popülerliği
  const tourCounts = {};
  rs.forEach(r => {
    (r.tours||[]).forEach(t => {
      const opt = DB.tourOptions.find(o => o.id === t.tourId);
      let name = opt ? opt.name : 'Diğer';
      if (t.isPrivate) name += ' (VIP)';
      tourCounts[name] = (tourCounts[name] || 0) + 1;
    });
  });
  const tArr = Object.entries(tourCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxTour = tArr.length ? tArr[0][1] : 1;
  const toursHTML = tArr.map(([name, count]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${name}</span> <span style="color:var(--text-muted)">${count} Rez.</span>
      </div>
      <div class="stat-bar-container">
        <div class="stat-bar-fill" style="--target-width:${(count/maxTour)*100}%"></div>
      </div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Henüz veri yok.</div>';

  // Demografi (Memleket, Yaş, Cinsiyet)
  const allGuests = [];
  const buyerGuests = [];
  const memberGuests = [];

  rs.forEach(r => {
    if (r.guests && r.guests.length > 0) {
      buyerGuests.push(r.guests[0]);
      allGuests.push(r.guests[0]);
      for (let i = 1; i < r.guests.length; i++) {
        memberGuests.push(r.guests[i]);
        allGuests.push(r.guests[i]);
      }
    }
  });

  const currentYear = new Date().getFullYear();
  const calcDemo = (gList) => {
    const nats = {};
    const gens = { 'Erkek': 0, 'Kadın': 0, 'Belirtilmemiş': 0 };
    const ages = { '0-12 Çocuk': 0, '13-25 Genç': 0, '26-40 Yetişkin': 0, '41-60 Orta Yaş': 0, '60+ Yaşlı': 0, 'Bilinmiyor': 0 };
    gList.forEach(g => {
      const nat = g.nationality || 'Bilinmiyor';
      nats[nat] = (nats[nat] || 0) + 1;
      const gen = g.gender || 'Belirtilmemiş';
      gens[gen] = (gens[gen] || 0) + 1;
      if (g.dob) {
        const y = parseInt(g.dob.substring(0,4));
        const age = currentYear - y;
        if (age <= 12) ages['0-12 Çocuk']++;
        else if (age <= 25) ages['13-25 Genç']++;
        else if (age <= 40) ages['26-40 Yetişkin']++;
        else if (age <= 60) ages['41-60 Orta Yaş']++;
        else ages['60+ Yaşlı']++;
      } else {
        ages['Bilinmiyor']++;
      }
    });
    return { nats, gens, ages };
  };

  const demoAll = calcDemo(allGuests);
  const demoBuyer = calcDemo(buyerGuests);
  const demoMember = calcDemo(memberGuests);

  const renderBars = (obj) => {
    const arr = Object.entries(obj).sort((a,b)=>b[1]-a[1]).filter(x => x[1] > 0);
    const maxVal = arr.length ? arr[0][1] : 1;
    return arr.map(([name, count]) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span>${name}</span> <span style="color:var(--text-muted)">${count} Kişi</span>
        </div>
        <div class="stat-bar-container">
          <div class="stat-bar-fill" style="--target-width:${(count/maxVal)*100}%; background:linear-gradient(90deg, var(--blue), var(--cyan))"></div>
        </div>
      </div>
    `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Veri yok.</div>';
  };

  // Audit Logs — patron islemi gizlenir, sadece editor/viewer gorulur
  const logs = DB.auditLogs;
  // Patronun hareketleri sistemde denetim bölümünde tamamen gizlenir
  const visibleLogs = logs.filter(l => l.userRole !== 'owner');

  const logsEditHTML = visibleLogs.filter(l => l.action !== 'goruntuledi').map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> kaydını <strong>${l.action}</strong>.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  const logsViewHTML = visibleLogs.filter(l => l.action === 'goruntuledi').slice(0,100).map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> profiline baktı.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  return `
  <div style="max-width:960px;margin:0 auto;padding-bottom:50px">

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
      <div class="tabs" id="statsTabs" style="margin:0; border-bottom:none">
        ${Auth.isOwner() ? `<button class="tab-btn active" data-tab="st-genel" onclick="switchStatsTab(this,'st-genel')">📊 Genel</button>` : ''}
        <button class="tab-btn ${!Auth.isOwner() ? 'active' : ''}" data-tab="st-demografi" onclick="switchStatsTab(this,'st-demografi')">👥 Demografi</button>
        <button class="tab-btn" data-tab="st-denetim" onclick="switchStatsTab(this,'st-denetim')">🔍 Denetim</button>
      </div>
      ${Auth.isOwner() ? `<button type="button" class="btn btn-primary" onclick="openReportModal()">📄 Rapor / Çıktı Al</button>` : ''}
    </div>

    ${Auth.isOwner() ? `
    <!-- Sekme: Genel -->
    <div class="tab-content active" id="tc-st-genel">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px,1fr));gap:20px;margin-bottom:20px">
        <div class="card" style="display:flex;align-items:center;gap:30px">
          <div>${donutSVG}</div>
          <div style="flex:1">
            <div class="sec-title">Finansal Özet (Tüm Zamanlar)</div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Toplam Beklenen Ciro</div><div style="font-size:18px;font-weight:700">${formatCurrency(total, cur)}</div></div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Tahsil Edilen</div><div style="font-size:18px;font-weight:700;color:var(--green)">${formatCurrency(paid, cur)}</div></div>
            <div><div style="font-size:11px;color:var(--text-muted)">Kalan Alacak</div><div style="font-size:18px;font-weight:700;color:var(--red)">${formatCurrency(remain, cur)}</div></div>
          </div>
        </div>
        <div class="card">
          <div class="sec-title">Aktivite Kâr Analizi (Girilen Maliyetler)</div>
          <div style="overflow-x:auto">
            <table class="table" style="margin-top:8px">
              <thead><tr><th>Aktivite</th><th style="text-align:right">Satış</th><th style="text-align:right">Maliyet</th><th style="text-align:right">Net Kâr</th></tr></thead>
              <tbody>
                <tr><td>Balon</td><td style="text-align:right">${formatCurrency(balloonSales,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(balloonCost,cur)}</td><td style="text-align:right;font-weight:700;color:${balloonProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(balloonProfit,cur)}</td></tr>
                <tr><td>Turlar</td><td style="text-align:right">${formatCurrency(tourSales,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(tourCost,cur)}</td><td style="text-align:right;font-weight:700;color:${tourProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(tourProfit,cur)}</td></tr>
                <tr><td>Oteller</td><td style="text-align:right">${formatCurrency(hotelSales,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(hotelCost,cur)}</td><td style="text-align:right;font-weight:700;color:${hotelProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(hotelProfit,cur)}</td></tr>
                <tr><td>Uçuşlar</td><td style="text-align:right">${formatCurrency(flightSales,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(flightCost,cur)}</td><td style="text-align:right;font-weight:700;color:${flightProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(flightProfit,cur)}</td></tr>
                <tr><td>Transferler</td><td style="text-align:right">${formatCurrency(transferSales,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(transferCost,cur)}</td><td style="text-align:right;font-weight:700;color:${transferProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(transferProfit,cur)}</td></tr>
                <tr style="border-top:2px solid var(--border);font-weight:700"><td>TOPLAM</td><td style="text-align:right">${formatCurrency(activitySalesTotal,cur)}</td><td style="text-align:right;color:var(--orange)">${formatCurrency(activityCostTotal,cur)}</td><td style="text-align:right;font-size:16px;color:${activityProfit>=0?'var(--green)':'var(--red)'}">${formatCurrency(activityProfit,cur)}</td></tr>
              </tbody>
            </table>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">* Yalnızca fiyat girilen aktiviteler dahildir.</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:20px;border-color:var(--orange)">
        <div class="sec-title" style="color:var(--orange)">🌟 Ekstra (Sonradan) Satışlar</div>
        <div style="display:flex;gap:30px;align-items:center;margin-bottom:16px">
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Ek Satış Yapılan Rezervasyon</div>
            <div style="font-size:24px;font-weight:700">${extraSalesCount}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Toplam Ek Satış Cirosu</div>
            <div style="font-size:24px;font-weight:700;color:var(--green)">${formatCurrency(extraSalesAmount, cur)}</div>
          </div>
        </div>
        ${extraSalesDetails.length ? `
          <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm)">
            <table class="table" style="margin:0">
              <thead style="position:sticky;top:0;background:var(--surface)"><tr><th>Misafir</th><th>Hizmet</th><th style="text-align:right">Tutar</th></tr></thead>
              <tbody>
                ${extraSalesDetails.map(ex => `
                  <tr style="cursor:pointer" onclick="Router.navigate('/reservation/${ex.resId}')">
                    <td style="font-weight:600">${ex.name}</td>
                    <td>${ex.item}</td>
                    <td style="text-align:right;color:var(--green);font-weight:600">${formatCurrency(ex.amount, cur)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div style="font-size:13px;color:var(--text-muted)">Henüz ekstra satış bulunmamaktadır.</div>'}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px,1fr));gap:20px;margin-top:20px">
        <div class="card">
          <div class="sec-title">🌍 En Çok Gelen Uyruklar</div>
          ${renderBars(demoAll.nats)}
        </div>
        <div class="card">
          <div class="sec-title">🏷️ Popüler Turlar</div>
          ${toursHTML}
        </div>
      </div>
    </div>
    ` : ''}


    <!-- Sekme: Demografi -->
    <div class="tab-content ${!Auth.isOwner() ? 'active' : ''}" id="tc-st-demografi">
      <div style="margin-bottom:20px;display:flex;align-items:center;gap:12px;background:var(--card);padding:14px;border-radius:var(--radius);border:1px solid var(--border)">
        <label style="font-size:13px;font-weight:600;color:var(--text-sec)">Kategori:</label>
        <select class="form-control" style="width:auto;min-width:240px" onchange="document.querySelectorAll('.demo-view').forEach(e=>e.style.display='none'); document.getElementById('demo-'+this.value).style.display='grid';">
          <option value="all">Tüm Yolcular</option>
          <option value="buyer">Satın Alanlar (Ana Misafirler)</option>
          <option value="member">Gruba Dahil Olanlar (Diğerleri)</option>
        </select>
      </div>

      <div id="demo-all" class="demo-view" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:20px">
        <div class="card"><div class="sec-title">Cinsiyet Dağılımı</div>${renderBars(demoAll.gens)}</div>
        <div class="card"><div class="sec-title">Yaş Grupları</div>${renderBars(demoAll.ages)}</div>
        <div class="card"><div class="sec-title">Uyruk (Memleket) Dağılımı</div>${renderBars(demoAll.nats)}</div>
      </div>

      <div id="demo-buyer" class="demo-view" style="display:none;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:20px">
        <div class="card"><div class="sec-title">Cinsiyet Dağılımı (Satın Alanlar)</div>${renderBars(demoBuyer.gens)}</div>
        <div class="card"><div class="sec-title">Yaş Grupları (Satın Alanlar)</div>${renderBars(demoBuyer.ages)}</div>
        <div class="card"><div class="sec-title">Uyruk Dağılımı (Satın Alanlar)</div>${renderBars(demoBuyer.nats)}</div>
      </div>

      <div id="demo-member" class="demo-view" style="display:none;grid-template-columns:repeat(auto-fit, minmax(280px,1fr));gap:20px">
        <div class="card"><div class="sec-title">Cinsiyet Dağılımı (Grup)</div>${renderBars(demoMember.gens)}</div>
        <div class="card"><div class="sec-title">Yaş Grupları (Grup)</div>${renderBars(demoMember.ages)}</div>
        <div class="card"><div class="sec-title">Uyruk Dağılımı (Grup)</div>${renderBars(demoMember.nats)}</div>
      </div>
    </div>

    <!-- Sekme: Denetim Kayıtları -->
    <div class="tab-content" id="tc-st-denetim">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="sec-title">✏️ Düzenleme Geçmişi</div>
          <div style="max-height:500px;overflow-y:auto;padding-right:10px">${logsEditHTML}</div>
        </div>
        <div class="card">
          <div class="sec-title">👁️ Görüntüleme Geçmişi (Son 100)</div>
          <div style="max-height:500px;overflow-y:auto;padding-right:10px">${logsViewHTML}</div>
        </div>
      </div>
    </div>

  </div>
  
  ${Auth.isOwner() ? `
  <!-- Rapor Modal -->
  <div id="reportModalOverlay" class="modal-overlay" onclick="if(event.target===this) closeReportModal()">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">📄 Detaylı Rapor Oluştur</div>
        <button type="button" class="modal-close" onclick="closeReportModal()">&times;</button>
      </div>
      
      <div style="padding: 0 20px 20px 20px">
      <div class="form-group">
        <label class="form-label">Tarih Aralığı (Rezervasyon Başlangıcına Göre)</label>
        <select id="repDateFilter" class="form-control" onchange="document.getElementById('repCustomDates').style.display = this.value==='custom' ? 'block' : 'none'">
          <option value="all">Tüm Zamanlar</option>
          <option value="this_month">Bu Ay</option>
          <option value="last_month">Geçen Ay</option>
          <option value="custom">Özel Tarih Seçimi...</option>
        </select>
      </div>
      
      <div id="repCustomDates" style="display:none; background:var(--card-hover); padding:10px; border-radius:var(--radius-sm); margin-bottom:16px">
        <div style="display:flex; gap:10px">
          <div style="flex:1"><label class="form-label">Başlangıç</label><input type="date" id="repStartDate" class="form-control"></div>
          <div style="flex:1"><label class="form-label">Bitiş</label><input type="date" id="repEndDate" class="form-control"></div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:20px">
        <label class="form-label">Eklenecek Veri Sütunları</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColBasic" checked> Temel Bilgiler</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColFinance" checked> Finans / Ciro Özeti</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColTours" checked> Tur Dağılımı</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColHotels" checked> Otel Dağılımı</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColBalloon" checked> Balon Durumu</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColDemo" checked> Cinsiyet/Uyruk</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColFlights" checked> Uçuşlar</label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer"><input type="checkbox" id="repColTransfers" checked> Transferler</label>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border); padding-top:16px">
        <button type="button" class="btn btn-ghost" onclick="closeReportModal()">İptal</button>
        <button type="button" class="btn btn-secondary" onclick="generateReport('csv')" style="display:flex;align-items:center;gap:6px">📊 Excel (CSV) İndir</button>
        <button type="button" class="btn btn-primary" onclick="generateReport('print')" style="display:flex;align-items:center;gap:6px">🖨️ PDF / Yazdır</button>
      </div>
      </div>
    </div>
  </div>
  ` : ''}`;
}

function switchStatsTab(btn, tabId) {
  document.querySelectorAll('#statsTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('#tc-st-genel, #tc-st-denetim, #tc-st-demografi').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}

function openReportModal() {
  const el = document.getElementById('reportModalOverlay');
  if (!el) { console.warn('Rapor modal DOM\'da bulunamadı'); return; }
  el.classList.add('open');
}

function closeReportModal() {
  const el = document.getElementById('reportModalOverlay');
  if (!el) return;
  el.classList.remove('open');
}

function generateReport(format) {
  if (!Auth.isOwner()) return;

  const dateFilter = document.getElementById('repDateFilter').value;
  let start = null, end = null;
  const now = new Date();

  if (dateFilter === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (dateFilter === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (dateFilter === 'custom') {
    const s = document.getElementById('repStartDate').value;
    const e = document.getElementById('repEndDate').value;
    if (s) start = new Date(s + 'T00:00:00');
    if (e) end = new Date(e + 'T23:59:59');
  }

  // Verileri Filtrele
  const filtered = DB.reservations.filter(r => {
    if (start || end) {
      if (!r.startDate) return false;
      const d = new Date(r.startDate + 'T00:00:00');
      if (start && d < start) return false;
      if (end && d > end) return false;
    }
    return true;
  });

  const options = {
    basic: document.getElementById('repColBasic').checked,
    finance: document.getElementById('repColFinance').checked,
    tours: document.getElementById('repColTours').checked,
    hotels: document.getElementById('repColHotels').checked,
    balloon: document.getElementById('repColBalloon').checked,
    demographics: document.getElementById('repColDemo').checked,
    flights: document.getElementById('repColFlights').checked,
    transfers: document.getElementById('repColTransfers').checked
  };

  const data = ReportEngine.buildData(filtered, options);

  if (format === 'csv') {
    ReportEngine.downloadCSV(data, 'rezervasyon_raporu');
  } else if (format === 'print') {
    let title = 'Rezervasyon Raporu';
    if (dateFilter === 'this_month') title += ' (Bu Ay)';
    else if (dateFilter === 'last_month') title += ' (Geçen Ay)';
    else if (dateFilter === 'custom') title += ' (Özel Tarih)';
    else title += ' (Tüm Zamanlar)';
    
    ReportEngine.printReport(data, title);
  }

  closeReportModal();
}
