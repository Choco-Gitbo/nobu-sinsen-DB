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
        if (conditionName === "has_弱体") {
            return caster.states.includes("status_effect");
        }
        if (conditionName === "has_封撃") {
            return target.states.some(s => s.name === "封撃");
        }
        if (conditionName === "not_has_封撃") {
            return !target.states.some(s => s.name === "封撃");
        }
        if (conditionName === "has_無策") {
            return target.states.some(s => s.name === "無策");
        }
        if (conditionName === "not_has_無策") {
            return !target.states.some(s => s.name === "無策");
        }
        if (conditionName === "has_潰走") {
            return target.states.some(s => s.name === "潰走");
        }
        if (conditionName === "has_威圧") {
            return target.states.some(s => s.name === "威圧");
        }
        if (conditionName === "not_has_威圧") {
            return !target.states.some(s => s.name === "威圧");
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
        if (conditionName === "飯富虎昌") {
            return caster.name === "飯富虎昌";
        }
        if (conditionName === "島津貴久") {
            return caster.name === "島津貴久";
        }
        if (conditionName === "not_島津貴久") {
            return !caster.name === "島津貴久";
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
    // --- 特殊処理 ---
    handle_special_effect(specialId, caster, target, battleField) {
        /**特殊効果の処理*/
        if (specialId === "時は今") {this.#handleTokiwaima(caster, target, battleField);
        } else if (specialId === "風林火山") {this.#handleFurinkazan(caster, target, battleField);
        } else if (specialId === "軍神") {this.#handleGunshin(caster, target, battleField);
        } else if (specialId === "海道一") {this.#handleKaidouichi(caster, target, battleField);
        } else if (specialId === "雷光雷轟") {this.#handleRaikoRaigo(caster, target, battleField);
        } else if (specialId === "百万一心") {this.#handleHyakumanisshin(caster, target, battleField);
        } else if (specialId === "梟雄の計") {this.#handleKyoyunokei(caster, target, battleField);           
        } else if (specialId === "形影相弔") {this.#handleKeieisoutyou(caster, target, battleField);
        } else if (specialId === "帰蝶の舞") {this.#handleKichonoMai(caster, target, battleField);
        } else if (specialId === "陣禅無我") {this.#handleJinzenmuga(caster, target, battleField);           
        } else if (specialId === "死灰復然") {this.#handleShikaifukunen(caster, target, battleField);
        } else if (specialId === "啄木鳥") {this.#handleKitsutsuki(caster, target, battleField);
        } else if (specialId === "相模の獅子") {this.#handleSagaminoShishi(caster, target, battleField);
        } else if (specialId === "旋乾転坤") {this.#handleSenkentenkon(caster, target, battleField);
        } else if (specialId === "津田流砲術") {this.#handleTsudaryuHojutsu(caster, target, battleField);
        } else if (specialId === "笹の才蔵") {this.#handleSasanoSaizo(caster, target, battleField);
        } else if (specialId === "天下御免") {this.#handleTenkaGomen(caster, target, battleField);
        } else if (specialId === "豊後の戦神") {this.#handleBungonoSenjin(caster, target, battleField);
        } else if (specialId === "諸行無常") {this.#handleShogyomujo(caster, target, battleField);
        } else if (specialId === "仁者の沈勇") {this.#handleJinshanoChinyu(caster, target, battleField);
        } else if (specialId === "盤石耽々") {this.#handleBanjakutantan(caster, target, battleField);
        } else if (specialId === "戦意消沈") {this.#handleSenishochin(caster, target, battleField);
        } else if (specialId === "母衣武者") {this.#handleHoromusha(caster, target, battleField);
        } else if (specialId === "鉄砲僧兵") {this.#handleTeppoSohei(caster, target, battleField);
        } else if (specialId === "不意打ち") {this.#handleFuichii(caster, target, battleField);
        } else if (specialId === "一六勝負") {this.#handleIchirokuShobu(caster, target, battleField);
        } else if (specialId === "矢石飛交") {this.#handleYasekiHikou(caster, target, battleField);
        } else if (specialId === "岐阜侍従") {this.#handleGifuShijuu(caster, target, battleField);
        }
    }

    #handleTokiwaima(caster, target, battleField) {
        /**時は今の処理*/

        const statePool = [
            { name: "火傷", type: "status_effect" ,stat:"intl"},
            { name: "水攻め", type: "status_effect" ,stat:"intl"},
            { name: "中毒", type: "status_effect" ,stat:"intl"},
            { name: "消沈", type: "status_effect" ,stat:"intl"},
            { name: "潰走", type: "status_effect" ,stat:"pow"}
        ];

        const targetStates = ["火傷", "水攻め", "中毒", "消沈", "潰走"];

        // 全て持っているか判定
        const hasAllStates = targetStates.every(stateName => 
            target.states.some(s => s.name === stateName)
        );
        let st_clr = true;
        let clr_label ="";
        if(caster.is_main && hasAllStates){
            //大将時
            st_clr = false;
            clr_label = " (浄化不可)"
        }

        const chosenStateBase = statePool[Math.floor(Math.random() * statePool.length)];
        const dmgVal = battleField.calculate_damage(caster, target, 56, dmgtype = chosenStateBase.stat==="pow" ? "weapon":"intel", this);
        
        const newState = {
            name: chosenStateBase.name,
            type: chosenStateBase.type,
            value:dmgVal,
            duration: 3,
            source_skill: this,
            source_busho: caster,
            clear: st_clr,
            conflict_rule: "NONE"
        };

        const isSuccess = target.add_state(newState, battleField);
        if (isSuccess) {
            const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与${clr_label} (${newState.duration}ターン)`;
            battleField.add_log(logMsg);
        }

        caster.record_skill_stats(this.name, 0, false);
    }

    #handleFurinkazan(caster, target, battleField) {
        /**風林火山の処理*/
        const stat =[
            {name : "spd", value : caster.current_spd, flag: "風"},
            {name : "intl", value : caster.current_intl, flag: "林"},
            {name : "pow", value : caster.current_pow, flag: "火"},
            {name : "ldr", value : caster.current_ldr, flag: "山"}
        ];
        const  flag_turn=[]
        flag_turn["風"] = {max:"風",turn1:1,turn2:3,turn3:5,turn4:7};
        flag_turn["林"] = {max:"林",turn1:7,turn2:1,turn3:3,turn4:5};
        flag_turn["火"] = {max:"火",turn1:5,turn2:7,turn3:1,turn4:3};
        flag_turn["山"] = {max:"山",turn1:3,turn2:5,turn3:7,turn4:1};

        let max_val = 0;
        let max_stat = "";
        let max_flag ="";
        stat.forEach(st => {
            if (st.value >= max_val){
                max_val = st.value;
                max_stat = st.name;
                max_flag = st.flag;
            } 
        })
            
        const flag = flag_turn[max_flag] 
        //風旗
        const newState1 = {
            name: "風林火山-風",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            value :caster.current_spd,
            value2:flag.turn1,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE",
            clear:true
        };
        caster.add_state(newState1, battleField);

        //林旗
        const newState2 = {
            name: "風林火山-林",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            value :caster.current_intl,
            value2:flag.turn2,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE",
            clear:true
        };
        caster.add_state(newState2, battleField);

        //火旗
        const newState3 = {
            name: "風林火山-火",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            value :caster.current_pow,
            value2:flag.turn3,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE",
            clear:true
        };
        caster.add_state(newState3, battleField);

        //山旗
        const newState4 = {
            name: "風林火山-山",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            value :caster.current_ldr,
            value2:flag.turn4,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE",
            clear:true
        };
        caster.add_state(newState4, battleField);
    }


    #handleGunshin(caster, target, battleField) {
        /**軍神の処理*/

        const stat_val = caster.current_pow;

        if (target === caster){
            const newState = {
                name: "軍神-昆(予備)",
                type: "special",
                phase: "after_attack",
                trigger_side: "attacker",
                duration: 99,
                source_skill: this,
                source_busho: caster,
                action:"通常",
                conflict_rule: "NONE",
                clear:true
            };

            const isSuccess = target.add_state(newState, battleField);

                if (target.is_main){
                    const newState = {
                    name: "軍神-龍(予備)",
                    type: "special",
                    phase: "before_action",
                    trigger_side: "attacker",
                    value: stat_val,
                    duration: 99,
                    source_skill: this,
                    source_busho: caster,
                    action:null,
                    conflict_rule: "NONE",
                    clear:true
                    };
                    const isSuccess = target.add_state(newState, battleField);
                    if (isSuccess) {
                        const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                        battleField.add_log(logMsg);
                    }
                }
        }else{
                const newState = {
                name: "軍神(予備)",
                type: "special",
                phase: "after_attack",
                trigger_side: "attacker",
                value: stat_val,
                duration: 99,
                source_skill: this,
                source_busho: caster,
                action:["通常","能動","突撃"],
                conflict_rule: "NONE",
                clear:true
            };

            const isSuccess = target.add_state(newState, battleField);
            if (isSuccess) {
                const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }
        caster.record_skill_stats(this.name, 0, false);
    }

    #handleHyakumanisshin(caster, target, battleField) {
        /**百万一心の処理*/
        const rate = caster.is_main ? 0.35 : 0.15;
        let targetKey
        if(Math.random() <= rate){
            targetKey = "enemy_random_3";
        }else{ targetKey = "enemy_random_2";}
        const newTargets = battleField.find_targets(caster, targetKey, this.type);

        for(let newTarget of newTargets){
            const newState = {
                type: "special",
                phase: "before_skill_exe",
                trigger_side: "attacker",
                name: "百万一心(予備)",
                duration: 99,
                attackType:null,
                action:"能動",
                source_skill: this,
                source_busho: caster,
                conflict_rule: "NONE"
            };

            const isSuccess = newTarget.add_state(newState, battleField);
            if (isSuccess) {
                const logMsg = ` -> ${caster.colored_name} が ${newTarget.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }
    }

    #handleRaikoRaigo(caster, target, battleField) {
        /**雷光雷轟の処理*/
        const val = caster.is_main ? 60 : 52;
        //対象への処理
        let has_mahi1 = target.states.find(s => s.name == "麻痺");
        if(has_mahi1){
            const targetKey = "enemy_random_3";
            const newTargets = battleField.find_targets(caster, targetKey, this.type);
            for(let newTarget of newTargets){
                battleField.process_attack_event(caster, newTarget, val, "weapon", this);
                let has_mahi = newTarget.states.find(s => s.name == "麻痺");
                if(!has_mahi){
                    const newState1 = {
                        name: "麻痺",
                        type: "status_effect",
                        rate: 30,
                        duration: 2,
                        source_skill: this,
                        source_busho: caster,
                        conflict_rule: "NONE"
                    };

                    const isSuccess1 = newTarget.add_state(newState1, battleField);
                    if (isSuccess1) {
                        const logMsg = ` -> ${caster.colored_name} が ${newTarget.colored_name} に ${newState1.name} を付与 (${newState1.duration}ターン)`;
                        battleField.add_log(logMsg);
                    }
                }
            }
        }else{
            const newState2 = {
                name: "麻痺",
                type: "status_effect",
                rate: 30,
                duration: 2,
                source_skill: this,
                source_busho: caster,
                conflict_rule: "NONE"
            };

            const isSuccess2 = target.add_state(newState2, battleField);
            if (isSuccess2) {
                const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState2.name} を付与 (${newState2.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }
        //ランダムな敵単体への処理
        let newTargets10 = battleField.get_enemies(caster);
        newTargets10 = newTargets10.filter(b => b.name != target.name && b.hp > 0)
        const randomIndex = Math.floor(Math.random() * newTargets10.length);
        const newTarget10 = newTargets10[randomIndex];
        let has_mahi2 = newTarget10.states.find(s => s.name == "麻痺");
        if(has_mahi2){
            const targetKey11 = "enemy_random_3";
            const newTargets11 = battleField.find_targets(caster, targetKey11, this.type);
            for(let newTarget11 of newTargets11){
                battleField.process_attack_event(caster, newTarget11, val, "weapon", this);
                let has_mahi1 = newTarget11.states.find(s => s.name == "麻痺");
                if(!has_mahi1){
                    const newState11 = {
                        name: "麻痺",
                        type: "status_effect",
                        rate: 30,
                        duration: 2,
                        source_skill: this,
                        source_busho: caster,
                        conflict_rule: "NONE"
                    };

                    const isSuccess11 = newTarget11.add_state(newState11, battleField);
                    if (isSuccess11) {
                        const logMsg = ` -> ${caster.colored_name} が ${newTarget11.colored_name} に ${newState11.name} を付与 (${newState11.duration}ターン)`;
                        battleField.add_log(logMsg);
                    }
                }
            }
        }else{
            const newState12 = {
                name: "麻痺",
                type: "status_effect",
                rate: 30,
                duration: 2,
                source_skill: this,
                source_busho: caster,
                conflict_rule: "NONE"
            };

            const isSuccess12 = newTarget10.add_state(newState12, battleField);
            if (isSuccess12) {
                const logMsg = ` -> ${caster.colored_name} が ${newTarget10.colored_name} に ${newState12.name} を付与 (${newState12.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }
        //再発動不可付与
        const newState3 = {
            name: "再発動不可",
            type: "refire",
            phase: "before_attack",
            trigger_side: "attacker",
            duration:1,
            attackType:null,
            conflict_rule: "NONE",
            action:null,
            clear:true
        };

        const isSuccess = caster.add_state(newState3, battleField);
        if (isSuccess) {
            const logMsg = ` -> ${caster.colored_name} に ${newState3.name} を付与 (${newState3.duration}ターン)`;
            battleField.add_log(logMsg);
        }

    }

    #handleKaidouichi(caster, target, battleField) {
        /**海道一の処理*/
        const ldr_val = Math.round(caster.current_ldr * 6) /100;
        const effect1 = { type: "debuff_stat", value: ldr_val, stat: "ldr", duration: 99, stack_max: "8",clear:false };
        this.add_buff(caster, target, effect1, battleField);
        const effect2 = { type: "buff_stat", value: ldr_val, stat: "pow", duration: 99, stack_max: "8",clear:false };
        this.add_buff(caster, target, effect2, battleField);
        const effect3 = { type: "buff_stat", value: ldr_val, stat: "intl", duration: 99, stack_max: "8",clear:false };
        this.add_buff(caster, target, effect3, battleField);

    }

    #handleKyoyunokei(caster, target, battleField) {
        /**梟雄の計の処理*/
        if(battleField >= 5 && Math.random() <= 0.5){
            //知略上昇
            const intl_val = Math.round(caster.current_intl * 25) /100;
            const effect1 = { type: "buff_stat", value: ldr_val, stat: "intl", duration: 99, stack_max: "1",clear:true };
            this.add_buff(caster, target, effect1, battleField);
            //混乱付与
            if(!caster.is_main){
                const newState = {
                    name: "混乱",
                    type: "status_effect",
                    duration: 1,
                    source_skill: this,
                    source_busho: caster,
                    conflict_rule: "NONE"
                };

                const isSuccess = target.add_state(newState, battleField);
                if (isSuccess) {
                    const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                    battleField.add_log(logMsg);
                }
            }
        }
    }

    #handleKeieisoutyou(caster, target, battleField) {
        /**形影相弔の処理*/
        battleField.process_attack_event(caster, target, 192, "intel", this);
        //知略の高い敵軍をcasterとする
        const targetKey1 = "enemy_highest_intl";
        const newCasters = battleField.find_targets(caster, targetKey1, this.type);
        let fainal_Target = target;
        if(battleField.turn == 6){
            const targetKey2 = "friend_random_1";
            const newTargets = battleField.find_targets(caster, targetKey2, this.type);
            fainal_Target = newTargets[0];
        }
        battleField.process_attack_event(newCasters[0], fainal_Target, 192, "intel", this);

    }

    #handleKichonoMai(caster, target, battleField) {
        /**帰蝶の舞の処理*/
        const val = Math.round(((caster.current_intl -100) * 0 + 22) *100) /100;

        const newState = {
            name: "帰蝶の舞(予備)",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            value: val,
            duration: 99,
            attackType:null,
            action:null,
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

    #handleJinzenmuga(caster, target, battleField) {
        /**陣前無我の処理*/
        const allies = this.get_allies(caster);
        let liveAllies = allies.filter(b => b.hp > 0);
        const minhp = liveAllies.reduce((min, b) => b.hp < min.hp ? b : min);
        if(caster == minhp){
            battleField.process_heal_event(caster, caster, 258, "ldr", this.name);
        }else{
            const casterKey = "enemy_random_2-3";
            const newTargets = battleField.find_targets(caster, casterKey, this.type);
            for(let newTarget of newTargets){
                const newState1 = {
                    name: "挑発",
                    type: "status_effect",
                    duration: 1,
                    source_skill: this,
                    source_busho: caster,
                    conflict_rule: "NONE"
                };

                const isSuccess1 = newTarget.add_state(newState1, battleField);
                if (isSuccess1) {
                    const logMsg = ` -> ${caster.colored_name} が ${newTarget.colored_name} に ${newState1.name} を付与 (${newState1.duration}ターン)`;
                    battleField.add_log(logMsg);
                }
                const newState2 = {
                    name: "牽制",
                    type: "status_effect",
                    duration: 1,
                    source_skill: this,
                    source_busho: caster,
                    conflict_rule: "NONE"
                };

                const isSuccess2 = newTarget.add_state(newState2, battleField);
                if (isSuccess2) {
                    const logMsg = ` -> ${caster.colored_name} が ${newTarget.colored_name} に ${newState2.name} を付与 (${newState2.duration}ターン)`;
                    battleField.add_log(logMsg);
                }
            }
        }
        caster.record_skill_stats(this.name, 0, false);
    }

    #handleShikaifukunen(caster, target, battleField) {
        /**死灰復然の処理*/
        const val = Math.round(((caster.current_intl -100) * 0.045 + 18) *100) /100;
        const effect1 = { type: "buff_stat", value: val, stat: "dmg_cut_weapon", duration: 1, clear:true };
        this.add_buff(caster, target, effect1, battleField);
        const effect2 = { type: "buff_stat", value: val, stat: "dmg_cut_intel", duration: 1, clear:true };
        this.add_buff(caster, target, effect2, battleField);
        if(caster.ovHeal){
            battleField.process_heal_event(caster, caster, 108, "intl", this.name);
        }
    }

    #handleKitsutsuki(caster, target, battleField) {
        /**啄木鳥の処理*/
        const skill_cnt = caster.is_main ? 2 :1;
        for (let i =0; i< skill_cnt; i++){
            // 知略攻撃
            battleField.process_attack_event(caster, target, 156, "intel", this);
            // 自軍武勇高いが兵刃
            const casterKey = "ally_highest_pow";
            const newCaster = battleField.find_targets(caster, casterKey, this.type);
            battleField.process_attack_event(caster, target, 160, "weapon", this);
            //威圧付与
            if(Math.random() <= 0.35){
                const newState = {
                    name: "威圧",
                    type: "status_effect",
                    duration: 1,
                    source_skill: this,
                    source_busho: caster,
                    conflict_rule: "NONE"
                };

                const isSuccess = target.add_state(newState, battleField);
                if (isSuccess) {
                    const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                    battleField.add_log(logMsg);
                }
            }

        }
    }

    #handleSagaminoShishi(caster, target, battleField) {
        /**相模の獅子の処理*/
        const has_teppeki = target.states.find(st => st.name === "鉄壁");
        if(has_teppeki){
            //鉄壁保有なら計略攻撃
            const targetKey = "enemy_random_1";
            const newTarget = battleField.find_targets(caster, targetKey, this.type);
            battleField.process_attack_event(caster, newTarget, 178, "intel", this);
        }else{
            if(Math.random() <= 0.85){
                //鉄壁付与
                const newState = {
                    name: "鉄壁",
                    type: "buff_status",
                    value:2,
                    duration: 2,
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

            }else if (caster.is_main){
                battleField.process_heal_event(caster, target, 40, "intl", this.name);
            }
        }
    }

    #handleSenkentenkon(caster, target, battleField) {
        /**旋乾転坤の処理*/
        battleField.process_attack_event(caster, target, 126, "intel", this);
        const siki_judo_skill = target.states.filter(s=> s.type == "指揮" || s.type == "受動");
        const skill_cnt = siki_judo_skill.length;
        const dmgVal = battleField.calculate_damage(caster, target, 56, "intel", this);
        const atk_val = dmgVal + 40 * skill_cnt;
        const newState1 = {
            name: "恐慌",
            type: "continuous_damage",
            phase: "before_action",
            trigger_side: "attacker",
            rate: skill_cnt == 0 ? 0: 100,
            value: atk_val,
            duration: 2,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE"
        };

        const isSuccess1 = target.add_state(newState1, battleField);
        if (isSuccess1) {
            const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState1.name} を付与 (${newState1.duration}ターン)`;
            battleField.add_log(logMsg);
        }
        const newState2 = {
            name: "再発動不可",
            type: "refire",
            phase: "before_attack",
            trigger_side: "attacker",
            duration:2,
            attackType:null,
            conflict_rule: "NONE",
            action:null,
            clear:true
        };

        const isSuccess2 = caster.add_state(newState2, battleField);
        if (isSuccess2) {
            const logMsg = ` -> ${caster.colored_name} に ${newState2.name} を付与 (${newState2.duration}ターン)`;
            battleField.add_log(logMsg);
        }
    }

    #handleTsudaryuHojutsu(caster, target, battleField) {
        /**津田流砲術の処理*/

        const statePool = [
            { name: "封撃", type: "status_effect" },
            { name: "無策", type: "status_effect" },
            { name: "威圧", type: "status_effect" },
            { name: "混乱", type: "status_effect" }
        ];
        const chosenStateBase = statePool[Math.floor(Math.random() * statePool.length)];

        const newState = {
            name: chosenStateBase.name,
            type: chosenStateBase.type,
            duration: 2,
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

    #handleSasanoSaizo(caster, target, battleField) {
        /**笹の才蔵の処理*/
        if(target.hp <= 0){
            //発動確率100%増
            const effect1 = { type: "buff_stat", value: 100, stat: "rate_unique_active", duration: 2, clear:true };
            this.add_buff(caster, caster, effect1, battleField);

            const newState = {
                name: "準備ターン省略",
                type: "skip",
                value:1,
                duration: 2,
                source_skill: this,
                source_busho: caster,
                conflict_rule: "NONE"
            };

            const isSuccess = target.add_state(newState, battleField);
            if (isSuccess) {
                const logMsg = ` -> ${caster.colored_name} が ${caster.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }
    }

    #handleTenkaGomen(caster, target, battleField) {
        /**天下御免の処理*/
        battleField.process_attack_event(caster, target, 188, "weapon", this);
        if(target.is_main){
            const has_konran = target.states.find(st => st.name === "混乱");
            if(!has_konran){
                //大将なら混乱付与
                const newState = {
                    name: "混乱",
                    type: "status_effect",
                    duration: 2,
                    source_skill: this,
                    source_busho: caster,
                    conflict_rule: "NONE"
                };
                const isSuccess = target.add_state(newState, battleField);
                if (isSuccess) {
                    const logMsg = ` -> ${caster.colored_name} が ${target.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                    battleField.add_log(logMsg);
                }
            }else{
                const stat =[
                    {name : "pow", value : target.current_pow},
                    {name : "intl", value : target.current_intl},
                    {name : "ldr", value : target.current_ldr},
                    {name : "spd", value : target.current_spd}
                ];
                let max_baf = 0;
                let max_stat = "";
                stat.forEach(st => {
                    if (st.value >= max_baf){
                        max_baf = st.value;
                        max_stat = st.name;
                    } 
                })
                const val = Math.round(((caster[`current_${max_stat}`] -100) * 0.0848 + 30) *100) /100;
                const effect1 = { type: "debuff_stat", value: val, stat: max_stat, duration: 99, clear:false };
                this.add_buff(caster, target, effect1, battleField);
                
                const effect2 = { type: "buff_stat", value: val, stat: max_stat, duration: 99, clear:false };
                this.add_buff(caster, caster, effect2, battleField);
            }
        }
    }

    #handleBungonoSenjin(caster, target, battleField) {
        /**豊後の戦神の処理*/
        if(caster.is_main){
            const val = 20;
            const effect1 = { type: "buff_stat", value: val, stat: max_stat, duration: 99, clear:false };
            this.add_buff(caster, target, effect1, battleField);
        }

        const stat =[
            {name : "pow", value : caster.current_pow},
            {name : "intl", value : caster.current_intl},
            {name : "ldr", value : caster.current_ldr},
            {name : "spd", value : caster.current_spd}
        ];
        let max_baf = 0;
        let max_stat = "";
        stat.forEach(st => {
            if (st.value >= max_baf){
                max_baf = st.value;
                max_stat = st.name;
            } 
        })
        if(max_stat == "pow"){
            const val = Math.round(((caster[`current_${max_stat}`] -100) * 0.028 + 12) *100) /100; 
            const effect1 = { type: "buff_stat", value: val, stat: "dmg_up_weapon", duration: "99" };
            this.add_buff(caster, caster, effect1, battleField);
        }
        if(max_stat == "intl"){
            const val = Math.round(((caster[`current_${max_stat}`] -100) * 0.028 + 12) *100) /100; 
            const effect1 = { type: "buff_stat", value: val, stat: "dmg_up_intel", duration: "99" };
            this.add_buff(caster, caster, effect1, battleField);
        }
        if(max_stat == "ldr"){
            const val = Math.round(((caster[`current_${max_stat}`] -100) * 0.019 + 8) *100) /100; 
            const effect1 = { type: "buff_stat", value: val, stat: "rate_active", duration: "99" };
            this.add_buff(caster, caster, effect1, battleField);
        }
    }

    #handleShogyomujo(caster, target, battleField) {
        /**諸行無常の処理*/
        const val = Math.round(((caster.current_intl -100) * 0.0565 + 24) *100) /100; 
        const newTargets1 = battleField.find_targets(caster, "ally_random_3", this.type);
        for(let newTarget1 of newTargets1){
            const effect1 = { type: "buff_stat", value: val, stat: "dmg_up_weapon", duration: "99" };
            this.add_buff(caster, newTarget1, effect1, battleField);
            const effect2 = { type: "buff_stat", value: val, stat: "dmg_up_intel", duration: "99" };
            this.add_buff(caster, newTarget1, effect2, battleField);
        }

        const val2 = Math.round(((caster.current_intl -100) * 0.1318 + 56) *100) /100; 
        const newState = {
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            name: "諸行無常(予備)",
            value:val2,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE"
        };

        const isSuccess1 = caster.add_state(newState, battleField);
        if (isSuccess1) {
            const logMsg = ` -> ${caster.colored_name} が ${caster.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
            battleField.add_log(logMsg);
        }
        const newTarget2 = battleField.find_targets(caster, "enemy_random_1", this.type);
        const isSuccess2 = newTarget2[0].add_state(newState, battleField);
        if (isSuccess2) {
            const logMsg = ` -> ${caster.colored_name} が ${newTarget2[0].colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
            battleField.add_log(logMsg);
        }
        caster.record_skill_stats(this.name, 0, false);
    }

    #handleJinshanoChinyu(caster, target, battleField) {
        /**仁者の沈勇の処理*/
        battleField.process_attack_event(caster, target, 184, "intel", this);
        const rate = caster.is_main ? 0.9 : 0.7;
        if(Math.random() <= rate){
            const targetKey = "friend_random_1";
            const newCaster = battleField.find_targets(caster, targetKey, this.type);
            battleField.process_attack_event(newCaster[0], target, 154, "intel", this);
        }
    }

    #handleBanjakutantan(caster, target, battleField) {
        /**盤石耽々の処理*/
        const val1 = Math.round(((caster.current_ldr -100) * 0.045 + 9) *100) /100;
        const effect1 = { type: "buff_stat", value: val1, stat: "dmg_cut_weapon", duration: 99, clear:true };
        this.add_buff(caster, target, effect1, battleField);
        const effect2 = { type: "buff_stat", value: val1, stat: "dmg_cut_intel", duration: 99, clear:true };
        this.add_buff(caster, target, effect2, battleField);

        const val2 = Math.round(((caster.current_ldr -100) * 0.045 + 4) *100) /100;
        const newState = {
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            name: "盤石耽々(予備)",
            value:val2,
            duration: 99,
            attackType:null,
            action:null,
            source_skill: this,
            source_busho: caster,
            conflict_rule: "NONE"
        };

        const isSuccess = caster.add_state(newState, battleField);
        if (isSuccess) {
            const logMsg = ` -> ${caster.colored_name} が ${caster.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
            battleField.add_log(logMsg);
        }
        caster.record_skill_stats(this.name, 0, false);
    }

        #handleSenishochin(caster, target, battleField) {
        /**戦意消沈の処理*/
        let flg =0;
        const newTargets = battleField.find_targets(caster, "enemy_random_2", this.type);
        for (const newTarget of newTargets) {
            flg += 1;
            let val = flg == 1? 1 :3;
            const newState = {
                type: "special",
                phase: "before_action",
                trigger_side: "attacker",
                name: "戦意消沈(予備)",
                value: val,
                duration: 99,
                attackType:null,
                action:null,
                source_skill: this,
                source_busho: caster,
                conflict_rule: "NONE"
            };

            const isSuccess = newTarget.add_state(newState, battleField);
            if (isSuccess) {
                const logMsg = ` -> ${caster.colored_name} が ${newTarget.colored_name} に ${newState.name} を付与 (${newState.duration}ターン)`;
                battleField.add_log(logMsg);
            }
        }

        caster.record_skill_stats(this.name, 0, false);
    }

    #handleHoromusha(caster, target, battleField) {
        /**母衣武者の処理*/
        const base_val = caster.name == "前田利家" ? 3.5 : 3;
        const val = Math.round(((caster.current_spd -100) * 0.017 + 3) *100) /100;

        const newState = {
            name: "母衣武者(予備)",
            type: "special",
            phase: "after_attack",
            trigger_side: "attacker",
            value: val,
            value2: 0,
            duration: 99,
            attackType:null,
            action:"通常",
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

    #handleTeppoSohei(caster, target, battleField) {
        /**鉄砲僧兵の処理*/
        const base_val = caster.name == "津田算長" ? 0.01 : 0;
        const val = Math.round(((caster.current_ldr -100) * base_val + 12) *100) /100;
        const effect1 = { type: "buff_stat", value: val, stat: "ldr", duration: 99, clear:true };
        this.add_buff(caster, target, effect1, battleField);
        const effect2 = { type: "buff_stat", value: val, stat: "intl", duration: 99, clear:true };
        this.add_buff(caster, target, effect2, battleField);

        const newState = {
            name: "鉄砲僧兵(予備)",
            type: "special",
            phase: "before_action",
            trigger_side: "attacker",
            duration: 99,
            attackType:null,
            action:null,
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
