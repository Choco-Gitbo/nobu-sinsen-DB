const factionColors = {
  "織田": "#2f6fb6",   // 青
  "豊臣": "#d4af37",   // 金
  "徳川": "#2e8b57",   // 緑
  "武田": "#c0392b",   // 赤
  "上杉": "#7b3fa1",   // 紫
  "群":   "#f4a261"    // 薄オレンジ
};

const SENPO_TYPE_COLOR = {
  "指揮": "#6ec6ff",   // 水色
  "能動": "#ffb3b3",   // 薄赤
  "突撃": "#ffd966",   // 黄
  "受動": "#9be29b",   // 緑
  "兵種": "#d6c9f0"    // 薄紫
};


/* URLから id を取得 */
const params = new URLSearchParams(location.search);
const bushoId = params.get("id");

/* CSV読み込み(武将) */
fetch("data/busho.csv")
  .then(res => res.text())
  .then(text => {
    const data = parseCSV(text);
    const busho = data.find(b => b.id === bushoId);
    if (busho) renderDetail(busho);
  });

/* CSV読み込み(戦法) */
fetch("data/senpo.csv")
  .then(res => res.text())
  .then(text => {
    const data = parseCSV(text);
    const senpo = senpoList.find(s => s.id === busho.unique_senpo);
    if (senpo) renderDetail(senpo);
  });

/* CSV読み込み(戦法状態) */
fetch("data/senpo_state.csv")
  .then(res => res.text())
  .then(text => {
    const data = parseCSV(text);
    const states = senpoStates.filter(st => st.senpo_id === senpo.id);
    if (states) renderDetail(states);
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

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cx = canvas.width/2;
  const cy = canvas.height/2;
  const maxRadius = 120;
  const maxValue = 500;
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
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  labels.forEach((l,i)=>{
    const angle = step*i - Math.PI/2;
    ctx.fillText(
      l,
      cx + Math.cos(angle)*(maxRadius+22),
      cy + Math.sin(angle)*(maxRadius+22)
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

const typeTag = document.createElement("span");
typeTag.className = "senpo-type";
typeTag.textContent = senpo.type;

const type = senpo.type?.trim();
typeTag.style.backgroundColor =
  SENPO_TYPE_COLOR[type] ?? "#ccc";