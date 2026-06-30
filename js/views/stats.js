/* views/stats.js — İstatistikler ve Denetim Kayıtları (Sadece Patron) */

function renderStatsView() {
  if (!Auth.canEdit()) {
    return `<div class="empty-state">
      <div class="empty-ico">🔒</div>
      <div class="empty-title">Erişim Engellendi</div>
      <div class="empty-desc">Bu sayfayı yalnızca Patron ve Editör rolündeki kullanıcılar görüntüleyebilir.</div>
    </div>`;
  }

  const rs = DB.reservations;
  const cur = DB.settings.currency || 'EUR';

  // Finans
  let total = 0, paid = 0;
  let balloonSales = 0, balloonCost = 0;
  rs.forEach(r => { 
    total += (r.payment?.total||0); 
    paid += (r.payment?.paid||0); 
    if (r.balloon && r.balloon.active && r.balloon.count > 0) {
      balloonSales += (r.balloon.price || 0) * r.balloon.count;
      balloonCost += (r.balloon.cost || 0) * r.balloon.count;
    }
  });
  const remain = total - paid;
  const balloonProfit = balloonSales - balloonCost;
  
  // Basit SVG Donut
  const pct = total > 0 ? (paid / total) * 100 : 0;
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
      const name = opt ? opt.name : 'Diğer';
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

  // Audit Logs
  const logs = DB.auditLogs;
  const logsEditHTML = logs.filter(l => l.action !== 'görüntüledi').map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> kaydını <strong>${l.action}</strong>.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  const logsViewHTML = logs.filter(l => l.action === 'görüntüledi').slice(0,100).map(l => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:13px">
      <div style="color:var(--text-muted);min-width:110px">${formatDateTime(l.time)}</div>
      <div><strong>${l.userName}</strong> (${l.userRole}) <span style="color:var(--text-sec)">${l.details}</span> profiline baktı.</div>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text-muted)">Kayıt yok.</div>';

  return `
  <div style="max-width:960px;margin:0 auto;padding-bottom:50px">

    <div class="tabs" id="statsTabs">
      ${Auth.isOwner() ? `<button class="tab-btn active" data-tab="st-genel" onclick="switchStatsTab(this,'st-genel')">📊 Genel</button>` : ''}
      <button class="tab-btn ${!Auth.isOwner() ? 'active' : ''}" data-tab="st-demografi" onclick="switchStatsTab(this,'st-demografi')">👥 Demografi</button>
      <button class="tab-btn" data-tab="st-denetim" onclick="switchStatsTab(this,'st-denetim')">🔍 Denetim</button>
    </div>

    ${Auth.isOwner() ? `
    <!-- Sekme: Genel -->
    <div class="tab-content active" id="tc-st-genel">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px,1fr));gap:20px">
        
        <div class="card" style="display:flex;align-items:center;gap:30px">
          <div>${donutSVG}</div>
          <div style="flex:1">
            <div class="sec-title">Finansal Özet (Tüm Zamanlar)</div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Toplam Ciro</div><div style="font-size:18px;font-weight:700">${formatCurrency(total, cur)}</div></div>
            <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-muted)">Tahsil Edilen</div><div style="font-size:18px;font-weight:700;color:var(--green)">${formatCurrency(paid, cur)}</div></div>
            <div><div style="font-size:11px;color:var(--text-muted)">Kalan Alacak</div><div style="font-size:18px;font-weight:700;color:var(--red)">${formatCurrency(remain, cur)}</div></div>
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;justify-content:center">
          <div class="sec-title">🎈 Balon Karlılık Analizi</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div><div style="font-size:11px;color:var(--text-muted)">Balon Satış Hacmi</div><div style="font-size:16px;font-weight:600">${formatCurrency(balloonSales, cur)}</div></div>
            <div><div style="font-size:11px;color:var(--text-muted)">Balon Maliyeti</div><div style="font-size:16px;font-weight:600;color:var(--orange)">${formatCurrency(balloonCost, cur)}</div></div>
          </div>
          <div style="padding-top:12px;border-top:1px solid var(--border)">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Net Balon Karı</div>
            <div style="font-size:24px;font-weight:800;color:var(--green)">${formatCurrency(balloonProfit, cur)}</div>
          </div>
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

  </div>`;
}

function switchStatsTab(btn, tabId) {
  document.querySelectorAll('#statsTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('#tc-st-genel, #tc-st-denetim, #tc-st-demografi').forEach(c => c.classList.toggle('active', c.id === 'tc-' + tabId));
}
