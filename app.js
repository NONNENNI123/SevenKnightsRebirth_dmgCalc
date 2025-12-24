import cfg from "./config.json" assert { type:"json" };
import { calcAll } from "./formulas.js";

const STORE = "skrb_calc_state_v2";

const DEFAULT = {
  // top
  skill_coef: 4.7,
  armor_ignore: 0.65,
  crit_on: true,
  weak_on: true,
  block_on: false,

  // attacker base
  atk_base: 2040,
  atk_add: 1623,
  atk_pet: 371,
  dmg_inc_revenge: 1.1,
  crit_dmg_stat: 2.94,
  weak_dmg_stat: 1.3,

  // attacker buffs (direct fields, 엑셀 핵심)
  atk_buff_always: 0.33,
  atk_buff_turn: 0,
  dmg_inc_always: 0.15,
  dmg_inc_turn: 0.28,
  dmg_dec_always: 0,
  dmg_dec_turn: 0,
  crit_dmg_always: 0.4,
  crit_dmg_turn: 0,
  weak_dmg_always: 0,
  weak_dmg_turn: 0,
  atk_debuff_always: 0,
  atk_debuff_turn: 0,

  // attacker etc
  atk_transcend_bonus: 0.36,
  atk_form_bonus: 0.42,
  atk_buff_pet: 0.17,

  // defender base
  def_base: 1510,
  def_add: 0,
  def_pet: 0,
  taken_dec_stat: 0,
  block_dec_stat: 1.5,

  // defender buffs
  def_buff_always: 0,
  def_buff_turn: 0,
  def_debuff_always: 0.24,
  def_debuff_turn: 0.41,
  taken_dec_always: 0,
  taken_dec_turn: 0,
  taken_inc_always: 0,
  taken_inc_turn: 0,

  // defender etc
  def_transcend_bonus: 0,
  def_form_bonus: 0,
  def_buff_pet: 0,
  is_jave: false,

  // sets (3개)
  set1_type: "주는 피해량", set1_val: 15,
  set2_type: "주는 피해량", set2_val: 30,
  set3_type: "보스 대상 피해량", set3_val: 80,

  // equipment toggles
  atk_use_equip: true,
  def_use_equip: false,

  // equipment (공격자)
  atk_w1_flat: 304, atk_w1_main:"", atk_w1_main_val:0, atk_w1_s1:"치명타 데미지", atk_w1_s1_val:24, atk_w1_s2:"치명타 데미지", atk_w1_s2_val:24, atk_w1_s3:"공격력 %", atk_w1_s3_val:5,
  atk_w2_flat: 304, atk_w2_main:"치명타 데미지", atk_w2_main_val:36, atk_w2_s1:"치명타 데미지", atk_w2_s1_val:18, atk_w2_s2:"깡공격력", atk_w2_s2_val:50, atk_w2_s3:"", atk_w2_s3_val:0,
  atk_a1_flat: 0,   atk_a1_main:"공격력 %", atk_a1_main_val:28, atk_a1_s1:"치명타 데미지", atk_a1_s1_val:24, atk_a1_s2:"깡공격력", atk_a1_s2_val:50, atk_a1_s3:"", atk_a1_s3_val:0,
  atk_a2_flat: 0,   atk_a2_main:"공격력 %", atk_a2_main_val:28, atk_a2_s1:"치명타 데미지", atk_a2_s1_val:18, atk_a2_s2:"", atk_a2_s2_val:0, atk_a2_s3:"", atk_a2_s3_val:0,

  // equipment (피격자)
  def_w1_flat: 0, def_w1_main:"", def_w1_main_val:0, def_w1_s1:"", def_w1_s1_val:0, def_w1_s2:"", def_w1_s2_val:0, def_w1_s3:"", def_w1_s3_val:0,
  def_w2_flat: 0, def_w2_main:"", def_w2_main_val:0, def_w2_s1:"", def_w2_s1_val:0, def_w2_s2:"", def_w2_s2_val:0, def_w2_s3:"", def_w2_s3_val:0,
  def_a1_flat: 60, def_a1_main:"받는 피해 감소", def_a1_main_val:5.8, def_a1_s1:"방어력 %", def_a1_s1_val:4, def_a1_s2:"깡방어력", def_a1_s2_val:21, def_a1_s3:"", def_a1_s3_val:0,
  def_a2_flat: 0,  def_a2_main:"", def_a2_main_val:0, def_a2_s1:"", def_a2_s1_val:0, def_a2_s2:"", def_a2_s2_val:0, def_a2_s3:"", def_a2_s3_val:0,

  // Buff rows (엑셀처럼 표로 확장 가능한 구조)
  rows_attacker: [
    { type:"공격력 증가 (상시)", value:0.33 },
    { type:"치명타 데미지 증가 (상시)", value:0.4 },
    { type:"주는 피해 증가 (상시)", value:0.15 },
    { type:"주는 피해 증가 (턴제)", value:0.28 }
  ],
  rows_defender: [
    { type:"방어력 감소 (상시)", value:0.24 },
    { type:"방어력 감소 (턴제)", value:0.41 }
  ]
};

