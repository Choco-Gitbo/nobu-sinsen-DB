export const COLOR_RESET = "\u001b[0m";
export const COLOR_ALLY = "\u001b[94m";   // 青
export const COLOR_ENEMY = "\u001b[91m";  // 赤
export const COLOR_SKILL = "\u001b[93m";  // 黄
export const COLOR_HEAL = "\u001b[92m";   // 緑

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
        conflict_rule: "NONE"
    },
    "回避": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        conflict_rule: "STACK"
    },
    "鉄壁": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        conflict_rule: "NONE"
    },
    "乱舞": {
        type: "buff_status",
        phase: "range_attack",
        trigger_side: "attacker",
        conflict_rule: "STACK"
    },
    "反撃": {
        type: "buff_status",
        phase: "counter_attack",
        trigger_side: "defender",
        conflict_rule: "STACK"
    },
    "援護": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        conflict_rule: "NONE"
    },
    "肩代り": {
        type: "buff_status",
        phase: "before_attack",
        trigger_side: "defender",
        conflict_rule: "NONE"
    },
    "混乱耐性": {
        type: "buff_status",
        conflict_rule: "NONE"
    },
    "洞察": {
        type: "buff_status",
        phase: "after_attack",
        trigger_side: "defender",
        conflict_rule: "NONE"
    },
    "先攻": {
        type: "buff_status",
        phase: "before_turn",
        trigger_side: "attacker",
        conflict_rule: "NONE"
    },
    "必中": {
        type: "buff_status",
        conflict_rule: "NONE"
    },
    "破陣": {
        type: "buff_status",
        conflict_rule: "NONE"
    },
    "離反": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: "dmg",
        conflict_rule: "STACK"
    },
    "心攻": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: "dmg",
        conflict_rule: "STACK"
    },
    "威圧": {
        type: "status_effect",
        phase: "before_action",
        trigger_side: "attacker",
        rate: 100,
        stat: null,
        conflict_rule: "NONE"
    },
    "無策": {
        type: "status_effect",
        conflict_rule: "NONE"
    },
    "封撃": {
        type: "status_effect",
        conflict_rule: "NONE"
    },
    "混乱": {
        type: "status_effect",
        conflict_rule: "NONE"
    },
    "疲弊": {
        type: "status_effect",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: null,
        conflict_rule: "NONE"
    },
    "麻痺": {
        type: "status_effect",
        phase: "before_action",
        trigger_side: "attacker",
        rate: 30,
        stat: null,
        conflict_rule: "NONE"
    },
    "回復不可": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "defender",
        stat: null,
        conflict_rule: "NONE"
    },
    "浄化不可": {
        type: "status_effect",
        phase: "before_attack",
        trigger_side: "defender",
        stat: null,
        conflict_rule: "NONE"
    },
    "挑発": {
        type: "status_effect",
        conflict_rule: "NONE"
    },
    "牽制": {
        type: "status_effect",
        conflict_rule: "NONE"
    },
    "火傷": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "水攻め": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "中毒": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "潰走": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "pow",
        conflict_rule: "EXTEND"
    },
    "消沈": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "乱兵": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "撹乱": {
        type: "continuous_damage",
        phase: "after_attack",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "恐慌": {
        type: "continuous_damage",
        phase: "before_action",
        trigger_side: "attacker",
        stat: "intl",
        conflict_rule: "EXTEND"
    },
    "休養": {
        type: "heal",
        phase: "before_action",
        trigger_side: "attacker",
        conflict_rule: "EXTEND"
    },
    "回生": {
        type: "heal",
        phase: "after_attack",
        trigger_side: "defender",
        conflict_rule: "EXTEND"
    },
    "全力戦闘_連撃(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        trigger_turn: 5,
        rate: 70,
        source_skill: "全力戦闘",
        conflict_rule: "NONE"
    },
    "捨て身の義(予備)": {
        type: "special",
        phase: "after_attack",
        trigger_side: "defender",
        value: 100,
        source_skill: "捨て身の義",
        conflict_rule: "NONE"
    },
    "懐柔_休養(予備)": {
        type: "special",
        phase: "before_action",
        trigger_side: "attacker",
        trigger_turn: 2,
        source_skill: "懐柔",
        conflict_rule: "NONE"
    }
};
