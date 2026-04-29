import { STAT_MAP, GOOD_STATUS, BAD_STATUS, CONT_STATUS, CONT_DMG_STATUS, CONT_HEAL_STATUS, STATE_TEMPLATES } from './BS_constants.js';

export class BattleField {
    constructor(armyA, armyB) {
        /**
         * armyA: 自軍の武勇リスト（最大3人）
         * armyB: 敵軍の武勇リスト（最大3人）
         */
        this.army_a = armyA;
        this.army_b = armyB;
        this.turn = 0;
        this.battle_logs = []; // すべてのログをここに格納
    }

    get_enemies(caster) {
        /**発動者から見た『敵軍』のリストを返す*/
        if (this.army_a.includes(caster)) {
            return this.army_b;
        }
        return this.army_a;
    }

    get_allies(caster) {
        /**発動者から見た『自軍』のリストを返す*/
        if (this.army_a.includes(caster)) {
            return this.army_a;
        }
        return this.army_b;
    }

    get_friends(caster) {
        /**発動者から見た『友軍』のリストを返す*/
        if (this.army_a.includes(caster)) {
            return this.army_a.filter(f => f !== caster);
        } else {
            return this.army_b.filter(f => f !== caster);
        }
    }

    #pickRandom(units, countStr) {
        /**
         * '1', '2', '3', '1-2', '2-3' といった文字列から人数を決定して抽出する
         */
        const liveUnits = units.filter(u => u.hp > 0);
        if (liveUnits.length === 0) {
            return [];
        }

        let n;
        if (countStr.includes('-')) {
            const [minN, maxN] = countStr.split('-').map(Number);
            n = Math.floor(Math.random() * (maxN - minN + 1)) + minN;
        } else {
            n = parseInt(countStr);
        }

