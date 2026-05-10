// main.js
import { BattleField } from './BS_BattleField.js';
import { Busho } from './BS_Busho.js'; // 武将クラス
import { initDB } from './BS_csv_loader.js';
import { getTeamFromStorage } from './BS_deck.js';

async function startSimulation() {
    // 1. まずCSVデータを全て読み込む
    await initDB();

}
window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});

function setupNavigation() {
  const openBtn = document.querySelector('.js-menu-open');
  const closeBtn = document.querySelector('.js-menu-close');
  const menu = document.querySelector('.js-side-menu');
  const overlay = document.querySelector('.js-menu-overlay');

  const toggleMenu = () => {
    menu.classList.toggle('is-open');
    overlay.classList.toggle('is-open');
  };

  openBtn.addEventListener('click', toggleMenu);
  closeBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu); // 背景クリックでも閉じる
}

startSimulation();

// プルダウンの生成（1~12）
const setupSelect = (id) => {
    const select = document.getElementById(id);
    for (let i = 0; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        if (i === 0){
            opt.textContent = `---`;
        }else{
            opt.textContent = `部隊 ${i}`;
        }
        select.appendChild(opt);
    }
};

setupSelect('select-team-a');
setupSelect('select-team-b');
updatePreview("a", 0);
updatePreview("b", 0);

