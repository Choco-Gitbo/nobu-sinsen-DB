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
}
