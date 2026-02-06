/**********************
 * 勢力カラー定義
 **********************/
const factionColors = {
  "織田":   "rgba(33,150,243,0.45)",
  "豊臣":   "rgba(255,193,7,0.45)",
  "徳川":   "rgba(76,175,80,0.45)",
  "武田":   "rgba(244,67,54,0.45)",
  "上杉":   "rgba(156,39,176,0.45)",
  "群":     "rgba(255,152,0,0.40)"
};
const rarityColors = {
  5: "#fbc02d", // 金
  4: "#7e57c2", // 紫
  3: "#42a5f5", // 青
  2: "#66bb6a", // 緑
  1: "#424242"  // 黒
};

let data = [];

/**********************
 * CSV読み込み
 **********************/
fetch('busho.csv')
  .then(res => res.text())
  .then(text => {
    data = parseCSV(text);
    renderList(data);
  });

function parseCSV(text) {
  const lines = text.trim().split('\n');

  // BOM除去 + trim
  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ? values[i].trim() : "";
    });
    return obj;
  });
}

/**********************
 * 一覧表示
 **********************/
function applyFilters() {
  const name = nameInput.value.trim();
  const faction = factionSelect.value;
  const clan = clanSelect.value;
  const cost = costSelect.value;

  const filtered = allBusho.filter(b => {
    if (name && !b.name.includes(name)) return false;
    if (faction && b.faction !== faction) return false;
    if (clan && b.clan !== clan) return false;
    if (cost && String(b.cost) !== cost) return false;
    return true;
  });

  renderList(filtered);
}

function renderList(list) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  list.forEach(item => {
    const rarity = Number(item.rarity) || 1;
    const color = rarityColors[rarity] || "#999";

    const div = document.createElement('div');
    div.className = 'list-item';

    div.innerHTML = `
      <span class="rarity-bar" style="background:${color};"></span>
      <span class="name">${item.name}</span>
    `;

    div.onclick = () => showDetail(item.id);
    app.appendChild(div);
  });
}

/**********************
 * 詳細表示
 **********************/
function showDetail(id) {
const item = data.find(d => d.id === id);
  if (!item) return;

const faction = item.faction ? item.faction.trim() : "";
const color =
  factionColors[faction] || "rgba(120,120,120,0.4)";

  document.body.innerHTML = `
    <h1>${item.name}</h1>

    <div class="container">
      <div class="card">
        <p>勢力：<strong>${item.faction}</strong></p>
        <canvas id="chart" width="280" height="280"></canvas>
        <p style="font-size:12px;color:#666;">
          <span style="color:${color};">■</span> Lv50　
          <span style="color:rgba(160,160,160,0.4);">■</span> Lv1
        </p>
      </div>
    </div>

    <a class="back" href="index.html">← 一覧に戻る</a>
  `;

  const p = Number(item.power);

  const statsLv50 = {
    武力: p,
    知力: p,
    統率: p,
    速度: p,
    防御: p,
    攻撃: p
  };

  const statsLv1 = {
    武力: p - 20,
    知力: p - 25,
    統率: p - 22,
    速度: p - 18,
    防御: p - 20,
    攻撃: p - 15
  };

  drawRadarChart(
    "chart",
    [statsLv50, statsLv1],
    [color, "rgba(180,180,180,0.35)"],
    100
  );

console.log(
  "勢力=[" + item.faction + "]",
  "trim=[" + faction + "]",
  "color=", factionColors[faction]
);

}

/**********************
 * レーダーチャート
 **********************/
function drawRadarChart(canvasId, statsList, colors, maxValue) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = Object.keys(statsList[0]);
  const count = labels.length;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ガイド
  ctx.strokeStyle = '#ccc';
  for (let l = 1; l <= 5; l++) {
    ctx.beginPath();
    labels.forEach((_, i) => {
      const a = Math.PI * 2 / count * i - Math.PI / 2;
      const r = radius * l / 5;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // 軸とラベル
  labels.forEach((label, i) => {
    const a = Math.PI * 2 / count * i - Math.PI / 2;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, x - 10, y - 4);
  });

  // データ描画（重ね）
  statsList.forEach((stats, idx) => {
    ctx.beginPath();
    Object.values(stats).forEach((v, i) => {
      const a = Math.PI * 2 / count * i - Math.PI / 2;
      const r = radius * v / maxValue;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = colors[idx];
    ctx.strokeStyle = colors[idx];
    ctx.fill();
    ctx.stroke();
  });
}
