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
  
  makeTable() //テーブル作成
  createBushoSelect() //武将プルダウンのオプション作成
  createSenpoSelect() //戦法プルダウンのオプション作成

}

/* 所持武将・戦法取得 */
const ownership = JSON.parse(localStorage.getItem("ownership") || "{}")
DB.own_busho = ownership
const senpoOwnership = JSON.parse(localStorage.getItem("senpoOwnership") || "{}")
DB.own_senpo = senpoOwnership


/* */

function createBushoSelect(){

  const selected = [...document.querySelectorAll(".busho-name")]
    .map(s=>s.value)
    .filter(v=>v)

  const f = getBushoFilter()
  const usedIds = getSelectedBushoIds()
  const mode = document.querySelector(".own-mode").value

  document.querySelectorAll(".busho-name").forEach(select=>{
    const current = select.value
    select.innerHTML = `<option value="">--</option>` 
    
    DB.busho.forEach(b=>{
      let usedmark =""
      if(!usedIds.includes(b.id) || b.id !== current) { /*　現在選択している項目 */
        if(usedIds.includes(b.id)) usedmark = "●"
        if(mode==="owned" && !b.own.some(o=>o.own === true) ) return false /* 所有確認 */
        if(f.faction && b.faction!==f.faction) return false /*陣営フィルター */
        if(f.cost && b.cost!==f.cost) return false /*コストフィルター */
        if(f.usType && b.unique_senpotype!==f.usType) return false /*固有戦法タイプフィルター */
        if(f.usState && !b.unique_senpostates.some(e=>e.effect===f.usState)) return false /*固有戦法状態フィルター */
      }
      
      const op=document.createElement("option")
      op.value=b.id
      op.textContent=usedmark + b.name
      select.appendChild(op)

    })
    select.value = current
    
  })
}

