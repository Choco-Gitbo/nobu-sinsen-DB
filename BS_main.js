// main.js
import { Battlefield } from './BS_BattleField.js';
import { Busho } from './BS_Busho.js'; // 武将クラス
import { initDB } from './BS_csv_loader.js';
import { getTeamFromStorage } from './BS_deck.js';

async function startSimulation() {
    // 1. まずCSVデータを全て読み込む
    await initDB();

    // 2. 使用する編成番号を指定（将来的にHTMLのselect等から取得）
    const allyTeamNo = 1;  // 味方：チーム1
    const enemyTeamNo = 2; // 敵：チーム2

    // 3. データを展開
    const army_a = getTeamFromStorage(allyTeamNo,"A");
    const army_b = getTeamFromStorage(enemyTeamNo,"E");

    if (!army_a || !army_b) {
        console.error("部隊データの読み込みに失敗しました。編成を確認してください。");
        return;
    }   

    console.log("--- シミュレーション準備完了 ---");
    console.log("味方部隊:", army_a);
    console.log("敵部隊:", army_b);

    // 3. BattleField の初期化
    const bf = new Battlefield(army_a, army_b);

    // 4. 戦闘実行
    bf.run_battle(8);

    // 5. ログの出力 (HTMLへの反映)
    renderLogs(bf.get_full_log());
}

//startSimulation();

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
    const idA = document.getElementById('select-team-a').value;
    const idB = document.getElementById('select-team-b').value;

    // 1. 指定したIDの部隊をLocalStorage/DBから取得
    // ※ getTeamFromStorage(id) のような形に改修が必要かもしれません
    const teamA = await getTeamFromStorage(idA);
    const teamB = await getTeamFromStorage(idB);

    // 2. 戦闘実行
    const bf = new BattleField(teamA, teamB);
    bf.run_battle(8);

    // 3. 画面にログを出力
    const container = document.getElementById('log-container');
    container.innerText = bf.get_full_log();
    
    // 一番下まで自動スクロール
    container.scrollTop = container.scrollHeight;
});