import { STAT_MAP, GOOD_STATUS, BAD_STATUS, CONT_STATUS, CONT_DMG_STATUS, CONT_HEAL_STATUS, STATE_TEMPLATES, TOKUSEI_TEMPLATES } from './BS_constants.js';

export class Tokusei {
    constructor(id, name, effectsJson) {
        this.id = id;
        this.name = name;
        this.effects_json = effectsJson || [];
               
    }
    get colored_name() {
        const colorClass = 'tokusei-name';
        return `<span class="${colorClass}">${this.name}</span>`;
    }

    execute(caster, battlefield) {
        /**
         * 戦法発動のメイン処理
         */
        battlefield.add_log(`--- ${caster.colored_name} の戦法 【${this.colored_name}】 発動！ ---`);
        const contextTargets = { last_target: null };

        for (const effect of this.effects_json) {
            // 2. ターゲットの特定
            const targetKey = effect.target;

            // 保存されたターゲット（target_Aなど）を使うか、新しく戦場から取得するか
            let targets;
            if (targetKey in contextTargets && contextTargets[targetKey] !== null) {
                targets = contextTargets[targetKey];
            } else {
                targets = battlefield.find_targets(caster, targetKey, this.type);
            }

            // 3. ターゲットの保存（save_asがある場合���
            if (effect.save_as) {
                contextTargets[effect.save_as] = targets;
            }

            // 直前のターゲットとして更新
            contextTargets.last_target = targets;

            // 4. 効果の適用（ターゲット全員に対してループ）
            for (const target of targets) {
                if (effect.condition) {
                    // 配列に変換して一括処理
                    const conditions = Array.isArray(effect.condition) ? effect.condition : [effect.condition];
                    
                    // すべての条件を満たすかチェック (AND判定)
                    const allPassed = conditions.every(cond => 
                        this.#checkCondition(caster, target, cond, battlefield)
                    );

                    if (!allPassed) continue; 
                }
                this.#applyEffectLogic(caster, target, effect, battlefield);
            }
        }
    }

    #checkCondition(caster, target, conditionName, battlefield) {
        const enemies = battlefield.get_enemies(caster);
        /**条件分岐の判定ロジック*/

