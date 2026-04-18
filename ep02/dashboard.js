const http = require('http');
const { openDatabase, setupDB, getStats, getAllProvinceRecords } = require('./db');
const PORT = 3456;

const queryDB = () => {
  const db = openDatabase();
  setupDB(db);

  const data = {
    stats: getStats(db),
    records: getAllProvinceRecords(db),
  };

  db.close();

  return data;
};

const HTML = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>Weather Bulk — Dashboard</title>
<meta http-equiv="refresh" content="3">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f0f;color:#e0e0e0;padding:24px}
h1{font-size:20px;font-weight:500;color:#fff;margin-bottom:4px}
.sub{font-size:13px;color:#555;margin-bottom:20px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.stat{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:16px}
.slabel{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.sval{font-size:28px;font-weight:600}
.total{color:#fff}.pending{color:#888}.success{color:#4ade80}.failed{color:#f87171}
.bar{background:#1a1a1a;border-radius:6px;height:8px;margin-bottom:20px;overflow:hidden}
.fill{height:100%;background:#4ade80;border-radius:6px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 12px;color:#555;font-weight:500;border-bottom:1px solid #2a2a2a}
td{padding:8px 12px;border-bottom:1px solid #1a1a1a}
.b{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500}
.b.success{background:#052e16;color:#4ade80}
.b.failed{background:#2d0a0a;color:#f87171}
.b.pending{background:#1a1a1a;color:#666}
.ref{font-size:12px;color:#333;margin-top:12px}
</style></head><body>
<h1>Weather Bulk Fetch</h1>
<div class="sub">ถอดสมองสร้าง EP.02 — No Brain Build</div>
<div class="stats" id="s"></div>
<div class="bar"><div class="fill" id="p" style="width:0%"></div></div>
<table><thead><tr><th>#</th><th>จังหวัด</th><th>Province</th><th>Temp</th><th>Humidity</th><th>Wind</th><th>Status</th></tr></thead>
<tbody id="t"></tbody></table>
<div class="ref" id="r"></div>
<script>
async function load(){
  const d=await(await fetch('/api/data')).json();
  const s=d.stats;
  document.getElementById('s').innerHTML=
    '<div class="stat"><div class="slabel">Total</div><div class="sval total">'+s.total+'</div></div>'+
    '<div class="stat"><div class="slabel">Pending</div><div class="sval pending">'+s.pending+'</div></div>'+
    '<div class="stat"><div class="slabel">Success</div><div class="sval success">'+s.success+'</div></div>'+
    '<div class="stat"><div class="slabel">Failed</div><div class="sval failed">'+s.failed+'</div></div>';
  const pct=s.total>0?Math.round(s.success/s.total*100):0;
  document.getElementById('p').style.width=pct+'%';
  document.getElementById('t').innerHTML=d.records.map(r=>
    '<tr><td>'+r.id+'</td><td>'+r.province_th+'</td><td>'+r.province_en+'</td>'+
    '<td>'+(r.temperature!=null?r.temperature+'°C':'—')+'</td>'+
    '<td>'+(r.humidity!=null?r.humidity+'%':'—')+'</td>'+
    '<td>'+(r.wind_speed!=null?r.wind_speed+' km/h':'—')+'</td>'+
    '<td><span class="b '+r.status+'">'+r.status+'</span></td></tr>'
  ).join('');
  document.getElementById('r').textContent='อัปเดต: '+new Date().toLocaleTimeString('th-TH');
}
load();setInterval(load,2000);
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }
  if (req.url === '/api/data') {
    try {
      const data = queryDB();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log(`[*] Dashboard: http://localhost:${PORT}`));
