const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {createEngine}=require('../engine.js');
const {RELIC_BY_ID:cards,RELIC_STARTERS:decks}=vm.runInNewContext(fs.readFileSync('cards.js','utf8')+'\n'+fs.readFileSync('starters.js','utf8')+'\n({RELIC_BY_ID,RELIC_STARTERS})');
function setup(){let seed=9;const e=createEngine(cards,{stagedTurns:true,random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}});return {e,g:e.create(decks[0].deck,decks[0].extra,decks[1].deck,decks[1].extra)};}
test('opening draw and standby run automatically without drawing a sixth card',()=>{
 const {e,g}=setup();assert.equal(g.phase,'draw');assert.equal(g.you.hand.length,5);
 assert.equal(e.summon(g,'you',0),false);e.advanceAutomatic(g,'you');assert.equal(g.phase,'standby');
 e.advanceAutomatic(g,'you');assert.equal(g.phase,'main1');assert.equal(g.you.hand.length,5);
 assert.equal(e.shouldAdvance(g),false);assert.equal(e.advanceAutomatic(g,'you'),false);
});
test('end, opponent draw and standby preserve their order and draw once',()=>{
 const {e,g}=setup();e.advanceAutomatic(g,'you');e.advanceAutomatic(g,'you');
 e.endTurn(g,'you');assert.equal(g.phase,'end');assert.equal(g.turn,'you');assert.equal(g.ai.hand.length,5);
 e.advanceAutomatic(g,'you');assert.equal(g.turn,'ai');assert.equal(g.phase,'draw');assert.equal(g.ai.hand.length,5);
 e.advanceAutomatic(g,'ai');assert.equal(g.phase,'standby');assert.equal(g.ai.hand.length,6);
 e.advanceAutomatic(g,'ai');assert.equal(g.phase,'main1');assert.equal(g.ai.hand.length,6);
});
test('automatic progression skips empty phases and stops for real decisions',()=>{
 const {e,g}=setup();g.phase='main1';g.turnNumber=3;g.you.hand=[];
 assert.equal(e.shouldAdvance(g),true);e.advanceAutomatic(g,'you');assert.equal(g.phase,'battle');
 e.advanceAutomatic(g,'you');assert.equal(g.phase,'main2');
 e.advanceAutomatic(g,'you');assert.equal(g.phase,'end');
 const h=setup();h.g.phase='main1';h.g.you.hand=['relic-fusion'];
 // Even an unplayable spell can legally be set, so this is still a player decision.
 assert.equal(h.e.shouldAdvance(h.g),false);assert.equal(h.e.advanceAutomatic(h.g,'you'),false);
});
test('battle waits for attacks and moves on after the final attack',()=>{
 const {e,g}=setup();g.phase='battle';g.turnNumber=3;g.you.hand=[];
 g.you.monsters[0]={id:'ember-squire',pos:'attack',played:3,attacked:false,moved:false,atkBonus:0};
 assert.equal(e.shouldAdvance(g),false);assert.equal(e.advanceAutomatic(g,'you'),false);
 e.attack(g,'you',0,-1);assert.equal(g.ai.lp,6300);assert.equal(e.shouldAdvance(g),true);
 e.advanceAutomatic(g,'you');assert.equal(g.phase,'main2');
});
test('first turn skips Battle and no automatic step can alter a finished match',()=>{
 const {e,g}=setup();e.advanceAutomatic(g,'you');e.advanceAutomatic(g,'you');e.nextPhase(g,'you');assert.equal(g.phase,'main2');
 e.finish(g,'you','done');const snapshot=JSON.stringify(g);
 assert.equal(e.shouldAdvance(g),false);assert.equal(e.advanceAutomatic(g,'you'),false);assert.equal(e.aiStep(g),false);assert.equal(JSON.stringify(g),snapshot);
});
test('one AI step changes only one decision; batched staged matches still finish',()=>{
 const {e,g}=setup();g.phase='main1';g.turn='ai';g.turnNumber=2;g.ai.hand=['spark-bolt','spark-bolt'];
 e.aiStep(g);assert.equal(g.you.lp,7500);assert.equal(g.ai.hand.length,1);
 for(const a of decks)for(const b of decks){
  const state=e.create(a.deck,a.extra,b.deck,b.extra);
  for(let t=0;t<200&&!state.winner;t++)e.aiTurn(state,state.turn);
  assert.ok(state.winner,a.id+'/'+b.id);
 }
});