function createSenpoSelect(){

  const selected = [...document.querySelectorAll(".senpo")]
    .map(s=>s.value)
    .filter(v=>v)

  const f = getSenpoFilter()
  const usedIds = getSelectedSenpoIds()
  const mode = document.querySelector(".own-mode").value

  document.querySelectorAll(".senpo").forEach(select=>{

    const current = select.value
    const unit = select.closest('[data-group]');
    const unitId = parseInt(unit.getAttribute('data-group'));
    const teamLeaderId = Math.floor((unitId - 1) / 3) * 3 + 1;
    const leaderUnit = document.querySelector(`[data-group="${teamLeaderId}"]`);
    
    select.innerHTML=`<option value="">--</option>`
    DB.senpo.forEach(s=>{
      let usedmark =""

      if(s.get === "固有") return
      if(!usedIds.includes(s.id) || s.id !== current) { /*　現在選択している項目 */
        if(usedIds.includes(s.id)) usedmark = "●"
        if(mode==="owned" && !s.own.some(o=>o.own === true) ) return false /* 所有確認 */
        if(f.type && s.type!==f.type) return false
        if(f.state && !s.states.some(st=>st.effect===f.state)) return false
        
        if(unit){
          const UnitType = leaderUnit.querySelector('.unit-type').value;
          const units=(s.unit||"").split("|").map(u=>u.trim())
          if(!units.includes(UnitType)) return false
        }

      }
      const op=document.createElement("option")
      op.value=s.id
      op.textContent=usedmark + s.name
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

  //戦法状態を戦法DBに付与
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

  //所有情報を戦法DBに付与
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

  //戦法情報(タイプ)を武将DBに付与
  const sTypeMap={}

  DB.busho.forEach(b=>{

    DB.senpo.forEach(s=>{
      if(b.unique_senpo==s.id){
        b.unique_senpotype=s.type
        return false
      }
      
    })
  })

  //戦法状態を武将DBに付与
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

  //所有情報を武将DBに付与
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


function setBushoData(Gid,id){

  const b=DB.busho.find(v=>v.id==id)

  if(!b)return

  const UnitGroup = document.querySelectorAll(`[data-group="${Gid}"]`);
  let c = null;
  let r = null;
  let t0 = null;
  let t1 = null;
  let t3 = null;
  let t5 = null;

  UnitGroup.forEach(u => {
    const found_c = u.querySelector('.cost'); //コスト
    if (found_c){c=found_c;}
    const found_r = u.querySelector('.rank'); //凸数
    if (found_r){r=found_r;}
  
    const found_t0 = u.querySelector('.tokusei0') //固有特性
    const found_t1 = u.querySelector('.tokusei1') //特性1凸
    const found_t3 = u.querySelector('.tokusei3') //特性3凸
    const found_t5 = u.querySelector('.tokusei5') //特性5凸
    if (found_t0){t0=found_t0;}
    if (found_t1){t1=found_t1;}
    if (found_t3){t3=found_t3;}
    if (found_t5){t5=found_t5;}

  })
  //コスト＆凸数
  const mode = document.querySelector(".own-mode").value
  let rank=0
  if (mode==="owned"){
    rank = b.own[0]?.rank ?? 0
  }
  
  if(c){c.textContent = "C" + b.cost;}
  if(r){r.textContent = "R" + rank;}

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

  // 状態
  const UnitGroupStates = document.querySelector(`[data-group="${Gid}"]`);
  const state = UnitGroupStates.querySelector('.states0'); //状態
  const statemore = UnitGroupStates.querySelector('.statesmore'); //状態
  state.textContent="固有" + b.unique_senpostates.length + "種類"
  statemore.textContent="more..."
  //状態の全てのタグを仕込む
  const stateCell = UnitGroupStates.querySelector('.states'); //状態
  if(b.unique_senpostates){
    let fullStates = ""
    b.unique_senpostates.forEach(s=>{
      if (fullStates==""){fullStates= s.label}
      else{fullStates = fullStates + "," + s.label}
      
    })
    stateCell.dataset.fullStatesUnique = fullStates
  } 

  // タグ
  const UnitGroupTag = document.querySelector(`[data-group="${Gid}"]`);
  const tag = UnitGroupTag.querySelector('.row-tags'); //タグ
  if(tag){
    tag.innerHTML=""
    if(b.tags){
      b.tags.split("|").forEach(t=>{
        const span=document.createElement("span")
        span.className="label-tag tag0"
        span.textContent=t
        tag.appendChild(span)
      })
    } 
  }
  setupHeigaku(Gid, id) //兵学

  //トータルコスト
  const teamLeaderId = Math.floor((Gid - 1) / 3) * 3 + 1;
  
  let total=0;
  const teamLeaderId2 = teamLeaderId + 2
  for (let i = teamLeaderId; i<= teamLeaderId2; i++){
      const unit = document.querySelector(`[data-group="${i}"]`);
      const c = unit.querySelector('.cost'); //コスト
      total += Number(c.textContent.replace("C",""))||0
  }
  const teamCost = document.querySelector(`[data-group="${teamLeaderId}"]`);
  teamCost.querySelector('.nowcost').textContent = "C" + total;
}

function setSenpoStates(Gid,id){
  // 状態
  const UnitGroupStates = document.querySelector(`[data-group="${Gid}"]`);
  const stateCell2 = UnitGroupStates.querySelector('.states'); //状態
  const state2 = UnitGroupStates.querySelector('.states2'); //状態
  const state3 = UnitGroupStates.querySelector('.states3'); //状態
  const UnitGroupSenpo = document.querySelector(`[data-group="${Gid}"]`);
  const senpo = UnitGroupSenpo.querySelectorAll('.senpo'); 
  let n=2
  if(senpo){
    state2.textContent = ""
    state3.textContent = ""           
    senpo.forEach(s=>{
      if(s.value !==""){
        let fullStates = ""
        DB.senpo.forEach(st=>{
          if(st.id!==s.value) return false
            st.states.forEach(sst=>{
              if (fullStates==""){fullStates= sst.label}
              else{fullStates = fullStates + "," + sst.label}
            })
            if (n==2){
              state2.textContent = "第2:" + st.states.length + "種類"
              stateCell2.dataset.fullStatesSenpo2 = fullStates
            }
            if (n==3){
              state3.textContent = "第3:" + st.states.length + "種類"
              stateCell2.dataset.fullStatesSenpo3 = fullStates
            }            
        })
      } 
      n++;
    })
  }

}

function setupHeigaku(Gid, id){

  const b=DB.busho.find(v=>v.id==id)

  const UnitGroup = document.querySelectorAll(`[data-group="${Gid}"]`);
  
  let type = null;
  let kiSelect = null;
  let sei1Select = null;
  let sei2Select = null;
  let sei3Select = null;

  UnitGroup.forEach(u => {
    const found_type = u.querySelector('.heigaku-type'); //コスト
    if (found_type){type=found_type.value;}
    const found_ki = u.querySelector('.heigaku-ki'); //凸数
    if (found_ki){kiSelect=found_ki;}
    const found_sei1 = u.querySelector('.heigaku-sei1'); //凸数
    if (found_sei1){sei1Select=found_sei1;}
    const found_sei2 = u.querySelector('.heigaku-sei2'); //凸数
    if (found_sei2){sei2Select=found_sei2;}
    const found_sei3 = u.querySelector('.heigaku-sei3'); //凸数
    if (found_sei3){sei3Select=found_sei3;}

  })

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

  document.querySelectorAll(".senpo").forEach(s=>{
    if(s.value) ids.push(s.value)
  })

  return ids
}
/* フィルター値の取得 */
function getBushoFilter(){

  return {
    faction:document.querySelector(".busho-faction").value,
    cost:document.querySelector(".busho-cost").value,
    usType:document.querySelector(".usenpo-type").value,
    usState:document.querySelector(".usenpo-states").value
  }

}
function getSenpoFilter(){

  return {
    type:document.querySelector(".senpo-type").value,
    state:document.querySelector(".senpo-states").value,
    unit:document.querySelector(".unit-type").value    
  }

}



// テーブル全体に対してイベントを設定
const table = document.getElementById('squad-table');
/* 同じ武将を選択した時、入れ替える処理 */
let beforeBushoValue = "";

  /* チェンジイベント前処理 */
table.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('busho-name')) {
    beforeBushoValue = e.target.value;
  }
});
  /* チェンジイベント後処理 */
  table.addEventListener('change', (e) => {
    if (!e.target.classList.contains('busho-name')) return;
      const newValue = e.target.value;  
  
    if (newValue === ""|| newValue === beforeBushoValue) return;  /*未選択時は空にする */
    // 自分のユニット（データグループ）を取得
    const myUnitId = e.target.closest('[data-group]').getAttribute('data-group');
    // 全ての武将セレクトを取得して重複チェック
    const allBushoSelects = document.querySelectorAll('.busho-name');
    let swapSelect = false;
    allBushoSelects.forEach(otherSelect => {
      if (otherSelect !== e.target && otherSelect.value === newValue) {
        swapSelect = true;
      }
    })
    if(swapSelect==true){
      allBushoSelects.forEach(otherSelect => {
          if (otherSelect !== e.target && otherSelect.value === newValue) {
            const otherUnitId = otherSelect.closest('[data-group]').getAttribute('data-group');
            // 1. 武将の値をスワップ
            otherSelect.value = beforeBushoValue;

            const myUnit = document.querySelector(`[data-group="${myUnitId}"]`);
            const otherUnit = document.querySelectorAll(`[data-group="${otherUnitId}"]`); // ※1チーム複数行ある場合
            
            const swapByClass = (className) => {
              const myItems = document.querySelectorAll(`[data-group="${myUnitId}"] .${className}`);
              const otherItems = document.querySelectorAll(`[data-group="${otherUnitId}"] .${className}`);
              
              myItems.forEach((item, i) => {
                if (otherItems[i]) {
                  const temp = item.value;
                  item.value = otherItems[i].value;
                  otherItems[i].value = temp;
                }
              });
            };

            swapByClass('senpo');  // 戦法を入れ替え
            swapByClass('heigaku-type');  // 兵学タイプを入れ替え

            const kiA = document.querySelector(`[data-group="${myUnitId}"] .heigaku-ki`).value;
            const sei1A = document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei1`).value;
            const sei2A = document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei2`).value;
            const sei3A = document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei3`).value;

            const kiB = document.querySelector(`[data-group="${otherUnitId}"] .heigaku-ki`).value;
            const sei1B = document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei1`).value;
            const sei2B = document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei2`).value;
            const sei3B = document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei3`).value;


            flashElement(e.target);  //選択箇所を光らせる
            flashElement(otherSelect);  //入替箇所を光らせる

            setBushoData(myUnitId,newValue)  //入替後の武将情報セット
            setBushoData(otherUnitId,otherSelect.value)  //入替後の武将情報セット
          
            document.querySelector(`[data-group="${myUnitId}"] .heigaku-ki`).value = kiB;
            document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei1`).value = sei1B;
            document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei2`).value = sei2B;
            document.querySelector(`[data-group="${myUnitId}"] .heigaku-sei3`).value = sei3B;

            document.querySelector(`[data-group="${otherUnitId}"] .heigaku-ki`).value = kiA;
            document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei1`).value = sei1A;
            document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei2`).value = sei2A;
            document.querySelector(`[data-group="${otherUnitId}"] .heigaku-sei3`).value = sei3A;
            
          }
      });
    }else{
      setBushoData(myUnitId,newValue)
    }
    beforeBushoValue = newValue;
    createBushoSelect()
  });

