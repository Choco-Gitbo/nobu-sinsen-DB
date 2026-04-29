// main.js
import { BattleField } from './BS_BattleField.js';
import { Busho } from './BS_Busho.js'; // 武将クラス
import { initDB } from './BS_csv_loader.js';
import { getTeamFromStorage } from './BS_deck.js';

async function startSimulation() {
    // 1. まずCSVデータを全て読み込む
    await initDB();

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
    runMultipleBattles(2)
});
// 連続戦闘ボタンが押された時
async function runMultipleBattles(count) {
    // これが「集計データのひな型」
    let summary = {
        win: 0, loss: 0, draw: 0,
        teamDamage:{sum:0,max:0,min:Infinity},
        teamTaken:{sum:0,max:0,min:Infinity},
        teamHeal:{sum:0,max:0,min:Infinity},
        details: {} // 武将ごとの最大・平均などを入れる
    };

    const idA = Number(document.getElementById('select-team-a').value);
    const idB = Number(document.getElementById('select-team-b').value);

    // 1. 指定したIDの部隊をLocalStorage/DBから取得
    const teamA = await getTeamFromStorage(idA,"A");
    const teamB = await getTeamFromStorage(idB,"E");


    for (let i = 0; i < count; i++) {
        const bf = new BattleField(teamA, teamB);
        const report = bf.run_battle(8); // 上記パターンAの戻り値

        // 勝敗のカウント
        if (report.result === "勝利") summary.win++;
        else if (report.result === "敗北") summary.loss++;
        else summary.draw++;

        // 武将ごとのダメージ集計（ここで最大・最小・合計を更新）
        report.armyA.forEach(b => {
            if (!summary.details[b.name]) {
                summary.details[b.name] = { dmgSum: 0, dmgMax: 0, dmgMin: Infinity };  
            }
            const sd = summary.teamDamage;
            sd.sum += b.damage;
            sd.max = Math.max(sd.max, b.damage);
            sd.min = Math.min(sd.min, b.damage);

            const st = summary.teamTaken;
            st.sum += b.taken;
            st.max = Math.max(st.max, b.taken);
            st.min = Math.min(st.min, b.taken);

            const sh = summary.teamHeal;
            sh.sum += b.heal;
            sh.max = Math.max(sh.max, b.heal);
            sh.min = Math.min(sh.min, b.heal);
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

    // --- 1. 全体数値の表示 ---
    updateStatRow('team-total-damage', summary.teamDamage, total);
    updateStatRow('team-total-taken', summary.teamTaken, total);
    updateStatRow('team-total-heal', summary.teamHeal, total);

    // --- 2. 武将・戦法別の詳細生成 ---
    const container = document.getElementById('busho-detail-container');
    container.innerHTML = ""; // 初期化

    Object.keys(summary.details).forEach(bushoName => {
        const b = summary.details[bushoName];
        let html = `
            <table class="summary-table detail-table">
                <thead>
                    <tr><th colspan="6" class="busho-header">${bushoName}</th></tr>
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