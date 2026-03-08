const DB={
  busho:[],
  senpo:[],
  senpoState:[],
  tokusei:[],
  heigaku:[]
}

async function loadCSV(path){

  const res=await fetch(path)
  const text=await res.text()
  const rows=text.trim().split("\n")
  const header=rows.shift().split(",")

  return rows.map(r=>{
    const cols=r.split(",")
    const obj={}
    header.forEach((h,i)=>obj[h]=cols[i])
    return obj
  })
}

async function init(){
  /* 初期化処理*/
  DB.busho=await loadCSV("data/busho.csv")
  DB.senpo=await loadCSV("data/senpo.csv")
  DB.senpoState=await loadCSV("data/senpo_state.csv")
  DB.tokusei=await loadCSV("data/tokusei.csv")
  DB.heigaku=await loadCSV("data/heigaku.csv")

  createBushoSelect()
  createSenpoSelect()

  createBushoFactionFilter() 
  createBushoCostFilter() 
  createSenpoTypeFilter()
  createSenpoStateFilter() 
  setupHeigakuType() 

  refreshBushoSelect()
  refreshSenpoSelect()
}

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

  document.querySelectorAll(".busho-select").forEach(select=>{
    const current = select.value
    select.innerHTML = `<option value="">武将選択</option>`
    getFilteredBusho().forEach(b=>{
      if(selected.includes(b.id) && b.id !== current) return
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=b.name
      if(b.id === current) op.selected = true
      select.appendChild(op)

    })
  })
}
function getFilteredBusho(){

  const f=getBushoFilter()

  return DB.busho.filter(b=>{

    if(f.faction && b.faction!==f.faction) return false
    if(f.cost && b.cost!==f.cost) return false

    return true

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

  document.querySelectorAll(".senpo-select").forEach(select=>{

    const current = select.value
    select.innerHTML=`<option value="">戦法選択</option>`
    getFilteredSenpo().forEach(s=>{
      if(s.get === "固有") return
      if(selected.includes(s.id) && s.id !== current) return
      const op=document.createElement("option")
      op.value=s.id
      op.textContent=s.name
      if(s.id === current) op.selected=true
      select.appendChild(op)
    })

  })

}

function getFilteredSenpo(){

  const f=getSenpoFilter()

  return DB.senpo.filter(s=>{

    if(s.get==="固有") return false

    if(f.type && s.type!==f.type) return false
    if(f.state && s.state!==f.state) return false

    return true

  })

}
function setBushoData(column,id){

  const b=DB.busho.find(v=>v.id==id)

  if(!b)return

  // コスト表示
  column.querySelector(".busho-grid").innerHTML=`
    <div class="label-center">C${b.cost}</div>
    <div class="label-center">0凸</div>
    <div class="label-center">${b.awake=="1"?"覚醒":"未覚醒"}</div>
  `
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
  /* 武将選択の変更処理 */
  if(e.target.classList.contains("busho-select")){

    const column=e.target.closest(".team")

    setBushoData(column,e.target.value)

    refreshBushoSelect()

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