/* 同じ戦法を選択した時、入れ替える処理 */
let beforeSenpoValue = "";

  /* チェンジイベント前処理 */
table.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('senpo')) {
    beforeSenpoValue = e.target.value;
  }
});
  /* チェンジイベント後処理 */
  table.addEventListener('change', (e) => {
    if (!e.target.classList.contains('senpo')) return;
      const newValue = e.target.value;  
  
    if (newValue === "") return;  /*未選択時は空にする */
    // 全ての戦法セレクトを取得して重複チェック
    const allSenpoSelects = document.querySelectorAll('.senpo');
    allSenpoSelects.forEach(otherSelect => {
        if (otherSelect !== e.target && otherSelect.value === newValue) {
          otherSelect.value = beforeSenpoValue;

          flashElement(e.target);  //選択箇所を光らせる
          flashElement(otherSelect);  //入替箇所を光らせる
        }
    });
    beforeSenpoValue = newValue;
  });


/* チェンジイベント処理 */
document.addEventListener("change",e=>{

    /* 選択対象フィルターの変更処理 */
  if(e.target.classList.contains("own-mode")){
    createBushoSelect()
    createSenpoSelect()

  }
    /* 武将選択フィルターの変更処理 */
  if(e.target.classList.contains("filter-b")){
    createBushoSelect()
  }
    /* 戦法選択フィルターの変更処理 */
  if(e.target.classList.contains("filter-s")){
    createSenpoSelect()
  }
    /* 武将選択の変更処理 */
  /*if(e.target.classList.contains("busho-name")){
    createBushoSelect()
    const b = e.target.closest('[data-group]');
    const bGId = parseInt(b.getAttribute('data-group'));
    const bvalue = e.target.value
    setBushoData(bGId,bvalue)
  }*/
    /* 戦法選択の変更処理 */
  if(e.target.classList.contains("senpo")){
    createSenpoSelect()
    const s = e.target.closest('[data-group]');
    const sGId = parseInt(s.getAttribute('data-group'));
    const svalue = e.target.value
    setSenpoStates(sGId,svalue)
  }
    /* 兵法選択の変更処理 */
  if(e.target.classList.contains("heigaku-type")){
    const b = e.target.closest('[data-group]');
    const bGId = parseInt(b.getAttribute('data-group'));
    const myUnit = document.querySelector(`[data-group="${bGId}"]`);
    const bvalue = myUnit.querySelector(".busho-name");
    setupHeigaku(bGId,bvalue.value)
  }
    /* 兵種選択の変更処理 */
  if(e.target.classList.contains("unit-type")){
    createSenpoSelect()
  }


})

