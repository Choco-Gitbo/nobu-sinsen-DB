const DB={
  busho:[],
  senpo:[],
  senpoState:[],
  tokusei:[],
  heigaku:[]
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

  setupTeamType()
  createMaxCost()
  
  createBushoSelect()
  createSenpoSelect()

  setupSenpoStates()  /* 戦法状態の作成 */
  
  createBushoFactionFilter() 
  createBushoCostFilter() 
  createSenpoTypeFilter()
  createSenpoStateFilter() 
  setupListMode()
  setupHeigakuType() 

  refreshBushoSelect()
  refreshSenpoSelect()

  updateNowCost()

  createTeamPresetButtons()
  loadTeam()
  updatePresetActive()
}

/* 所持武将・戦法取得 */
function getOwnedBushoIds(){

  const ownership = JSON.parse(localStorage.getItem("ownership") || "{}")

  return Object.keys(ownership)
    .filter(id => ownership[id]?.own)

}

function getOwnedSenpoIds(){

  const senpoOwnership = JSON.parse(localStorage.getItem("senpoOwnership") || "{}")

  return Object.keys(senpoOwnership)
    .filter(id => senpoOwnership[id])

}

/* */
function createBushoSelect(){

  document.querySelectorAll(".busho-select").forEach(select=>{
    select.innerHTML=`<option value="">武将選択</option>`
    DB.busho.forEach(b=>{
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=b.name
      select.appendChild(op)
    })
  })

}

function refreshBushoSelect(){

  const selected = [...document.querySelectorAll(".busho-select")]
    .map(s=>s.value)
    .filter(v=>v)

  const filtered = getFilteredBusho()
  const usedIds = getSelectedBushoIds()

  document.querySelectorAll(".busho-select").forEach(select=>{
    const current = select.value
    select.innerHTML = `<option value="">武将選択</option>` 
    
    DB.busho.forEach(b=>{
      if(!filtered.includes(b) && b.id !== current) return 
      if(usedIds.includes(b.id) && b.id !== current) return
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=b.name
      /* if(b.id === current) op.selected = true */
      select.appendChild(op)

    })
    select.value = current
    

  })
}


