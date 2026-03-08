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
  setupBushoCost() 
  setupSenpoType() 
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
    DB.busho.forEach(b=>{
      if(selected.includes(b.id) && b.id !== current) return
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=b.name
      if(b.id === current) op.selected = true
      select.appendChild(op)

    })
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
    DB.senpo.forEach(s=>{
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

function setupBushoCost(){

  const types = [3,4,5,6,7]
  document.querySelectorAll(".busho-cost").forEach(select=>{
    select.innerHTML = ""
    types.forEach(t=>{
      const option = document.createElement("option")
      option.value = t
      option.textContent = t
      select.appendChild(option)
    })
  })

}

function setupSenpoType(){

  const types = ["指揮","能動","突撃","受動","兵種"]
  document.querySelectorAll(".senpo-type").forEach(select=>{
    select.innerHTML = ""
    types.forEach(t=>{
      const option = document.createElement("option")
      option.value = t
      option.textContent = t
      select.appendChild(option)
    })
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
})