// テーブル全体のイベントに追加
table.addEventListener('click', (e) => {
  // statesクラスのセル（またはその中の要素）がクリックされたか判定
  const targetCell = e.target.closest('.states');
  if (!targetCell) return;

  // 1. その武将が持っている「全ての状態データ」をどこから持ってくるか？
  // おすすめは、表示用に省略する前の「全データ」を一時的に保持しておく方法です
  // ここでは仮に、セルの中に隠しデータ(dataset)で持たせているとします
  const allStatesUnique = targetCell.dataset.fullStatesUnique.split(',');

  // 2. ポップアップの中身を作成
  const listContainerUnique = document.getElementById('popup-tags-list-unique');
  listContainerUnique.innerHTML = ''; // クリア
  
  allStatesUnique.forEach(state => {
    const span = document.createElement('span');
    span.className = 'label-tag'; // タグと同じデザインを流用
    span.textContent = state;
    listContainerUnique.appendChild(span);
  });

  if(targetCell.dataset.fullStatesSenpo2){
    const allStatesSenpo2 = targetCell.dataset.fullStatesSenpo2.split(',');

    // 2. ポップアップの中身を作成
    const listContainerSenpo2 = document.getElementById('popup-tags-list-senpo2');
    listContainerSenpo2.innerHTML = ''; // クリア
    
    allStatesSenpo2.forEach(state => {
      const span = document.createElement('span');
      span.className = 'label-tag'; // タグと同じデザインを流用
      span.textContent = state;
      listContainerSenpo2.appendChild(span);
    });
  }

  if(targetCell.dataset.fullStatesSenpo3){
    const allStatesSenpo3 = targetCell.dataset.fullStatesSenpo3.split(',');

    // 2. ポップアップの中身を作成
    const listContainerSenpo3 = document.getElementById('popup-tags-list-senpo3');
    listContainerSenpo3.innerHTML = ''; // クリア
    
    allStatesSenpo3.forEach(state => {
      const span = document.createElement('span');
      span.className = 'label-tag'; // タグと同じデザインを流用
      span.textContent = state;
      listContainerSenpo3.appendChild(span);
    });
  }
  // 3. 表示
  document.getElementById('status-popup').style.display = 'flex';
});