function load(){
  try{
    const s = localStorage.getItem(STORE);
    if(!s) return structuredClone(DEFAULT);
    return { ...structuredClone(DEFAULT), ...JSON.parse(s) };
  }catch{
    return structuredClone(DEFAULT);
  }
}
function save(st){ localStorage.setItem(STORE, JSON.stringify(st)); }

const fmtInt = (x)=> (Number.isFinite(x)? Math.round(x).toLocaleString("ko-KR") : "-");
const fmt = (x)=> (Number.isFinite(x)? (Math.round(x*100000)/100000).toString() : "-");

let state = load();

const routes = [
  { id:"dashboard", name:"대시보드", desc:"최종 데미지와 핵심 요약", dot:"" },
  { id:"attacker", name:"공격자", desc:"기본/초월/진형/펫", dot:"" },
  { id:"defender", name:"피격자", desc:"기본/초월/진형/펫/제이브", dot:"" },
  { id:"buffs", name:"버프/디버프", desc:"행 추가/삭제로 관리", dot:"" },
  { id:"equipment", name:"장비", desc:"무기/방어구 옵션", dot:"" },
  { id:"debug", name:"디버그", desc:"엑셀 값 맞추기", dot:"" }
];

function toast(msg){
  const t = document.querySelector(".toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1200);
}

function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === "class") e.className = v;
    else if(k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
    else if(k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for(const c of children){
    if(c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function inputNumber(k, labelText, helpText="", step="0.001"){
  return el("div",{class:"field"},[
    el("div",{class:"labelRow"},[
      el("div",{class:"label"},[labelText]),
      el("div",{class:"help"},[helpText])
    ]),
    el("input",{class:"input", type:"number", step, value: state[k] ?? 0,
      oninput:(e)=>{ state[k]= (e.target.value===""?0:Number(e.target.value)); save(state); render(); }
    })
  ]);
}

function switcher(k, text){
  return el("label",{class:"switch"},[
    el("input",{type:"checkbox", checked: state[k] ? true : false,
      onchange:(e)=>{ state[k]=e.target.checked; save(state); render(); }
    }),
    el("span",{},[text])
  ]);
}

function selectBox(k, labelText, list){
  const s = el("select",{class:"input"}, list.map(v=>el("option",{value:v},[v])));
  s.value = state[k] ?? "";
  s.addEventListener("change",(e)=>{ state[k]=e.target.value; save(state); render(); });
  return el("div",{class:"field"},[
    el("div",{class:"labelRow"},[ el("div",{class:"label"},[labelText]), el("div",{class:"help"},[""]) ]),
    s
  ]);
}

function headerBlock(route){
  const out = calcAll(state);

  const kpi = el("div",{class:"kpi"},[
    el("div",{class:"panel tile"},[
      el("div",{class:"k"},["스킬/방무/상황"]),
      el("div",{class:"v"},[`×${fmt(state.skill_coef)}`]),
      el("div",{class:"s"},[`방무 ${fmt(state.armor_ignore)} · 치명 ${state.crit_on?"ON":"OFF"} · 약점 ${state.weak_on?"ON":"OFF"} · 막기 ${state.block_on?"ON":"OFF"}`]),
    ]),
    el("div",{class:"panel tile"},[
      el("div",{class:"k"},["장비 관리"]),
      el("div",{class:"v"},[`${state.atk_use_equip?"공격자":"-"} / ${state.def_use_equip?"피격자":"-"}`]),
      el("div",{class:"s"},["장비 페이지에서 세부 옵션 수정"])
    ])
  ]);

  const actions = el("div",{class:"panel btnRow"},[
    el("button",{class:"btn primary", onclick:()=>{ save(state); toast("저장 완료"); }},["저장"]),
    el("button",{class:"btn", onclick:()=>exportJSON();},["내보내기"]),
    el("button",{class:"btn", onclick:()=>importJSON();},["가져오기"]),
    el("button",{class:"btn", onclick:()=>{ state=structuredClone(DEFAULT); save(state); render(); toast("초기화"); }},["초기화"]),
  ]);

  const resultPanel = el("div",{class:"panel topResult"},[
    el("div",{},[
      el("div",{class:"bigLabel"},["최종 데미지"]),
      el("div",{class:"bigNum"},[fmtInt(out.dmg)]),
      el("div",{class:"bigHint"},[`atkEff(${fmt(out.debug.atkEff)}) × skill(${fmt(state.skill_coef)}) × defFactor(${fmt(out.debug.defFactor)})`]),
    ])
  ]);

  return el("div",{},[
    el("div",{class:"header"},[
      el("div",{class:"headerLeft"},[
        el("div",{class:"hTitle"},[route.name]),
        el("div",{class:"hDesc"},[route.desc])
      ]),
      el("div",{class:"headerRight"},[ resultPanel, kpi, actions ])
    ])
  ]);
}

function pageDashboard(){
  const out = calcAll(state);
  return el("div",{class:"grid"},[
    el("div",{class:"card", style:"grid-column: span 12;"},[
      el("div",{class:"cardTitle"},[
        el("h3",{},["빠른 설정"]),
        el("p",{},["엑셀 상단(스킬/방무/치명/약점/막기)과 동일"])
      ]),
      el("div",{class:"row2"},[
        inputNumber("skill_coef","스킬 계수","예: 4.7","0.001"),
        inputNumber("armor_ignore","방어 무시(0~1)","예: 0.65","0.001"),
        switcher("crit_on","치명타"),
        switcher("weak_on","약점공격"),
        switcher("block_on","막기")
      ])
    ]),
    el("div",{class:"card", style:"grid-column: span 6;"},[
      el("div",{class:"cardTitle"},[el("h3",{},["핵심 중간값"]), el("p",{},["엑셀 값 맞추기용 요약"]) ]),
      el("table",{class:"table"},[
        el("thead",{},[el("tr",{},[
          el("th",{},["항목"]), el("th",{},["값"])
        ])]),
        el("tbody",{},[
          trKV("atkEff", fmt(out.debug.atkEff)),
          trKV("defEff", fmt(out.debug.defEff)),
          trKV("defFactor", fmt(out.debug.defFactor)),
          trKV("giveInc", fmt(out.debug.giveInc)),
          trKV("takeDec", fmt(out.debug.takeDec))
        ])
      ])
    ]),
    el("div",{class:"card", style:"grid-column: span 6;"},[
      el("div",{class:"cardTitle"},[el("h3",{},["메모"]), el("p",{},["사용자 안내(추후 텍스트 수정 가능)"]) ]),
      el("div",{style:"color:var(--muted); font-size:13px; line-height:1.6;"},[
        "페이지가 나뉘어 있어도 상태는 모두 공유됩니다. ",
        "각 페이지 입력을 바꾸면 대시보드 결과가 바로 갱신됩니다. ",
        "다음 단계에서 formulas.js를 엑셀 공식 그대로 교체하면 1:1 결과가 나옵니다."
      ])
    ])
  ]);

  function trKV(k,v){
    return el("tr",{},[ el("td",{},[k]), el("td",{},[v]) ]);
  }
}

function pageAttacker(){
  return el("div",{class:"grid"},[
    cardSection("공격자 · 기본 스탯", "엑셀: 때리는놈(B열 입력)", [
      inputNumber("atk_base","기본 공격력","", "1"),
      inputNumber("atk_add","추가 공격력","", "1"),
      inputNumber("atk_pet","성장 효과 공격력(펫)","", "1"),
      inputNumber("crit_dmg_stat","치명타 데미지(배율)","예: 2.94","0.001"),
      inputNumber("weak_dmg_stat","약점공격 데미지(배율)","예: 1.3","0.001"),
      inputNumber("dmg_inc_revenge","복수자 보너스(배율)","예: 1.1","0.001")
    ], 12),

    cardSection("공격자 · 기타(초월/진형/펫 스킬)", "엑셀: 기타/펫 영역", [
      inputNumber("atk_transcend_bonus","초월 공증","", "0.001"),
      inputNumber("atk_form_bonus","진형 보너스(공)","", "0.001"),
      inputNumber("atk_buff_pet","펫 스킬 공증","", "0.001"),
      switcher("atk_use_equip","장비 관리(공격자)")
    ], 12),
  ]);
}

function pageDefender(){
  return el("div",{class:"grid"},[
    cardSection("피격자 · 기본 스탯", "엑셀: 맞는놈(J열 입력)", [
      inputNumber("def_base","기본 방어력","", "1"),
      inputNumber("def_add","추가 방어력","", "1"),
      inputNumber("def_pet","성장 효과 방어력(펫)","", "1"),
      inputNumber("taken_dec_stat","받는 피해 감소(스탯)","예: 0.2=20%","0.001"),
      inputNumber("block_dec_stat","막기 데미지 감소(스탯)","정의는 엑셀과 동일","0.001"),
    ], 12),

    cardSection("피격자 · 기타(초월/진형/펫/예외)", "엑셀: 기타/펫 + 제이브 토글", [
      inputNumber("def_transcend_bonus","초월 방증","", "0.001"),
      inputNumber("def_form_bonus","진형 보너스(방)","", "0.001"),
      inputNumber("def_buff_pet","펫 스킬 방증","", "0.001"),
      switcher("def_use_equip","장비 관리(피격자)"),
      switcher("is_jave","제이브(예외)")
    ], 12)
  ]);
}

function pageBuffs(){
  return el("div",{class:"grid"},[
    el("div",{class:"card", style:"grid-column: span 12;"},[
      el("div",{class:"cardTitle"},[
        el("h3",{},["세트 효과(1~3)"]),
        el("p",{},["엑셀: 세트효과 1~3"])
      ]),
      el("div",{class:"form"},[
        selectBox("set1_type","세트효과 1", cfg.lists.set_effects),
        inputNumber("set1_val","수치","", "0.001"),
        selectBox("set2_type","세트효과 2", cfg.lists.set_effects),
        inputNumber("set2_val","수치","", "0.001"),
        selectBox("set3_type","세트효과 3", cfg.lists.set_effects),
        inputNumber("set3_val","수치","", "0.001"),
      ])
    ]),

    el("div",{class:"card", style:"grid-column: span 12;"},[
      el("div",{class:"cardTitle"},[
        el("h3",{},["버프/디버프 테이블"]),
        el("p",{},["엑셀 자버프/상시/턴제 입력을 행 기반으로 관리(추가/삭제)"])
      ]),
      el("div",{class:"row2"},[
        el("span",{class:"badge good"},[el("span",{class:"bDot"}), "공격자 행"]),
        el("button",{class:"smallBtn", onclick:()=>{ state.rows_attacker.push({type:cfg.lists.buff_inc_dec[0], value:0}); save(state); render(); }},["+ 공격자 행 추가"]),
        el("span",{class:"badge warn"},[el("span",{class:"bDot"}), "피격자 행"]),
        el("button",{class:"smallBtn", onclick:()=>{ state.rows_defender.push({type:cfg.lists.buff_inc_dec[0], value:0}); save(state); render(); }},["+ 피격자 행 추가"]),
      ]),
      el("div",{style:"height:10px"}),

      el("div",{style:"display:grid; grid-template-columns: 1fr; gap:12px;"},[
        buffTable("공격자 rows_attacker", "rows_attacker", cfg.lists.buff_inc_dec),
        buffTable("피격자 rows_defender", "rows_defender", cfg.lists.buff_inc_dec)
      ])
    ])
  ]);

  function buffTable(title, key, list){
    const rows = state[key] ?? [];
    return el("div",{},[
      el("div",{style:"display:flex; justify-content:space-between; align-items:center; margin:6px 0 8px;"},[
        el("div",{style:"font-weight:950; color:rgba(234,240,255,.92)"},[title]),
        el("div",{style:"color:var(--muted); font-size:12px;"},["(추후: MAXIFS/SUMIFS 규칙을 formulas.js에서 반영)"])
      ]),
      el("table",{class:"table"},[
        el("thead",{},[el("tr",{},[
          el("th",{},["타입(드롭다운)"]),
          el("th",{},["수치"]),
          el("th",{},[""])
        ])]),
        el("tbody",{}, rows.map((r,idx)=>rowTr(key, idx, r, list)))
      ])
    ]);
  }

  function rowTr(key, idx, r, list){
    const sel = el("select",{class:"mini"}, list.map(v=>el("option",{value:v},[v])));
    sel.value = r.type ?? list[0];
    sel.addEventListener("change",(e)=>{
      state[key][idx].type = e.target.value; save(state); render();
    });

    const val = el("input",{class:"mini", type:"number", step:"0.001", value: r.value ?? 0});
    val.addEventListener("input",(e)=>{
      state[key][idx].value = (e.target.value===""?0:Number(e.target.value)); save(state); render();
    });

    const del = el("button",{class:"smallBtn", onclick:()=>{
      state[key].splice(idx,1); save(state); render();
    }},["삭제"]);

    return el("tr",{},[
      el("td",{},[sel]),
      el("td",{},[val]),
      el("td",{},[del])
    ]);
  }
}

function pageEquipment(){
  return el("div",{class:"grid"},[
    equipGroup("공격자 장비", "atk", state.atk_use_equip, 12),
    equipGroup("피격자 장비", "def", state.def_use_equip, 12),
  ]);

  function equipGroup(title, prefix, enabled, span){
    const badge = enabled ? el("span",{class:"badge good"},[el("span",{class:"bDot"}), "ON"]) : el("span",{class:"badge warn"},[el("span",{class:"bDot"}), "OFF"]);
    const help = enabled ? "장비 옵션이 계산에 반영되도록 다음 단계에서 formulas.js에 합산 로직을 추가합니다." : "장비 관리가 OFF면 장비 입력은 저장만 되고 계산에는 반영하지 않도록 처리합니다.";

    return el("div",{class:"card", style:`grid-column: span ${span};`},[
      el("div",{class:"cardTitle"},[
        el("h3",{},[title," ", badge]),
        el("p",{},[help])
      ]),
      el("div",{style:"display:grid; grid-template-columns: 1fr; gap:12px;"},[
        equipCard(prefix, "w1", "무기 1", cfg.lists.weapon_main, cfg.lists.weapon_sub),
        equipCard(prefix, "w2", "무기 2", cfg.lists.weapon_main, cfg.lists.weapon_sub),
        equipCard(prefix, "a1", "방어구 1", cfg.lists.armor_main, cfg.lists.armor_sub),
        equipCard(prefix, "a2", "방어구 2", cfg.lists.armor_main, cfg.lists.armor_sub),
      ])
    ]);
  }

  function equipCard(prefix, slot, title, mainList, subList){
    const baseKey = `${prefix}_${slot}`;
    const flatKey = `${baseKey}_flat`;
    const mainKey = `${baseKey}_main`;
    const mainValKey = `${baseKey}_main_val`;
    const s1Key = `${baseKey}_s1`, s1ValKey = `${baseKey}_s1_val`;
    const s2Key = `${baseKey}_s2`, s2ValKey = `${baseKey}_s2_val`;
    const s3Key = `${baseKey}_s3`, s3ValKey = `${baseKey}_s3_val`;

    const flatLabel = slot.startsWith("w") ? "깡공격력" : "깡방어력";

    return el("div",{class:"panel", style:"padding:12px; border-radius:20px; border:1px solid var(--line2);"},[
      el("div",{style:"display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;"},[
        el("div",{style:"font-weight:950; font-size:16px;"},[title]),
        el("div",{style:"color:var(--muted); font-size:12px;"},["메인/서브옵션 1~3"])
      ]),
      el("div",{class:"form"},[
        inputNumber(flatKey, flatLabel, "", "1"),
        selectBox(mainKey, "메인 옵션", mainList),
        inputNumber(mainValKey, "메인 수치", "", "0.001"),

        selectBox(s1Key, "서브 옵션 1", subList),
        inputNumber(s1ValKey, "수치", "", "0.001"),

        selectBox(s2Key, "서브 옵션 2", subList),
        inputNumber(s2ValKey, "수치", "", "0.001"),

        selectBox(s3Key, "서브 옵션 3", subList),
        inputNumber(s3ValKey, "수치", "", "0.001"),
      ])
    ]);
  }
}

function pageDebug(){
  const out = calcAll(state);
  const dbg = out.debug;

  return el("div",{class:"grid"},[
    el("div",{class:"card", style:"grid-column: span 12;"},[
      el("div",{class:"cardTitle"},[
        el("h3",{},["중간값(엑셀 비교용)"]),
        el("p",{},["엑셀의 데미지공식 시트(수식_공격력/방어력/배율들)를 그대로 맞추기 위한 패널"])
      ]),
      el("table",{class:"table"},[
        el("thead",{},[el("tr",{},[
          el("th",{},["키"]),
          el("th",{},["값"])
        ])]),
        el("tbody",{},[
          kv("atkEff", dbg.atkEff),
          kv("defEff", dbg.defEff),
          kv("defFactor", dbg.defFactor),
          kv("giveInc", dbg.giveInc),
          kv("giveDec", dbg.giveDec),
          kv("takeInc", dbg.takeInc),
          kv("takeDec", dbg.takeDec),
          kv("critMul", dbg.critMul),
          kv("weakMul", dbg.weakMul),
          kv("blockMul", dbg.blockMul)
        ])
      ])
    ])
  ]);

  function kv(k,v){
    return el("tr",{},[
      el("td",{},[k]),
      el("td",{},[fmt(v)])
    ]);
  }
}

function cardSection(title, desc, fields, span=12){
  return el("div",{class:"card", style:`grid-column: span ${span};`},[
    el("div",{class:"cardTitle"},[
      el("h3",{},[title]),
      el("p",{},[desc])
    ]),
    el("div",{class:"form"}, fields.map(x=>x))
  ]);
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "damage_state.json"; a.click();
  URL.revokeObjectURL(url);
  toast("내보내기 완료");
}
function importJSON(){
  const inp = document.createElement("input");
  inp.type="file"; inp.accept="application/json";
  inp.addEventListener("change", async ()=>{
    const f = inp.files?.[0];
    if(!f) return;
    try{
      const obj = JSON.parse(await f.text());
      state = { ...structuredClone(DEFAULT), ...obj };
      save(state);
      render();
      toast("가져오기 완료");
    }catch{
      toast("가져오기 실패");
    }
  });
  inp.click();
}

function currentRoute(){
  const h = (location.hash || "#dashboard").replace("#","");
  return routes.find(r=>r.id===h) ?? routes[0];
}

function render(){
  const r = currentRoute();

  const app = document.getElementById("app");
  app.innerHTML = "";

  const sidebar = el("aside",{class:"sidebar"},[
    el("div",{class:"brand"},[
      el("div",{class:"brand__logo"}),
      el("div",{},[
        el("div",{class:"brand__title"},["세나 리버스 계산기"]),
        el("div",{class:"brand__sub"},["엑셀 기반 · GitHub Pages"])
      ])
    ]),
    el("nav",{class:"nav"}, routes.map(x=>{
      const a = el("a",{href:`#${x.id}`, class: (x.id===r.id ? "is-active" : "")},[
        el("span",{class:"dot"}),
        el("div",{},[
          el("div",{style:"font-weight:950;"},[x.name]),
          el("div",{style:"font-size:12px; color:var(--muted); margin-top:2px;"},[x.desc])
        ])
      ]);
      return a;
    })),
    el("div",{class:"sidebarFooter"},[
      el("div",{},["상태는 자동 저장됩니다."]),
      el("div",{class:"row"},[
        el("div",{class:"chip", onclick:()=>{ exportJSON(); }},["JSON 백업"]),
        el("div",{class:"chip", onclick:()=>{ state=structuredClone(DEFAULT); save(state); render(); toast("초기화"); }},["초기화"])
      ])
    ])
  ]);

  const main = el("main",{class:"main"},[
    headerBlock(r),
    routeView(r.id),
    el("div",{class:"toast"},[""])
  ]);

  app.appendChild(el("div",{class:"shell"},[sidebar, main]));
}

function routeView(id){
  if(id==="dashboard") return pageDashboard();
  if(id==="attacker") return pageAttacker();
  if(id==="defender") return pageDefender();
  if(id==="buffs") return pageBuffs();
  if(id==="equipment") return pageEquipment();
  if(id==="debug") return pageDebug();
  return pageDashboard();
}

window.addEventListener("hashchange", render);
render();
