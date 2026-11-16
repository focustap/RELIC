const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const source=read("cards.js")+"\n"+read("starters.js");
const catalog=vm.runInNewContext(source+"\n({RELIC_CARDS,RELIC_BY_ID,STARTER_LIST,STARTER_DECK,STARTER_EXTRA,RELIC_STARTERS})");
const {RELIC_CARDS,RELIC_BY_ID,STARTER_DECK,STARTER_EXTRA,RELIC_STARTERS}=catalog;
const tally=a=>a.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{});

test("Original catalogue contains at least 50 cards with unique names and IDs",()=>{
 assert.ok(RELIC_CARDS.length>=50);
 assert.equal(new Set(RELIC_CARDS.map(c=>c.id)).size,RELIC_CARDS.length);
 assert.equal(new Set(RELIC_CARDS.map(c=>c.name)).size,RELIC_CARDS.length);
});
test("Only Normal/Effect Monsters, Spells, Traps and Fusion types are used",()=>{
 for(const card of RELIC_CARDS)assert.ok(["monster","spell","trap","fusion"].includes(card.type),card.id);
});
test("Levels, ATK and DEF are bounded for early balance",()=>{
 for(const c of RELIC_CARDS.filter(x=>x.level)){
  assert.ok(c.level>=1&&c.level<=12,c.id);
  assert.ok(c.atk>=0&&c.def>=0&&c.atk<=3000&&c.def<=3000,c.id);
  if(c.type==="monster"&&c.level<=4)assert.ok(c.atk<=2000,c.id);
 }
});
test("All fusions require exactly two named valid materials",()=>{
 for(const c of RELIC_CARDS.filter(x=>x.type==="fusion")){
  assert.equal(c.materials.length,2,c.id);
  for(const material of c.materials)assert.equal(RELIC_BY_ID[material].type,"monster",c.id);
 }
});
test("No redundant summoning system or mana field exists",()=>{
 assert.ok(!/\b(Link|Xyz|Pendulum|Synchro|Ritual)\b/i.test(RELIC_CARDS.map(c=>c.type).join(" ")));
 assert.ok(!RELIC_CARDS.some(c=>Object.hasOwn(c,"mana")));
 assert.doesNotMatch(read("app.js"),/\bmana\b/i);
});
test("Default deck is legal and has a Fusion-only extra deck",()=>{
 assert.equal(STARTER_DECK.length,40);
 assert.ok(STARTER_EXTRA.length<=15);
 for(const [id,n] of Object.entries(tally([...STARTER_DECK,...STARTER_EXTRA])))assert.ok(n<=3,id);
 assert.ok(STARTER_DECK.every(id=>RELIC_BY_ID[id].type!=="fusion"));
 assert.ok(STARTER_EXTRA.every(id=>RELIC_BY_ID[id].type==="fusion"));
});
test("Five commander-themed decks have 40 cards, legal copies and a commander in the list",()=>{
 assert.equal(RELIC_STARTERS.length,5);
 for(const deck of RELIC_STARTERS){
  assert.equal(deck.deck.length,40,deck.name);
  assert.ok(deck.extra.length<=15,deck.name);
  for(const [id,n] of Object.entries(tally([...deck.deck,...deck.extra])))assert.ok(n<=3,id);
  assert.ok([...deck.deck,...deck.extra].includes(deck.commander),deck.name);
  assert.ok(deck.description.length>20);
 }
 assert.equal(new Set(RELIC_STARTERS.map(s=>s.style)).size,5);
});
test("Shop and game rewards use earned Gold, not mana",()=>{
 const app=read("app.js");
 assert.match(app,/w==="you"\?10:2/);
 assert.match(app,/openPack\(5,10\)/);
 assert.match(app,/12 CARDS — 22 GOLD/);
 assert.match(app,/25 CARDS — 40 GOLD/);
 assert.match(app,/lp:8000/);
});
test("Branded card back exists and is shown on hidden cards",()=>{
 assert.match(read("relic-card-back.svg"),/>RELIC<\/text>/);
 assert.match(read("effects.css"),/relic-card-back\.svg/);
 assert.match(read("app.js"),/set-card/);
});
test("Animations have reduced-motion fallbacks",()=>{
 const fx=read("effects.css");
 for(const word of ["relicSummon","relicSet","relicSpell","relicTrap","relicFusion"])assert.ok(fx.includes(word),word);
 assert.ok(fx.includes("prefers-reduced-motion:reduce"));
});
test("HTML loads game scripts in dependency order",()=>{
 const html=read("index.html");
 assert.ok(html.indexOf('src="./cards.js"')<html.indexOf('src="./starters.js"'));
 assert.ok(html.indexOf('src="./starters.js"')<html.indexOf('src="./app.js"'));
 assert.ok(html.includes('href="./effects.css"'));
});
test("Every browser script parses",()=>{
 for(const name of ["cards.js","starters.js","app.js"])assert.doesNotThrow(()=>new vm.Script(read(name),{filename:name}));
});