function createSenpoSelect(){

  document.querySelectorAll(".senpo-select").forEach(select=>{
    select.innerHTML=`<option value="">戦法選択</option>`
    DB.senpo.forEach(s=>{
      if(s.get === "固有") return
      const op=document.createElement("option")
      op.value=s.id
      op.textContent=s.name
      select.appendChild(op)
    })
  })

}
function refreshSenpoSelect(){

  const selected = [...document.querySelectorAll(".senpo-select")]
    .map(s=>s.value)
    .filter(v=>v)

  const filtered = getFilteredSenpo()
  const usedIds = getSelectedSenpoIds()

  document.querySelectorAll(".senpo-select").forEach(select=>{

    const current = select.value
    select.innerHTML=`<option value="">戦法選択</option>`
    DB.senpo.forEach(s=>{
      if(s.get === "固有") return
      if(!filtered.includes(s) && s.id !== current) return
      if(usedIds.includes(s.id) && s.id !== current) return
      const op=document.createElement("option")
      op.value=s.id
      op.textContent=s.name
      /* if(s.id === current) op.selected=true */
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

}


function setBushoData(column,id){

  const b=DB.busho.find(v=>v.id==id)

  if(!b)return

  // コスト表示
  const own = ownership[b.id] || {};

  const rank = own.rank ?? 0;
  const awake = own.awake ? "覚醒" : "未覚醒";

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

  // 固有特性
  const tokusei0 = DB.tokusei.find(t => t.id === b.unique_tokusei)
  column.querySelector(".tokusei0").textContent = tokusei0 ? tokusei0.name : ""

  // 特性1凸
  const tokusei1 = DB.tokusei.find(t => t.id === b.tokusei_1)
  column.querySelector(".tokusei1").textContent = tokusei1 ? tokusei1.name : ""

  // 特性3凸
  const tokusei3 = DB.tokusei.find(t => t.id === b.tokusei_3)
  column.querySelector(".tokusei3").textContent = tokusei3 ? tokusei3.name : ""

  // 特性5凸
  const tokusei5 = DB.tokusei.find(t => t.id === b.tokusei_5)
  column.querySelector(".tokusei5").textContent = tokusei5 ? tokusei5.name : ""

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
function resetBushoData(column){

  const own = ownership[b.id] || {};

  const rank = own.rank ?? 0;
  const awake = own.awake ? "覚醒" : "未覚醒";

  column.querySelector(".busho-grid").innerHTML = `
    <div class="label-center">C${b.cost}</div>
    <div class="label-center">${rank}凸</div>
    <div class="label-center">${awake}</div>
  `; 
  
  column.querySelector(".attr-grid").innerHTML=`
      <div>武勇</div><input class ="input-buyu" type="number" value="0">
      <div>知略</div><input class ="input-tiryaku" type="number" value="0">
      <div>統率</div><input class ="input-tosotsu" type="number" value="0">
      <div>速度</div><input class ="input-sokudo" type="number" value="0">
      <div>政務</div><input class ="input-seimu" type="number" value="0">
      <div>魅力</div><input class ="input-miryoku" type="number" value="0">
  `
  column.querySelector(".senpo1").textContent = ""
  column.querySelector(".senpo2").value = ""
  column.querySelector(".senpo3").value = ""
  column.querySelector(".tokusei0").textContent = ""
  column.querySelector(".tokusei1").textContent = ""
  column.querySelector(".tokusei3").textContent = ""
  column.querySelector(".tokusei5").textContent = ""
  column.querySelector(".heigaku-ki").value=""
  column.querySelector(".heigaku-sei1").value=""
  column.querySelector(".heigaku-sei2").value=""
  column.querySelector(".heigaku-sei3").value=""
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

function createBushoFactionFilter(){

  const select=document.querySelector(".busho-faction")

  select.innerHTML=`<option value="">全て</option>`

  const factions=[...new Set(DB.busho.map(b=>b.faction))]

  factions.forEach(f=>{
    const op=document.createElement("option")
    op.value=f
    op.textContent=f
    select.appendChild(op)
  })

}
function createBushoCostFilter(){

  const select=document.querySelector(".busho-cost")

  select.innerHTML=`<option value="">全て</option>`

  const costs=[...new Set(DB.busho.map(b=>b.cost))]

  costs.sort((a,b)=>a-b)

  costs.forEach(c=>{
    const op=document.createElement("option")
    op.value=c
    op.textContent=c
    select.appendChild(op)
  })

}
function createSenpoTypeFilter(){

  const select=document.querySelector(".senpo-type")

  select.innerHTML=`<option value="">全て</option>`

  const types=[...new Set(DB.senpo.map(s=>s.type))]

  types.forEach(t=>{
    const op=document.createElement("option")
    op.value=t
    op.textContent=t
    select.appendChild(op)
  })

}
function createSenpoStateFilter(){

  const select=document.querySelector(".senpo-state")

  select.innerHTML=`<option value="">全て</option>`

  /* const states=[...new Set(DB.senpo.map(s=>s.state))] */
  const states = ["連撃","回避","鉄壁","乱舞","反撃","援護","肩代り","分担",
  "耐性","洞察","先攻","必中","破陣","会心","奇策","離反","心攻",
  "襲撃","威圧","無策","封撃","混乱","疲弊","麻痺","回復不可","浄化不可",
  "挑発","牽制","攻撃対象ロック",
  "火傷","水攻め","中毒","潰走","消沈","乱兵","撹乱","恐慌",
  "休養","回生","浄化","強化解除",
  "武勇増","武勇減","知略増","知略減","統率増","統率減","速度増","速度減",
  "全属性減","メイン属性増","メイン属性減",
  "能動発動増","能動発動減","固有能動発動増","固有能動発動減",
  "突撃発動増","突撃発動減","固有突撃発動増","固有突撃発動減","継続時間増","継続時間減",
  "与兵刃増","与兵刃減","被兵刃増","被兵刃減",
  "与計略増","与計略減","被計略増","被計略減",
  "与通攻増","与通攻減","被通攻増","被通攻減",
  "会心ダメ増","会心ダメ減","奇策ダメ増","奇策ダメ減",
  "与能動増","与能動減","被能動増","被能動減","与突撃増","与突撃減","被突撃増","被突撃減",
  "兵刃ダメ","計略ダメ","準備1ターン","準備2ターン","準備スキップ",
  "与回復増","与回復減","被回復増","被回復減","回復量蓄積",
  "兵損増","兵損減","通攻計略化","通攻禁止","傭兵","一揆","能動阻止","特殊兵種",
  "行軍速度増"];

  states.forEach(s=>{
    const op=document.createElement("option")
    op.value=s
    op.textContent=s
    select.appendChild(op)
  })

}

/* 所持武将フィルター */
function getFilteredBusho(){

  const f = getBushoFilter()

  const mode = document.querySelector(".list-mode").value
  const ownedIds = getOwnedBushoIds()

  return DB.busho.filter(b=>{

    if(mode==="owned" && !ownedIds.includes(b.id)) return false

    if(f.faction && b.faction!==f.faction) return false
    if(f.cost && b.cost!==f.cost) return false

    return true

  })

}

/* 所持戦法フィルター */
function getFilteredSenpo(){

  const f=getSenpoFilter()
  const unit=getUnitFilter()

  const mode = document.querySelector(".list-mode").value
  const ownedIds = getOwnedSenpoIds()

  return DB.senpo.filter(s=>{

    if(s.get==="固有") return false

    if(mode==="owned" && !ownedIds.includes(s.id)) return false

    if(f.type && s.type!==f.type) return false
    if(f.state && !s.states.some(st=>st.effect===f.state)) return false

    if(unit){

      const units=(s.unit||"").split("|").map(u=>u.trim())
      if(!units.includes(unit)) return false

    }

    return true

  })

}

function setupListMode(){

  const select = document.querySelector(".list-mode")
  select.innerHTML = `
    <option value="all">全て</option>
    <option value="owned">登録のみ</option>
  `
}
function setupTeamType(){

  const types = ["騎兵","弓兵","鉄砲","足軽","兵器"]
  document.querySelectorAll(".unit-select").forEach(select=>{
    select.innerHTML = ""
    types.forEach(t=>{
      const option = document.createElement("option")
      option.value = t
      option.textContent = t
      select.appendChild(option)
    })
  })

}
function createMaxCost(){

  const select = document.querySelector(".maxcost")

  for(let i=15;i<=20;i++){

    const op = document.createElement("option")
    op.value = i
    op.textContent = i

    if(i===15) op.selected = true   // 初期値

    select.appendChild(op)

  }

}
function updateNowCost(){

  let total = 0

  document.querySelectorAll(".busho-select").forEach(select=>{

    const id = select.value
    if(!id) return

    const b = DB.busho.find(x=>x.id===id)
    if(!b) return

    total += Number(b.cost)||0

  })

  const now = document.querySelector(".nowcost")
  const max = Number(document.querySelector(".maxcost").value)

  now.textContent = total

  if(total > max){
    now.style.color = "red"
  }else{
    now.style.color = ""
  }

}
function setupHeigakuType(){

  const types = ["武略","機略","陣立","臨戦"]
  document.querySelectorAll(".heigaku-type").forEach(select=>{
    select.innerHTML = ""
    types.forEach(t=>{
      const option = document.createElement("option")
      option.value = t
      option.textContent = t
      select.appendChild(option)
    })
  })

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

/* フィルター値の取得 */
function getBushoFilter(){

  return {
    faction:document.querySelector(".busho-faction").value,
    cost:document.querySelector(".busho-cost").value
  }

}
function getSenpoFilter(){

  return {
    type:document.querySelector(".senpo-type").value,
    state:document.querySelector(".senpo-state").value
  }

}
function getUnitFilter(){
  return document.querySelector(".unit-select").value
}

/* 使用中のIDを取得 */
function getSelectedBushoIds(){

  const ids=[]

  document.querySelectorAll(".busho-select").forEach(s=>{
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

document.querySelectorAll('.collapsible-column').forEach(column => {
  column.addEventListener('click', function(e) {
    // inputタグなどをクリックした時は折りたたまないようにする
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }
    
    // 中身のグリッド（attr-grid）を探してクラスを切り替える
    const content = this.querySelector('.attr-grid');
    if (content) {
      content.classList.toggle('is-hidden');
    }
    const contenttag = this.querySelector('.tag-grid');
    if (contenttag) {
      contenttag.classList.toggle('is-hidden');
    }
    const contentfilter = this.querySelector('.select-filter');
    if (contentfilter) {
      contentfilter.classList.toggle('is-hidden');
    }
  });
});
/* 兵学タイプ変更時の処理*/
document.querySelectorAll(".heigaku-type").forEach(select=>{

  select.addEventListener("change",function(){
    const team = this.closest(".team")
    const column = this.closest(".column")
    const bushoId = team.querySelector(".busho-select").value
    const b = DB.busho.find(v=>v.id === bushoId)

    if(b){
      setupHeigaku(column,b)
    }

  })

})

/* チェンジイベント処理 */
document.addEventListener("change",e=>{

  saveTeam()

  /* 武将選択の変更処理 */
  if(e.target.classList.contains("busho-select")){

    const column=e.target.closest(".team")
    const id = e.target.value
    if(!id){
      resetBushoData(column)
      updateNowCost()
      return
    }
    setBushoData(column,id)

    refreshBushoSelect()

    updateNowCost()
  }

    /* 戦法選択の変更処理 */
  if(e.target.classList.contains("senpo-select")){
    refreshSenpoSelect()
  }

  if(e.target.closest(".select-filter")){

    refreshBushoSelect()
    refreshSenpoSelect()

  }

})
document
.querySelector(".maxcost")
.addEventListener("change", updateNowCost)

document
.querySelector(".unit-select")
.addEventListener("change",refreshSenpoSelect)

/* 設定内容の保存 */
function saveTeam(){

  const data = {

    unit: document.querySelector(".unit-select")?.value || "",
    maxcost: document.querySelector(".maxcost")?.value || "",
    name:document.querySelector(".unit-name")?.value || "",
    team: []

  }

  document.querySelectorAll(".team").forEach(col=>{

    data.team.push({
      busho:col.querySelector(".busho-select")?.value || "",
      buyu:col.querySelector(".input-buyu")?.value || "0",
      tiryaku:col.querySelector(".input-tiryaku")?.value || "0",
      tosotsu:col.querySelector(".input-tosotsu")?.value || "0",
      sokudo:col.querySelector(".input-sokudo")?.value || "0",
      seimu:col.querySelector(".input-seimu")?.value || "0",
      miryoku:col.querySelector(".input-miryoku")?.value || "0",
      senpo2:col.querySelector(".senpo2")?.value || "",
      senpo3:col.querySelector(".senpo3")?.value || "",
      heigakuType:col.querySelector(".heigaku-type")?.value || "",
      heigakuKi:col.querySelector(".heigaku-ki")?.value || "",
      heigakuSei1:col.querySelector(".heigaku-sei1")?.value || "",
      heigakuSei2:col.querySelector(".heigaku-sei2")?.value || "",
      heigakuSei3:col.querySelector(".heigaku-sei3")?.value || ""
    })

  })

  localStorage.setItem("teamData_"+currentTeam,JSON.stringify(data))

}
/* 設定内容の読み出し */
function loadTeam(){

  const data=JSON.parse(localStorage.getItem("teamData_"+currentTeam)||"{}")

  if(!data.team) return

  /* グローバル設定 */

  if(data.unit){
    document.querySelector(".unit-select").value = data.unit
  }

  if(data.maxcost){
    document.querySelector(".maxcost").value = data.maxcost
  }
  if(data.name){
    document.querySelector(".unit-name").value = data.name
  }

  const columns=document.querySelectorAll(".team")

  data.team.forEach((t,i)=>{

    const col=columns[i]
    if(!col) return

    col.querySelector(".busho-select").value=t.busho||""
    if(t.busho){
      setBushoData(col,t.busho)
    }
    col.querySelector(".input-buyu").value=t.buyu||""
    col.querySelector(".input-tiryaku").value=t.tiryaku||"0"
    col.querySelector(".input-tosotsu").value=t.tosotsu||"0"
    col.querySelector(".input-sokudo").value=t.sokudo||"0"
    col.querySelector(".input-seimu").value=t.seimu||"0"
    col.querySelector(".input-miryoku").value=t.miryoku||"0"
    col.querySelector(".senpo2").value=t.senpo2||""
    col.querySelector(".senpo3").value=t.senpo3||""
    col.querySelector(".heigaku-type").value=t.heigakuType||""
    col.querySelector(".heigaku-ki").value=t.heigakuKi||""
    col.querySelector(".heigaku-sei1").value=t.heigakuSei1||""
    col.querySelector(".heigaku-sei2").value=t.heigakuSei2||""
    col.querySelector(".heigaku-sei3").value=t.heigakuSei3||""

  })

  updateNowCost()

  refreshBushoSelect()
  refreshSenpoSelect()
}

function createTeamPresetButtons(){

  const container = document.querySelector(".team-preset-buttons")

  const row1 = document.createElement("div")
  const row2 = document.createElement("div")

  row1.className = "team-row"
  row2.className = "team-row"

  for(let i=1;i<=12;i++){

    const btn = document.createElement("button")

    btn.textContent = i
    btn.dataset.team = i

    btn.addEventListener("click",function(){

      saveTeam()

      currentTeam = Number(this.dataset.team)

      loadTeam()

      updatePresetActive()

    })

    if(i<=5){
      row1.appendChild(btn)
    }else{
      row2.appendChild(btn)
    }

    container.appendChild(row1)
    container.appendChild(row2)

  }

}

function updatePresetActive(){

  document
  .querySelectorAll(".team-preset-buttons button")
  .forEach(btn=>{

    if(Number(btn.dataset.team) === currentTeam){
      btn.classList.add("active")
    }else{
      btn.classList.remove("active")
    }

  })

}

/* 編成画面への切り替え */
const goBushoBtn = document.getElementById("goBushoList");

if(goBushoBtn){
  goBushoBtn.onclick = () => {
    location.href = "index.html";
  };
}