        return true;
    }

    #applyEffectLogic(caster, target, effect, battleField) {
        /**個別の効果（ダメージ、バフ、解除など）を実行する*/
        const eName = effect.effect; // 状態名（威圧、休養など）
        const eType = effect.type; // buff_stat, status など

        if (!effect || !eType) {
            battleField.add_log(`  ( ! ) ${this.name} の効果の一部は未実装です`);
            return;
        }

        let eVal = effect.value || 0;
        if (effect.value !== undefined && typeof effect.value === 'string') {
            const numCheck = /\d/.test(effect.value);
            if (numCheck) {
                eVal = parseFloat(effect.value);
            }
        }

        const eDuration = effect.duration ? parseInt(effect.duration) : 0;

        if (eType === "dmg_weapon") {
            // 兵刃ダメージ
            battleField.process_attack_event(caster, target, eVal, "weapon", this);
        } else if (eType === "dmg_intel") {
            // 計略ダメージ
            battleField.process_attack_event(caster, target, eVal, "intel", this);
        } else if (eType === "heal") {
            // 回復
            battleField.process_heal_event(caster, target, eVal, "intl", this.name);
        } else if (eType === "buff_stat" || eType === "debuff_stat") {
            this.add_buff(caster, target, effect, battleField);
            caster.record_skill_stats(this.name, 0, false);
        } else if (eType === "status") {
            const eEffect = effect.effect;
            const isCont = CONT_STATUS.has(eEffect);
            
            // 上書きに使わない無視するキー
            const ignoreKeys = ["type", "effect", "target"];
            const ov = Object.fromEntries(
                Object.entries(effect).filter(([k]) => !ignoreKeys.includes(k))
            );

            if (isCont) {
                // 継続状態ならダメージ量(回復量)を計算する
                if (eEffect === "休養" || eEffect === "回生") {
                    const stat = effect.stat || null;
                    const stVal = battleField.calculate_heal(caster, target, effect.value, stat, this);
                    ov.value = stVal;
                } else {
                    let dmgtype;
                    const stVal = battleField.calculate_damage(caster, target, effect.value, dmgtype = effect.stat==="pow" ? "weapon":"intel", this);
                    ov.value = stVal;
                }
            }

            ov.source_tokusei = this;
            ov.source_busho = caster;
            const isSuccess = battleField.add_tokusei_state_by_name(target, eEffect, ov);
            
            if (isSuccess) {
                const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${eEffect} を付与 (${effect.duration}ターン)`;
                battleField.add_log(logMsg);
            }

            caster.record_skill_stats(this.name, 0, false);
            
        } else if (eType === "dispel_buff" || eType === "dispel_debuff") {
            this.handleDispel(caster, target, effect, battleField);
        } else if (eType === "special") {
            const specialId = effect.value;
            this.handle_special_effect(specialId, caster, target, battleField);
        }
    }

    handleDispel(caster, target, effect, battleField) {
        /**解除処理*/
        let candidates = [];

        if (effect.type === "dispel_buff") {
            // 強化効果のみ
            candidates = target.states.filter(s => GOOD_STATUS.has(s.type));
        } else {
            // 弱体化効果のみ
            candidates = target.states.filter(s => BAD_STATUS.has(s.type));
        }

        // さらに種類を限定する場合
        const targetCategory = effect.stat;
        if (targetCategory === "継続") {
            // 継続ダメージ系（毒、炎上など）に限定
            candidates = candidates.filter(s => CONT_STATUS.has(s.name));
            // 付与戦法が能動か突撃
            candidates = candidates.filter(s => s.source_senpo && (s.source_senpo.type === "能動" || s.source_senpo.type === "突撃"));
        }

        // 2. 解除個数の決定
        const dispelCount = parseInt(effect.value);
        const toRemove = Number.isNaN(dispelCount) ? candidates : candidates.slice(0, dispelCount);

        for (const s of toRemove) {
            const sType = s.type;
            const sStat = s.stat;
            const sVal = s.value || 0;
            const sName = s.name || "効果";

            if (target.states.indexOf(s).clear){    //浄化可
                const index = target.states.indexOf(s);
                if (index > -1) {
                    target.states.splice(index, 1);
                }

                if ((sType === "buff_stat" || sType === "debuff_stat") && sStat in STAT_MAP) {
                    const statName = STAT_MAP[sStat];
                    const currentVal = target[`current_${sStat}`];
                    
                    const isCutStat = sStat.includes("cut");
                    let displayLabel;
                    if (sType === "buff_stat") {
                        displayLabel = isCutStat ? "増加" : "減少";
                    } else {
                        displayLabel = isCutStat ? "減少" : "増加";
                    }

                    battleField.add_log(`  (効果終了) ${target.colored_name} の [${sName}] が消失：${statName} が ${sVal} ${displayLabel} (現在: ${currentVal})`);
                } else {
                    battleField.add_log(`  (効果終了) ${target.colored_name} の [${sName}] が消失`);
                }
            }else{
                battleField.add_log(`  ${target.colored_name} の [${sName}] は浄化不可`);
            }
        }

        caster.record_skill_stats(this.name, 0, false);
    }

    add_buff(caster, target, effect, battleField) {
        /**バフ/デバフ付与処理*/
        const eType = effect.type;
        const eVal = effect.value;
        const statKey = effect.stat;
        const eDuration = effect.duration;
        const statName = STAT_MAP[statKey] || statKey;
        
        const isCutStat = statKey.includes("cut");
        const rule = effect.conflict_rule || "STACK";
        const stackMax = effect.stack_max || 1;
        
        // 対象ステータスの現在の値を取得
        const currentVal = target[statKey];
        // 増減する実数値を計算
        const finalValue = this.calculateEffectValue(eVal, currentVal);

        let displayLabel;
        if (eType === "buff_stat") {
            displayLabel = isCutStat ? "減少" : "増加";
        } else {
            displayLabel = isCutStat ? "増加" : "減少";
        }

        const isSuccess = target.add_state({
            name: `${statName}${displayLabel}`,
            phase:null,
            trigger_side:null,
            type: eType,
            stat: statKey,
            value: finalValue,
            duration: eDuration,
            source_skill: this,
            source_busho: caster,
            attackType:null,
            action:null,
            conflict_rule: rule,
            stack_max: stackMax
        }, battleField);

        if (isSuccess) {
            const currentVal = target[`current_${statKey}`];
            const logMsg = ` -> [${this.colored_name}] により ${target.colored_name} の ${statName} が ${finalValue} ${displayLabel} (現在: ${currentVal}) (${eDuration}ターン)`;
            battleField.add_log(logMsg);
        }
    }
    /**
     * バフの値を計算する（固定値 or 割合）
     * @param {string|number} rawValue - "10%" や 50 などの値
     * @param {number} currentStatValue - 対象武将の現在のステータス値
     */
    calculateEffectValue(rawValue, currentStatValue) {
        if (typeof rawValue === 'string' && rawValue.includes('%')) {
            const percentage = parseFloat(rawValue.replace('%', '')) / 100;
            return Math.floor(currentStatValue * percentage);
        }
        // 数値ならそのまま返す
        return Number(rawValue);
    }
}
