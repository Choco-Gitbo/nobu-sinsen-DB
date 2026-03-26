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
    select.innerHTML = `<option value="">武将選択</option>` 
    
    DB.busho.forEach(b=>{
      let usedmark =""
      if(!usedIds.includes(b.id) || b.id !== current) { /*　現在選択している項目 */
        if(usedIds.includes(b.id)) usedmark = "●"
        if(mode==="owned" && !b.own.some(o=>o.own === true) ) return false /* 所有確認 */
        if(f.faction && b.faction!==f.faction) return false /*陣営フィルター */
        if(f.cost && b.cost!==f.cost) return false /*コストフィルター */
        if(f.usType && !b.unique_senpotype.some(e=>e.type===f.usType)) return false /*固有戦法タイプフィルター */
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
    select.innerHTML=`<option value="">戦法選択</option>`
    DB.senpo.forEach(s=>{
      let usedmark =""

      if(s.get === "固有") return
      if(!usedIds.includes(s.id) || s.id !== current) { /*　現在選択している項目 */
        if(usedIds.includes(s.id)) usedmark = "●"
        if(mode==="owned" && !s.own.some(o=>o.own === true) ) return false /* 所有確認 */
        if(f.type && s.type!==f.type) return false
        if(f.state && !s.states.some(st=>st.effect===f.state)) return false
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

  DB.senpo.forEach(st=>{

    if(!sTypeMap[st.senpo_id]){
      sTypeMap[st.senpo_id]=[]
    }

    sTypeMap[st.senpo_id].push(st)

  })
  DB.busho.forEach(b=>{
    b.unique_senpotype=sTypeMap[b.unique_senpo] || []
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
    state:document.querySelector(".senpo-states").value
  }

}


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
    allBushoSelects.forEach(otherSelect => {
        if (otherSelect !== e.target && otherSelect.value === newValue) {
          const otherUnitId = otherSelect.closest('[data-group]').getAttribute('data-group');
          // 1. 武将の値をスワップ
          otherSelect.value = beforeBushoValue;

          // 2. そのユニット内の「戦法」などをスワップ
          // data-group属性を使って、自分と相手の関連セレクトを全て取得
          const mySenpo = document.querySelectorAll(`[data-group="${myUnitId}"] select:not(.busho-name)`);
          const otherSenpo = document.querySelectorAll(`[data-group="${otherUnitId}"] select:not(.busho-name)`);

          mySenpo.forEach((s, i) => {
            const temp = s.value;
            s.value = otherSenpo[i].value;
            otherSenpo[i].value = temp;
          });
          flashElement(e.target);  //選択箇所を光らせる
          flashElement(otherSelect);  //入替箇所を光らせる
        }
    });
    beforeBushoValue = newValue;
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
  if(e.target.classList.contains("busho-name")){
    createBushoSelect()
  }
    /* 戦法選択の変更処理 */
  if(e.target.classList.contains("senpo")){
    createSenpoSelect()
  }


})


/* 編成画面への切り替え */
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

      html += `
        <tr class="data-group="${i}">
          ${isTeamStart ? `<td class="team-No" rowspan="6">${teamNum}</td>` : ''}
          <td class="cost">C0</td>
          <td rowspan="2">
            <select class="select busho-name">
                <option value="">--</option>
            </select>
          </td>
          <td rowspan="2">
            <div class="column-senpo">
                <select class="select senpo">
                    <option value="">--</option>
                </select>
                <select class="select senpo">
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
                </div>
          </td>
          <td rowspan="2" class="states">
                <div class="row-states">
                    <span class="label-tag stetas"></span>
                </div>
          </td>
          <td rowspan="2" class="tags">
                <div class="row-tags">
                    <span class="label-tag tags"></span>
                </div>
          </td>
        </tr>
        <tr>
          <td class="rank">R0</td>
          <td class="heigaku">正</td>
          <td class="heigaku-sei2">
            <select class="select heigaku-sei">
                <option value="">・正</option>
            </select>
            <select class="select heigaku-sei">
                <option value="">・正</option>
            </select>
            <select class="select heigaku-sei">
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