document.getElementById('start-battle-btn').addEventListener('click', async () => {
    const battle_cnt = parseInt(document.getElementById('battle_count').value)
    runMultipleBattles(battle_cnt)
});
// 連続戦闘ボタンが押された時
async function runMultipleBattles(count) {
    // これが「集計データのひな型」
    let summary = {
        win: 0, loss: 0, draw: 0, turn: 0,
        teamDamage_a:{sum1:0,sum:0,max:0,min:Infinity},
        teamTaken_a:{sum1:0,sum:0,max:0,min:Infinity},
        teamHeal_a:{sum1:0,sum:0,max:0,min:Infinity},
        teamDamage_b:{sum1:0,sum:0,max:0,min:Infinity},
        teamTaken_b:{sum1:0,sum:0,max:0,min:Infinity},
        teamHeal_b:{sum1:0,sum:0,max:0,min:Infinity},
        details: {
            armyA:{},armyB:{}
        } // 武将ごとの最大・平均などを入れる
    };

    const idA = Number(document.getElementById('select-team-a').value);
    const idB = Number(document.getElementById('select-team-b').value);


    for (let i = 0; i < count; i++) {

        // 1. 指定したIDの部隊をLocalStorage/DBから取得
        //前回戦闘を引き継ぐときは実行しない
        const teamA = await getTeamFromStorage(idA,"A");
        const teamB = await getTeamFromStorage(idB,"E");

        //兵数リセット
        teamA[0].hp = Number(document.getElementById("preview-a-0-hp").value);
        teamA[1].hp = Number(document.getElementById("preview-a-1-hp").value);
        teamA[2].hp = Number(document.getElementById("preview-a-2-hp").value);
        teamB[0].hp = Number(document.getElementById("preview-b-0-hp").value);
        teamB[1].hp = Number(document.getElementById("preview-b-1-hp").value);
        teamB[2].hp = Number(document.getElementById("preview-b-2-hp").value);

        //サマリーリセット
        summary.teamDamage_a.sum1 = 0;
        summary.teamTaken_a.sum1 = 0;
        summary.teamHeal_a.sum1 = 0;
        summary.teamDamage_b.sum1 = 0;
        summary.teamTaken_b.sum1 = 0;
        summary.teamHeal_b.sum1 = 0;

        const bf = new BattleField(teamA, teamB);
        const report = bf.run_battle(8); // 上記パターンAの戻り値

        // 勝敗のカウント
        if (report.result === "勝利") summary.win++;
        else if (report.result === "敗北") summary.loss++;
        else summary.draw++;
        
        // 所要ターンのカウント
        summary.turn += report.turn;

        // 武将ごとのダメージ集計（ここで最大・最小・合計を更新）
        ["armyA", "armyB"].forEach(side => {
            report[side].forEach(b => {
                if (!summary.details[side][b.name]) {
                    summary.details[side][b.name] = { dmgSum: 0, dmgMax: 0, dmgMin: Infinity,skills:{}};  
                }
                if (side == "armyA"){
                    const sd = summary.teamDamage_a;
                    sd.sum += b.damage;
                    sd.sum1 += b.damage;
                    const st = summary.teamTaken_a;
                    st.sum += b.taken;
                    st.sum1 += b.taken;
                    const sh = summary.teamHeal_a;
                    sh.sum += b.heal;
                    sh.sum1 += b.heal;
                }
                if(side == "armyB"){
                    const sd = summary.teamDamage_b;
                    sd.sum += b.damage;
                    sd.sum1 += b.damage;
                    const st = summary.teamTaken_b;
                    st.sum += b.taken;
                    st.sum1 += b.taken;
                    const sh = summary.teamHeal_b;
                    sh.sum += b.heal;
                    sh.sum1 += b.heal;
                }

                const target = summary.details[side][b.name];
                b.skill_details.forEach(ss => {
                    target.skills[ss.name]={dmg:{sum:0,max:0,min:Infinity},
                        heal:{sum:0,max:0,min:Infinity},count:{sum:0,max:0,min:Infinity}};
                    let ss1 = summary.details[side][b.name].skills[ss.name]
                    //発動回数
                    ss1.count.sum += ss.count
                    ss1.count.max = Math.max(ss1.count.max, ss.count);
                    ss1.count.min = Math.min(ss1.count.min, ss.count);

                    //与ダメ
                    ss1.dmg.sum += ss.dmg
                    ss1.dmg.max = Math.max(ss1.dmg.max, ss.dmg);
                    ss1.dmg.min = Math.min(ss1.dmg.min, ss.dmg);

                    //回復
                    ss1.heal.sum += ss.heal
                    ss1.heal.max = Math.max(ss1.heal.max, ss.heal);
                    ss1.heal.min = Math.min(ss1.heal.min, ss.heal);
                })
            });
            if (side == "armyA"){
                const sdA = summary.teamDamage_a;
                sdA.max = Math.max(sdA.max, sdA.sum1);
                sdA.min = Math.min(sdA.min, sdA.sum1);
                const stA = summary.teamTaken_a;
                stA.max = Math.max(stA.max, stA.sum1);
                stA.min = Math.min(stA.min, stA.sum1);
                const shA = summary.teamHeal_a;
                shA.max = Math.max(shA.max, shA.sum1);
                shA.min = Math.min(shA.min, shA.sum1);
            }
            if (side == "armyB"){
                const sdB = summary.teamDamage_b;
                sdB.max = Math.max(sdB.max, sdB.sum1);
                sdB.min = Math.min(sdB.min, sdB.sum1);
                const stB = summary.teamTaken_b;
                stB.max = Math.max(stB.max, stB.sum1);
                stB.min = Math.min(stB.min, stB.sum1);
                const shB = summary.teamHeal_b;
                shB.max = Math.max(shB.max, shB.sum1);
                shB.min = Math.min(shB.min, shB.sum1);
            }
        });
        if (i == (count-1)){
            // 3. 画面にログを出力
            const container = document.getElementById('log-container');
            container.innerHTML = bf.get_full_log();
            
            // 一番下まで自動スクロール
            container.scrollTop = container.scrollHeight;
        }
    }


    // 最後にUI（image_33414e.png の表）に反映
    displaySummaryTable(summary);

}

// 部隊選択が変更された時のイベント
document.getElementById('select-team-a').addEventListener('change', (e) => {
    updatePreview('a', e.target.value);
});
document.getElementById('select-team-b').addEventListener('change', (e) => {
    updatePreview('b', e.target.value);
});


