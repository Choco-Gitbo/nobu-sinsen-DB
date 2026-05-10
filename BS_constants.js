export const COLOR_RESET = "\u001b[0m";
export const COLOR_ALLY = "\u001b[94m";   // 青
export const COLOR_ENEMY = "\u001b[91m";  // 赤
export const COLOR_SKILL = "\u001b[93m";  // 黄
export const COLOR_HEAL = "\u001b[92m";   // 緑

export const HEISHU_AFFINITY = {
    "騎兵": { "弓兵": 1.2 },
    "弓兵": { "鉄砲": 1.2 },
    "足軽": { "騎兵": 1.2 },
    "鉄砲": { "足軽": 1.2 },
    // どの兵種が相手でも1.2倍になる「兵器」への攻撃など
    "any": { "兵器": 1.2 } 
};

// ステータスキーと表示名の対応表
export const STAT_MAP = {
    "pow": "武勇", "intl": "知略", "ldr": "統率", "spd": "速度", "adm": "政務", "cha": "魅力",
    "rate_active": "能動発動率", "rate_unique_active": "固有能動発動率",
    "rate_assault": "突撃発動率", "rate_unique_assault": "固有突撃発動率",
    "duration": "継続時間",
    "dmg_up_weapon": "与兵刃", "dmg_cut_weapon": "被兵刃",
    "dmg_up_intel": "与計略", "dmg_cut_intel": "被計略",
    "dmg_up_normal": "与通攻", "dmg_cut_normal": "被通攻",
    "dmg_up_active": "与能動", "dmg_cut_active": "被能動",
    "dmg_up_assault": "与突撃", "dmg_cut_assault": "被突撃",
    "heal": "与回復", "receive_heal": "被回復",
    "critical_rate_weapon": "会心率", "critical_rate_intel": "奇策率",
    "critical_dmg_weapon": "会心ダメ", "critical_dmg_intel": "奇策ダメ"
};

// 強化状態定義
export const GOOD_STATUS = new Set(["buff_status", "heal", "buff_stat", "buff"]);
// 弱体状態定義
export const BAD_STATUS = new Set(["status_effect", "continuous_damage", "debuff_stat", "debuff"]);
// 継続状態
export const CONT_STATUS = new Set(["火傷", "水攻め", "中毒", "潰走", "消沈", "乱兵", "撹乱", "恐慌", "休養", "回生"]);
// 継続ダメージ状態
export const CONT_DMG_STATUS = new Set(["火傷", "水攻め", "中毒", "潰走", "消沈", "乱兵", "撹乱", "恐慌"]);
// 継続回復状態
export const CONT_HEAL_STATUS = new Set(["休養", "回生"]);