// 関数定義
const closePopup = () => {
  document.getElementById('status-popup').style.display = 'none';
};

// ボタンにイベントを登録
document.getElementById('close-popup-btn').addEventListener('click', closePopup);

// 背景をタップしても閉じるようにするとさらに使いやすいです
document.getElementById('status-popup').addEventListener('click', (e) => {
  if (e.target.id === 'status-popup') closePopup();
});


window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});


function makeTable(){
  const table = document.getElementById('squad-table');
  let html = '';

  // 12チーム × 3名 = 36回ループ
  for (let j=1; j<=12; j++){
    let html = `<tbody class="member-unit" >`
    for (let i = 1; i <= 3; i++) {
      // チーム番号の計算（1,1,1, 2,2,2... となるように）
      
        const teamNum = j
      
      // 3人ごとの最初の1人だけ rowspan="3" をつけるための判定
      const isTeamStart = (i  === 1);
      
      const groupNo = (j-1)*3+i;
      html += `
        <tr class="unit-row-1" data-group="${groupNo}">
          ${isTeamStart ? `<td class="team-No" rowspan="6">${teamNum}</td>` : ''}
          ${isTeamStart ? `<td rowspan="6">
            <div class="unit">
              <select class="select unit-type">
                <option value="">--</option>
                <option value="騎兵">騎兵</option>
                <option value="弓兵">弓兵</option>
                <option value="鉄砲">鉄砲</option>
                <option value="足軽">足軽</option>
                <option value="兵器">兵器</option>
              </select>
              <div class="team-cost">
                <span class="nowcost">C0</span>
                <input class="chain-chk" type="checkbox" >
              </div>
            </div>
          </td>` : ''}
          <td ><span class="cost">C0</span></td>
          <td rowspan="2">
            <select class="select busho-name">
                <option value="">--</option>
            </select>
          </td>
          <td rowspan="2">
            <div class="column-senpo">
                <select class="select senpo senpo2">
                    <option value="">--</option>
                </select>
                <select class="select senpo senpo3">
                    <option value="">--</option>
                </select>
            </div>
          </td>
          <td class="heigaku" rowspan="2">
            <select class="select heigaku-type">
                <option value="">--</option>
                <option value="武略">武略</option>
                <option value="機略">機略</option>
                <option value="陣立">陣立</option>
                <option value="臨戦">臨戦</option>
            </select>
          </td>
          <td class="heigaku">奇</td>
          <td class="heigaku-ki2">
            <select class="select heigaku-ki">
                <option value="">兵学・奇</option>
            </select>
          </td>
          <td rowspan="2" class="tokusei">
                <div class="row-tokusei">
                    <span class="label-tag tokusei0"></span>
                    <span class="label-tag tokusei1"></span>
                    <span class="label-tag tokusei3"></span>
                    <span class="label-tag tokusei5"></span>
                </div>
          </td>
          <td rowspan="2" class="states">
                <div class="row-states">
                    <span class="label-tag states0"></span>
                    <span class="label-tag statesmore"></span>
                    <span class="label-tag states2"></span>
                    <span class="label-tag states3"></span>
                </div>
          </td>
          <td rowspan="2" class="tags">
                <div class="row-tags">
                    <span class="label-tag tag0"></span>
                </div>
          </td>
        </tr>
        <tr class="unit-row-2" data-group="${groupNo}">
          <td><span class="rank">R0</span></td>
          <td class="heigaku">正</td>
          <td class="heigaku-sei">
            <select class="select heigaku-sei1">
                <option value="">・正</option>
            </select>
            <select class="select heigaku-sei2">
                <option value="">・正</option>
            </select>
            <select class="select heigaku-sei3">
                <option value="">・正</option>
            </select>
          </td>
        </tr>
        `;
    }
  // 最後にテーブルにガバッと入れる
  html += `</tbody>`;
  table.insertAdjacentHTML('beforeend', html);
  }
  
}
/* 入れ替わったことを分かりやすくするための演出
 */