async function updatePreview(side, teamId) {

    // 兵種アイコンの定義
    const unitIcons = {
        "騎兵": "🐎 ",
        "弓兵": "🏹 ",
        "足軽": "🗡️ ",
        "鉄砲": "🔫 ",
        "兵器": "🛠️ " // ゲーム内の名称に合わせて調整してください
    };

    // LocalStorage等から部隊データを取得
    let side_t;
    if (side=="a"){
        side_t = "A";
    }else{
        side_t = "E";
    }

    document.getElementById(`preview-${side}-unit-type`).innerText = "-";

    for (let i_b = 0; i_b < 3; i_b++){
        document.getElementById(`preview-${side}-${i_b}-name`).innerText = "-";
        for (let i_s = 1; i_s < 4; i_s++){
            document.getElementById(`preview-${side}-${i_b}-s${i_s}`).innerText = "-";
        }
    }

    if (teamId === 0) return

    const teamData = await getTeamFromStorage(teamId , side_t); 
    if (!teamData || teamData.length === 0 || !teamData[0]) {
    return;
}
    // 兵種の表示
    const displayLabel = unitIcons[teamData[0].unit_type] || u_typeteamData[0].unit_type;
    document.getElementById(`preview-${side}-unit-type`).innerText = displayLabel;

    // 武将と戦法の流し込み
    teamData.forEach((member, index) => {
        if (!member) return;
        
        // 武将名（例: preview-a-0-name）
        document.getElementById(`preview-${side}-${index}-name`).innerText = member.name;
        
        // 戦法名（例: preview-a-0-s0, s1, s2）
        member.skills.forEach((skill, sIndex) => {
            const skillEl = document.getElementById(`preview-${side}-${index}-s${sIndex}`);
            if (skillEl) {
                skillEl.innerText = skill.name;
            }
        });
    });
}

function displaySummaryTable(summary) {
    const total = summary.win + summary.loss + summary.draw;
    if (total === 0) return;
    

    // 1. 全体統計の更新
    document.getElementById('stat-total-count').innerText = total;
    document.getElementById('stat-win-rate').innerText = ((summary.win / total) * 100).toFixed(1) + "%";
    document.getElementById('stat-turn').innerText = ((summary.turn / total)).toFixed(0) ;
    document.getElementById('stat-win-count').innerText = summary.win;
    document.getElementById('stat-loss-count').innerText = summary.loss;
    document.getElementById('stat-draw-count').innerText = summary.draw;

    // --- 1. 全体数値の表示 ---
    updateStatRow('teamA-total-damage', summary.teamDamage_a, total);
    updateStatRow('teamA-total-taken', summary.teamTaken_a, total);
    updateStatRow('teamA-total-heal', summary.teamHeal_a, total);
    updateStatRow('teamB-total-damage', summary.teamDamage_b, total);
    updateStatRow('teamB-total-taken', summary.teamTaken_b, total);
    updateStatRow('teamB-total-heal', summary.teamHeal_b, total);

    // --- 2. 武将・戦法別の詳細生成 ---
    const container = document.getElementById('busho-detail-container');
    container.innerHTML = ""; // 初期化

    ["armyA", "armyB"].forEach(side => {
        const sideClass = (side === "armyA") ? "team-a" : "team-b";
        Object.keys(summary.details[side]).forEach(bushoName => {
            const b = summary.details[side][bushoName];
            
            let html = `
                <table class="summary-table detail-table">
                    <thead>
                        <tr><th colspan="6" class="busho-header ${sideClass}">${bushoName}</th></tr>
                        <tr><th>戦法</th><th>項目</th><th>合計</th><th>最大</th><th>最小</th><th>平均</th></tr>
                    </thead>
                    <tbody>`;

            Object.keys(b.skills).forEach(skillName => {
                const s = b.skills[skillName];
                // 各項目の行を生成（与ダメ、回復、回数）
                html += generateSkillRow(skillName, "与ダメ", s.dmg, total);
                html += generateSkillRow("", "回復", s.heal, total);
                html += generateSkillRow("", "発動回数", s.count, total);
            });

            html += `</tbody></table>`;
            container.insertAdjacentHTML('beforeend', html);
        });
    });
}

// 補助関数：1つの統計行を更新
function updateStatRow(rowId, data, totalBattles) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.querySelector('.max').innerText = data.max;
    row.querySelector('.min').innerText = data.min;
    row.querySelector('.avg').innerText = Math.floor(data.sum / totalBattles);
}

// 補助関数：戦法ごとのHTML行を作成
function generateSkillRow(label, type, data, total) {
    return `
        <tr>
            <td style="font-weight:bold">${label}</td>
            <td>${type}</td>
            <td>${data.sum}</td>
            <td>${data.max}</td>
            <td>${data.min}</td>
            <td>${(data.sum / total).toFixed(1)}</td>
        </tr>`;
}

document.getElementById('go-listPage').addEventListener('click', (e) => {
    // ページを移動させる
      window.location.href = 'teams1.html';
});