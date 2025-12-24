// ui.js
import { calcDamage } from "./formulas.js";

const STORAGE_KEY = "skrb_damage_calc_v1";

const DEFAULTS = {
  // 상단
  skill_coef: 1,
  armor_ignore: 0,
  crit_on: false,
  weak_on: false,
  block_on: false,

  // 공격자
  atk_use_equip: false,
  atk_deck: "default",
  atk_base: 0,
  atk_add: 0,
  atk_pet: 0,
  atk_transcend_bonus: 0,
  atk_form_bonus: 0,
  atk_buff_pet: 0,
  atk_buff_always: 0,
  atk_buff_turn: 0,
  atk_debuff_always: 0,
  atk_debuff_turn: 0,

  dmg_inc_revenge: 0,
  dmg_inc_always: 0,
  dmg_inc_turn: 0,
  dmg_dec_always: 0,
  dmg_dec_turn: 0,

  crit_dmg_stat: 1.5,
  crit_dmg_always: 0,
  crit_dmg_turn: 0,

  weak_dmg_stat: 1.3,
  weak_dmg_always: 0,
  weak_dmg_turn: 0,

  // 피격자
  def_use_equip: false,
  def_deck: "default",
  def_base: 0,
  def_add: 0,
  def_pet: 0,
  def_transcend_bonus: 0,
  def_form_bonus: 0,
  def_buff_pet: 0,
  def_buff_always: 0,
  def_buff_turn: 0,
  def_debuff_always: 0,
  def_debuff_turn: 0,

  taken_dec_stat: 0,
  taken_dec_always: 0,
  taken_dec_turn: 0,

  taken_inc_always: 0,
  taken_inc_turn: 0,

  block_dec_stat: 0,
  is_jave: false,

  // 장비(키만 확보)
  w1_flat_atk: 0, w1_main_opt:"", w1_main_val:0, w1_s1_opt:"", w1_s1_val:0, w1_s2_opt:"", w1_s2_val:0, w1_s3_opt:"", w1_s3_val:0,
  w2_flat_atk: 0, w2_main_opt:"", w2_main_val:0, w2_s1_opt:"", w2_s1_val:0, w2_s2_opt:"", w2_s2_val:0, w2_s3_opt:"", w2_s3_val:0,
  a1_flat_def: 0, a1_main_opt:"", a1_main_val:0, a1_s1_opt:"", a1_s1_val:0, a1_s2_opt:"", a1_s2_val:0, a1_s3_opt:"", a1_s3_val:0,
  a2_flat_def: 0, a2_main_opt:"", a2_main_val:0, a2_s1_opt:"", a2_s1_val:0, a2_s2_opt:"", a2_s2_val:0, a2_s3_opt:"", a2_s3_val:0,
};

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return { ...DEFAULTS };
    const obj = JSON.parse(raw);
    return { ...DEFAULTS, ...obj };
  }catch{
    return { ...DEFAULTS };
  }
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatNum(n){
  if(!Number.isFinite(n)) return "-";
  const x = Math.round(n);
  return x.toLocaleString("ko-KR");
}

function formatFloat(n){
  if(!Number.isFinite(n)) return "-";
  return (Math.round(n * 100000) / 100000).toString();
}

let state = loadState();

function bindTabs(){
  $$(".tabs").forEach(tabsEl=>{
    const bar = $(".tabs__bar", tabsEl);
    bar.addEventListener("click", (e)=>{
      const btn = e.target.closest(".tab");
      if(!btn) return;
      const key = btn.dataset.tab;

      $$(".tab", bar).forEach(b=>b.classList.toggle("is-active", b === btn));
      $$(".tabs__panel", tabsEl).forEach(p=>{
        p.classList.toggle("is-active", p.dataset.panel === key);
      });
    });
  });
}

function setEquipEnabled(){
  const on = !!state.atk_use_equip || !!state.def_use_equip;
  $("#equip_state").textContent = `장비 관리: ${on ? "ON" : "OFF"}`;
  $("#equip_wrap").style.opacity = on ? "1" : ".45";
  $("#equip_wrap").style.pointerEvents = on ? "auto" : "none";
}

function applyStateToInputs(){
  $$("[data-k]").forEach(el=>{
    const k = el.dataset.k;
    const v = state[k];

    if(el.type === "checkbox"){
      el.checked = !!v;
      return;
    }

    if(el.tagName === "SELECT"){
      el.value = (v ?? "");
      return;
    }

    // input number/text
    el.value = (v ?? "");
  });

  setEquipEnabled();
}

function readInputsToState(){
  const next = { ...state };
  $$("[data-k]").forEach(el=>{
    const k = el.dataset.k;

    if(el.type === "checkbox"){
      next[k] = el.checked;
      return;
    }

    if(el.tagName === "SELECT"){
      next[k] = el.value;
      return;
    }

    // number input
    if(el.type === "number"){
      const s = el.value;
      next[k] = s === "" ? 0 : Number(s);
      return;
    }

    next[k] = el.value;
  });

  state = next;
  saveState(state);
  setEquipEnabled();
}

function render(){
  const out = calcDamage(state);

  $("#result_dmg").textContent = formatNum(out.dmg);
  $("#result_hint").textContent =
    `atkEff(${formatFloat(out.debug.atkEff)}) × skill(${formatFloat(state.skill_coef)}) × defFactor(${formatFloat(out.debug.defFactor)})`;

  // debug
  $("#dbg_atkEff").textContent = formatFloat(out.debug.atkEff);
  $("#dbg_defEff").textContent = formatFloat(out.debug.defEff);
  $("#dbg_defFactor").textContent = formatFloat(out.debug.defFactor);

  $("#dbg_giveInc").textContent = formatFloat(out.debug.giveInc);
  $("#dbg_giveDec").textContent = formatFloat(out.debug.giveDec);
  $("#dbg_takeInc").textContent = formatFloat(out.debug.takeInc);
  $("#dbg_takeDec").textContent = formatFloat(out.debug.takeDec);

  $("#dbg_critMul").textContent = formatFloat(out.debug.critMul);
  $("#dbg_weakMul").textContent = formatFloat(out.debug.weakMul);
  $("#dbg_blockMul").textContent = formatFloat(out.debug.blockMul);
}

function bindInputEvents(){
  // 입력 즉시 반영
  document.addEventListener("input", (e)=>{
    const el = e.target.closest("[data-k]");
    if(!el) return;
    readInputsToState();
    render();
  });
  document.addEventListener("change", (e)=>{
    const el = e.target.closest("[data-k]");
    if(!el) return;
    readInputsToState();
    render();
  });

  // 초기화
  $("#btn_reset").addEventListener("click", ()=>{
    state = { ...DEFAULTS };
    saveState(state);
    applyStateToInputs();
    render();
  });

  // 내보내기
  $("#btn_export").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "damage_calc_state.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // 가져오기
  $("#btn_import").addEventListener("click", ()=>{
    $("#import_file").click();
  });
  $("#import_file").addEventListener("change", async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    try{
      const txt = await f.text();
      const obj = JSON.parse(txt);
      state = { ...DEFAULTS, ...obj };
      saveState(state);
      applyStateToInputs();
      render();
    }catch{
      alert("JSON 가져오기에 실패했습니다.");
    }finally{
      e.target.value = "";
    }
  });
}

bindTabs();
applyStateToInputs();
bindInputEvents();
render();
