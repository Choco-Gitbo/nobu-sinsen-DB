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

// ボタンクリックイベント
document.getElementById('start-battle-btn').addEventListener('click', async () => {
    const idA = Number(document.getElementById('select-team-a').value);
    const idB = Number(document.getElementById('select-team-b').value);

    // 1. 指定したIDの部隊をLocalStorage/DBから取得
    // ※ getTeamFromStorage(id) のような形に改修が必要かもしれません
    const teamA = await getTeamFromStorage(idA,"A");
    const teamB = await getTeamFromStorage(idB,"E");

    // 2. 戦闘実行
    const bf = new BattleField(teamA, teamB);
    const report = bf.run_battle(8);

    // 3. 画面にログを出力
    const container = document.getElementById('log-container');
    container.innerHTML = bf.get_full_log();
    
    // 一番下まで自動スクロール
    container.scrollTop = container.scrollHeight;
});

document.getElementById('run-multi').addEventListener('click', async () => {
    runMultipleBattles(2)
});
// 連続戦闘ボタンが押された時
async function runMultipleBattles(count) {
    // これが「集計データのひな型」
    let summary = {
        win: 0, loss: 0, draw: 0,
        details: {} // 武将ごとの最大・平均などを入れる
    };

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
    }

    // 最後にUI（image_33414e.png の表）に反映
    displaySummaryTable(summary);
}