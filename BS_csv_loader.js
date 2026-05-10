// csv_loader.js

export const DB = {
    busho: [],
    senpo: [],
};

async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    return parseCSV(text);
}

function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const lines = text.trim().split(/\r?\n/);
    const headers = splitCSVLine(lines.shift());

    return lines.map(line => {
        const values = splitCSVLine(line);
        const obj = {};
        
        headers.forEach((h, i) => {
            let val = values[i] ?? "";
            // 前後の引用符を削除し、"" を " に戻す
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            obj[h] = processValue(val);
        });
        return obj;
    });
}

/**
 * CSVの1行を正確に分割する関数（引用符内のカンマを無視）
 */
function splitCSVLine(line) {
    const result = [];
    let curVal = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            // エスケープされたダブルクォート ("") の処理
            if (inQuotes && nextChar === '"') {
                curVal += '"';
                i++; // 1文字飛ばす
            } else {
                // 引用符の開始/終了を切り替え
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 引用符の外にあるカンマなら分割
            result.push(curVal);
            curVal = "";
        } else {
            curVal += char;
        }
    }
    result.push(curVal); // 最後の項目を追加
    return result;
}

/**
 * 型変換（数値やJSONを自動判別）
 */
function processValue(val) {
    val = val.trim();
    if (val === "") return "";
    
    // 数値判定（カンマ区切りの数値は除外するため、単純な数値のみ）
    if (!isNaN(val) && !isNaN(parseFloat(val))) return Number(val);
    
    // JSON(配列またはオブジェクト)のパース試行
    if (val.startsWith("[") || val.startsWith("{")) {
        try {
            return JSON.parse(val);
        } catch (e) {
            // パース失敗時はそのまま文字列
            return val;
        }
    }
    return val;
}

export async function initDB() {
    DB.busho = await loadCSV("data/busho.csv");
    DB.senpo = await loadCSV("data/senpo.csv");
    console.log("Database initialized:", DB);
}