const factionColors = {
  "織田": "#2f6fb6",   // 青
  "豊臣": "#d4af37",   // 金
  "徳川": "#2e8b57",   // 緑
  "武田": "#c0392b",   // 赤
  "上杉": "#7b3fa1",   // 紫
  "群":   "#f4a261"    // 薄オレンジ
};

/* =========================
   CSVパース（BOM対策）
========================= */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

/* =========================
   URLパラメータ取得
========================= */
const params = new URLSearchParams(location.search);
const bushoId = params.get("id");

/* =========================
   データ格納
========================= */
let bushoList = [];
let senpoList = [];
let senpoStates = [];
let tokuseiList = [];

/* =========================
   読み込み
========================= */
Promise.all([
  fetch("data/busho.csv").then(r => r.text()),
  fetch("data/senpo.csv").then(r => r.text()),
  fetch("data/senpo_state.csv").then(r => r.text()),
  fetch("data/tokusei.csv").then(r => r.text())
]).then(([bushoText, senpoText, stateText,tokuseiText]) => {

  bushoList = parseCSV(bushoText);
  senpoList = parseCSV(senpoText);
  senpoStates = parseCSV(stateText);
  tokuseiList = parseCSV(tokuseiText);


  const busho = bushoList.find(b => b.id === bushoId);
  if (!busho) return;

  renderBushoDetail(busho);
});

/* =========================
   種類タグ色
========================= */
const SENPO_TYPE_COLOR = {
  "指揮": "#6ec6ff",
  "能動": "#ffb3b3",
  "突撃": "#ffd966",
  "受動": "#9be29b",
  "兵種": "#d6c9f0"
};

/* =========================
   状態タグ色
========================= */
const STATE_COLOR_RULES = [
  {
    match: ["連撃", "回避", "鉄壁", "乱舞", "反撃", "援護", "肩代り", "耐性", "洞察", "先攻", "必中", "破陣", "離反", "心攻", "襲撃"],
    color: "#cce4ff"   // バフ（青）
  },
  {
    match: ["威圧", "無策", "封撃", "混乱", "疲弊", "回復不可", "挑発", "牽制", "麻痺"],
    color: "#ffd6d6"   // デバフ（赤）
  },
  {
    match: ["火傷", "水攻め", "中毒", "潰走", "消沈", "乱兵", "撹乱"],
    color: "#ffe0b2"   // ダメージ（橙）
  }
  {
    match: ["回復", "休養", "回生"],
    color: "#9be29"   // ダメージ（緑）
  }  
];

/* =========================
   戦法カード生成
========================= */
function createSenpoCard(senpo, states, label) {
  const card = document.createElement("div");
  card.className = "senpo-card";

  const titleRow = document.createElement("div");
  titleRow.className = "senpo-title-row";

  const nameEl = document.createElement("span");
  nameEl.className = "senpo-name";
  nameEl.textContent = senpo.name;

  const typeTag = document.createElement("span");
  typeTag.className = "senpo-type"; //`type-tag type-${senpo.type}`;
  
  const type = senpo.type?.trim();
  typeTag.textContent = type;
  typeTag.style.backgroundColor =
    SENPO_TYPE_COLOR[type] ?? "#ccc";

  titleRow.appendChild(nameEl);
  titleRow.appendChild(typeTag);

  const descEl = document.createElement("div");
  descEl.className = "senpo-desc";
  descEl.textContent = senpo.description;
  descEl.style.display = "none";  

  titleRow.addEventListener("click", () => {
    const isOpen = descEl.style.display === "block";
    descEl.style.display = isOpen ? "none" : "block";
  });  

  const stateWrap = document.createElement("div");
  stateWrap.className = "senpo-states";

  states.forEach(st => {
    const tag = document.createElement("span");
    tag.className = "state-tag";
    tag.textContent = st.label;

    const rule = STATE_COLOR_RULES.find(r =>
      r.match.some(word => st.label.includes(word))
    );

    if (rule) {
      tag.style.backgroundColor = rule.color;
    }
    stateWrap.appendChild(tag);
  });

  card.appendChild(titleRow);  // 戦法名＋種類
  card.appendChild(descEl);    // ← 戦法説明
  card.appendChild(stateWrap); // 状態タグ群

  return card;
}

/* =========================
   特性カード生成
========================= */

function createTokuseiCard(tokusei,label) {
  const card = document.createElement("div");
  card.className = "toggle-card";

  const header = document.createElement("div");
  header.className = "toggle-header";

  const arrow = document.createElement("span");
  arrow.textContent = "";
  arrow.className = "toggle-arrow";
 

  const titleEl = document.createElement("span");
  titleEl.className = "toggle-title";
  titleEl.textContent = label;

  const nameEl = document.createElement("span");
  nameEl.className = "toggle-name";
  nameEl.textContent = tokusei.name;

  header.append(arrow, titleEl, nameEl);

  const desc = document.createElement("div");
  desc.className = "toggle-desc";
  desc.textContent = tokusei.description;
  desc.style.display = "none";

  header.addEventListener("click", () => {
    const open = desc.style.display === "block";
    desc.style.display = open ? "none" : "block";
    arrow.textContent = open ? "" : "";
  }); 

  card.append(header, desc);
  return card;
}