function flashElement(el) {
  el.style.transition = 'background-color 0.5s';
  el.style.backgroundColor = 'gold'; // 薄い青色などで強調
  setTimeout(() => {
    el.style.backgroundColor = '';
  }, 600);
}

// ボタンにイベントを登録
document.getElementById('teamLoad-btn').addEventListener('click', loadTeam);

/* 設定内容の読み出し */
function loadTeam(){

  let TeamNo = 2
  const data=JSON.parse(localStorage.getItem("teamData_"+TeamNo)||"{}")

  const myUnit = document.querySelectorAll(`[data-group="${TeamNo}"]`);

    /* グローバル設定 */

  myUnit.querySelector(".unit-type").value = data.unit  //兵種
  
  myUnit.querySelector(".busho-name").value=t.busho||""
  myUnit.querySelector(".heigaku-type").value=t.heigakuType||""
  if(t.busho){
    setBushoData(myUnit,t.busho)
  }
  myUnit.querySelector(".senpo2").value=t.senpo2||""
  myUnit.querySelector(".senpo3").value=t.senpo3||""
  
  myUnit.querySelector(".heigaku-ki").value=t.heigakuKi||""
  myUnit.querySelector(".heigaku-sei1").value=t.heigakuSei1||""
  myUnit.querySelector(".heigaku-sei2").value=t.heigakuSei2||""
  myUnit.querySelector(".heigaku-sei3").value=t.heigakuSei3||""

}
  
