/* views/settings.js — Ayarlar */

function renderSettingsView() {
  const s     = DB.settings;
  const users = DB.users;

  return `
  <div style="max-width:680px">

    <!-- Para Birimi -->
    <div class="settings-section">
      <div class="settings-head">💰 Para Birimi</div>
      <div class="card">
        <div class="form-group" style="margin:0">
          <label class="form-label">Varsayılan Para Birimi</label>
          <select id="currSel" class="form-control" style="max-width:200px" onchange="saveCurrency()">
            <option value="EUR" ${s.currency==='EUR'?'selected':''}>€ EUR — Euro</option>
            <option value="USD" ${s.currency==='USD'?'selected':''}>$ USD — Dolar</option>
            <option value="TRY" ${s.currency==='TRY'?'selected':''}>₺ TRY — Türk Lirası</option>
          </select>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px">Yeni turist eklerken varsayılan olarak kullanılır. Her turistin para birimi ayrı seçilebilir.</div>
        </div>
      </div>
    </div>

    <!-- Kullanıcılar -->
    <div class="settings-section">
      <div class="settings-head">👥 Kullanıcılar (Demo)</div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>Şifre</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td><strong>${u.name}</strong></td>
              <td style="font-size:12px">${u.email}</td>
              <td><span class="badge ${u.role==='editor'?'badge-orange':'badge-blue'}">${u.role==='editor'?'✏️ Editör':'👁️ Görüntüleyici'}</span></td>
              <td><code style="font-size:11px;background:var(--surface);padding:2px 6px;border-radius:4px;color:var(--orange)">${u.password}</code></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:8px">ℹ️ Firebase entegrasyonu ile gerçek kullanıcı yönetimi eklenebilir.</div>
    </div>

    <!-- Veri Yönetimi -->
    <div class="settings-section">
      <div class="settings-head">🗄️ Veri Yönetimi</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <button class="btn btn-secondary" onclick="exportJSON()">📤 JSON Olarak Dışa Aktar</button>
        <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📥 JSON İçe Aktar</button>
        <input type="file" id="importFile" accept=".json" style="display:none" onchange="importJSON(event)">
        <button class="btn btn-danger" onclick="resetAll()">🗑️ Tüm Verileri Sıfırla</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">Veriler tarayıcının yerel depolamasında saklanır. Dışa aktararak yedek alabilirsiniz.</div>
    </div>

    <!-- GitHub Pages Bilgisi -->
    <div class="settings-section">
      <div class="settings-head">🌐 Ücretsiz Hosting (GitHub Pages)</div>
      <div class="card" style="line-height:1.9;font-size:13.5px;color:var(--text-sec)">
        Bu siteyi tamamen ücretsiz olarak GitHub Pages'te yayınlayabilirsiniz:<br><br>
        <strong style="color:var(--text)">1.</strong> <a href="https://github.com" target="_blank" style="color:var(--orange)">github.com</a>'da ücretsiz hesap açın.<br>
        <strong style="color:var(--text)">2.</strong> Yeni bir "repository" (repo) oluşturun → adını <code style="color:var(--orange);background:var(--surface);padding:1px 5px;border-radius:3px">turizm-takip</code> yapın.<br>
        <strong style="color:var(--text)">3.</strong> Tüm proje dosyalarını bu repoya yükleyin (Upload files).<br>
        <strong style="color:var(--text)">4.</strong> Settings → Pages → "Deploy from branch" → <code style="color:var(--orange);background:var(--surface);padding:1px 5px;border-radius:3px">main</code> seçin → Kaydet.<br>
        <strong style="color:var(--text)">5.</strong> Birkaç dakika sonra <code style="color:var(--orange);background:var(--surface);padding:1px 5px;border-radius:3px">kullaniciadiniz.github.io/turizm-takip</code> adresinde yayında olur!<br><br>
        <span style="color:var(--yellow)">⚠️ Not:</span> Prototip sürümünde veriler her kullanıcının kendi tarayıcısında saklanır. Ekip paylaşımı için Firebase entegrasyonu gereklidir.
      </div>
    </div>

    <!-- Hakkında -->
    <div class="settings-section">
      <div class="settings-head">ℹ️ Hakkında</div>
      <div class="card" style="font-size:13px;color:var(--text-sec);line-height:1.8">
        <strong style="color:var(--text)">TurTakip</strong> v1.0 — Turizm Yönetim Sistemi<br>
        Prototip sürümü. Veriler tarayıcı LocalStorage'da saklanır.<br>
        Tasarım: Dark mode, premium UI, tamamen Türkçe.
      </div>
    </div>
  </div>`;
}

function saveCurrency() {
  const s = DB.settings;
  s.currency = document.getElementById('currSel').value;
  DB.settings = s;
  showNotif('Para birimi güncellendi: ' + s.currency, 'success');
}

function exportJSON() {
  const data = { tourists: DB.tourists, tours: DB.tours, settings: DB.settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url;
  a.download = `turtakip-yedek-${new Date().toISOString().split('T')[0]}.json`;
  a.click(); URL.revokeObjectURL(url);
  showNotif('Veri dışa aktarıldı!', 'success');
}

function importJSON(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.tourists) DB.tourists = d.tourists;
      if (d.tours)    DB.tours    = d.tours;
      if (d.settings) DB.settings = d.settings;
      showNotif('Veri içe aktarıldı!', 'success');
      Router.navigate('/year/' + new Date().getFullYear());
    } catch { showNotif('Geçersiz JSON dosyası.', 'error'); }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('TÜM verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;
  if (!confirm('Son onay: Tüm turistler ve ayarlar silinecek.')) return;
  ['tts_tourists','tts_tours','tts_settings'].forEach(k => localStorage.removeItem(k));
  showNotif('Veriler sıfırlandı.', 'success');
  Router.navigate('/year/' + new Date().getFullYear());
}
