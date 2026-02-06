const listEl = document.getElementById("bushoList");
const nameInput = document.getElementById("nameSearch");
const factionSelect = document.getElementById("factionFilter");
const clanSelect = document.getElementById("clanFilter");
const costSelect = document.getElementById("costFilter");

let allBusho = [];

/* レアリティ → 色 */
const rarityColors = {
  5: "#d4af37", // 金
  4: "#7b3fa1", // 紫
  3: "#2f6fb6", // 青
  2: "#2e8b57", // 緑
  1: "#000000"  // 黒
};

/* CSV読み込み */
fetch("data/busho.csv")
  .then(res => res.text())
  .then(text => {
    allBusho = parseCSV(text);
    setupFilters(allBusho);
    renderList(allBusho);
  });

/* CSVパース */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

/* フィルター選択肢生成 */
function setupFilters(data) {
  createOptions(factionSelect, data.map(b => b.faction));
  createOptions(clanSelect, data.map(b => b.clan));
  createOptions(costSelect, data.map(b => b.cost));
}

/* option生成 */
function createOptions(select, values) {
  [...new Set(values)].sort().forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

/* フィルター適用 */
function applyFilters() {
  const name = nameInput.value.trim();
  const faction = factionSelect.value;
  const clan = clanSelect.value;
  const cost = costSelect.value;

  const filtered = allBusho.filter(b => {
    if (name && !b.name.includes(name)) return false;
    if (faction && b.faction !== faction) return false;
    if (clan && b.clan !== clan) return false;
    if (cost && b.cost !== cost) return false;
    return true;
  });

  renderList(filtered);
}

/* 一覧描画 */
function renderList(data) {
  listEl.innerHTML = "";

  data.forEach(b => {
    const row = document.createElement("div");
    row.className = "busho-row";

    const bar = document.createElement("div");
    bar.className = "rarity-bar";
    bar.style.background =
      rarityColors[b.rarity] || "#999";

    row.appendChild(bar);

    row.innerHTML += `
      <div class="busho-name">${b.name}</div>
      <div class="busho-sub">
        勢力:${b.faction} / 家門:${b.clan} / コスト:${b.cost}
      </div>
    `;

    listEl.appendChild(row);
  });
}

/* イベント */
[nameInput, factionSelect, clanSelect, costSelect]
  .forEach(el => el.addEventListener("input", applyFilters));

