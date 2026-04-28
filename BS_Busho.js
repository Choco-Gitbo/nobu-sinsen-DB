import { STAT_MAP, GOOD_STATUS, BAD_STATUS, CONT_STATUS, CONT_DMG_STATUS, CONT_HEAL_STATUS, STATE_TEMPLATES } from './BS_constants.js';

export class Busho {
    constructor({
        // 基本情報
        name,
        Lv,
        rank,           // 凸
        faction,        // 陣営
        clan,           // 家門
        unit_type,
        unit_type_Lv,
        team,           // 味方:A,敵:E
        is_main = false, //true:大将,false:副将

        // 能力値
        pow,            // 武力
        intl,           // 知力
        ldr,            // 統率
        spd,            // 速度
        adm,            // 政治
        cha,            // 魅力
        
        // 戦法・装備
        skills = [],
        
        // 戦闘中に変動する値
        max_hp = 0,
        hp = 0,
        wounded = 0,    // 負傷兵
        total_over_heal = 0,  // 超過回復量
        morale = 100,   // 士気
        states = [],
        last_normal_attack_damage = 0,
        last_target = null
    }) {
        // 基本情報
        this.name = name;
        this.Lv = Lv;
        this.rank = rank || 0;
        this.faction = faction;
        this.clan = clan;
        this.unit_type = unit_type;
        this.unit_type_Lv = unit_type_Lv || 0;
        this.team = team;
        this.is_main = is_main;
        
        // 能力値
        this.pow = pow;
        this.intl = intl;
        this.ldr = ldr;
        this.spd = spd;
        this.adm = adm;
        this.cha = cha;
        
        // 戦法・装備
        this.skills = skills;
        
        // 戦闘中に変動する値
        this.max_hp = max_hp;
        this.hp = hp;
        this.wounded = wounded;
        this.total_over_heal = total_over_heal;
        this.morale = morale;
        this.states = states;
        this.last_normal_attack_damage = last_normal_attack_damage;
        this.last_target = last_target;
        
        // 戦績カウント用
        this.stats_log = {
            damage_dealt: 0,
            damage_taken: 0,
            healing: 0,
            skill_details: {}  // 戦法毎の統計
        };
    }

    get colored_name() {
        const colorClass = this.team === 'A' ? 'team-a' : 'team-b';
        return `<span class="${colorClass}">[${this.team}]${this.name}</span>`;
    }

