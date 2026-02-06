const factionColors = {
  "織田": "#2f6fb6",   // 青
  "豊臣": "#d4af37",   // 金
  "徳川": "#2e8b57",   // 緑
  "武田": "#c0392b",   // 赤
  "上杉": "#7b3fa1",   // 紫
  "群":   "#f4a261"    // 薄オレンジ
};

/* URLから id を取得 */
const params = new URLSearchParams(location.search);
const bushoId = params.get("id");

/* CSV読み込み */
fetch("data/busho.csv")
  .then(res => res.text())
  .then(text => {
    const data = parseCSV(text);
    const busho = data.find(b => b.id === bushoId);
    if (busho) renderDetail(busho);
  });

/* CSVパース（一覧と同じ） */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines.map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] ?? "");
    return obj;
  });
}

/* 詳細描画 */
function renderDetail(b) {
  document.getElementById("name").textContent = b.name;
  document.getElementById("faction").textContent = b.faction;
  document.getElementById("clan").textContent = b.clan;
  document.getElementById("cost").textContent = b.cost;
  document.getElementById("rarity").textContent = "★".repeat(b.rarity);

  drawHexChart(b);
}

function drawHexChart(b) {

  const canvas = document.getElementById("statusChart");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxRadius = 120;

  const angleStep = (Math.PI * 2) / 6;

  /* 能力ラベル（固定順） */
  const labels = ["知略","武勇","魅力","政務","速度","統率"];

  /* ★ 仮能力値（あとでCSV化可能） */

  const statsLv1 = [50,55,48,60,52,58];
  const statsLv50 = [85,90,80,88,82,86];

  const maxValue = 100;

  const color = factionColors[b.faction] || "#999";

  /* ---- ガイド六角形 ---- */

  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 5; i++) {
    drawPolygon(ctx, cx, cy, (maxRadius/5)*i);
  }

  /* ---- ラベル描画 ---- */

  ctx.fillStyle = "#333";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  labels.forEach((label, i) => {

    const angle = angleStep * i - Math.PI/2;

    const x = cx + Math.cos(angle) * (maxRadius + 20);
    const y = cy + Math.sin(angle) * (maxRadius + 20);

    ctx.fillText(label, x, y);
  });

  /* ---- Lv50（外側） ---- */

  drawStatShape(ctx, statsLv50, color, 0.25, cx, cy, maxRadius);

  /* ---- Lv1（内側） ---- */

  drawStatShape(ctx, statsLv1, color, 0.65, cx, cy, maxRadius);
}


function drawStatShape(ctx, stats, color, alpha, cx, cy, maxRadius){

  const maxValue = 100;
  const step = (Math.PI * 2) / 6;

  ctx.beginPath();

  stats.forEach((value,i)=>{

    const angle = step*i - Math.PI/2;
    const r = (value/maxValue) * maxRadius;

    const x = cx + Math.cos(angle)*r;
    const y = cy + Math.sin(angle)*r;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);

  });

  ctx.closePath();

  ctx.fillStyle = hexToRGBA(color,alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.fill();
  ctx.stroke();
}

function drawPolygon(ctx, cx, cy, r){

  const step = (Math.PI*2)/6;

  ctx.beginPath();

  for(let i=0;i<6;i++){

    const angle = step*i - Math.PI/2;

    const x = cx + Math.cos(angle)*r;
    const y = cy + Math.sin(angle)*r;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }

  ctx.closePath();
  ctx.stroke();
}

function hexToRGBA(hex, alpha){

  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);

  return `rgba(${r},${g},${b},${alpha})`;
}