        const finalN = Math.min(liveUnits.length, n);
        return this.#randomSample(liveUnits, finalN);
    }

    #randomSample(array, sampleSize) {
        /**配列からランダムに指定数の要素を抽出（非重複）*/
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, sampleSize);
    }

    find_targets(caster, rangeType, skillType = "能動") {
        // ターゲットを決める
        const enemies = this.get_enemies(caster);
        const allies = this.get_allies(caster);
        const friends = this.get_friends(caster);

        // 生存している武将のみを対象にする（HP > 0 のフィルター）
        let liveEnemies = enemies.filter(b => b.hp > 0);
        let liveAllies = allies.filter(b => b.hp > 0);
        let liveFriends = friends.filter(b => b.hp > 0);

        // 1. 挑発・牽制によるターゲット強制のチェック
        let forcedTarget = null;

        if (skillType === "通常") {
            // 敵の中に「挑発」状態がいるか確認
            const forcedState = caster.states.find(s => s.name === '挑発');
            if (forcedState) {
                forcedTarget = forcedState.source_busho;
                this.add_log(`  -> ${caster.colored_name} は【挑発】により ${forcedTarget.colored_name} を攻撃！`);
            }
        } else if (skillType === "能動") {
            // 敵の中に「牽制」状態がいるか確認
            const forcedState = caster.states.find(s => s.name === '牽制');
            if (forcedState) {
                forcedTarget = forcedState.source_busho;
                this.add_log(`  -> ${caster.colored_name} の戦法対象が【牽制】により ${forcedTarget.colored_name} に固定された！`);
            }
        }

        if (forcedTarget) {
            return [forcedTarget];
        }

        // 2. 混乱の時はターゲット変更
        if (caster.states.some(s => s.name === '混乱')) {
            liveEnemies = [...liveEnemies, ...liveFriends];
            liveAllies = [...liveAllies, ...liveEnemies];
            this.add_log(`   ${caster.colored_name} は 混乱中！`);
        }

        // --- 基本形 ---
        if (rangeType.startsWith("enemy_random_")) {
            const numStr = rangeType.replace("enemy_random_", "");
            return this.#pickRandom(liveEnemies, numStr);
        } else if (rangeType.startsWith("ally_random_")) {
            const numStr = rangeType.replace("ally_random_", "");
            return this.#pickRandom(liveAllies, numStr);
        } else if (rangeType.startsWith("friend_random_")) {
            const numStr = rangeType.replace("friend_random_", "");
            return this.#pickRandom(liveFriends, numStr);
        } else if (rangeType === "self") {
            return [caster];
        } else if (rangeType === "last_target") {
            if (caster.last_target && caster.last_target.hp > 0) {
                const target = caster.last_target;
                caster.last_target = null;
                return [target];
            }
        } else if (rangeType === "enemy_main") {
            return enemies.filter(u => u.is_main && u.hp > 0);
        } else if (rangeType === "ally_main") {
            return allies.filter(u => u.is_main && u.hp > 0);
        }

        // ステータス最高系
        if (rangeType === "ally_highest_pow") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((max, b) => b.current_pow > max.current_pow ? b : max);
            return [target];
        } else if (rangeType === "ally_highest_intl") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((max, b) => b.current_intl > max.current_intl ? b : max);
            return [target];
        } else if (rangeType === "ally_highest_ldr") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((max, b) => b.current_ldr > max.current_ldr ? b : max);
            return [target];
        } else if (rangeType === "ally_highest_spd") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((max, b) => b.current_spd > max.current_spd ? b : max);
            return [target];
        }

        // ステータス最低系
        if (rangeType === "ally_lowest_pow") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((min, b) => b.current_pow < min.current_pow ? b : min);
            return [target];
        } else if (rangeType === "ally_lowest_intl") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((min, b) => b.current_intl < min.current_intl ? b : min);
            return [target];
        } else if (rangeType === "ally_lowest_ldr") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((min, b) => b.current_ldr < min.current_ldr ? b : min);
            return [target];
        } else if (rangeType === "ally_lowest_spd") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((min, b) => b.current_spd < min.current_spd ? b : min);
            return [target];
        }

        // 友軍ステータス最高系
        if (rangeType === "friend_highest_pow") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((max, b) => b.current_pow > max.current_pow ? b : max);
            return [target];
        } else if (rangeType === "friend_highest_intl") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((max, b) => b.current_intl > max.current_intl ? b : max);
            return [target];
        } else if (rangeType === "friend_highest_ldr") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((max, b) => b.current_ldr > max.current_ldr ? b : max);
            return [target];
        } else if (rangeType === "friend_highest_spd") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((max, b) => b.current_spd > max.current_spd ? b : max);
            return [target];
        }

        // 友軍ステータス最低系
        if (rangeType === "friend_lowest_pow") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((min, b) => b.current_pow < min.current_pow ? b : min);
            return [target];
        } else if (rangeType === "friend_lowest_intl") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((min, b) => b.current_intl < min.current_intl ? b : min);
            return [target];
        } else if (rangeType === "friend_lowest_ldr") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((min, b) => b.current_ldr < min.current_ldr ? b : min);
            return [target];
        } else if (rangeType === "friend_lowest_spd") {
            if (liveFriends.length === 0) return [];
            const target = liveFriends.reduce((min, b) => b.current_spd < min.current_spd ? b : min);
            return [target];
        }

        // 敵軍ステータス最高系
        if (rangeType === "enemy_highest_pow") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((max, b) => b.current_pow > max.current_pow ? b : max);
            return [target];
        } else if (rangeType === "enemy_highest_intl") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((max, b) => b.current_intl > max.current_intl ? b : max);
            return [target];
        } else if (rangeType === "enemy_highest_ldr") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((max, b) => b.current_ldr > max.current_ldr ? b : max);
            return [target];
        } else if (rangeType === "enemy_highest_spd") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((max, b) => b.current_spd > max.current_spd ? b : max);
            return [target];
        }

        // 敵軍ステータス最低系
        if (rangeType === "enemy_lowest_pow") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((min, b) => b.current_pow < min.current_pow ? b : min);
            return [target];
        } else if (rangeType === "enemy_lowest_intl") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((min, b) => b.current_intl < min.current_intl ? b : min);
            return [target];
        } else if (rangeType === "enemy_lowest_ldr") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((min, b) => b.current_ldr < min.current_ldr ? b : min);
            return [target];
        } else if (rangeType === "enemy_lowest_spd") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((min, b) => b.current_spd < min.current_spd ? b : min);
            return [target];
        }

        // HP系
        if (rangeType === "ally_highest_hp") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((max, b) => b.hp > max.hp ? b : max);
            return [target];
        } else if (rangeType === "ally_lowest_hp") {
            if (liveAllies.length === 0) return [];
            const target = liveAllies.reduce((min, b) => b.hp < min.hp ? b : min);
            return [target];
        } else if (rangeType === "enemy_highest_hp") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((max, b) => b.hp > max.hp ? b : max);
            return [target];
        } else if (rangeType === "enemy_lowest_hp") {
            if (liveEnemies.length === 0) return [];
            const target = liveEnemies.reduce((min, b) => b.hp < min.hp ? b : min);
            return [target];
        }

        return [];
    }

    add_state_by_name(target, stateName, overrides = {}) {
        /**
         * stateName: STATE_TEMPLATES のキー
         * overrides: value, duration, stat など、戦法ごとに変わる値
         */
        if (!(stateName in STATE_TEMPLATES)) {
            this.add_log(`エラー: 状態 ${stateName} の定義が見つかりません`);
            return false;
        }

        // 1. ひな形をコピー（元の定義を壊さないため）
        const newState = {
            ...STATE_TEMPLATES[stateName],
            name: stateName,
            ...overrides
        };

        // 2. 実行
        const success = target.add_state(newState, this);
        return success;
    }

    process_attack_event(caster, target, rate, attackType, skillName, statusName = null) {
        /**
         * 通常攻撃または突撃戦法など、対象が存在する攻撃アクション
         */
        const atkName = statusName === null ? skillName.name : statusName;
        this.add_log(`${caster.colored_name} の[<span class="senpo-name">${atkName}</span>]攻撃開始（対象: ${target.colored_name}）`);

        // --- 援護の判定 ---
        let engoState = caster.states.find(s => s.name === '援護');
        let actualTarget = target;

        if (engoState && skillName.name === "通常攻撃") {
            const supporter = engoState.source_busho;
            if (supporter && supporter.hp > 0 && supporter !== target) {
                this.add_log(`  !! ${target.colored_name} は援護されて、${supporter.colored_name} に目標変更！`);
                actualTarget = supporter;
            }
        }

        // 1. 攻撃前処理
        this.process_phase_states(caster, "before_attack", "attacker", actualTarget);
        this.process_phase_states(actualTarget, "before_attack", "defender", caster);

        // 2. ダメージ計算
        const isCont = statusName && CONT_DMG_STATUS.has(statusName);
        let totalDmg = 0;

        if (isCont) {
            totalDmg = rate;
        } else {
            if (statusName === "乱舞") {
                const baseDmg = caster.last_normal_attack_damage;
                totalDmg = Math.floor(baseDmg * parseInt(rate) / 100);
            } else {
                totalDmg = this.calculate_damage(caster, actualTarget, rate, attackType, skillName, statusName);
            }
        }

        let hitRate = 1.0; // デフォルトは 100% ダメージ

        // 1. 疲弊のチェック（最優先）
        if (caster.states.some(s => s.name === '疲弊')) {
            hitRate = 0.0;
            this.add_log(`  !! ${caster.colored_name} は【疲弊】によりダメージを与えられない`);
        }
        // 2. 必中のチェック
        else if (caster.states.some(s => s.name === '必中')) {
            hitRate = 1.0;
        }
        // 3. 回避のチェック（防御側）
        else if (actualTarget.states.some(s => s.name === '回避')) {
            const kaihinState = actualTarget.states.find(s => s.name === '回避');
            if (Math.random() <= (parseInt(kaihinState.rate || 0) /100)) {
                hitRate = 0.0;
                this.add_log(`  !! ${actualTarget.colored_name} は攻撃を回避した`);
            } else {
                this.add_log(`  !! ${actualTarget.colored_name} は攻撃を回避失敗`);
            }
        }
        // 4. 鉄壁のチェック（防御側）
        else if (actualTarget.states.some(s => s.name === '鉄壁')) {
            const teppeki = actualTarget.states.find(s => s.name === '鉄壁');
            if (parseInt(teppeki.value || 0) > 0) {
                hitRate = 0.0;
                teppeki.value = parseInt(teppeki.value) - 1;
                this.add_log(`  !! ${actualTarget.colored_name} の【鉄壁】がダメージを無効化した（残り${teppeki.value}回）`);
            }
        }

        // 最終ダメージの適用
        totalDmg = Math.floor(totalDmg * hitRate);
        caster.stats_log.damage_dealt += totalDmg;
        caster.record_skill_stats(skillName.name, totalDmg, false);
        //caster.stats_log.skill_details[skillName.name].count += 1;

        // 3. ダメージ適用（肩代わり考慮）
        const actualDmg = this.apply_damage_with_protection(caster, actualTarget, totalDmg);

        // 離反・心攻の処理
        if (attackType === "weapon") {
            const rihanState = caster.states.find(s => s.name === '離反');
            if (rihanState) {
                this.process_heal_event(caster, caster, rihanState.value, "dmg", "離反", totalDmg);
            }
        } else {
            const sinkoState = caster.states.find(s => s.name === '心攻');
            if (sinkoState) {
                this.process_heal_event(caster, caster, sinkoState.value, "dmg", "心攻", totalDmg);
            }
        }

        caster.last_target = actualTarget;

        // 4. 攻撃後処理
        this.process_phase_states(caster, "after_attack", "attacker", actualTarget);
        this.process_phase_states(actualTarget, "after_attack", "defender", caster);

        return totalDmg;
    }

    apply_damage_with_protection(caster, target, totalDmg) {
        /**
         * 算出したダメージ(totalDmg)を、肩代わり状態を考慮して分配する
         */
        const protectionState = target.states.find(s => s.name === '肩代り');

        if (protectionState && protectionState.provider && protectionState.provider.hp > 0) {
            const provider = protectionState.provider;
            const rate = protectionState.rate || 0.4;

            // 分配計算
            const providedDmg = Math.round(totalDmg * rate);
            const originalTargetDmg = totalDmg - providedDmg;

            // 肩代わり者にダメージ適用
            provider.hp -= providedDmg;
            this.add_log(`【肩代わり】${provider.name}が${target.colored_name}のダメージを${rate * 100}%分担`);
            this.add_log(`${provider.colored_name}に${providedDmg}のダメージ（残り${provider.hp}）`);
            const newProvidedWounded = Math.floor(providedDmg * 0.9);
            provider.wounded += newProvidedWounded;
            provider.stats_log.damage_taken += providedDmg;

            // 本来のターゲットにダメージ適用
            target.hp -= originalTargetDmg;
            this.add_log(`${target.colored_name}に${originalTargetDmg}のダメージ（残り${target.hp}）`);
            const newOriginalTargetWounded = Math.floor(originalTargetDmg * 0.9);
            target.wounded += newOriginalTargetWounded;
            target.stats_log.damage_taken += originalTargetDmg;
        } else {
            // 肩代わりなし
            target.hp -= totalDmg;
            this.add_log(`${target.colored_name}が${totalDmg}のダメージを受けた（残り${target.hp}）`);
            const newTargetWounded = Math.floor(totalDmg * 0.9);
            target.wounded += newTargetWounded;
            target.stats_log.damage_taken += totalDmg;
        }
    }

    calculate_damage(caster, target, rate, dmgType, skillObj = null, status = null) {
        /**
         * caster: 攻撃者
         * target: 防御者
         * rate: 戦法のダメージ倍率 (例: 150% -> 1.5)
         * dmgType: "weapon" (兵刃) or "intel" (計略)
         * skillObj: スキルオブジェクト
         * status: ステータス名
         */
        let criticalRate = 0.0;
        let criticalDmg = 2.0;

        // 1. ステータスの決定
        let atkStat, defStat;
        if (dmgType === "weapon") {
            atkStat = caster.current_pow;
            defStat = target.current_ldr;
            criticalRate = caster.current_critical_rate_weapon;
            criticalDmg = caster.current_critical_dmg_weapon;
        } else {
            atkStat = caster.current_intl;
            defStat = target.current_intl;
            criticalRate = caster.current_critical_rate_intel;
            criticalDmg = caster.current_critical_dmg_intel;
        }

        // 破陣状態時はdefStatを0にする
        const nodefState = caster.states.find(s => s.name === '破陣');
        if (nodefState) {
            const hajinRate = parseInt(nodefState.rate || 100);
            if (Math.random() <= (hajinRate /100)) {
                defStat = 0;
                this.add_log(`   ${caster.colored_name} が 破陣発動！`);
            }
        }

        // A: ステータス・レベル補正差
        const A = atkStat * (Math.max(caster.Lv - 20.0, 0) / 50 + 1) - 
                  defStat * (Math.max(target.Lv - 20.0, 0) / 50 + 1);

        // B: 兵力補正
        let B;
        if (caster.hp < 2000) {
            B = caster.hp / 10;
        } else {
            B = (Math.log(caster.hp) / Math.log(2) - 9) * 100;
        }

        // C: 凸数（ランクアップ）補正
        const cAtk = 1 + ((2 + (caster.Lv - 30) / 20) * caster.rank) / 100;
        const cDef = 1 + ((2 + (target.Lv - 30) / 20) * target.rank) / 100;
        const C = cAtk * cDef;

        // D: バフ・デバフ合計
        const sType = skillObj ? skillObj.type : "";
        const dAtk = 1 + (caster.get_total_dmg_up(dmgType, sType) / 100);
        const dDef = 1 + (target.get_total_dmg_cut(dmgType, sType) / 100);
        const D = dAtk * dDef;

        // E: 最低ダメージ補償
        const E = Math.min(caster.hp / 50, 100);

        // F: 兵種相性
        const F = 1.2;

        // G: 特殊バフ
        const gAtk = 1 + (caster.get_total_sp_dmg_up(dmgType, sType)) / 100;
        const gDef = 1 + (target.get_total_sp_dmg_cut(dmgType, sType)) / 100;
        const G = gAtk * gDef;

        // H: 戦法ダメージ率
        const H = parseFloat(rate) / 100;

        // I: 会心
        const isCritical = Math.random()  < (criticalRate /100);
        const I = isCritical ? (1.5 + criticalDmg) : 1;

        // 最終ダメージ計算
        const baseDamage = (((A + B) * (C * D) + E) * F * G * H * I);

        // ±5%の乱数
        const randTable = [0.955, 0.966, 0.978, 0.989, 1, 1.011, 1.023, 1.034, 1.045];
        const randomFactor = Math.floor(Math.random() * randTable.length);
        const finalDamage = baseDamage * randTable[randomFactor];

        return Math.max(0, Math.floor(finalDamage));
    }

    process_heal_event(caster, target, rate, stat, skillName, baseValue = null) {
        /**
         * 回復処理のメインロジック
         */
        const calRate = rate / 100;

        this.add_log(`  [${skillName}] による回復発動：対象 ${target.colored_name}`);

        // 1. 回復無効（禁療など）のチェック
        if (target.states.some(s => s.name === '回復不可')) {
            this.add_log(`    !! ${target.colored_name} は回復不可状態のため回復できない`);
            return 0;
        }

        const isCont = CONT_HEAL_STATUS.has(skillName);
        let rawHeal;
        if (!isCont) {
            rawHeal = this.calculate_heal(caster, target, rate, stat, skillName, baseValue);
        } else {
            // 継続状態での回復では事前に計算した効果値(rate)を使用する
            rawHeal = rate;
        }

        // 4. 負傷兵数による上限判定
        const actualHeal = Math.min(rawHeal, target.wounded);
        const overHeal = Math.max(0, rawHeal - target.wounded);

        // 5. 適用
        target.hp += actualHeal;
        target.wounded -= actualHeal;
        target.total_over_heal += overHeal;
        caster.stats_log.healing += actualHeal;
        caster.record_skill_stats(skillName, actualHeal, true);
        //caster.stats_log.skill_details[skillName].count += 1;

        // 6. ログ出力
        let logMsg = `    -> ${target.colored_name} の兵数が<span class="heal">${actualHeal}</span>回復 (現在: ${target.hp})`;
        if (overHeal > 0) {
            logMsg += ` ※超過回復: <span class="heal">${overHeal}</span>`;
        }
        this.add_log(logMsg);

        return actualHeal;
    }

    calculate_heal(caster, target, rate, stat, skillName, baseValue = null) {
        /**回復量の計算*/
        const calRate = parseInt(rate) / 100;
        const modifier = caster.get_total_heal_modifier(caster, target);

        let rawHeal;
        if (stat === "dmg" && baseValue !== null) {
            // 離反・心攻のパターン
            rawHeal = baseValue * calRate * (1 + modifier);
        } else {
            const currentStatVal = caster[`current_${stat}`] || 0;
            if (caster.hp < 2000) {
                rawHeal = (caster.hp / 10 + currentStatVal) * calRate * (1 + modifier);
            } else {
                rawHeal = ((144.09 * Math.log(caster.hp) / Math.log(2) - 897.91) + currentStatVal) * calRate * (1 + modifier);
            }
        }

        return Math.floor(rawHeal);
    }

    process_phase_states(actor, phase, side, target) {
        /**フェーズに応じた状態効果の処理*/
        const statesToProcess = actor.states.filter(s => s.phase === phase && s.trigger_side === side);

        for (const state of statesToProcess) {
            if (state.name === "反撃") {
                this.add_log(`  [反撃] ${actor.colored_name} が ${target.colored_name} に反撃！`);
                this.process_attack_event(actor, target, state.value || 100, "weapon", "", "反撃");
            }

            if (state.name === "乱舞") {
                const enemies = actor.team === "A" ? this.army_b : this.army_a;
                for (const enemy of enemies) {
                    if (enemy.hp > 0 && enemy !== target) {
                        const dmgRate = state.value || 50;
                        this.add_log(`  [乱舞] の効果により ${enemy.colored_name} に波及！`);
                        this.process_attack_event(actor, enemy, dmgRate, "weapon", "", "乱舞");
                    }
                }
            }

            const isContDmg = CONT_DMG_STATUS.has(state.name);
            if (isContDmg) {
                const dmgRate = parseInt(state.rate || 100);
                if (Math.random() <= (dmgRate /100)) {
                    const val = parseInt(state.value);
                    const dmgType = "intel";
                    this.process_attack_event(state.source_busho, actor, val, dmgType, "", state.name);
                } else {
                    this.add_log(`  [${state.name}] ${actor.colored_name} が ${state.name}発動失敗！`);
                }
            }

            const isContHeal = CONT_HEAL_STATUS.has(state.name);
            if (isContHeal) {
                const healRate = parseInt(state.rate || 100);
                if (Math.random() <= (healRate /100)) {
                    const val = parseInt(state.value);
                    this.process_heal_event(state.source_busho, actor, val, "intl", state.source_skill);
                } else {
                    this.add_log(`  [${state.name}] ${actor.colored_name} が ${state.name}発動失敗！`);
                }
            }

            if (state.type === "special") {
                this.#handleSpecialStates(actor, phase, side, target, state);
            }
        }
    }

    #handleSpecialStates(actor, phase, side, target, state) {
        /**特殊状態の処理*/
        if (state.name === "全力戦闘_連撃(予備)") {
            if (this.turn >= parseInt(state.trigger_turn)) {
                const isSuccess = actor.add_state({
                    type: "buff_status",
                    name: "連撃",
                    rate: parseInt(state.rate),
                    duration: 4,
                    source_skill: "全力戦闘",
                    source_busho: state.source_busho,
                    conflict_rule: "STACK"
                }, this);

                if (isSuccess) {
                    const logMsg = ` -> ${actor.colored_name} が 連撃 を付与 (4ターン)`;
                    this.add_log(logMsg);
                    const idx = actor.states.indexOf(state);
                    if (idx > -1) actor.states.splice(idx, 1);
                    this.add_log(`  (効果終了) ${actor.colored_name} の [全力戦闘_連撃(予備)] が消失`);
                }
            }
        }

        if (state.name === "捨て身の義(予備)") {
            const dmgRate = (actor.hp / actor.max_hp) * 100;
            const dmgBorder = parseInt(state.value) - 20;
            if (dmgRate <= dmgBorder) {
                state.value = Math.floor(dmgRate / 20) * 20 + 20;
                const skill = actor.skills.find(s => s.name === "捨て身の義");
                if (skill) {
                    const newTargets = this.find_targets(actor, "self", "指揮");
                    const newEffect = { type: "buff_stat", value: 24, stat: "ldr", duration: "99", stack_max: "99" };
                    skill.add_buff(actor, newTargets[0], newEffect, this);

                    const newTargets2 = this.find_targets(actor, "friend_random_2", "指揮");
                    for (const newTarget of newTargets2) {
                        const effect1 = { type: "buff_stat", value: 12, stat: "pow", duration: "99", stack_max: "99" };
                        skill.add_buff(actor, newTarget, effect1, this);
                        const effect2 = { type: "buff_stat", value: 12, stat: "intl", duration: "99", stack_max: "99" };
                        skill.add_buff(actor, newTarget, effect2, this);
                    }
                }
            }
        }

        if (state.name === "懐柔_休養(予備)") {
            if (this.turn >= parseInt(state.trigger_turn)) {
                const isSuccess = actor.add_state({
                    phase: "before_action",
                    trigger_side: "attacker",
                    type: "heal",
                    name: "休養",
                    value: 84,
                    stat: "intl",
                    duration: 2,
                    source_skill: "懐柔",
                    source_busho: state.source_busho,
                    conflict_rule: "EXTEND"
                }, this);

                if (isSuccess) {
                    const logMsg = ` -> ${actor.colored_name} が 休養 を付与 (4ターン)`;
                    this.add_log(logMsg);
                    const idx = actor.states.indexOf(state);
                    if (idx > -1) actor.states.splice(idx, 1);
                    this.add_log(`  (効果終了) ${actor.colored_name} の [懐柔_休養(予備)] が消失`);
                    this.process_heal_event(state.source_busho, actor, 84, "intl", "懐柔");
                }
            }
        }
    }

    add_log(message, category = "info") {
        /**
         * メッセージを保存する。
         * category を分けることで、後で「ダメージだけ抽出」などが可能。
         */
        const formattedMsg = `T${this.turn}: ${message}`;
        this.battle_logs.push({
            turn: this.turn,
            category: category,
            text: formattedMsg
        });
        console.log(formattedMsg);
    }

    get_full_log() {
        /**全ログをひとつの文字列として結合して返す*/
        return this.battle_logs.map(log => log.text).join("\n");
    }

    run_battle(maxTurns = 8) {
        /**戦闘シミュレーションのメインループ*/
        this.add_log("=== 戦闘開始 ===");

        this.#processPreparationTurn();

        for (let t = 1; t <= maxTurns; t++) {
            this.turn = t;
            if (this.check_victory()) break;

            this.add_log(`--- 第 ${this.turn} ターン ---`);

            // 1. 行動順の決定
            const activeUnits = [...this.army_a, ...this.army_b].filter(u => u.hp > 0);

            const getPrioritySpeed = (busho) => {
                const baseSpeed = busho.current_spd;
                const hasSenko = busho.states.some(s => s.name === '先攻');
                const priorityBonus = hasSenko ? 1000 : 0;
                return baseSpeed + priorityBonus;
            };

            // シャッフルしてからソート
            activeUnits.sort(() => Math.random() - 0.5);
            const order = activeUnits.sort((a, b) => getPrioritySpeed(b) - getPrioritySpeed(a));

            // 2. 個別行動
            for (const busho of order) {
                if (busho.hp <= 0) continue;
                if (this.check_victory()) break;

                this.#processSingleBushoAct(busho);
            }

            // 3. ターン終了処理
            this.#processTurnEnd();
        }

        this.add_log("=== 戦闘終了 ===");
        //this.show_result();

        // 最後に統計に必要なデータをまとめて返す
        return {
            result: this.get_battle_result(), // "勝利", "敗北", "引分"
            armyA: this.army_a.map(b => ({
                name: b.name,
                damage: b.stats_log.damage_dealt, // 武将クラスに持たせている与ダメ合計
                taken: b.stats_log.damage_taken,
                heal:b.stats_log.healing,     // 回復合計
                hp: b.hp,                // 残り兵数
                wounded: b.wounded,      //負傷兵
                skill_details: Object.entries(b.stats_log.skill_details).map(([sName, sData]) => ({
                    name: sName,
                    ...sData
                }))
            })),
            armyB: this.army_b.map(b => ({
                name: b.name,
                damage: b.stats_log.damage_dealt, // 武将クラスに持たせている与ダメ合計
                taken: b.stats_log.damage_taken,
                heal:b.stats_log.healing,     // 回復合計
                hp: b.hp,                // 残り兵数
                wounded: b.wounded,      //負傷兵
                skill_details: Object.entries(b.stats_log.skill_details).map(([sName, sData]) => ({
                    name: sName,
                    ...sData
                }))
            }))
        };        
    }

    #processPreparationTurn() {
        /**準備ターンの処理：受動・指揮戦法を発動させる*/
        const activeUnits = [...this.army_a, ...this.army_b].filter(u => u.hp > 0);
        const order = activeUnits.sort((a, b) => b.current_spd - a.current_spd);

        // 2. 受動戦法（Passive）の発動
        for (const busho of order) {
            this.#executeSpecificTypeSkills(busho, "受動");
        }

        // 3. 指揮戦法（Command）の発動
        for (const busho of order) {
            this.#executeSpecificTypeSkills(busho, "指揮");
        }

        this.add_log("=== 戦闘準備完了 ===");
    }

    #processSingleBushoAct(busho) {
        /**1人の武将の行動フロー*/
        this.add_log(`${busho.colored_name} の行動`);

        // 行動前に継続時間0の状態を消去
        this.#cleanupBushoStates(busho);

        // A. 行動前フェーズ
        this.process_phase_states(busho, "before_action", "attacker", null);
        this.process_phase_states(busho, "before_action", "defender", null);

        // B. 行動制限チェック
        if (this.is_action_restricted(busho)) {
            this.#updateBushoStatesAtActionEnd(busho);
            return;
        }

        // C. 能動戦法フェーズ
        this.#executeSpecificTypeSkills(busho, "能動");

        // D. 通常攻撃フェーズ
        this.#processNormalAttackLoop(busho);

        // E. 行動後フェーズ
        this.process_phase_states(busho, "after_action", "attacker", null);
        this.process_phase_states(busho, "after_action", "defender", null);

        // 行動後に付与している状態の継続時間を-1
        this.#updateBushoStatesAtActionEnd(busho);
    }

    #processTurnEnd() {
        /**ターン終了時の状態更新*/
        for (const busho of [...this.army_a, ...this.army_b]) {
            // 負傷兵の死亡兵変換
            busho.wounded = Math.floor(busho.wounded * 0.9);
        }
    }

    check_victory() {
        /**主将が倒れたか、全滅したかを判定*/
        const mainA = this.army_a.find(u => u.is_main);
        const mainB = this.army_b.find(u => u.is_main);

        if (!mainA || !mainB) return false;

        if (mainA.hp <= 0 || this.army_a.every(u => u.hp <= 0)) {
            this.add_log("軍勢Bの勝利！");
            return true;
        }
        if (mainB.hp <= 0 || this.army_b.every(u => u.hp <= 0)) {
            this.add_log("軍勢Aの勝利！");
            return true;
        }
        return false;
    }

    show_result() {
        /**戦闘結果の表示*/
        console.log("\n" + "=".repeat(40));
        console.log("      ⚔️  戦闘リザルト  ⚔️");
        console.log("=".repeat(40));

        const allBusho = [...this.army_a, ...this.army_b];
        const mainA = this.army_a.find(u => u.is_main);
        const mainB = this.army_b.find(u => u.is_main);

        let winner = { 自軍: "引分", 敵軍: "引分" };
        if (mainA?.hp <= 0) {
            winner = { 自軍: "敗北", 敵軍: "勝利" };
        }
        if (mainB?.hp <= 0) {
            winner = { 自軍: "勝利", 敵軍: "敗北" };
        }

        for (const side of ["自軍", "敵軍"]) {
            const sideTag = side === "自軍" ? "A" : "E";
            const members = allBusho.filter(b => b.team === sideTag);

            console.log(`\n【${side}】${winner[side]}`);
            console.log(`${"武将名".padEnd(10)} | ${"兵数".padEnd(3)}(負傷)/${"最大兵数".padEnd(4)}|${"与ダメ".padStart(4)} | ${"被ダメ".padStart(4)} | ${"回復".padStart(4)}`);
            console.log("-".repeat(60));

            let sideTotal = 0;
            for (const b of members) {
                const s = b.stats_log;
                sideTotal += s.damage_dealt;
                console.log(`${b.name.padEnd(10)} |${String(b.hp).padStart(5)} (${b.wounded})/ ${String(b.max_hp).padStart(4)} |${String(s.damage_dealt).padStart(7)} | ${String(s.damage_taken).padStart(7)} | ${String(s.healing).padStart(7)}`);
            }

            console.log(`--- 陣営合計与ダメ: ${sideTotal} ---`);
        }

        console.log("\n" + "=".repeat(60));
        console.log("\n" + "─".repeat(50));
        console.log("      📜 戦 法 発 動 詳 細 📜");
        console.log("─".repeat(50));

        for (const b of allBusho) {
            if (Object.keys(b.stats_log.skill_details).length === 0) continue;

            console.log(`\n【${b.colored_name}】`);
            console.log(`  ${"戦法名".padEnd(15)} | ${"発動数".padStart(3)} | ${"合計ダメージ".padStart(3)} | ${"平均".padStart(4)}`);
            console.log("  " + "-".repeat(40));

            for (const [sName, sData] of Object.entries(b.stats_log.skill_details)) {
                const avg = sData.count > 0 ? Math.floor(sData.dmg / sData.count) : 0;
                console.log(`  ${sName.padEnd(15)} | ${String(sData.count).padStart(5)} | ${String(sData.dmg).padStart(10)} | ${String(avg).padStart(7)}`);
            }
        }
    }

    is_action_restricted(busho) {
        /**
         * 武将の行動制限（威圧・麻痺など）をチェックする。
         * 行動できない場合は True を返す。
         */
        const restrictionStates = busho.states.filter(
            s => s.type === "status_effect" && s.fail_rate !== undefined
        );

        if (restrictionStates.length === 0) {
            return false;
        }

        const maxFailRate = Math.max(...restrictionStates.map(s => s.fail_rate));
        const primaryState = restrictionStates.find(s => s.fail_rate === maxFailRate) || restrictionStates[0];

        if (Math.random() <= (maxFailRate / 100)) {
            this.add_log(`  !! ${busho.colored_name} は【${primaryState.name}】により行動できない！`);
            return true;
        }

        return false;
    }

    #executeSpecificTypeSkills(busho, skillType) {
        /**指定タイプの戦法を発動*/
        const targetSkills = busho.skills.filter(s => s.type === skillType);

        // 無策（能動戦法発動不可）チェック
        if (skillType === "能動") {
            if (busho.states.some(s => s.type === 'status_effect' && s.name === '無策')) {
                this.add_log(`  ${busho.colored_name} は無策状態で能動戦法発動不可`);
                return;
            }
            if (busho.states.some(s => s.type === 'status_effect' && s.name === '再発動不可')) {
                this.add_log(`  ${busho.colored_name} は再発動不可`);
                return;
            }
        }

        for (const skill of targetSkills) {
            let isPrep = false;
            for (const s of busho.states) {
                if (s.type === "preparation" && s.value === skill) {
                    isPrep = true;
                    s.duration = parseInt(s.duration) - 1;
                }
            }

            let sRate = skill.rate;
            if (skillType === "能動") {
                if (busho.skills[1] === skill) {
                    sRate = skill.rate + busho.current_rate_active + busho.current_rate_unique_active;
                }
            } else if (skillType === "突撃") {
                if (busho.skills[1] === skill) {
                    sRate = skill.rate + busho.current_rate_assault + busho.current_rate_unique_assault;
                }
            }

            if (sRate !== skill.rate) {
                this.add_log(`  ${busho.colored_name} は【${skill.colored_name}】の発動率変更（${skill.rate}％ -> ${sRate}％)`);
            }
            
            if ((Math.random() <= (sRate /100)) || isPrep) {
                if (!isPrep) {
                    const prepState = {
                        name: `準備:${skill.name}`,
                        type: "preparation",
                        duration: skill.prepTurns,
                        value: skill,
                        conflict_rule: "NONE",
                        source_skill: skill,
                        source_busho: busho
                    };

                    const success = busho.add_state(prepState, this);
                    if (success && skill.prepTurns > 0) {
                        this.add_log(`  ${busho.colored_name} が 【${skill.colored_name}】 の準備を開始！`);
                    }
                }

                for (const s of busho.states) {
                    if (s.type === "preparation" && s.duration === 0 && s.value === skill) {
                        skill.execute(busho, this);
                        const idx = busho.states.indexOf(s);
                        if (idx > -1) busho.states.splice(idx, 1);
                    }
                }
            } else {
                this.add_log(`${busho.colored_name} は戦法 【${skill.colored_name}】発動失敗！`);
            }
        }
    }

    #processNormalAttackLoop(busho) {
        /**通常攻撃ループ*/
        // 封撃（通常攻撃不可）チェック
        if (busho.states.some(s => s.type === 'status_effect' && s.name === '封撃')) {
            this.add_log(`  ${busho.colored_name} は封撃状態で通常攻撃不可`);
            return;
        }

        // 連撃状態なら回数を増やす
        let attackCount = 1;
        for (const s of busho.states) {
            if (s.type === 'buff_status' && s.name === '連撃') {
                const isRengeki = Math.random()  <= (parseInt(s.rate || 100) /100);
                if (isRengeki) {
                    attackCount = 2;
                } else {
                    this.add_log(`  ${busho.colored_name} は ${s.source_skill} の連撃発動失敗`);
                }
            }
        }

        for (let i = 0; i < attackCount; i++) {
            const targets = this.find_targets(busho, "enemy_random_1", "通常");
            if (targets.length === 0) break;

            const actualDmg = this.process_attack_event(busho, targets[0], 100, "weapon", busho.skills[0]);
            busho.last_normal_attack_damage = actualDmg;

            // 突撃戦法フェーズ
            this.#executeSpecificTypeSkills(busho, "突撃");

            // 範囲攻撃フェーズ
            this.process_phase_states(busho, "range_attack", "attacker", targets[0]);

            // 反撃攻撃フェーズ
            this.process_phase_states(targets[0], "counter_attack", "defender", busho);
        }
    }

    #updateBushoStatesAtActionEnd(busho) {
        /**武将の行動終了時に持続時間を減らす*/
        for (const s of busho.states) {
            if (s.duration !== undefined && s.type !== "preparation") {
                s.duration = parseInt(s.duration) - 1;
            }
        }
    }

    #cleanupBushoStates(busho) {
        /**武将の行動前処理時に持続時間0の状態を消去*/
        const statesToRemove = [];

        for (const s of busho.states) {
            if (s.duration !== undefined && s.duration === 0) {
                const sType = s.type;
                const sStat = s.stat;
                const sVal = s.value || 0;
                const sName = s.name || "効果";

                statesToRemove.push(s);

                if ((sType === "buff_stat" || sType === "debuff_stat") && sStat in STAT_MAP) {
                    const statName = STAT_MAP[sStat];
                    const currentVal = busho[`current_${sStat}`];

                    const isCutStat = sStat.includes("cut");
                    let displayLabel;
                    if (sType === "buff_stat") {
                        displayLabel = isCutStat ? "増加" : "減少";
                    } else {
                        displayLabel = isCutStat ? "減少" : "増加";
                    }

                    this.add_log(`  (効果終了) ${busho.colored_name} の [${sName}] が消失：${statName} が ${sVal} ${displayLabel} (現在: ${currentVal})`);
                } else {
                    this.add_log(`  (効果終了) ${busho.colored_name} の [${sName}] が消失`);
                }
            }
        }

        for (const s of statesToRemove) {
            const idx = busho.states.indexOf(s);
            if (idx > -1) busho.states.splice(idx, 1);
        }
    }
    get_battle_result() {
        const leaderA = this.army_a[0]; // 配列の先頭が大将と想定
        const leaderB = this.army_b[0];

        if (leaderB.hp <= 0) return "勝利";
        if (leaderA.hp <= 0) return "敗北";
        return "引分";
    }
}
