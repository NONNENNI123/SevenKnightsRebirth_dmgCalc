// formulas.js
export const CONST = { DEF_CONST: 467 };

const n = (x,d=0)=> (Number.isFinite(Number(x))? Number(x): d);
const clamp01 = (x)=> Math.max(0, Math.min(1, n(x,0)));

export function calcAll(state){
  // ✅ 임시 계산(UI용)
  // 다음 단계에서 엑셀 수식(수식_공격력/수식_방어력/피증/피감/받피증/받피감/치명/약점/막기)을 그대로 이 함수로 옮기면 됨.
  const atk = n(state.atk_base)+n(state.atk_add)+n(state.atk_pet);
  const def = n(state.def_base)+n(state.def_add)+n(state.def_pet);

  const skill = n(state.skill_coef, 1);
  const armorIgnore = clamp01(state.armor_ignore);

  const giveInc = 1 + n(state.dmg_inc_revenge) + n(state.dmg_inc_always) + n(state.dmg_inc_turn);
  const giveDec = 1 - n(state.dmg_dec_always) - n(state.dmg_dec_turn);

  const takeInc = 1 + n(state.taken_inc_always) + n(state.taken_inc_turn);
  const takeDec = (1 - n(state.taken_dec_stat)) * (1 - n(state.taken_dec_always) - n(state.taken_dec_turn));

  const critMul = state.crit_on ? (n(state.crit_dmg_stat,1) + n(state.crit_dmg_always) + n(state.crit_dmg_turn)) : 1;
  const weakMul = state.weak_on ? (n(state.weak_dmg_stat,1) + n(state.weak_dmg_always) + n(state.weak_dmg_turn)) : 1;
  const blockMul = state.block_on ? (1 - n(state.block_dec_stat)) : 1;

  const defEff = Math.max(0, def * (1 - armorIgnore));
  const defFactor = CONST.DEF_CONST / (defEff + CONST.DEF_CONST);

  const atkEff = atk; // 임시
  const dmg = atkEff * skill * giveInc * giveDec * takeInc * takeDec * critMul * weakMul * blockMul * defFactor;

  return {
    dmg,
    debug: { atkEff, defEff, defFactor, giveInc, giveDec, takeInc, takeDec, critMul, weakMul, blockMul }
  };
}
