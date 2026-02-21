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
const stateSelect = document.getElementById("stateFilter");

let allBusho = [];
let allSenpo = [];
let senpoStates = [];


/* レアリティ → 色 */
const rarityColors = {
  5: "#d4af37", // 金
  4: "#7b3fa1", // 紫
  3: "#2f6fb6", // 青
  2: "#2e8b57", // 緑
  1: "#000000"  // 黒
};

/* =========================
   状態タグ色
========================= */
const STATE_COLOR_RULES = [
  {
    match: ["兵刃ダメ", "計略ダメ"],
    color: "#ffd5cc"   // バフ（赤）
  },  
  {
    match: ["連撃", "回避", "鉄壁", "乱舞", "反撃", "援護", "肩代り", "耐性", "洞察", "先攻", "必中", "破陣", "離反", "心攻", "襲撃"],
    color: "#cce4ff"   // バフ（青）
  },
  {
    match: ["与兵刃増", "与計略増", "被兵刃減", "被計略減", "与通攻増", "被通攻減"],
    color: "#cce4ff"   // バフ（青）
  }, 
  {
    match: ["武勇増", "知略増", "統率増", "速度増", "能動増", "突撃増", ,"発動増","会心", "奇策"],
    color: "#cce4ff"   // バフ（青）
  },  
  {
    match: ["威圧", "無策", "封撃", "混乱", "疲弊", "回復不可", "挑発", "牽制", "麻痺","強化解除"],
    color: "#f7d6ff"   // デバフ（赤）
  },
  {
    match: ["与兵刃減", "与計略減", "被兵刃増", "被計略増", "与通攻減", "被通攻増"],
    color: "#f7d6ff"   // デバフ（赤）
  },
  {
    match: ["武勇減", "知略減", "統率減", "速度減", "能動減", "突撃減","発動減"],
    color: "#f7d6ff"   // デバフ（赤）
  },
  {
    match: ["火傷", "水攻め", "中毒", "潰走", "消沈", "乱兵", "撹乱"],
    color: "#ffe0b2"   // ダメージ（橙）
  },
  {
    match: ["回復", "休養", "回生","浄化"],
    color: "#9be29b"   // ダメージ（緑）
  }  
];


/* =========================
   読み込み
========================= */
Promise.all([
  fetch("data/busho.csv").then(r => r.text()),
  fetch("data/senpo.csv").then(r => r.text()),
  fetch("data/senpo_state.csv").then(r => r.text()),
  fetch("data/tokusei.csv").then(r => r.text())
]).then(([bushoText, senpoText, stateText,tokuseiText]) => {

  allBusho = parseCSV(bushoText);
  allSenpo = parseCSV(senpoText);
  senpoStates = parseCSV(stateText);
  /* tokuseiList = parseCSV(tokuseiText) */

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

    setupFilters(allBusho);
    renderList(allBusho);
    setupSenpoFilters(allSenpo);
    renderSenpoList(allSenpo);
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
  /* フィルター選択肢生成 */
function setupSenpoFilters(data) {
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
  }
    
function renderSenpoList(data){

  const list = document.getElementById("senpoList");
  list.innerHTML = "";

  data.forEach(s=>{

    const card = createSenpoCard(s);

    const bar = document.createElement("div");
    bar.className = "rarity-bar";
    bar.style.background =
      rarityColors[s.rarity] || "#999";

    card.prepend(bar);

    list.appendChild(card); 
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
/* =========================
   戦法カード生成
========================= */
function createSenpoCard(s){

  const card = document.createElement("div");
  card.className = "senpo-card";

  const titleRow = document.createElement("div");
  titleRow.className = "senpo-title-row";

  const name = document.createElement("span");
  name.className = "senpo-name";
  name.textContent = s.name;

  const type = document.createElement("span");
  type.className = "senpo-type";
  type.textContent = s.type;

  const get = document.createElement("span");
  get.className = "senpo-get";
  get.textContent = "入手方法：" + s.get;

  titleRow.append(name,type,get);

  const desc = document.createElement("div");
  desc.className = "senpo-desc";
  desc.innerHTML = (s.description || "").replace(/\|/g,"<br>");
  desc.style.display = "none";

  titleRow.onclick = () =>{
    desc.style.display =
      desc.style.display === "none" ? "block" : "none";
  };

  /* 状態タグ */
  const statesWrap = document.createElement("div");
  statesWrap.className = "senpo-states";

  const states = senpoStates.filter(st => st.senpo_id === s.id);

  states.forEach(st=>{

    const tag = document.createElement("span");
    tag.className = "state-tag";
    tag.textContent = st.label;

    const rule = STATE_COLOR_RULES.find(r =>
      r.match.some(w => st.label.includes(w))
    );

    if(rule) tag.style.background = rule.color;

    statesWrap.appendChild(tag);
  });

  card.append(titleRow,desc,statesWrap);

  return card;
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

[senpoNameInput, senpoTypeSelect, senpoGetSelect, stateSelect]
  .forEach(el => el.addEventListener("input", applySenpoFilters));