// 状態異常のひな形定義（マスター）
export const STATE_TEMPLATES = {
    "連撃": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:"通常",
        clear:true
    },
    "回避": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "STACK",
        action:null,
        clear:true
    },
    "鉄壁": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "乱舞": {
        type: "buff_status",
        phase: "range_attack",
        trigger_side: "attacker",
        attackType:null,
        conflict_rule: "STACK",
        action:null,
        clear:true
    },
    "反撃": {
        type: "buff_status",
        phase: "counter_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "STACK",
        action:null,
        clear:true
    },
    "援護": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "NONE",
        action:"通常",
        clear:true
    },
    "肩代り": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "封撃耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "無策耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "威圧耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "疲弊耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "混乱耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "乱舞耐性": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "洞察": {
        type: "buff_status",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "先攻": {
        type: "buff_status",
        phase: "before_turn",
        trigger_side: "attacker",
        attackType:null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "必中": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "破陣": {
        type: "buff_status",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "離反": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: "dmg",
        conflict_rule: "STACK",
        attackType:null,
        action:null,
        clear:true
    },
    "心攻": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: "dmg",
        conflict_rule: "STACK",
        attackType:null,
        action:null,
        clear:true
    },
    "威圧": {
        type: "status_effect",
        phase: "before_action",
        trigger_side: "attacker",
        rate: 100,
        stat: null,
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "無策": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:"能動",
        clear:true
    },
    "封撃": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:"通常",
        clear:true
    },
    "混乱": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "疲弊": {
        type: "status_effect",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: null,
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "麻痺": {
        type: "status_effect",
        phase: "before_action",
        trigger_side: "attacker",
        rate: 30,
        stat: null,
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "回復不可": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        stat: null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "浄化不可": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "defender",
        attackType:null,
        stat: null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "再発動不可": {
        type: "refire",
        phase: "before_attack",
        trigger_side: "attacker",
        attackType:null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "通常攻撃不可": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "attacker",
        attackType:null,
        stat: null,
        conflict_rule: "NONE",
        action:"通常",
        clear:true
    },
    "通攻計略化": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "attacker",
        attackType:null,
        stat: null,
        conflict_rule: "NONE",
        action:null,
        clear:true
    },
    "挑発": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:"通常",
        clear:true
    },
    "牽制": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "狙撃": {
        type: "status_effect",
        conflict_rule: "NONE",
        attackType:null,
        action:null,
        clear:true
    },
    "火傷": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "水攻め": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "中毒": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "潰走": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "pow",
        conflict_rule: "EXTEND",
        clear:true
    },
    "消沈": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "乱兵": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "撹乱": {
        type: "continuous_damage",
        phase: "after_skill_exe",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "恐慌": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        stat: "intl",
        conflict_rule: "EXTEND",
        clear:true
    },
    "休養": {
        type: "heal",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "EXTEND",
        clear:true
    },
    "回生": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:null,
        conflict_rule: "EXTEND",
        clear:true
    },

    "全力戦闘_連撃(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        trigger_turn: 5,
        rate: 70,
        conflict_rule: "NONE",
        clear:true
    },
    "捨て身の義(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:null,
        value: 100,
        conflict_rule: "NONE",
        clear:true
    },
    "懐柔_休養(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        trigger_turn: 2,
        conflict_rule: "NONE",
        clear:true
    },
    "一念乱志(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        trigger_turn: 3,
        conflict_rule: "NONE",
        clear:true
    },
    "後方支援(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "鬼美濃(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "三楽犬(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "沈魚落雁(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "新生(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "千成瓢箪(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "古今独歩(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "破陣乱舞(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "三河魂-強化(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "三河魂(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "風林火山-風": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "風林火山-林": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "風林火山-火": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "風林火山-山": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "軍神(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        action:["通常","能動","突撃"],
        attackType:null,
        conflict_rule: "NONE",
        clear:true
    },
    "軍神-龍(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "軍神-昆(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "湖水渡り(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "帰蝶の舞(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "槍の又左-鉄壁(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "槍の又左-強化(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "槍の又左(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "七本槍筆頭(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "七本槍筆頭-強化(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "破竹の勢い(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "剛の武者(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:"intel",
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "先手必勝(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "尼御台_離反(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "尼御台_心攻(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "怪力無双(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "越後流軍学(予備)": {
        type: "special",
        phase: "after_skill_exe",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "仏の高力(予備)": {
        type: "special",
        phase: "after_skill_exe",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "百万一心(予備)": {
        type: "special",
        phase: "before_skill_exe",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "百万一心-謀(予備)": {
        type: "special",
        phase: "after_skill_exe",
        trigger_side: "attacker",
        attackType:null,
        action:"能動",
        conflict_rule: "NONE",
        clear:true
    },
    "洞察反撃(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "不屈の精神(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "耐苦鍛錬(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "武田之赤備(予備)": {
        type: "special",
        phase: "after_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "武田之赤備-威勢(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "諸行無常(予備)": {
        type: "special",
        phase: "before_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "諸行無常-脱(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "死中求活(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "死中求活-絶境(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:"weapon",
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "戦意消沈(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "七十二の計(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "赤備え隊(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "大太刀力士隊(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"兵種",
        conflict_rule: "NONE",
        clear:true
    },
    "薩摩鉄砲兵(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:null,
        action:"通常",
        conflict_rule: "NONE",
        clear:true
    },
    "文武両道-文(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:"intel",
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "文武両道-武(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "attacker",
        attackType:"weapon",
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "城盗り(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        attackType:"intel",
        action:null,
        conflict_rule: "NONE",
        clear:true
    }

};

// 特性のひな形定義（マスター）
export const TOKUSEI_TEMPLATES = {
    "威勢(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "奮戦(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "攻陣(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    },
    "猛闘(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        attackType:null,
        action:null,
        conflict_rule: "NONE",
        clear:true
    }
}

