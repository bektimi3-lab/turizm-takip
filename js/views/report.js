/* views/report.js — Raporlama, CSV ve Print Altyapısı */

const ReportEngine = {
  // Filtrelerden tablo verisini oluşturur
  buildData: function(reservations, options) {
    const rows = [];
    let headers = [];

    const addCol = (title, valFunc) => {
      headers.push(title);
      return valFunc;
    };

    const columns = [];
    
    if (options.basic) {
      columns.push(addCol('Rezervasyon ID', r => r.id.substring(0,6)));
      columns.push(addCol('Müşteri Adı', r => `${r.personal?.firstName||''} ${r.personal?.lastName||''}`.trim()));
      columns.push(addCol('Telefon', r => r.personal?.phone||''));
      columns.push(addCol('Tarih', r => r.startDate||''));
      columns.push(addCol('Kişi Sayısı', r => r.guestCount||1));
      columns.push(addCol('Satışçı', r => r.personal?.salesperson||''));
    }

    if (options.demographics) {
      columns.push(addCol('Uyruklar', r => {
        const nats = (r.guests||[]).map(g => g.nationality).filter(Boolean);
        return [...new Set(nats)].join(', ');
      }));
      columns.push(addCol('Cinsiyetler', r => {
        const m = (r.guests||[]).filter(g => g.gender === 'E').length;
        const f = (r.guests||[]).filter(g => g.gender === 'K').length;
        let str = [];
        if(m>0) str.push(m+' Erkek');
        if(f>0) str.push(f+' Kadın');
        return str.join(', ');
      }));
    }

    if (options.finance) {
      columns.push(addCol('Toplam Satış', r => r.payment?.total||0));
      columns.push(addCol('Ödenen', r => r.payment?.paid||0));
      columns.push(addCol('Kalan', r => (r.payment?.total||0) - (r.payment?.paid||0)));
      columns.push(addCol('Döviz', r => r.payment?.currency||''));
      
      columns.push(addCol('Toplam Maliyet', r => {
        let cost = 0;
        if(r.balloon?.active) {
          cost += (r.balloon.totalCost != null ? r.balloon.totalCost : (r.balloon.cost||0) * (r.balloon.count||1));
        }
        (r.tours||[]).forEach(x => cost += (x.totalCost != null ? x.totalCost : (x.cost||0) * (x.count||1)));
        (r.hotels||[]).forEach(x => cost += (x.totalCost != null ? x.totalCost : (x.cost||0) * (x.count||1)));
        (r.flights||[]).forEach(x => cost += (x.totalCost != null ? x.totalCost : (x.cost||0) * (x.count||1)));
        (r.transfers||[]).forEach(x => cost += (x.totalCost != null ? x.totalCost : (x.cost||0) * (x.count||1)));
        return cost;
      }));
    }

    if (options.tours) {
      columns.push(addCol('Turlar', r => {
        return (r.tours||[]).map(t => {
          const to = DB.tourOptions.find(o => o.id === t.tourId);
          return to ? to.name : t.tourId;
        }).join(', ');
      }));
    }

    if (options.hotels) {
      columns.push(addCol('Oteller', r => {
        return (r.hotels||[]).map(h => {
          const ho = DB.hotelOptions.find(o => o.id === h.hotelId);
          return ho ? ho.name : h.hotelId;
        }).join(', ');
      }));
    }
    if (options.balloon) {
      columns.push(addCol('Balon', r => r.balloon?.active ? 'Var' : 'Yok'));
    }

    if (options.flights) {
      columns.push(addCol('Uçuşlar', r => {
        return (r.flights||[]).map(f => {
          return f.flightNo ? f.flightNo + ' (' + f.direction + ')' : '';
        }).filter(Boolean).join(', ');
      }));
    }

    if (options.transfers) {
      columns.push(addCol('Transferler', r => {
        return (r.transfers||[]).map(t => {
          const to = DB.transferOptions.find(o => o.id === t.transferId);
          return to ? to.name : t.transferId;
        }).join(', ');
      }));
    }

    // Satırları doldur
    reservations.forEach(r => {
      const row = [];
      columns.forEach(colFunc => {
        row.push(colFunc(r));
      });
      rows.push(row);
    });

    return { headers, rows };
  },

  // CSV İndirme
  downloadCSV: function(data, filename) {
    const escapeCsv = (val) => {
      if (val == null) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Turkish chars
    csvContent += data.headers.map(escapeCsv).join(",") + "\r\n";
    
    data.rows.forEach(row => {
      csvContent += row.map(escapeCsv).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // PDF / Print (Ekrana Raporu Basar ve Yazdırır)
  printReport: function(data, title) {
    // Rapor konteynerini oluştur
    let printDiv = document.getElementById('print-report-container');
    if (!printDiv) {
      printDiv = document.createElement('div');
      printDiv.id = 'print-report-container';
      document.body.appendChild(printDiv);
    }

    const d = new Date();
    const dateStr = d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});

    let html = `
      <div class="print-header">
        <h1>${title}</h1>
        <div class="print-meta">Tarih: ${dateStr} | Kayıt Sayısı: ${data.rows.length}</div>
      </div>
      <table class="print-table">
        <thead>
          <tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printDiv.innerHTML = html;

    // Sadece yazdırılacak alanı göster, geri kalanı gizle (CSS ile halledilecek)
    window.print();
  }
};
