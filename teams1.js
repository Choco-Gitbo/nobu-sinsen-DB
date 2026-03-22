import { setupNavigation } from './module.js';

const DB={
  busho:[],
  senpo:[],
  senpoState:[],
  tokusei:[],
  heigaku:[],
  own_busho:[],
  own_senpo:[]
}
let currentTeam = 1

async function loadCSV(url){

  const res = await fetch(url)
  const text = await res.text()

  return parseCSV(text)

}
function parseCSV(text) {

  text = text.replace(/^\uFEFF/, "");

  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines.map(line => {

    const values = line.split(",").map(v => v.trim());
    const obj = {};

    headers.forEach((h,i)=>{
      obj[h] = values[i] ?? "";
    });

    return obj;

  });
}
async function init(){
  /* 初期化処理*/
  DB.busho=await loadCSV("data/busho.csv")
  DB.senpo=await loadCSV("data/senpo.csv")
  DB.senpoState=await loadCSV("data/senpo_state.csv")
  DB.tokusei=await loadCSV("data/tokusei.csv")
  DB.heigaku=await loadCSV("data/heigaku.csv")

  linkStatesToBusho() /* 武将情報に所有情報を付与 */
  setupSenpoStates()  /* 戦法状態の作成 */
  
  createBushoSelect()
  createSenpoSelect()

}

/* 所持武将・戦法取得 */
const ownership = JSON.parse(localStorage.getItem("ownership") || "{}")
DB.own_busho = ownership
const senpoOwnership = JSON.parse(localStorage.getItem("senpoOwnership") || "{}")
DB.own_senpo = senpoOwnership

function getOwnedBushoIds(){

  return Object.keys(ownership)
  .filter(id => ownership[id]?.own)

}

function getOwnedSenpoIds(){

  return Object.keys(senpoOwnership)
    .filter(id => senpoOwnership[id])

}

/* */

function createBushoSelect(){

  const selected = [...document.querySelectorAll(".busho-name")]
    .map(s=>s.value)
    .filter(v=>v)

  const usedIds = getSelectedBushoIds()

  document.querySelectorAll(".busho-name").forEach(select=>{
    const current = select.value
    select.innerHTML = `<option value="">武将選択</option>` 
    
    DB.busho.forEach(b=>{
      /*if(!filtered.includes(b) && b.id !== current) return 
      if(usedIds.includes(b.id) && b.id !== current) return*/
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=b.name
      select.appendChild(op)

    })
    select.value = current
    

  })
}

function createSenpoSelect(){

  const selected = [...document.querySelectorAll(".senpo")]
    .map(s=>s.value)
    .filter(v=>v)

  document.querySelectorAll(".senpo").forEach(select=>{

    const current = select.value
    select.innerHTML=`<option value="">戦法選択</option>`
    DB.senpo.forEach(s=>{
      if(s.get === "固有") return
      if(s.states.includes(s.id) && s.id !== current) return
      const op=document.createElement("option")
      op.value=s.id
      op.textContent=s.name
      select.appendChild(op)
    })
    select.value = current
  })

}

function setupSenpoStates(){

  DB.senpoState.forEach(st=>{

    let target=""
    let range=""
    let effect=st.label

    if(st.label.startsWith("敵軍")) target="敵軍"
    else if(st.label.startsWith("自軍")) target="自軍"
    else if(st.label.startsWith("友軍")) target="友軍"
    else if(st.label.startsWith("自身")) target="自身"

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

    st.target=target
    st.range=range
    st.effect=effect

  })

  linkStatesToSenpo()

}
function linkStatesToSenpo(){

  const stateMap={}

  DB.senpoState.forEach(st=>{

    if(!stateMap[st.senpo_id]){
      stateMap[st.senpo_id]=[]
    }

    stateMap[st.senpo_id].push(st)

  })

  DB.senpo.forEach(s=>{
    s.states=stateMap[s.id] || []
  })

  const ownMap={}

  Object.entries(DB.own_senpo).forEach(([key, value])=>{
    if(!ownMap[key]){
      ownMap[key]=[]
    }
    ownMap[key].push(value)
  })
  DB.senpo.forEach(s=>{
    s.own=ownMap[s.id] || []
  })

}
function linkStatesToBusho(){

  const stateMap={}

  DB.senpoState.forEach(st=>{

    if(!stateMap[st.senpo_id]){
      stateMap[st.senpo_id]=[]
    }

    stateMap[st.senpo_id].push(st)

  })

  DB.busho.forEach(b=>{
    b.unique_senpostates=stateMap[b.unique_senpo] || []
  })

  const ownMap={}

  Object.entries(DB.own_busho).forEach(([key, value])=>{
    if(!ownMap[key]){
      ownMap[key]=[]
    }
    ownMap[key].push(value)
  })
  DB.busho.forEach(b=>{
    b.own=ownMap[b.id] || []
  })
}


