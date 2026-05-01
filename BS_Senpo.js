import { STAT_MAP, GOOD_STATUS, BAD_STATUS, CONT_STATUS, CONT_DMG_STATUS, CONT_HEAL_STATUS, STATE_TEMPLATES } from './BS_constants.js';

export class Senpo {
    constructor(id, name, type, rate, effectsJson, prepTurns = 0) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.rate = rate;
        
        // パース済みデータが渡される前提なので、そのまま格納（空なら空配列）
        this.effects_json = effectsJson || [];
               
        // 0:即時, 1:1ターン準備, 2:2ターン準備
        this.prepTurns = prepTurns;
    }
    get colored_name() {
        const colorClass = 'senpo-name';
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
        if (conditionName === "is_main") {
            return caster.is_main; // 主将ならTrue
        }
        if (conditionName === "is_sub") {
            return !caster.is_main; // 主将でなければTrue
        }
        if (conditionName === "is_man") {
            return caster.sex == "男"; // 男性ならTrue
        }
        if (conditionName === "is_woman") {
            return caster.sex == "女"; // 女性ならTrue
        }
        if (conditionName === "is_騎兵") {
            return caster.unit_type == "騎兵"; // 騎馬ならTrue
        }
        if (conditionName === "isnot_騎兵") {
            return caster.unit_type != "騎兵"; // 騎馬でないTrue
        }
        if (conditionName === "is_弓兵") {
            return caster.unit_type == "弓兵"; // 弓兵ならTrue
        }
        if (conditionName === "isnot_弓兵") {
            return caster.unit_type != "弓兵"; // 弓兵でないTrue
        }
        if (conditionName === "is_足軽") {
            return caster.unit_type == "足軽"; // 足軽ならTrue
        }
        if (conditionName === "isnot_足軽") {
            return caster.unit_type != "足軽"; // 足軽でないTrue
        }
        if (conditionName === "is_鉄砲") {
            return caster.unit_type == "鉄砲"; // 鉄砲ならTrue
        }
        if (conditionName === "isnot_鉄砲") {
            return caster.unit_type != "鉄砲"; // 鉄砲でないTrue
        }
        if (conditionName === "is_兵器") {
            return caster.unit_type == "兵器"; // 兵器ならTrue
        }
        if (conditionName === "isnot_兵器") {
            return caster.unit_type != "兵器"; // 兵器でないTrue
        }
        if (conditionName === "is_t騎兵") {
            return target.unit_type == "騎兵"; // 騎馬ならTrue
        }
        if (conditionName === "isnot_t騎兵") {
            return target.unit_type != "騎兵"; // 騎馬でないTrue
        }
        if (conditionName === "is_t弓兵") {
            return target.unit_type == "弓兵"; // 弓兵ならTrue
        }
        if (conditionName === "isnot_t弓兵") {
            return target.unit_type != "弓兵"; // 弓兵でないTrue
        }
        if (conditionName === "is_t足軽") {
            return target.unit_type == "足軽"; // 足軽ならTrue
        }
        if (conditionName === "isnot_t足軽") {
            return target.unit_type != "足軽"; // 足軽でないTrue
        }
        if (conditionName === "is_t鉄砲") {
            return target.unit_type == "鉄砲"; // 鉄砲ならTrue
        }
        if (conditionName === "isnot_t鉄砲") {
            return target.unit_type != "鉄砲"; // 鉄砲でないTrue
        }
        if (conditionName === "is_t兵器") {
            return target.unit_type == "兵器"; // 兵器ならTrue
        }
        if (conditionName === "isnot_t兵器") {
            return target.unit_type != "兵器"; // 兵器でないTrue
        }
        if (conditionName === "is_e騎兵") {
            return enemies[0].unit_type == "騎兵"; // 騎馬ならTrue
        }
        if (conditionName === "isnot_e騎兵") {
            return enemies[0].unit_type != "騎兵"; // 騎馬でないTrue
        }
        if (conditionName === "is_e弓兵") {
            return enemies[0].unit_type == "弓兵"; // 弓兵ならTrue
        }
        if (conditionName === "isnot_e弓兵") {
            return enemies[0].unit_type != "弓兵"; // 弓兵でないTrue
        }
        if (conditionName === "is_e足軽") {
            return enemies[0].unit_type == "足軽"; // 足軽ならTrue
        }
        if (conditionName === "isnot_e足軽") {
            return enemies[0].unit_type != "足軽"; // 足軽でないTrue
        }
        if (conditionName === "is_e鉄砲") {
            return enemies[0].unit_type == "鉄砲"; // 鉄砲ならTrue
        }
        if (conditionName === "isnot_e鉄砲") {
            return enemies[0].unit_type != "鉄砲"; // 鉄砲でないTrue
        }
        if (conditionName === "is_e兵器") {
            return enemies[0].unit_type == "兵器"; // 兵器ならTrue
        }
        if (conditionName === "isnot_e兵器") {
            return enemies[0].unit_type != "兵器"; // 兵器でないTrue
        }
        if (conditionName === "武勇>知略") {
            return caster.current_pow >= caster.current_intl;
        }
        if (conditionName === "知略>武勇") {
            return caster.current_pow < caster.current_intl;
        }
        if (conditionName === "t武勇>t知略") {
            return target.current_pow >= target.current_intl;
        }
        if (conditionName === "t知略>t武勇") {
            return target.current_pow < target.current_intl;
        }
        if (conditionName === "has_封撃") {
            return target.states.some(s => s.name === "封撃");
        }
        if (conditionName === "not_has_封撃") {
            return !target.states.some(s => s.name === "封撃");
        }
        if (conditionName === "has_潰走") {
            return target.states.some(s => s.name === "潰走");
        }
        if (conditionName === "has_麻痺") {
            return target.states.some(s => s.name === "麻痺");
        }
        if (conditionName === "has_挑発") {
            return target.states.some(s => s.name === "挑発");
        }
        if (conditionName === "not_has_挑発") {
            return !target.states.some(s => s.name === "挑発");
        }
        if (conditionName === "has_牽制") {
            return target.states.some(s => s.name === "牽制");
        }
        if (conditionName === "not_has_牽制") {
            return !target.states.some(s => s.name === "牽制");
        }
        if (conditionName.includes("mhp")) {
            // 自身の兵数
            const match = conditionName.match(/\d+/);
            if (match) {
                const targetHp = parseInt(match[0]);
                const hpPercent = (caster.hp / caster.max_hp) * 100;
                
                if (conditionName.includes(">=")) {
                    return targetHp >= hpPercent;
                } else if (conditionName.includes("==")) {
                    return targetHp === hpPercent;
                } else if (conditionName.includes("<=")) {
                    return targetHp <= hpPercent;
                }
            }
        }
        if (conditionName.includes("thp")) {
            // ターゲットの兵数
            const match = conditionName.match(/\d+/);
            if (match) {
                const targetHpVal = parseInt(match[0]);
                const hpPercent = (target.hp / target.max_hp) * 100;
                
                if (conditionName.includes(">")) {
                    return targetHpVal >= hpPercent;
                } else if (conditionName.includes("==")) {
                    return targetHpVal === hpPercent;
                } else if (conditionName.includes("<=")) {
                    return targetHpVal <= hpPercent;
                }
            }
        }
        if (conditionName.includes("turn")) {
            // ターン
            const match = conditionName.match(/\d+/);
            if (match) {
                const targetTurn = parseInt(match[0]);
                
                if (conditionName.includes(">=")) {
                    return battlefield.turn >= targetTurn;
                } else if (conditionName.includes("==")) {
                    return battlefield.turn === targetTurn;
                }
            }else if(conditionName.includes("odd")){
                return battlefield.turn % 2 === 1;
            }else if(conditionName.includes("even")){
                return battlefield.turn % 2 === 0;
            }
        }
        if (conditionName.includes("rmd")) {
            // 確率
            const match = conditionName.match(/\d+/);
            if (match) {
                const addRate = parseInt(match[0]);
                return Math.random() <= (addRate /100);
            }
        }

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
            this.#addBuff(caster, target, effect, battleField);
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
                    const stVal = battleField.calculate_damage(caster, target, effect.value, effect.stat, this);
                    ov.value = stVal;
                }
            }

            ov.source_skill = this;
            ov.source_busho = caster;
            const isSuccess = battleField.add_state_by_name(target, eEffect, ov);
            
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
        }

        caster.record_skill_stats(this.name, 0, false);
    }

    #addBuff(caster, target, effect, battleField) {
        /**バフ/デバフ付与処理*/
        const eType = effect.type;
        const eVal = effect.value;
        const statKey = effect.stat;
        const eDuration = effect.duration;
        const statName = STAT_MAP[statKey] || statKey;

        const isCutStat = statKey.includes("cut");
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
            type: eType,
            stat: statKey,
            value: finalValue,
            duration: eDuration,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "STACK",
            stack_max: stackMax
        }, battleField);

        if (isSuccess) {
            const currentVal = target[`current_${statKey}`];
            const logMsg = ` -> ${target.colored_name} の ${statName} が ${finalValue} ${displayLabel} (現在: ${currentVal}) (${eDuration}ターン)`;
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
    // --- 特殊処理 ---
    handle_special_effect(specialId, caster, target, battleField) {
        /**特殊効果の処理*/
        if (specialId === "不意打ち") {
            this.#handleFuichii(caster, target, battleField);
        } else if (specialId === "一六勝負") {
            this.#handleIchirokuShobu(caster, target, battleField);
        } else if (specialId === "矢石飛交") {
            this.#handleYasekiHikou(caster, target, battleField);
        } else if (specialId === "岐阜侍従") {
            this.#handleGifuShijuu(caster, target, battleField);
        }
    }

    #handleFuichii(caster, target, battleField) {
        /**不意打ちの処理*/
        const duration = Math.random() < 0.65 ? 2 : 1;

        const statePool = [
            { name: "無策", type: "status_effect" },
            { name: "封撃", type: "status_effect" }
        ];
        const chosenStateBase = statePool[Math.floor(Math.random() * statePool.length)];

        const newState = {
            name: chosenStateBase.name,
            type: chosenStateBase.type,
            duration: duration,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE"
        };

        const isSuccess = target.add_state(newState, battleField);
        if (isSuccess) {
            const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
            battleField.add_log(logMsg);
        }

        caster.record_skill_stats(this.name, 0, false);
    }

    #handleIchirokuShobu(caster, target, battleField) {
        /**一六勝負の処理*/
        const actType = Math.random() < 0.5;
        if (actType) {
            // 敵軍単体に240%計略攻撃
            battleField.process_attack_event(caster, target, 240, "intel", this);
        } else {
            // 自軍単体に240%(知略依存)回復
            const targetKey = "ally_random_1";
            const newTarget = battleField.find_targets(caster, targetKey, this.type);
            if (newTarget.length > 0) {
                battleField.process_heal_event(caster, newTarget[0], 240, "intl", this.name);
            }
        }
    }

    #handleYasekiHikou(caster, target, battleField) {
        /**矢石飛交の処理*/
        const attackCnt = Math.floor(Math.random() * 3) + 2; // 2～4回
        for (let i = 0; i < attackCnt; i++) {
            // 2～4回敵軍単体に240%計略攻撃
            const targetKey = "enemy_random_1";
            const newTarget = battleField.find_targets(caster, targetKey, this.type);
            if (newTarget.length > 0) {
                battleField.process_attack_event(caster, newTarget[0], 84, "weapon", this);
            }
        }
    }

    #handleGifuShijuu(caster, target, battleField) {
        /**岐阜侍従の処理*/
        const isCondition = (caster.current_pow >= target.current_pow) && 
                           (caster.current_intl >= target.current_intl);
        const atkVal = isCondition ? 170 : 148;
        
        battleField.process_attack_event(caster, target, atkVal, "weapon", this);
        battleField.process_attack_event(caster, target, atkVal, "intel", this);
    }
}
