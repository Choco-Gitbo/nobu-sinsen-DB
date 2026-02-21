const listEl = document.getElementById("bushoList");
const nameInput = document.getElementById("nameSearch");
const factionSelect = document.getElementById("factionFilter");
const clanSelect = document.getElementById("clanFilter");
const costSelect = document.getElementById("costFilter");
const sexSelect = document.getElementById("sexFilter");
const tagSelect = document.getElementById("tagFilter");

const senpoNameInput = document.getElementById("senpoNameSearch");
const senpoTypeSelect = document.getElementById("senpoTypeFilter");
const senpoGetSelect = document.getElementById("senpoGetFilter");

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
  // BOM除去
  text = text.replace(/^\uFEFF/, "");

  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines.map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};

    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });

    return obj;
  });
}

/* フィルター選択肢生成 */
function setupFilters(data) {
  createOptions(factionSelect, data.map(b => b.faction));
  createOptions(clanSelect, data.map(b => b.clan));
  createOptions(costSelect, data.map(b => b.cost));
  createOptions(sexSelect, data.map(b => b.sex));
  const allTags = data
    .flatMap(b => b.tags ? b.tags.split("|") : []);
  createOptions(tagSelect, allTags);

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
  const sex = sexSelect.value;
  const tag = tagSelect.value;

  const filtered = allBusho.filter(b => {
    if (name && !b.name.includes(name)) return false;
    if (faction && b.faction !== faction) return false;
    if (clan && b.clan !== clan) return false;
    if (cost && b.cost !== cost) return false;
    if (sex && b.sex !== sex) return false;

    if (tag) {
      if (!b.tags) return false;
      const tags = b.tags.split("|");
      if (!tags.includes(tag)) return false;
    }

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

    // ★ クリックで詳細へ
    row.addEventListener("click", () => {
      location.href = `detail.html?id=${b.id}`;
    });

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

/* 戦法一覧 */
let allSenpo = [];

fetch("data/senpo.csv")
  .then(r=>r.text())
  .then(t=>{
    allSenpo = parseCSV(t);

    createOptions(senpoTypeSelect, allSenpo.map(s=>s.type));
    createOptions(senpoGetSelect, allSenpo.map(s=>s.get));

    const stateMap = {};

    senpoStates.forEach(st => {
      if (!stateMap[st.senpo_id]) {
        stateMap[st.senpo_id] = [];
      }
      stateMap[st.senpo_id].push(st.label);
    });

    allSenpo.forEach(s => {
      s.states = stateMap[s.id] || [];
    });

    const allStates = senpoStates.map(s=>s.label);
    createOptions(stateSelect, allStates);

    renderSenpoList(allSenpo);
  });
function renderSenpoList(data){

  const list = document.getElementById("senpoList");
  list.innerHTML = "";

  data.forEach(s=>{

    const row = document.createElement("div");
    row.className = "senpo-row";

    /* row.innerHTML = `
      <div class="senpo-name">${s.name}</div>
      <div class="senpo-type">${s.type}</div>
      <div class="senpo-desc">${s.description}</div>
    `; */

    const bar = document.createElement("div");
    bar.className = "rarity-bar";
    bar.style.background =
      rarityColors[s.rarity] || "#999";

    row.appendChild(bar);

    row.innerHTML += `
      <div class="senpo-name">${s.name}</div>
      <div class="senpo-sub">
        タイプ:${s.type} / 入手方法:${s.get}
      </div>
      <div class="senpo-desc">${s.description}</div>
    `;

    list.appendChild(row); 
  });
}
/* 戦法一覧フィルター */
function applySenpoFilters(){

  const name = senpoNameInput.value.trim();
  const type = senpoTypeSelect.value;
  const get = senpoGetSelect.value;
  const state = stateSelect.value;

  const filtered = allSenpo.filter(s=>{

    if(name && !s.name.includes(name)) return false;
    if(type && s.type !== type) return false;
    if(get && s.get !== get) return false;
    if(state){
      if(!s.states.includes(state)) return false;
}
    return true;
  });

  renderSenpoList(filtered);
}

  
/* イベント */
[nameInput, factionSelect, clanSelect, costSelect,sexSelect,tagSelect]
  .forEach(el => el.addEventListener("input", applyFilters));

  
const tabBusho = document.getElementById("tabBusho");
const tabSenpo = document.getElementById("tabSenpo");

const bushoPage = document.getElementById("bushoPage");
const senpoPage = document.getElementById("senpoPage");

tabBusho.onclick = () => {
  bushoPage.style.display = "";
  senpoPage.style.display = "none";

  tabBusho.classList.add("active");
  tabSenpo.classList.remove("active");
};

tabSenpo.onclick = () => {
  bushoPage.style.display = "none";
  senpoPage.style.display = "";

  tabBusho.classList.remove("active");
  tabSenpo.classList.add("active");
};

[senpoNameInput, senpoTypeSelect, senpoGetSelect]
  .forEach(el => el.addEventListener("input", applySenpoFilters));