function setBushoData(column,id){

  const b=DB.busho.find(v=>v.id==id)

  if(!b)return

  // コスト表示

  column.querySelector(".busho-grid").innerHTML = `
    <div class="label-center">C${b.cost}</div>
    <div class="label-center">${rank}凸</div>
    <div class="label-center">${awake}</div>
  `; 

  // 属性
  const attrs=["buyu","chiryaku","tousei","speed","seimu","miryoku"]
  const attrb=[b.pow_base,b.int_base,b.ldr_base,b.spd_base,b.adm_base,b.cha_base]
  const attrg=[b.pow_growth,b.int_growth,b.ldr_growth,b.spd_growth,b.adm_growth,b.cha_growth]
  const attrNodes=column.querySelectorAll(".attr-grid div")

  attrs.forEach((a,i)=>{
    const Lv= 50
    const num1 = parseFloat(attrb[i] || 0)
    const num2 = parseFloat(attrg[i] || 0)
    const num = num1 + (num2 * (Lv -1))
    attrNodes[i].textContent = attrName(a) + num.toFixed(2)
  })

  // 固有戦法
  const senpo1 = DB.senpo.find(s => s.id === b.unique_senpo)
  column.querySelector(".senpo1").textContent = senpo1 ? senpo1.name : ""

  const t0 = column.querySelector(".tokusei0")
  const t1 = column.querySelector(".tokusei1")
  const t3 = column.querySelector(".tokusei3")
  const t5 = column.querySelector(".tokusei5")

  const on  = "#ffd966"   // 黄色
  const off = ""          // 既存CSS（薄グレー）に戻す

  // 固有特性
  const tokusei0 = DB.tokusei.find(t => t.id === b.unique_tokusei)
  t0.textContent = tokusei0 ? tokusei0.name : ""
  if(t0) t0.style.background = on

  // 特性1凸
  const tokusei1 = DB.tokusei.find(t => t.id === b.tokusei_1)
  t1.textContent = tokusei1 ? tokusei1.name : ""
  if(t1) t1.style.background = rank >= 1 ? on : off

  // 特性3凸
  const tokusei3 = DB.tokusei.find(t => t.id === b.tokusei_3)
  t3.textContent = tokusei3 ? tokusei3.name : ""
  if(t3) t3.style.background = rank >= 3 ? on : off

  // 特性5凸
  const tokusei5 = DB.tokusei.find(t => t.id === b.tokusei_5)
  t5.textContent = tokusei5 ? tokusei5.name : ""
  if(t5) t5.style.background = rank >= 5 ? on : off

  // タグ
  const tagGrid=column.querySelector(".tag-grid")
  tagGrid.innerHTML=""
  if(b.tags){
    b.tags.split("|").forEach(t=>{
      const div=document.createElement("div")
      div.className="label-center"
      div.textContent=t
      tagGrid.appendChild(div)
    })
  }
  setupHeigaku(column, b)

}
function attrName(key){

  const map={
    buyu:"武勇",
    chiryaku:"知略",
    tousei:"統率",
    speed:"速度",
    seimu:"政務",
    miryoku:"魅力"
  }
  return map[key]

}

function updateNowCost(){

  let total = 0

  document.querySelectorAll(".busho-name").forEach(select=>{

    const id = select.value
    if(!id) return

    const b = DB.busho.find(x=>x.id===id)
    if(!b) return

    total += Number(b.cost)||0

  })

  const now = document.querySelector(".nowcost")
  now.textContent = total
}

function setupHeigaku(column, b){

  const type = column.querySelector(".heigaku-type").value

  const kiSelect  = column.querySelector(".heigaku-ki")
  const sei1Select = column.querySelector(".heigaku-sei1")
  const sei2Select = column.querySelector(".heigaku-sei2")
  const sei3Select = column.querySelector(".heigaku-sei3")

  kiSelect.innerHTML = ""
  sei1Select.innerHTML = ""
  sei2Select.innerHTML = ""
  sei3Select.innerHTML = ""

 // 初期値（空白）
  kiSelect.appendChild(new Option("", ""))
  sei1Select.appendChild(new Option("", ""))
  sei2Select.appendChild(new Option("", ""))
  sei3Select.appendChild(new Option("", ""))

  if(!b.heigaku) return

  const ids = b.heigaku.split("|")

  ids.forEach(id=>{

    const h = DB.heigaku.find(v=>v.id === id)

    if(!h) return

    const cat = h.category.split("|")

    const typeName = cat[0]
    const kind = cat[1]

    if(typeName !== type) return

    const option = document.createElement("option")
    option.value = h.id
    option.textContent = h.name

    if(kind === "兵学・奇"){
      kiSelect.appendChild(option)
    }

    if(kind === "兵学・正"){
      sei1Select.appendChild(option.cloneNode(true))
      sei2Select.appendChild(option.cloneNode(true))
      sei3Select.appendChild(option.cloneNode(true))
    }

  })

}

init()

/* 使用中のIDを取得 */
function getSelectedBushoIds(){

  const ids=[]

  document.querySelectorAll(".busho-name").forEach(s=>{
    if(s.value) ids.push(s.value)
  })

  return ids
}
function getSelectedSenpoIds(){

  const ids=[]

  document.querySelectorAll(".senpo-select").forEach(s=>{
    if(s.value) ids.push(s.value)
  })

  return ids
}
/* */

/* 兵学タイプ変更時の処理*/
document.querySelectorAll(".heigaku-type").forEach(select=>{

  select.addEventListener("change",function(){
    const team = this.closest(".team")
    const column = this.closest(".column")
    const bushoId = team.querySelector(".busho-name").value
    const b = DB.busho.find(v=>v.id === bushoId)

    if(b){
      setupHeigaku(column,b)
    }

  })

})

/* チェンジイベント処理 */
document.addEventListener("change",e=>{


})


/* 編成画面への切り替え */
window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});