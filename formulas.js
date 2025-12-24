// formulas.js
export function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function toNum(x, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

// (1) 공격력 유효값
export function calcAtkEff(v) {
  // v: normalized input
  // 예시: 엑셀 구조 기반
  const base = v.atk_base + v.atk_add + v.atk_pet
    + (v.atk_base * v.atk_form_bonus / (1 + v.atk_transcend_bonus));

  const mul = 1
    + v.atk_buff_pet + v.atk_buff_always + v.atk_buff_turn
    - v.atk_debuff_always - v.atk_debuff_turn;

  return base * mul;
}

// (2) 방어력 유효값
export function calcDefEff(v) {
  const base = v.def_base + v.def_add + v.def_pet
    + (v.def_base * v.def_form_bonus / (1 + v.def_transcend_bonus));

  const mul = 1
    + v.def_buff_pet + v.def_buff_always + v.def_buff_turn
    - v.def_debuff_always - v.def_debuff_turn;

  const after = base * mul * (1 - clamp01(v.armor_ignore));

  // 제이브 예외 같은 건 여기서 분기
  const javeBonus = v.is_jave ? Math.min(Math.floor(v.atk_eff / 300) * 125, 1125) : 0;
  return after + javeBonus;
}

// (3) 배율들
export function calcMultipliers(v) {
  const giveInc = 1 + v.dmg_inc_revenge + v.dmg_inc_always + v.dmg_inc_turn;
  const giveDec = 1 - v.dmg_dec_always - v.dmg_dec_turn;

  const takeInc = 1 + v.taken_inc_always + v.taken_inc_turn;

  // "스탯 받피감"은 곱으로 분리(엑셀 반영)
  const takeDec = (1 - v.taken_dec_stat) * (1 - v.taken_dec_always - v.taken_dec_turn);

  const critMul = v.crit_on ? (v.crit_dmg_stat + v.crit_dmg_always + v.crit_dmg_turn) : 1;
  const weakMul = v.weak_on ? (v.weak_dmg_stat + v.weak_dmg_always + v.weak_dmg_turn) : 1;
  const blockMul = v.block_on ? (1 - v.block_dec_stat) : 1;

  return { giveInc, giveDec, takeInc, takeDec, critMul, weakMul, blockMul };
}

export function calcDamage(v, DEF_CONST) {
  // v.skill_coef: 스킬 계수(배율)
  const atkEff = calcAtkEff(v);
  v.atk_eff = atkEff; // 제이브 보너스에서 쓰려고 저장(원하면 리턴 구조로 분리해도 됨)

  const defEff = calcDefEff(v);
  const defFactor = DEF_CONST / (defEff + DEF_CONST);

  const m = calcMultipliers(v);

  const dmg = atkEff * v.skill_coef
    * m.giveInc * m.giveDec * m.takeInc * m.takeDec
    * m.critMul * m.weakMul * m.blockMul
    * defFactor;

  return { dmg, atkEff, defEff, defFactor, m };
}
