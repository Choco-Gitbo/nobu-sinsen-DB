const listEl = document.getElementById("bushoList");
const nameInput = document.getElementById("nameSearch");
const factionSelect = document.getElementById("factionFilter");
const clanSelect = document.getElementById("clanFilter");
const costSelect = document.getElementById("costFilter");
const sexSelect = document.getElementById("sexFilter");
const tagSelect = document.getElementById("tagFilter");
const ownFilter = document.getElementById("ownFilter");

const senpoNameInput = document.getElementById("senpoNameSearch");
const senpoTypeSelect = document.getElementById("senpoTypeFilter");
const senpoGetSelect = document.getElementById("senpoGetFilter");
const targetSelect = document.getElementById("targetFilter");
const rangeSelect = document.getElementById("rangeFilter");
const effectSelect = document.getElementById("effectFilter");
const senpoOwnFilter =document.getElementById("senpoOwnFilter");

let allBusho = [];
let allSenpo = [];
let senpoStates = [];

let ownership = JSON.parse(localStorage.getItem("ownership") || "{}");
let senpoOwnership = JSON.parse(localStorage.getItem("senpoOwnership") || "{}");

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
    match: ["兵刃単体","兵刃複数", "計略単体","計略複数","兵略単体","兵略複数"],
    color: "#ffd5cc"   // バフ（赤）
  },  
  {
    match: ["兵刃ダメ", "計略ダメ"],
    color: "#ffd5cc"   // バフ（赤）
  },
  {
    match: ["強化"],
    color: "#cce4ff"   // バフ（青）
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
    match: ["武勇増", "知略増", "統率増", "速度増", "能動増", "突撃増" ,"発動増","会心", "奇策","属性増"],
    color: "#cce4ff"   // バフ（青）
  },
  {
    match: ["弱体","制御"],
    color: "#f7d6ff"   // デバフ（赤）
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
    match: ["武勇減", "知略減", "統率減", "速度減", "能動減", "突撃減","発動減","属性減"],
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

const effectOrder = [
  "連撃",
  "回避",
  "鉄壁",
  "乱舞",
  "反撃",
  "援護",
  "肩代り",
  "分担",
  "耐性",
  "洞察",
  "先攻",
  "必中",
  "破陣",
  "会心",
  "奇策",
  "離反",
  "心攻",
  "襲撃",
  "威圧",
  "無策",
  "封撃",
  "混乱",
  "疲弊",
  "麻痺",
  "回復不可",
  "浄化不可",
  "挑発",
  "牽制",
  "攻撃対象ロック",
  "火傷",
  "水攻め",
  "中毒",
  "潰走",
  "消沈",
  "乱兵",
  "撹乱",
  "恐慌",
  "休養",
  "回生",
  "浄化",
  "強化解除",
  "武勇増",
  "武勇減",
  "知略増",
  "知略減",
  "統率増",
  "統率減",
  "速度増",
  "速度減",
  "全属性減",
  "メイン属性増",
  "メイン属性減",
  "能動発動増",
  "能動発動減",
  "固有能動発動増",
  "固有能動発動減",
  "突撃発動増",
  "突撃発動減",
  "固有突撃発動増",
  "固有突撃発動減",
  "継続時間増",
  "継続時間減",
  "与兵刃増",
  "与兵刃減",
  "被兵刃増",
  "被兵刃減",
  "与計略増",
  "与計略減",
  "被計略増",
  "被計略減",
  "与通攻増",
  "与通攻減",
  "被通攻増",
  "被通攻減",
  "会心ダメ増",
  "会心ダメ減",
  "奇策ダメ増",
  "奇策ダメ減",
  "与能動増",
  "与能動減",
  "被能動増",
  "被能動減",
  "与突撃増",
  "与突撃減",
  "被突撃増",
  "被突撃減",
  "兵刃ダメ",
  "計略ダメ",
  "準備1ターン",
  "準備2ターン",
  "準備スキップ",
  "与回復増",
  "与回復減",
  "被回復増",
  "被回復減",
  "回復量蓄積",
  "兵損増",
  "兵損減",
  "通攻計略化",
  "通攻禁止",
  "傭兵",
  "一揆",
  "能動阻止",
  "特殊兵種",
  "行軍速度増",
  "兵刃単体",
  "兵刃複数",
  "計略単体",
  "計略複数",
  "兵略単体",
  "兵略複数",
  "強化",
  "弱体",
  "制御",
  "回復"
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
  senpoStates.forEach(st => {

    let target = "";
    let range = "";
    let effect = st.label;

    if (st.label.startsWith("敵軍")) {
      target = "敵軍";
    } else if (st.label.startsWith("自軍")) {
      target = "自軍";
    } else if (st.label.startsWith("友軍")) {
      target = "友軍";
    } else if (st.label.startsWith("自身")) {
      target = "自身";
    }

    if (st.label.includes("全体")) {
      range = "全体";
    } else if (st.label.includes("単体")) {
      range = "単体";
    } else if (st.label.includes("1-2人")) {
      range = "1-2人";
    } else if (st.label.includes("2人")) {
      range = "2人";
    } else if (st.label.includes("2-3人")) {
      range = "2-3人";
    } else if (st.label.includes("大将")) {
      range = "大将";
    } else if (st.label.includes("副将")) {
      range = "副将";
    } else if (st.label.includes("異性")) {
      range = "異性";
    } else if (st.label.includes("雑賀本願寺")) {
      range = "雑賀本願寺";
    }

    effect = st.label
      .replace("敵軍","")
      .replace("自軍","")
      .replace("友軍","")
      .replace("自身","")
      .replace("全体","")
      .replace("単体","")
      .replace("1-2人","")
      .replace("2人","")
      .replace("2-3人","")
      .replace("大将","")
      .replace("副将","")
      .replace("異性","")
      .replace("雑賀本願寺","");

    st.target = target;
    st.range = range;
    st.effect = effect;

  });

const stateMap = {};

senpoStates.forEach(st => {

  if (!stateMap[st.senpo_id]) {
    stateMap[st.senpo_id] = [];
  }

  stateMap[st.senpo_id].push(st);

});

allSenpo.forEach(s => {
  s.states = stateMap[s.id] || [];
});
  const senpoOwners = {};
  const senpoTeachers = {};

  allBusho.forEach(b => {

    /* 固有戦法 */
    if (b.unique_senpo) {
      if (!senpoOwners[b.unique_senpo]) {
        senpoOwners[b.unique_senpo] = [];
      }
      senpoOwners[b.unique_senpo].push(b.name);
    }

    /* 伝授戦法（複数ありえる） */
    if (b.teach_senpo) {

      const ids = b.teach_senpo.split("|");

      ids.forEach(id => {
        if (!senpoTeachers[id]) {
          senpoTeachers[id] = [];
        }
        senpoTeachers[id].push(b.name);
      });
    }
  });

  allSenpo.forEach(s => {

    s.owner = senpoOwners[s.id] || [];
    s.teacher = senpoTeachers[s.id] || [];

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

  [...new Set(values)]
    .filter(v => v && v.trim() !== "")
    .sort()
    .forEach(v => {

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
    if(ownFilter.value === "1" && !ownership[b.id]?.own) return false;
    if(ownFilter.value === "0" && ownership[b.id]?.own) return false;

    return true;
  });

  renderList(filtered);
}

/* 全て所有 */
/* 武将 */
let allOwned = false;

document.getElementById("toggleOwn").onclick = () => {

  allOwned = !allOwned;

  allBusho.forEach(b => {
    ownership[b.id] ??= {own:false,awake:false,rank:0};
    ownership[b.id].own = allOwned;
  });

  saveOwnership();
  applyFilters();
};
/* 戦法 */
let allSenpoOwned = false;

document.getElementById("toggleSenpoOwn").onclick = () => {

  allSenpoOwned = !allSenpoOwned;

  allSenpo.forEach(s => {
    senpoOwnership[s.id] = allSenpoOwned;
  });

  saveSenpoOwnership();
  applySenpoFilters();
};

/* 一覧描画 */
function renderList(data) {
  listEl.innerHTML = "";

  data.forEach(b => {
    const row = document.createElement("div");
    row.className = "busho-row";

    // ★ クリックで詳細へ
    row.addEventListener("click", (e) => {

      if (
        ["INPUT","SELECT","BUTTON"].includes(e.target.tagName) ||
        e.target.closest("label")
      ){
        return;
      }
      location.href = `detail.html?id=${b.id}`;
    });
    const bar = document.createElement("div");
    bar.className = "rarity-bar";
    bar.style.background =
      rarityColors[b.rarity] || "#999";

    row.appendChild(bar);

    row.innerHTML += `
    <label>
    <input type="checkbox" class="own-check" data-id="${b.id}"
    ${ownership[b.id]?.own ? "checked":""}>
    ${b.name}
    </label>
    <div class="busho-sub">
    勢力:${b.faction} / 家門:${b.clan} / コスト:${b.cost}
    </div>

    <div class="own-area">


    <label>
    <input type="checkbox" class="awake-check" data-id="${b.id}"
    ${ownership[b.id]?.awake ? "checked":""}>
    覚醒
    </label>

    <label>
    　凸数
    <input type="number" class="rank-input"
    data-id="${b.id}"
    min="0"
    max="${b.rarity}"
    value="${ownership[b.id]?.rank || 0}">
    </label>

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

  stateMap[st.senpo_id].push(st);

});

allSenpo.forEach(s => {
  s.states = stateMap[s.id] || [];
});
  createOptions(targetSelect, unique(senpoStates.map(s => s.target)));
  createOptions(rangeSelect, unique(senpoStates.map(s => s.range)));
  /* createOptions(effectSelect, effectOrder); */
  createOptions(effectSelect, sortEffects(senpoStates.map(s => s.effect)));
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
  const target = targetSelect.value;
  const range = rangeSelect.value;
  const effect = effectSelect.value;
  const own = senpoOwnFilter.value;

  const filtered = allSenpo.filter(s => {

    if(name && !s.name.includes(name)) return false;
    if(type && s.type !== type) return false;
    if(get && s.get !== get) return false;

    const states = s.states;

    if(target && !states.some(st => st.target === target)) return false;
    if(range && !states.some(st => st.range === range)) return false;
    if(effect && !states.some(st => st.effect === effect)) return false;

    if(own === "owned" && !senpoOwnership[s.id]) return false;
    if(own === "not" && senpoOwnership[s.id]) return false;

    return true;
  });

  renderSenpoList(filtered);
}

function sortEffects(list) {

  return unique(list).sort((a,b)=>{

    const ai = effectOrder.indexOf(a);
    const bi = effectOrder.indexOf(b);

    if(ai === -1 && bi === -1) return a.localeCompare(b,"ja");
    if(ai === -1) return 1;
    if(bi === -1) return -1;

    return ai - bi;

  });

}
/* =========================
   戦法カード生成
========================= */
function createSenpoCard(s){

  const card = document.createElement("div");
  card.className = "senpo-card";

  const header = document.createElement("div");
  header.className = "senpo-header";

  const own = document.createElement("input");
  own.type = "checkbox";
  own.className = "senpo-own";
  own.dataset.id = s.id;
  own.checked = !!senpoOwnership[s.id];

  const titleBlock = document.createElement("div");
  titleBlock.className = "senpo-title-block";

  const titleRow = document.createElement("div");
  titleRow.className = "senpo-title-row";

  const name = document.createElement("span");
  name.className = "senpo-name";
  name.textContent = s.name;

  const type = document.createElement("span");
  type.className = "senpo-type";
  type.textContent = s.type;

  const trigger = document.createElement("span");
  trigger.className = "senpo-trigger";
  trigger.textContent = "発動率：" + s.trigger + "%";

  titleRow.append(own,name,type,trigger);
  card.appendChild(titleRow);

  /* header.append(own,titleBlock);
  card.appendChild(header); */

  const desc = document.createElement("div");
  desc.className = "senpo-desc";
  desc.innerHTML = (s.description || "").replace(/\|/g,"<br>");
  desc.style.display = "none";

  titleRow.onclick = (e) =>{

    if (e.target.tagName === "INPUT") return;

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


  /* titleRow.appendChild(own);  */

  const source = document.createElement("div");
  source.className = "senpo-get";
  let text = "";
  if (s.owner.length) {
    text += "固有：" + s.owner.join(" / ");
  }

  if (s.teacher.length) {
    if(text) text += " ";
    text += "伝授：" + s.teacher.join(" / ");
  }
  const getText = (s.get === "事件") ? "事件：" : s.man;
  if (getText) {
    if (text) text += " ";
    text +=  getText + s.man;
  }

  source.textContent = text;

  card.appendChild(source);

  return card;

  
}

function unique(list) {
  return [...new Set(list.filter(v => v && v.trim() !== ""))];
}

/* 所有データ保存 */
function saveOwnership(){
  localStorage.setItem("ownership", JSON.stringify(ownership));
}

function saveSenpoOwnership(){
  localStorage.setItem("senpoOwnership", JSON.stringify(senpoOwnership));
}

/* イベント */
/*  武将フィルターイベント*/
[nameInput].forEach(el => el.addEventListener("input", applyFilters));

[factionSelect, clanSelect, costSelect,sexSelect,tagSelect]
  .forEach(el => el.addEventListener("change", applyFilters));
ownFilter.addEventListener("input", applyFilters);

/*  戦法フィルターイベント*/
[senpoNameInput, senpoTypeSelect, senpoGetSelect]
  .forEach(el => el.addEventListener("input", applySenpoFilters));
[targetSelect, rangeSelect, effectSelect]
  .forEach(el => el.addEventListener("input", applySenpoFilters));
senpoOwnFilter.addEventListener("input", applySenpoFilters);



/* 武将ー戦法ページ切り替え */
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


/* 所有チェックボックスイベント */
/* 武将一覧 */
listEl.addEventListener("change", e=>{

  const id = e.target.dataset.id;
  if(!id) return;

  if(!ownership[id]) ownership[id] = {own:false,awake:false,rank:0};

  if(e.target.classList.contains("own-check")){
    ownership[id].own = e.target.checked;
  }

  if(e.target.classList.contains("awake-check")){
    ownership[id].awake = e.target.checked;
  }

  if(e.target.classList.contains("rank-input")){
    ownership[id].rank = Number(e.target.value);
  }

  saveOwnership();
});


/* 戦法一覧 */
document.getElementById("senpoList").addEventListener("change",e=>{

  if(e.target.classList.contains("senpo-own")){

    const id = e.target.dataset.id;
    if(!id) return;
    senpoOwnership[id] = e.target.checked;
    saveSenpoOwnership();

  }

});

/* 所有コピー */
document.getElementById("exportText").onclick = exportConsultText;

function exportConsultText(){

  let text = "";

  text += "【武将】\n\n";

  allBusho.forEach(b => {

    const own = ownership[b.id];
    if(!own?.own) return;

    const star = own.rank || 0;
    const awake = own.awake ? " 覚醒" : "";

    text += `C${b.cost} ${b.name} 凸${star}${awake}\n`;

  });

  text += "\n【戦法】\n\n";

  allSenpo.forEach(s => {

    if(!senpoOwnership[s.id]) return;

    text += `${s.name}\n`;

  });

  navigator.clipboard.writeText(text).then(()=>{
    alert("所有情報をコピーしました");
  });

}
