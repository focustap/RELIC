const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createEngine}=require('../engine.js');
const data=vm.runInNewContext(fs.readFileSync('cards.js','utf8')+'\n'+fs.readFileSync('starters.js','utf8')+'\n({RELIC_BY_ID,RELIC_STARTERS})');
const {RELIC_BY_ID:cards,RELIC_STARTERS:decks}=data;
function fixture(seed=7){
 const engine=createEngine(cards,{random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}});
 const game=engine.create(decks[0].deck,decks[0].extra,decks[1].deck,decks[1].extra);
 return {engine,game};
}
const monster=(id,pos='attack',more={})=>({id,pos,played:0,attacked:false,moved:false,atkBonus:0,...more});
test('illegal summon, cast, set, fusion and position actions leave state untouched',()=>{
 const {engine:e,game:g}=fixture();g.you.hand=['ember-squire','spark-bolt','fog-screen','relic-fusion','stonebound-golem'];
 for(const phase of ['battle','over']){
  g.phase=phase;const before=JSON.stringify(g);
  assert.equal(e.summon(g,'you',0),false);assert.equal(e.cast(g,'you','hand',1),false);
  assert.equal(e.setBackrow(g,'you',2),false);assert.equal(e.fusion(g,'you','hand',3,'emberstone-colossus'),false);
  assert.equal(e.position(g,'you',0),false);assert.equal(JSON.stringify(g),before);
 }
 g.phase='main1';g.turn='ai';assert.equal(e.summon(g,'you',0),false);
});
test('one normal summon, tribute cost and full zones enforced',()=>{
 const {engine:e,game:g}=fixture();g.you.hand=['emberlord','ember-squire','flame-lynx'];
 assert.equal(e.summon(g,'you',0),false);assert.equal(e.summon(g,'you',1),true);
 assert.equal(e.summon(g,'you',1),false);
 e.endTurn(g,'you');e.endTurn(g,'ai');g.you.monsters[1]=monster('flame-lynx');
 assert.equal(e.summon(g,'you',0),true);assert.equal(g.you.grave.length,2);
 assert.equal(g.you.monsters.filter(Boolean).length,1);
 g.you.normalUsed=false;g.you.monsters=Array.from({length:5},()=>monster('ember-squire'));
 assert.equal(e.summon(g,'you',0),false);
});
test('newly set trap matures on the next actual player turn',()=>{
 const {engine:e,game:g}=fixture();g.you.hand=['fog-screen'];e.setBackrow(g,'you',0);
 e.endTurn(g,'you');g.ai.monsters[0]=monster('ember-squire');g.phase='battle';
 assert.equal(g.turnNumber,2);assert.equal(e.attack(g,'ai',0,-1),true);
 assert.equal(g.you.lp,8000);assert.equal(g.you.spells[0],null);
 assert.ok(g.you.grave.includes('fog-screen'));
});
test('same-turn trap cannot respond and cannot be manually cast as a spell',()=>{
 const {engine:e,game:g}=fixture();g.turnNumber=3;g.phase='battle';
 g.ai.spells[0]={id:'fog-screen',setTurn:3};g.you.monsters[0]=monster('ember-squire');
 e.attack(g,'you',0,-1);assert.equal(g.ai.lp,6300);assert.ok(g.ai.spells[0]);
 g.phase='main1';assert.equal(e.cast(g,'ai','set',0),false);
});
test('temporary buffs expire at either end of turn, attack/position locks enforced',()=>{
 const {engine:e,game:g}=fixture();g.turnNumber=3;g.you.monsters[0]=monster('ember-squire');g.you.hand=['runic-blade'];
 assert.equal(e.cast(g,'you','hand',0),true);assert.equal(g.you.monsters[0].atkBonus,400);
 g.phase='battle';e.attack(g,'you',0,-1);g.phase='main2';assert.equal(e.position(g,'you',0),false);
 e.endTurn(g,'you');assert.equal(g.you.monsters[0].atkBonus,0);
});
test('first player cannot attack, even with a forged battle phase',()=>{
 const {engine:e,game:g}=fixture();g.you.monsters[0]=monster('ember-squire');g.phase='battle';
 assert.equal(e.attack(g,'you',0,-1),false);assert.equal(g.ai.lp,8000);
});
test('defense battle, tie destruction and defender shield preserve attacker damage',()=>{
 const {engine:e,game:g}=fixture();g.turnNumber=3;g.phase='battle';
 g.you.monsters[0]=monster('ember-squire');g.ai.monsters[0]=monster('mossbound-guard','set');
 g.ai.spells[0]={id:'final-stand',setTurn:1};e.attack(g,'you',0,0);
 assert.equal(g.you.lp,7800);assert.equal(g.ai.monsters[0].pos,'defense');
 g.you.monsters[0]=monster('ember-squire');g.ai.monsters[0]=monster('ember-squire');
 e.attack(g,'you',0,0);assert.equal(g.you.monsters[0],null);assert.equal(g.ai.monsters[0],null);
});
test('normal summon effects do not trigger on revival',()=>{
 const {engine:e,game:g}=fixture();g.you.hand=['returning-echo'];g.you.grave=['arcane-apprentice'];
 assert.equal(e.cast(g,'you','hand',0),true);assert.equal(g.you.hand.length,0);
 assert.equal(g.you.monsters[0].pos,'defense');
});
test('every published normal spell resolves its reusable effect',()=>{
 for(const [id,heal,draws] of [['mending-light',800,0],['quiet-rain',500,0],['ancient-map',200,1],['arcane-insight',0,1]]){
  const {engine:e,game:g}=fixture();g.you.hand=[id];const deckSize=g.you.deck.length;
  assert.equal(e.cast(g,'you','hand',0),true,id);assert.equal(g.you.lp,8000+heal,id);
  assert.equal(g.you.deck.length,deckSize-draws,id);assert.ok(g.you.grave.includes(id));
 }
 for(const [id,n] of [['spark-bolt',500],['flame-pulse',700]]){
  const {engine:e,game:g}=fixture();g.you.hand=[id];e.cast(g,'you','hand',0);assert.equal(g.ai.lp,8000-n);
 }
 for(const [id,n] of [['runic-blade',400],['solar-aegis',600]]){
  const {engine:e,game:g}=fixture();g.you.hand=[id];assert.equal(e.cast(g,'you','hand',0),false);
  g.you.monsters[0]=monster('ember-squire');assert.equal(e.cast(g,'you','hand',0),true);assert.equal(g.you.monsters[0].atkBonus,n);
 }
 const {engine:e,game:g}=fixture();g.you.hand=['shatterspell'];g.ai.monsters[0]=monster('dusk-scout');
 assert.equal(e.cast(g,'you','hand',0),true);assert.equal(g.ai.monsters[0],null);
});
test('draw and healing Normal Summon effects match their descriptions',()=>{
 for(const [id,heal,hand] of [['arcane-apprentice',0,1],['rune-medic',400,0]]){
  const {engine:e,game:g}=fixture();g.you.hand=[id];e.summon(g,'you',0);assert.equal(g.you.lp,8000+heal);assert.equal(g.you.hand.length,hand);
 }
});
test('each defensive trap handles a legal attack with the advertised outcome',()=>{
 for(const [id,expectedHp,destroyed] of [['fog-screen',8000,false],['ambush-snare',8000,true],['final-stand',8000,false],['ember-rebuke',6300,false],['nightfall-veil',8300,false],['rune-collapse',8000,true]]){
  const {engine:e,game:g}=fixture();g.turnNumber=3;g.phase='battle';g.you.monsters[0]=monster('ember-squire');g.ai.spells[0]={id,setTurn:1};
  assert.equal(e.attack(g,'you',0,-1),true,id);assert.equal(g.ai.lp,expectedHp,id);assert.equal(g.ai.spells[0],null,id);
  assert.equal(g.you.monsters[0]===null,destroyed,id);if(id==='ember-rebuke')assert.equal(g.you.lp,7650);
 }
 const {engine:e,game:g}=fixture();g.turnNumber=3;g.phase='battle';g.you.monsters[0]=monster('ember-squire');g.ai.monsters[0]=monster('glade-stag','defense');g.ai.spells[0]={id:'guardian-bond',setTurn:1};
 e.attack(g,'you',0,0);assert.equal(g.you.lp,7500);assert.ok(g.ai.monsters[0]);assert.equal(g.ai.spells[0],null);
});
test('fusion consumes exact hand/board materials and requires a real free zone',()=>{
 const {engine:e,game:g}=fixture();g.you.hand=['relic-fusion','ember-squire'];g.you.extra=['emberstone-colossus'];
 g.you.monsters[0]=monster('stonebound-golem');
 assert.equal(e.fusion(g,'you','hand',0,'emberstone-colossus'),true);
 assert.deepEqual([...g.you.grave].sort(),['ember-squire','relic-fusion','stonebound-golem'].sort());
 assert.equal(g.you.monsters[0].id,'emberstone-colossus');assert.equal(g.you.extra.length,0);
 assert.equal(e.fusion(g,'you','hand',0,'emberstone-colossus'),false);
});
test('terminal state rejects new actions and deck-out ends the duel',()=>{
 const {engine:e,game:g}=fixture();g.ai.deck=[];e.endTurn(g,'you');
 assert.equal(g.winner,'you');const before=JSON.stringify(g);
 assert.equal(e.endTurn(g,'ai'),false);assert.equal(e.aiTurn(g),false);
 assert.equal(e.finish(g,'ai','replay'),false);assert.equal(JSON.stringify(g),before);
});
test('AI avoids publicly losing attacks and does not inspect hidden monster stats',()=>{
 const {engine:e,game:g}=fixture();g.turn='ai';g.turnNumber=2;g.ai.hand=[];
 g.ai.monsters[0]=monster('ember-squire');g.you.monsters[0]=monster('emberlord');
 e.aiTurn(g);assert.equal(g.ai.lp,8000);assert.ok(g.ai.monsters[0]);
 function hidden(id){const f=fixture();f.game.turn='ai';f.game.turnNumber=2;f.game.ai.hand=[];
  f.game.ai.monsters[0]=monster('ember-squire');f.game.you.monsters[0]=monster(id,'set');f.engine.aiTurn(f.game);return f.game.logs.some(x=>x.includes('attacks.'));}
 assert.equal(hidden('emberlord'),hidden('opal-wisp'));
});
test('all five archetypes finish complete legal matches with conserved cards',()=>{
 for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let seed=1;seed<=4;seed++){
  const {engine:e}=fixture(seed);
  const g=e.create(decks[a].deck,decks[a].extra,decks[b].deck,decks[b].extra);
  for(let t=0;t<200&&!g.winner;t++){
   e.aiTurn(g,g.turn);
   for(const s of ['you','ai']){
    const p=g[s],ids=[...p.deck,...p.hand,...p.extra,...p.grave,...p.monsters.filter(Boolean).map(x=>x.id),...p.spells.filter(Boolean).map(x=>x.id)];
    assert.equal(ids.length,40+decks[s==='you'?a:b].extra.length,`${a}/${b} ${seed} ${s}`);
    assert.ok(p.lp>=0);assert.ok(ids.every(id=>cards[id]));assert.equal(p.monsters.length,5);
   }
  }
  assert.ok(g.winner,`unfinished ${a}/${b} seed ${seed}`);
 }
});
