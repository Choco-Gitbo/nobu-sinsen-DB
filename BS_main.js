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
    bf.run_battle(8);

    // 3. 画面にログを出力
    const container = document.getElementById('log-container');
    container.innerText = bf.get_full_log();
    
    // 一番下まで自動スクロール
    container.scrollTop = container.scrollHeight;
});