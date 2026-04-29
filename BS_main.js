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
    for (let i = 1; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `部隊 ${i}`;
        select.appendChild(opt);
    }
};

setupSelect('select-team-a');
setupSelect('select-team-b');
updatePreview("a", 0);
updatePreview("b", 0);
// ボタンクリックイベント
//document.getElementById('start-battle-btn').addEventListener('click', async () => {
//    const idA = Number(document.getElementById('select-team-a').value);
//    const idB = Number(document.getElementById('select-team-b').value);
//
    // 1. 指定したIDの部隊をLocalStorage/DBから取得
    // ※ getTeamFromStorage(id) のような形に改修が必要かもしれません
//    const teamA = await getTeamFromStorage(idA,"A");
//    const teamB = await getTeamFromStorage(idB,"E");

    // 2. 戦闘実行
//    const bf = new BattleField(teamA, teamB);
//    const report = bf.run_battle(8);

    // 3. 画面にログを出力
//    const container = document.getElementById('log-container');
//    container.innerHTML = bf.get_full_log();
    
    // 一番下まで自動スクロール
//    container.scrollTop = container.scrollHeight;
//});

document.getElementById('start-battle-btn').addEventListener('click', async () => {
    runMultipleBattles(2)
});
// 連続戦闘ボタンが押された時
async function runMultipleBattles(count) {
    // これが「集計データのひな型」
    let summary = {
        win: 0, loss: 0, draw: 0,
        details: {} // 武将ごとの最大・平均などを入れる
    };

    const idA = Number(document.getElementById('select-team-a').value);
    const idB = Number(document.getElementById('select-team-b').value);

    // 1. 指定したIDの部隊をLocalStorage/DBから取得
    // ※ getTeamFromStorage(id) のような形に改修が必要かもしれません
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
            const s = summary.details[b.name];
            s.dmgSum += b.damage;
            s.dmgMax = Math.max(s.dmgMax, b.damage);
            s.dmgMin = Math.min(s.dmgMin, b.damage);
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
    const totalBattles = summary.win + summary.loss + summary.draw;
    if (totalBattles === 0) return;

    // 1. 全体統計の更新
    document.getElementById('stat-total-count').innerText = totalBattles;
    document.getElementById('stat-win-rate').innerText = ((summary.win / totalBattles) * 100).toFixed(1) + "%";
    document.getElementById('stat-win-count').innerText = summary.win;
    document.getElementById('stat-loss-count').innerText = summary.loss;
    document.getElementById('stat-draw-count').innerText = summary.draw;

    // 2. 武将別詳細の更新
    const tbody = document.getElementById('busho-stats-body');
    tbody.innerHTML = ""; // 一旦クリア

    Object.keys(summary.details).forEach(name => {
        const d = summary.details[name];
        const avg = Math.floor(d.dmgSum / totalBattles);

        // 新しい行を作成
        const row = `
            <tr>
                <td>-</td> <td>${name}</td>
                <td>与ダメージ</td>
                <td>${d.dmgMax}</td>
                <td>${d.dmgMin}</td>
                <td>${avg}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}