/* =========================
   詳細描画
========================= */
function renderBushoDetail(busho) {

  console.log("renderBushoDetail:", busho);

  document.getElementById("name").textContent = busho.name;
  document.getElementById("faction").textContent = busho.faction;
  document.getElementById("clan").textContent = busho.clan;
  document.getElementById("cost").textContent = busho.cost;
  document.getElementById("rarity").textContent = "★".repeat(busho.rarity);

  drawHexChart(busho);

function drawHexChart(b) {

  const canvas = document.getElementById("radarChart");
  
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cx = canvas.width/2;
  const cy = canvas.height/2;
  
  const maxRadius = Math.min(cx, cy) -20;

  const maxValue = 300;
  const step = (Math.PI*2)/6;

  const labels = ["知略","武勇","魅力","政務","速度","統率"];

  const bases = [
    +b.int_base,
    +b.pow_base,
    +b.cha_base,
    +b.adm_base,
    +b.spd_base,
    +b.ldr_base
  ];

  const growths = [
    +b.int_growth,
    +b.pow_growth,
    +b.cha_growth,
    +b.adm_growth,
    +b.spd_growth,
    +b.ldr_growth
  ];

  const lv1 = bases;
  const lv50 = bases.map((v,i)=>v + 49*growths[i]);

  const color = factionColors[b.faction] || "#999";

  /* ガイド */
  ctx.strokeStyle = "#ddd";
  for(let i=1;i<=5;i++){
    drawPolygon(ctx,cx,cy,(maxRadius/5)*i);
  }

  /* ラベル */
  ctx.fillStyle = "#333";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  labels.forEach((l,i)=>{
    const angle = step*i - Math.PI/2;
    ctx.fillText(
      l,
      cx + Math.cos(angle)*(maxRadius+12),
      cy + Math.sin(angle)*(maxRadius+12)
    );
  });

  /* Lv50（外） */
  drawStat(ctx,lv50,color,0.25,cx,cy,maxRadius,maxValue);

  /* Lv1（内） */
  drawStat(ctx,lv1,color,0.6,cx,cy,maxRadius,maxValue);

  /* 数値表示（Lv50） */
  ctx.fillStyle = color;
  ctx.font = "12px sans-serif";

  lv50.forEach((v,i)=>{
    const angle = step*i - Math.PI/2;
    const r = (v/maxValue)*maxRadius + 12;
    ctx.fillText(
      Math.round(v),
      cx + Math.cos(angle)*r,
      cy + Math.sin(angle)*r
    );
  });
}



function drawStat(ctx,stats,color,alpha,cx,cy,maxRadius,maxValue){

  const step = (Math.PI*2)/6;

  ctx.beginPath();

  stats.forEach((v,i)=>{
    const angle = step*i - Math.PI/2;
    const r = (v/maxValue)*maxRadius;
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

function drawPolygon(ctx,cx,cy,r){
  const step=(Math.PI*2)/6;
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=step*i-Math.PI/2;
    const x=cx+Math.cos(a)*r;
    const y=cy+Math.sin(a)*r;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.stroke();
}

function hexToRGBA(hex,a){
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

  const senpoArea = document.getElementById("senpoArea");
  senpoArea.innerHTML = "";

  /* 固有戦法 */
  if (busho.unique_senpo) {
    const senpo = senpoList.find(s => s.id === busho.unique_senpo);
    if (senpo) {
      const states = senpoStates.filter(st => st.senpo_id === senpo.id);
      senpoArea.appendChild(
        createSenpoCard(senpo, states, "固有戦法")
      );
    }
  }

  /* 伝授戦法 */
  if (busho.teach_senpo) {
    const senpo = senpoList.find(s => s.id === busho.teach_senpo);
    if (senpo) {
      const states = senpoStates.filter(st => st.senpo_id === senpo.id);
      senpoArea.appendChild(
        createSenpoCard(senpo, states, "伝授戦法")
      );
    }
  }
  const tokuseiArea = document.getElementById("tokuseiArea");
  tokuseiArea.innerHTML = "";

  /* 固有特性 */
  if (busho.unique_tokusei) {
    const tokusei = tokuseiList.find(s => s.id === busho.unique_tokusei);
    if (tokusei) {
      /* const states = tokuseiStates.filter(st => st.tokusei_id === tokusei.id); */
      tokuseiArea.append(
        createTokuseiCard(tokusei,  "固有特性")
      );
    }
  }
  /* 特性1凸 */
  if (busho.tokusei_1) {
    const tokusei = tokuseiList.find(s => s.id === busho.tokusei_1);
    if (tokusei) {
      /* const states = tokuseiStates.filter(st => st.tokusei_id === tokusei.id); */
      tokuseiArea.append(
        createTokuseiCard(tokusei,  "特性(1凸)")
      );
    }
  } 
    /* 特性3凸 */
  if (busho.tokusei_3) {
    const tokusei = tokuseiList.find(s => s.id === busho.tokusei_3);
    if (tokusei) {
      /* const states = tokuseiStates.filter(st => st.tokusei_id === tokusei.id); */
      tokuseiArea.append(
        createTokuseiCard(tokusei,  "特性(3凸)")
      );
    }
  } 
    /* 特性5凸 */
  if (busho.tokusei_1) {
    const tokusei = tokuseiList.find(s => s.id === busho.tokusei_5);
    if (tokusei) {
      /* const states = tokuseiStates.filter(st => st.tokusei_id === tokusei.id); */
      tokuseiArea.append(
        createTokuseiCard(tokusei,  "特性(5凸)")
      );
    }
  } 
}