    #sumStateValues(statName, type) {
        const positive = this.states
            .filter(s => s.type === type && s.stat === statName)
            .reduce((sum, s) => sum + (s.value || 0), 0);
        return Math.max(0, Math.round(positive * 100) / 100);
    }

    get current_pow() {
        let total = this.pow;
        total += this.#sumStateValues('pow', 'buff_stat');
        total -= this.#sumStateValues('pow', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_intl() {
        let total = this.intl;
        total += this.#sumStateValues('intl', 'buff_stat');
        total -= this.#sumStateValues('intl', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_ldr() {
        let total = this.ldr;
        total += this.#sumStateValues('ldr', 'buff_stat');
        total -= this.#sumStateValues('ldr', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_spd() {
        let total = this.spd;
        total += this.#sumStateValues('spd', 'buff_stat');
        total -= this.#sumStateValues('spd', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_adm() {
        let total = this.adm;
        total += this.#sumStateValues('adm', 'buff_stat');
        total -= this.#sumStateValues('adm', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_cha() {
        let total = this.cha;
        total += this.#sumStateValues('cha', 'buff_stat');
        total -= this.#sumStateValues('cha', 'debuff_stat');
        return Math.max(0, Math.round(total * 100) / 100);
    }

    get current_rate_active() {
        let total = 0;
        total += this.#sumStateValues('rate_active', 'buff_stat');
        total -= this.#sumStateValues('rate_active', 'debuff_stat');
        return total;
    }

    get current_rate_assault() {
        let total = 0;
        total += this.#sumStateValues('rate_assault', 'buff_stat');
        total -= this.#sumStateValues('rate_assault', 'debuff_stat');
        return total;
    }

    get current_rate_unique_active() {
        let total = 0;
        total += this.#sumStateValues('rate_unique_active', 'buff_stat');
        total -= this.#sumStateValues('rate_unique_active', 'debuff_stat');
        return total;
    }

    get current_rate_unique_assault() {
        let total = 0;
        total += this.#sumStateValues('rate_unique_assault', 'buff_stat');
        total -= this.#sumStateValues('rate_unique_assault', 'debuff_stat');
        return total;
    }

    get current_dmg_up_weapon() {
        let total = 0;
        total += this.#sumStateValues('dmg_up_weapon', 'buff_stat');
        total -= this.#sumStateValues('dmg_up_weapon', 'debuff_stat');
        return total;
    }

    get current_dmg_cut_weapon() {
        let total = 0;
        total += this.#sumStateValues('dmg_cut_weapon', 'debuff_stat');
        total -= this.#sumStateValues('dmg_cut_weapon', 'buff_stat');
        return total;
    }

    get current_dmg_up_intel() {
        let total = 0;
        total += this.#sumStateValues('dmg_up_intel', 'buff_stat');
        total -= this.#sumStateValues('dmg_up_intel', 'debuff_stat');
        return total;
    }

    get current_dmg_cut_intel() {
        let total = 0;
        total += this.#sumStateValues('dmg_cut_intel', 'debuff_stat');
        total -= this.#sumStateValues('dmg_cut_intel', 'buff_stat');
        return total;
    }

    get current_dmg_up_normal() {
        let total = 0;
        total += this.#sumStateValues('dmg_up_normal', 'buff_stat');
        total -= this.#sumStateValues('dmg_up_normal', 'debuff_stat');
        return total;
    }

    get current_dmg_cut_normal() {
        let total = 0;
        total += this.#sumStateValues('dmg_cut_normal', 'debuff_stat');
        total -= this.#sumStateValues('dmg_cut_normal', 'buff_stat');
        return total;
    }

    get current_dmg_up_active() {
        let total = 0;
        total += this.#sumStateValues('dmg_up_active', 'buff_stat');
        total -= this.#sumStateValues('dmg_up_active', 'debuff_stat');
        return total;
    }

    get current_dmg_cut_active() {
        let total = 0;
        total += this.#sumStateValues('dmg_cut_active', 'debuff_stat');
        total -= this.#sumStateValues('dmg_cut_active', 'buff_stat');
        return total;
    }

    get current_dmg_up_assault() {
        let total = 0;
        total += this.#sumStateValues('dmg_up_assault', 'buff_stat');
        total -= this.#sumStateValues('dmg_up_assault', 'debuff_stat');
        return total;
    }

    get current_dmg_cut_assault() {
        let total = 0;
        total += this.#sumStateValues('dmg_cut_assault', 'debuff_stat');
        total -= this.#sumStateValues('dmg_cut_assault', 'buff_stat');
        return total;
    }

    get current_critical_rate_weapon() {
        let total = 0;
        total += this.#sumStateValues('critical_rate_weapon', 'buff_stat');
        total -= this.#sumStateValues('critical_rate_weapon', 'debuff_stat');
        return total;
    }

    get current_critical_rate_intel() {
        let total = 0;
        total += this.#sumStateValues('critical_rate_intel', 'buff_stat');
        total -= this.#sumStateValues('critical_rate_intel', 'debuff_stat');
        return total;
    }

    get current_critical_dmg_weapon() {
        let total = 0;
        total += this.#sumStateValues('critical_dmg_weapon', 'buff_stat');
        total -= this.#sumStateValues('critical_dmg_weapon', 'debuff_stat');
        return total;
    }

    get current_critical_dmg_intel() {
        let total = 0;
        total += this.#sumStateValues('critical_dmg_intel', 'buff_stat');
        total -= this.#sumStateValues('critical_dmg_intel', 'debuff_stat');
        return total;
    }

    add_state(newState, battleField) {
        // 1. 洞察状態のチェック
        const hasInsight = this.states.some(s => s.name === "洞察");
        const isBadStatus = BAD_STATUS.has(newState.type);

        if (hasInsight && isBadStatus) {
            battleField.add_log(`  !! ${this.colored_name} は【洞察】により効果を無効化した`);
            return false;
        }

        // 2. 耐性のチェック
        const resistanceName = `${newState.name}耐性`;
        const hasResistance = this.states.some(s => s.name === resistanceName);

        if (hasResistance) {
            battleField.add_log(`  !! ${this.colored_name} は【${resistanceName}】により${newState.name}を無効化した`);
            return false;
        }

        // 3. 無策チェック（準備状態の即時破棄）
        if (newState.name === "無策") {
            // 現在のstatesから preparation のものだけを抽出
            const prepStates = this.states.filter(s => s.type === "preparation");
            
            prepStates.forEach(s => {
                battleField.add_log(`  !! ${this.colored_name} は【無策】により【${s.source_skill}】の準備を失効`);
            });

            // preparation 以外のステータスだけを残す（＝準備をすべて削除）
            this.states = this.states.filter(s => s.type !== "preparation");
        }

        // 重複ルール：NONE(無効), OVERWRITE(上書き), EXTEND(期間), STACK(共存)
        const rule = newState.conflict_rule || "NONE";
        // 同一ソース・同一名の状態を探す
        const existingList = this.states.filter(s => 
            s.name === newState.name && s.source_skill === newState.source_skill
        );

        const hasExisting = existingList.length > 0;
        let shouldAdd = false;

        if (!hasExisting) {
            // 既存がなければ無条件で追加
            shouldAdd = true;
        } else {
            // 既存がある場合のルール判定
            const firstExisting = existingList[0];

            if (rule === "STACK") {
                const stackMax = parseInt(newState.stack_max || 1);
                shouldAdd = existingList.length < stackMax;
            } else if (rule === "OVERWRITE") {
                // 古いものを消して新しいのを追加
                this.states = this.states.filter(s => !existingList.includes(s));
                shouldAdd = true;
            } else if (rule === "EXTEND") {
                // 期間延長のみ（追加はしない）
                firstExisting.duration = Math.max(firstExisting.duration, newState.duration);
                return true;
            }
        }

        if (shouldAdd) {
            this.states.push(newState);
            return true;
        } else {
            battleField.add_log(`  !! ${this.colored_name} に 【${newState.name}】は付与済み`);
            return false;
        }
    }
    

    get_total_dmg_up(dmgType, skillType) {
        /**
         * dmgType: 'weapon' (兵刃), 'intel' (計略)
         * skillType: '能動' (能動), '突撃' (突撃), '通常' (通常)
         */
        let total = 0;

        // 属性（兵刃 or 計略）を足す
        if (dmgType === 'weapon') {
            total += this.current_dmg_up_weapon;
        } else if (dmgType === 'intel') {
            total += this.current_dmg_up_intel;
        }

        // 種類（能動 or 突撃 or 通常）を足す
        if (skillType === '能動') {
            total += this.current_dmg_up_active;
        } else if (skillType === '突撃') {
            total += this.current_dmg_up_assault;
        } else if (skillType === '通常') {
            total += this.current_dmg_up_normal;
        }

        return total;
    }

    get_total_dmg_cut(dmgType, skillType) {
        /**
         * dmgType: 'weapon' (兵刃), 'intel' (計略)
         * skillType: '能動' (能動), '突撃' (突撃), '通常' (通常)
         */
        let total = 0;

        // 属性（兵刃 or 計略）を足す
        if (dmgType === 'weapon') {
            total += this.current_dmg_cut_weapon;
        } else if (dmgType === 'intel') {
            total += this.current_dmg_cut_intel;
        }

        // 種類（能動 or 突撃 or 通常）を足す
        if (skillType === '能動') {
            total += this.current_dmg_cut_active;
        } else if (skillType === '突撃') {
            total += this.current_dmg_cut_assault;
        } else if (skillType === '通常') {
            total += this.current_dmg_cut_normal;
        }

        return total;
    }

    get_total_sp_dmg_up(dmgType, skillType) {
        /**
         * dmgType: 'weapon' (兵刃), 'intel' (計略)
         * skillType: '能動' (能動), '突撃' (突撃), '通常' (通常)
         */
        let total = 0;

        // 属性（兵刃 or 計略）を足す
        if (dmgType === 'weapon') {
            total += this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_up_weapon')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_up_weapon')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (dmgType === 'intel') {
            total += this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_up_intel')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_up_intel')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        }

        // 種類（能動 or 突撃 or 通常）を足す
        if (skillType === '能動') {
            total += this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_up_active')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_up_active')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (skillType === '突撃') {
            total += this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_up_assault')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_up_assault')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (skillType === '通常') {
            total += this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_up_normal')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_up_normal')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        }

        return total;
    }

    get_total_sp_dmg_cut(dmgType, skillType) {
        /**
         * dmgType: 'weapon' (兵刃), 'intel' (計略)
         * skillType: '能動' (能動), '突撃' (突撃), '通常' (通常)
         */
        let total = 0;

        // 属性（兵刃 or 計略）を足す
        if (dmgType === 'weapon') {
            total += this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_cut_weapon')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_cut_weapon')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (dmgType === 'intel') {
            total += this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_cut_intel')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_cut_intel')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        }

        // 種類（能動 or 突撃 or 通常）を足す
        if (skillType === '能動') {
            total += this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_cut_active')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_cut_active')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (skillType === '突撃') {
            total += this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_cut_assault')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_cut_assault')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        } else if (skillType === '通常') {
            total += this.states
                .filter(s => s.type === 'debuff_stat' && s.stat === 'SPdmg_cut_normal')
                .reduce((sum, s) => sum + (s.value || 0), 0);
            total -= this.states
                .filter(s => s.type === 'buff_stat' && s.stat === 'SPdmg_cut_normal')
                .reduce((sum, s) => sum + (s.value || 0), 0);
        }

        return total;
    }

    get_total_heal_modifier(caster, target) {
        let mod = 0.0;

        // 与回復バフ（発動者側）
        mod += caster.states
            .filter(s => s.type === 'buff_stat' && s.stat === 'heal')
            .reduce((sum, s) => sum + (s.value || 0), 0);
        mod -= caster.states
            .filter(s => s.type === 'debuff_stat' && s.stat === 'heal')
            .reduce((sum, s) => sum + (s.value || 0), 0);

        // 被回復バフ（対象者側）
        mod += target.states
            .filter(s => s.type === 'buff_stat' && s.stat === 'receive_heal')
            .reduce((sum, s) => sum + (s.value || 0), 0);
        mod -= target.states
            .filter(s => s.type === 'debuff_stat' && s.stat === 'receive_heal')
            .reduce((sum, s) => sum + (s.value || 0), 0);

        return mod;
    }

    record_skill_stats(skillName, damage, isHeal = false) {
        if (!(skillName in this.stats_log.skill_details)) {
            this.stats_log.skill_details[skillName] = {
                dmg: 0,
                heal: 0,
                count: 0
            };
        }

        if (isHeal) {
            this.stats_log.skill_details[skillName].heal += damage;
        } else {
            this.stats_log.skill_details[skillName].dmg += damage;
        }
        this.stats_log.skill_details[skillName].count += 1;
    }
}
