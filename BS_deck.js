// deck.js
import { DB } from './BS_csv_loader.js';
import { Busho } from './BS_Busho.js'; 
import { Senpo } from './BS_Senpo.js';

/**
 * 指定されたチーム番号のデータをLocalStorageから読み込み、DBデータと結合して返す
 * @param {number} teamNo - チーム番号 (1-12)
 * @returns {Object|null} 部隊データ
 */
/**
 * 武将のLv・成長値・凸数から最終ステータスを計算する
 */
function calculateFinalStat(base, growth, lv, rank) {
    // Python版ロジック: round(base + growth * (Lv - 1), 2)
    // ここにランク（凸）による加算が必要なら + (rank * 10) など調整
    let total = parseFloat(base) + (parseFloat(growth) * (lv - 1));
    
    // ランク補正（もし1凸ごとに属性+10なら）
    // total += (rank * 10); 
    
    return Math.round(total * 100) / 100;
}
export function getTeamFromStorage(teamNo,side) {
    const storageKey = `teamData_${teamNo}`;
    let rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
        console.warn(`チーム番号 ${teamNo} のデータがLocalStorageにありません。`);
        return null;
        //console.warn("LocalStorageが空のため、テスト用データを使用します");
        //const dummy = {
        //    unit: "騎兵",
        //    maxcost:"",
        //    name:"",
        //    team: [
        //        { busho: "B914", senpo2: "S745", senpo3: "", heigakuType: "", heigakuKi: "", heigakuSei1: "", heigakuSei2: "" },
        //        { busho: "B916", senpo2: "S731", senpo3: "", heigakuType: "", heigakuKi: "", heigakuSei1: "", heigakuSei2: "" },
        //        { busho: "B918", senpo2: "S738", senpo3: "", heigakuType: "", heigakuKi: "", heigakuSei1: "", heigakuSei2: "" }
        //    ]
        //};
        //rawData = JSON.stringify(dummy);
        // localStorage.setItem(storageKey, rawData); // 必要なら保存してもOK
    }

    const data = JSON.parse(rawData);
    if (!data.team || data.team.length === 0) return null;

    const unitType = data.unit || "騎兵"; // 兵種
    const bushoList= data.team.map((t, index) => {
        if (!t.busho) return null;

        // DBからマスタデータを取得
        const master = DB.busho.find(b => b.id == t.busho);
        if (!master) {
            console.warn(`武将名「${t.busho}」がDBに見つかりません。`);
            return null;
        }
        const Lv = 50; // 固定値、またはdataから取得
        const rank = t.rank || 0; // LocalStorageにあれば取得

        // Python版の「属性csv」と「属性」の紐付けを再現
        // csv上は pow_base / pow_growth のようになっている前提
        const finalStats = {
            pow: calculateFinalStat(master.pow_base, master.pow_growth, Lv, rank),
            intl: calculateFinalStat(master.int_base, master.int_growth, Lv, rank),
            ldr: calculateFinalStat(master.ldr_base, master.ldr_growth, Lv, rank),
            spd: calculateFinalStat(master.spd_base, master.spd_growth, Lv, rank),
            adm: calculateFinalStat(master.adm_base, master.adm_growth, Lv, rank),
            cha: calculateFinalStat(master.cha_base, master.cha_growth, Lv, rank)
        };
        
        // 戦法マスタからインスタンスを生成
        const skillObjects = ["S000",master.unique_senpo, t.senpo2, t.senpo3].map(sid => {
            const sData = DB.senpo.find(s => s.id === sid);
            if (!sData) return null;
            // Senpoクラスのコンストラクタに合わせてインスタンス化
            return new Senpo(
                sData.id, 
                sData.name, 
                sData.type, 
                sData.rate, 
                sData.effects_json, // JSONパース済みの想定
                sData.prep_turns || sData.prepTurns || 0
            );
        }).filter(s => s);

        // Bushoクラスのインスタンスを生成して返す
        const main = index == 0 ? true : false;
        const bushoInstance =  new Busho({
            ...master,
            ...finalStats,  //計算済みの属性値
            team: side, // ここで "A" か "E" を指定
            unit_type: unitType,
            is_main: main,
            skills: skillObjects,
            // 他、LvやrankなどもLocalStorageからあれば渡す
            Lv: 50,
            hp: 10000,
            max_hp: 10000
        });
        return bushoInstance;
    }).filter(m => m !== null) // 武将が設定されていない枠を除外

    return bushoList;
}