function mockElement(id){
 const e={id,innerHTML:"",textContent:"",style:{},value:id.includes("filter")?"all":"",checked:id==="collection-owned",dataset:{},className:"",
  classList:{add(){},remove(){},toggle(){}},append(){},appendChild(){},after(){},before(){},remove(){},
  addEventListener(){},closest(){return mockElement("parent")},querySelector(){return mockElement("child")},querySelectorAll(){return []}};
 return e;
}
function runApp(){
 const listeners={};
 const dom=new Map(),document={
  getElementById(id){if(!dom.has(id))dom.set(id,mockElement(id));return dom.get(id);},
  querySelector(){return mockElement("arena")},querySelectorAll(){return []},
  createElement(tag){return mockElement(tag)},addEventListener(type,callback){listeners[type]=callback}};
 const cache={};
 const localStorage={getItem(k){return cache[k]||null},setItem(k,v){cache[k]=v}};
 const code=read("app.js").replace(/wire\(\);\s*\}\)\(\);\s*$/,'wire();return {begin,phaseNext,turnEnd,aiTurn,openPack,chooseStarter,valid,save:()=>save,game:()=>game,cast,attack,fusion};})();');
 assert.ok(code.includes("return {begin,phaseNext"));
 const script="(function(){"+source+"\nreturn (function(){return "+code.replace(/^\/\*[\s\S]*?\*\/\s*/,"")+";})();})();";
 const context={document,window:{scrollTo(){}},location:{hash:""},localStorage,confirm:()=>true,setTimeout:()=>0,console,Math,Date};
 const app=vm.runInNewContext(script,context);
 app.__click=event=>listeners.click(event);
 app.__location=context.location;
 return app;
}
test("Browser smoke: Duel Arena navigation is clickable",()=>{
 const app=runApp();
 const target={closest(selector){
  if(!/^\\[data-[a-z-]+\\]$/.test(selector))throw new Error("Malformed CSS selector: "+selector);
  return selector==="[data-page]"?{dataset:{page:"duel"}}:null;
 }};
 assert.doesNotThrow(()=>app.__click({target}));
 assert.equal(app.__location.hash,"duel");
});
test("Browser smoke: starting deck selector and solo opening state",()=>{
 const app=runApp();
 assert.equal(app.valid(),true);
 app.chooseStarter("night");
 assert.equal(app.save().starter,"night");
 assert.equal(app.valid(),true);
 app.begin();
 assert.equal(app.game().you.lp,8000);
 assert.equal(app.game().ai.lp,8000);
 assert.equal(app.game().you.hand.length,5);
 assert.equal(app.game().ai.hand.length,5);
});
test("Browser smoke: first turn skips battle and AI draws",()=>{
 const app=runApp();app.begin();app.phaseNext();
 assert.equal(app.game().phase,"main2");
 app.turnEnd();assert.equal(app.game().ai.hand.length,6);
 app.aiTurn();assert.equal(app.game().turn,"you");
 assert.equal(app.game().round,2);
});
test("Browser smoke: basic booster costs 10 Gold",()=>{
 const app=runApp(),before=app.save().gold;app.openPack(5,10);
 assert.equal(app.save().gold,before-10);
 const total=Object.values(app.save().owned).reduce((a,n)=>a+Number(n),0);
 assert.ok(total>40);
});
test("Browser smoke: direct damage and monster battle update Life Points",()=>{
 const app=runApp();app.begin();
 const duel=app.game();duel.turn="you";duel.phase="battle";duel.round=2;
 duel.you.monsters[0]={id:"ember-squire",pos:"attack",atkBonus:0,attacked:false};
 duel.ai.monsters[0]={id:"dusk-scout",pos:"attack",atkBonus:0,attacked:false};
 app.attack("you",0,0);
 assert.equal(duel.ai.lp,7700);
 assert.equal(duel.ai.monsters[0],null);
});
test("Browser smoke: named-material Fusion consumes components and places fusion",()=>{
 const app=runApp();app.begin();const duel=app.game();
 duel.you.hand=["relic-fusion","ember-squire","stonebound-golem"];
 duel.you.extra=["emberstone-colossus"];
 app.fusion("you","hand",0,"emberstone-colossus");
 assert.ok(duel.you.monsters.some(m=>m&&m.id==="emberstone-colossus"));
 assert.equal(duel.you.extra.length,0);
 assert.ok(duel.you.grave.includes("ember-squire"));
 assert.ok(duel.you.grave.includes("stonebound-golem"));
});

test.todo("500+ fully designed original card roster with playtest data");
test.todo("Player-controlled Chains, full timing windows, Spell Speeds and priority");
test.todo("Illustrated card fronts verified in a real browser");
test.todo("Authoritative online 1v1 and in-game Gold wagers");
