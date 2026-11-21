/* Pure solo-duel rules. No DOM, storage, timers, network, or presentation dependency. */
(function (root) {
"use strict";
function createEngine(cards, options = {}) {
 const random = options.random || Math.random;
 const other = side => side === "you" ? "ai" : "you";
 const card = id => cards[id];
 const main = g => ["main1", "main2"].includes(g.phase);
 const active = (g,s) => !!g && !g.winner && g.turn === s;
 const allowed = (g,s) => active(g,s) && main(g);
 const slot = a => a.findIndex(x => !x);
 const power = m => card(m.id).atk + m.atkBonus;
 const tributes = id => card(id).level <= 4 ? 0 : card(id).level <= 6 ? 1 : 2;
 const log = (g,text) => g.logs.unshift(text);
 function shuffle(values) {
  const a = values.slice();
  for (let i=a.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
 }
 function validateDeck(deck,extra,owned) {
  if (!Array.isArray(deck)||!Array.isArray(extra)||deck.length<40||deck.length>60||extra.length>15) return false;
  if (deck.some(id=>!card(id)||card(id).type==="fusion")||extra.some(id=>card(id)?.type!=="fusion")) return false;
  const counts={};for(const id of [...deck,...extra]) counts[id]=(counts[id]||0)+1;
  return Object.entries(counts).every(([id,n])=>n<=3&&(!owned||n<=(owned[id]||0)));
 }
 function side(deck,extra) {return {lp:8000,deck:shuffle(deck),extra:extra.slice(),hand:[],monsters:Array(5).fill(null),spells:Array(5).fill(null),grave:[],normalUsed:false};}
 function finish(g,w,reason) {
  if(g.winner)return false;
  g.winner=w;g.phase="over";log(g,reason);return true;
 }
 function damage(g,s,n) {
  if(g.winner)return;
  g[s].lp=Math.max(0,g[s].lp-Math.max(0,n));
  if(g[s].lp===0)finish(g,other(s),(s==="you"?"You":"The Warden")+" ran out of HP.");
 }
 function draw(g,s,n=1) {
  for(let i=0;i<n&&!g.winner;i++) {
   if(!g[s].deck.length){finish(g,other(s),"Deck-out: "+s+" could not draw.");return;}
   g[s].hand.push(g[s].deck.shift());event(g,s,'hand',-1,'draw');
  }
 }
 function create(deck,extra,aiDeck=deck,aiExtra=extra) {
  if(!validateDeck(deck,extra)||!validateDeck(aiDeck,aiExtra))throw new Error("A legal 40–60 card deck is required.");
  const g={you:side(deck,extra),ai:side(aiDeck,aiExtra),turn:"you",phase:options.stagedTurns?'draw':'main1',round:1,turnNumber:1,winner:null,logs:[],events:[]};
  draw(g,"you",5);draw(g,"ai",5);
  log(g,"Both duelists begin with 8,000 HP and five cards.");
  log(g,"You go first. No first-turn draw or battle.");g.events=[];return g;
 }
 function event(g,side,zone,i,kind) {g.events.push({side,zone,i,kind,cardId:zone==='monster'?g[side].monsters[i]?.id:null});}
 function canNormal(g,s,id) {
  if(!allowed(g,s)||card(id)?.type!=="monster")return false;
  const p=g[s],n=tributes(id);
  return !p.normalUsed&&p.monsters.filter(Boolean).length>=n&&(slot(p.monsters)>=0||n>0);
 }
 function spawn(g,s,id,pos,normal=false) {
  const p=g[s],i=slot(p.monsters);if(i<0)return false;
  p.monsters[i]={id,pos,played:g.turnNumber,attacked:false,moved:false,atkBonus:0};
  if(normal)p.normalUsed=true;
  event(g,s,"monster",i,pos==="set"?"set":"summon");
  log(g,(s==="you"?"You":"Warden")+(pos==="set"?" Set a monster.":" summoned "+card(id).name+"."));
  // These effects explicitly require a Normal Summon, never a revive or Fusion.
  if(normal&&pos!=="set"&&card(id).effect==="draw-on-summon")draw(g,s);
  if(normal&&pos!=="set"&&card(id).effect==="heal-on-summon")p.lp+=400;
  return true;
 }
 function summon(g,s,i,pos="attack") {
  const p=g?.[s],id=p?.hand[i];
  if(!["attack","set"].includes(pos)||!id||!canNormal(g,s,id))return false;
  const n=tributes(id);
  // Existing solo rule: automatically tribute lowest ATK monsters.
  const targets=p.monsters.map((m,k)=>m?{k,atk:power(m)}:null).filter(Boolean).sort((a,b)=>a.atk-b.atk).slice(0,n);
  for(const {k} of targets){p.grave.push(p.monsters[k].id);log(g,"Tributed "+card(p.monsters[k].id).name);p.monsters[k]=null;}
  p.hand.splice(i,1);return spawn(g,s,id,pos,true);
 }
 function destroy(g,s,i) {
  const p=g[s],m=p.monsters[i];if(!m)return;
  p.monsters[i]=null;p.grave.push(m.id);log(g,card(m.id).name+" was destroyed.");
  event(g,s,"monster",i,"destroy");
  if(card(m.id).effect==="heal-on-destroy")p.lp+=300;
 }
 function setBackrow(g,s,i) {
  if(!allowed(g,s))return false;
  const p=g[s],id=p.hand[i],c=card(id),at=slot(p.spells);
  if(!c||!["spell","trap"].includes(c.type)||at<0)return false;
  p.spells[at]={id,setTurn:g.turnNumber};p.hand.splice(i,1);
  event(g,s,"spell",at,"set");log(g,(s==="you"?"You":"Warden")+" Set a card.");return true;
 }
 function material(g,s,id,used) {
  const p=g[s];
  for(let i=0;i<p.hand.length;i++)if(p.hand[i]===id&&!used.some(x=>x.where==="hand"&&x.i===i))return {where:"hand",i};
  for(let i=0;i<p.monsters.length;i++)if(p.monsters[i]?.id===id&&p.monsters[i].pos!=="set"&&!used.some(x=>x.where==="board"&&x.i===i))return {where:"board",i};
  return null;
 }
 function choices(g,s) {
  return g[s].extra.filter(id=>{const used=[];for(const id2 of card(id).materials){const m=material(g,s,id2,used);if(!m)return false;used.push(m);}return slot(g[s].monsters)>=0||used.some(x=>x.where==="board");});
 }
 function source(g,s,where,i) {
  if(!["hand","set"].includes(where))return null;
  return where==="hand"?g[s].hand[i]:g[s].spells[i]?.id;
 }
 function fusion(g,s,where,i,id) {
  if(!allowed(g,s)||source(g,s,where,i)!=="relic-fusion"||!choices(g,s).includes(id))return false;
  const p=g[s],used=[];
  for(const id2 of card(id).materials)used.push(material(g,s,id2,used));
  const remove=used.filter(x=>x.where==="hand").map(x=>x.i);if(where==="hand")remove.push(i);
  [...new Set(remove)].sort((a,b)=>b-a).forEach(k=>p.hand.splice(k,1));
  used.filter(x=>x.where==="board").forEach(x=>p.monsters[x.i]=null);
  if(where==="set")p.spells[i]=null;
  p.grave.push("relic-fusion",...card(id).materials);p.extra.splice(p.extra.indexOf(id),1);
  spawn(g,s,id,"attack");g.events[g.events.length-1].kind="fusion";
  log(g,"FUSION! "+card(id).name);return true;
 }
 // Shared effect handlers. Card identity selects data; it does not add UI rules.
 const spells={
  heal800:(g,s)=>g[s].lp+=800, heal500:(g,s)=>g[s].lp+=500,
  burn500:(g,s)=>damage(g,other(s),500), burn700:(g,s)=>damage(g,other(s),700),
  draw1:(g,s)=>draw(g,s), insight:(g,s)=>{draw(g,s);if(!g.winner)g[s].lp+=200;},
  buff400:(g,s)=>buff(g,s,400),buff600:(g,s)=>buff(g,s,600),
  shatter:(g,s)=>{const targets=g[other(s)].monsters.map((m,i)=>m&&m.pos!=="set"&&power(m)<=1600?{m,i}:null).filter(Boolean).sort((a,b)=>power(b.m)-power(a.m));destroy(g,other(s),targets[0].i);},
  revive:(g,s)=>{const p=g[s],i=p.grave.findLastIndex(id=>card(id).type==="monster"&&card(id).level<=4);const [id]=p.grave.splice(i,1);spawn(g,s,id,"defense");}
 };
 function buff(g,s,n){const targets=g[s].monsters.filter(m=>m&&m.pos==="attack").sort((a,b)=>power(b)-power(a));targets[0].atkBonus+=n;}
 function canCast(g,s,where,i) {
  if(!allowed(g,s))return false;
  const c=card(source(g,s,where,i));if(c?.type!=="spell")return false;
  if(c.effect==="fusion")return choices(g,s).length>0;
  if(!spells[c.effect])return false;
  if(c.effect==="shatter")return g[other(s)].monsters.some(m=>m&&m.pos!=="set"&&power(m)<=1600);
  if(c.effect==="revive")return slot(g[s].monsters)>=0&&g[s].grave.some(id=>card(id).type==="monster"&&card(id).level<=4);
  if(c.effect.startsWith("buff"))return g[s].monsters.some(m=>m?.pos==="attack");
  return true;
 }
 function cast(g,s,where,i) {
  if(!canCast(g,s,where,i))return false;
  const id=source(g,s,where,i),c=card(id),p=g[s];
  if(c.effect==="fusion")return false; // Explicit named Fusion selection is required.
  if(where==="hand")p.hand.splice(i,1);else p.spells[i]=null;
  p.grave.push(id);event(g,s,"spell",-1,"spell");log(g,(s==="you"?"You":"Warden")+" activated "+c.name+".");
  spells[c.effect](g,s);return true;
 }
 function position(g,s,i,flip=false) {
  if(!allowed(g,s))return false;
  const m=g[s].monsters[i];
  if(!m||m.played===g.turnNumber||m.moved||m.attacked||(m.pos==="set")!==flip)return false;
  m.pos=flip?"attack":m.pos==="attack"?"defense":"attack";m.moved=true;
  log(g,card(m.id).name+" changed to "+m.pos+" position.");return true;
 }
 function attack(g,s,from,to) {
  if(!active(g,s)||g.phase!=="battle"||g.turnNumber===1||!Number.isInteger(from)||!Number.isInteger(to)||to< -1||to>4)return false;
  const a=g[s],d=g[other(s)],m=a.monsters[from];
  if(!m||m.pos!=="attack"||m.attacked||(to===-1?d.monsters.some(Boolean):!d.monsters[to]))return false;
  m.attacked=true;event(g,s,"monster",from,"attack");log(g,card(m.id).name+" attacks.");
  let bonusDEF=0,shield=false;
  // Solo subset: defensive traps automatically respond in zone order.
  for(let i=0;i<d.spells.length;i++) {
   const t=d.spells[i];if(!t||card(t.id).type!=="trap"||t.setTurn>=g.turnNumber)continue;
   const e=card(t.id).effect;
   if(e==="snare"&&power(m)>1800||e==="collapse"&&power(m)>2200)continue;
   if(e==="guard"&&(to<0||d.monsters[to].pos==="attack"))continue;
   d.spells[i]=null;d.grave.push(t.id);event(g,other(s),"spell",-1,"trap");log(g,"TRAP! "+card(t.id).name);
   if(e==="snare"||e==="collapse"){destroy(g,s,from);return true;}
   if(e==="negate-attack")return true;
   if(e==="veil"){d.lp+=300;return true;}
   if(e==="shield"){shield=true;break;}
   if(e==="guard"){bonusDEF=500;break;}
   if(e==="rebuke"){damage(g,s,350);if(g.winner)return true;break;}
  }
  if(to===-1){if(!shield)damage(g,other(s),power(m));return true;}
  const target=d.monsters[to];if(target.pos==="set"){target.pos="defense";log(g,"Revealed "+card(target.id).name);}
  if(target.pos==="defense") {
   const diff=power(m)-card(target.id).def-bonusDEF;
   if(diff>0)destroy(g,other(s),to);
   else if(diff<0)damage(g,s,-diff); // Defender's shield never protects the attacker.
  } else {
   const diff=power(m)-power(target);
   if(diff>=0)destroy(g,other(s),to);if(diff<=0)destroy(g,s,from);
   if(diff>0&&!shield)damage(g,other(s),diff);if(diff<0)damage(g,s,-diff);
  }
  return true;
 }
 function completeTurn(g,s) {
  for(const p of [g.you,g.ai])for(const m of p.monsters)if(m)m.atkBonus=0;
  log(g,(s==="you"?"Your":"Warden's")+" turn ends.");
  g.turn=other(s);g.turnNumber++;g.round=Math.floor((g.turnNumber+1)/2);g.phase=options.stagedTurns?'draw':'main1';
  const p=g[g.turn];p.normalUsed=false;
  for(const m of p.monsters)if(m){m.attacked=false;m.moved=false;}
  if(!options.stagedTurns)draw(g,g.turn);return true;
 }
 function endTurn(g,s) {
  if(!active(g,s)||!['main1','battle','main2'].includes(g.phase))return false;
  if(options.stagedTurns){g.phase='end';log(g,'End Phase begins.');return true;}
  return completeTurn(g,s);
 }
 function nextPhase(g,s) {
  if(!active(g,s))return false;
  if(g.phase==="main1")g.phase=g.turnNumber===1?"main2":"battle";
  else if(g.phase==="battle")g.phase="main2";
  else if(g.phase==="main2")return endTurn(g,s);
  else return false;
  log(g,g.phase==="battle"?"Battle Phase begins.":"Main Phase 2 begins.");return true;
 }
 function canPosition(g,s,i) {
  const m=g[s].monsters[i];return !!m&&m.played!==g.turnNumber&&!m.moved&&!m.attacked;
 }
 function mainActions(g,s) {
  if(!allowed(g,s))return false;
  const p=g[s];
  return p.hand.some((id,i)=>canNormal(g,s,id)||canCast(g,s,'hand',i)||(['spell','trap'].includes(card(id).type)&&slot(p.spells)>=0))||
   p.spells.some((m,i)=>m&&canCast(g,s,'set',i))||p.monsters.some((m,i)=>m&&canPosition(g,s,i));
 }
 function attackers(g,s) {
  if(!active(g,s)||g.turnNumber===1)return [];
  return g[s].monsters.map((m,i)=>({m,i})).filter(x=>x.m?.pos==='attack'&&!x.m.attacked);
 }
 function shouldAdvance(g) {
  if(!g||g.winner)return false;
  if(['draw','standby','end'].includes(g.phase)||g.turn==='ai')return true;
  if(main(g))return !mainActions(g,g.turn);
  return g.phase==='battle'&&attackers(g,g.turn).length===0;
 }
 function advanceAutomatic(g,s) {
  if(!active(g,s))return false;
  if(g.phase==='end')return completeTurn(g,s);
  if(g.phase==='draw'){
   if(g.turnNumber!==1)draw(g,s);
   if(!g.winner){g.phase='standby';log(g,'Standby Phase begins.');}return true;
  }
  if(g.phase==='standby'){g.phase='main1';log(g,'Main Phase 1 begins.');return true;}
  if(main(g)&&!mainActions(g,s))return nextPhase(g,s);
  if(g.phase==='battle'&&!attackers(g,s).length)return nextPhase(g,s);
  return false;
 }
 // One real decision per step lets clients show the AI's actions and phases.
 function aiStep(g,s='ai') {
  if(!active(g,s))return false;
  if(['draw','standby','end'].includes(g.phase))return advanceAutomatic(g,s);
  const p=g[s],foe=g[other(s)];
  if(g.phase==='battle'){
   for(const {m,i} of attackers(g,s).sort((a,b)=>power(b.m)-power(a.m))){
    const targets=foe.monsters.map((x,k)=>x?{x,k}:null).filter(Boolean);
    if(!targets.length)return attack(g,s,i,-1);
    const beatable=targets.filter(({x})=>x.pos!=='set'&&power(m)>(x.pos==='attack'?power(x):card(x.id).def)).sort((a,b)=>power(b.x)-power(a.x));
    const hidden=targets.find(({x})=>x.pos==='set');
    if(beatable.length)return attack(g,s,i,beatable[0].k);
    if(hidden)return attack(g,s,i,hidden.k);
   }
   return nextPhase(g,s);
  }
  if(!main(g))return false;
  // Evaluate public threats before summons. Hidden defender stats are never read.
  for(let i=0;i<p.hand.length;i++)if(card(p.hand[i]).effect==='shatter'&&canCast(g,s,'hand',i))return cast(g,s,'hand',i);
  const fi=p.hand.indexOf('relic-fusion'),fusions=choices(g,s).sort((a,b)=>card(b).atk-card(a).atk);
  if(fi>=0&&fusions.length)return fusion(g,s,'hand',fi,fusions[0]);
  for(let i=0;i<p.spells.length;i++)if(p.spells[i]&&canCast(g,s,'set',i)){
   if(card(p.spells[i].id).effect==='fusion')return fusion(g,s,'set',i,fusions[0]);
   return cast(g,s,'set',i);
  }
  let best=-1,bestValue=-Infinity;
  const existing=p.monsters.filter(Boolean).map(power).sort((a,b)=>a-b);
  for(let i=0;i<p.hand.length;i++){
   const c=card(p.hand[i]);if(!canNormal(g,s,c.id))continue;
   const cost=existing.slice(0,tributes(c.id)).reduce((a,n)=>a+n,0);
   const value=Math.max(c.atk,c.def*.85)-cost+(c.effect==='draw-on-summon'?450:0);
   if(value>bestValue){bestValue=value;best=i;}
  }
  if(best>=0&&bestValue>0){
   const c=card(p.hand[best]),threat=Math.max(0,...foe.monsters.filter(m=>m&&m.pos!=='set').map(power));
   return summon(g,s,best,c.def>c.atk&&threat>c.atk?'set':'attack');
  }
  for(let i=0;i<p.hand.length;i++){
   const c=card(p.hand[i]);
   if(c.type==='trap'&&slot(p.spells)>=0)return setBackrow(g,s,i);
   if(c.type==='spell'&&c.effect!=='fusion'&&canCast(g,s,'hand',i))return cast(g,s,'hand',i);
  }
  for(let i=0;i<p.monsters.length;i++){
   const m=p.monsters[i];if(!canPosition(g,s,i))continue;
   const threat=Math.max(0,...foe.monsters.filter(x=>x&&x.pos==='attack').map(power));
   if(m.pos!=='attack'&&power(m)>=threat)return position(g,s,i,m.pos==='set');
   if(m.pos==='attack'&&power(m)<threat&&card(m.id).def>power(m))return position(g,s,i);
  }
  return nextPhase(g,s);
 }
 function aiTurn(g,s='ai') {
  if(!active(g,s))return false;
  // Batch interface for simulations; the browser uses aiStep with cancellable pacing.
  let steps=0;
  while(active(g,s)&&steps++<250){if(!aiStep(g,s))return false;}
  if(steps>=250)throw new Error('AI turn exceeded its action limit.');
  return true;
 }

 return {create,validateDeck,canNormal,canCast,choices,summon,setBackrow,fusion,cast,attack,position,endTurn,nextPhase,aiTurn,aiStep,advanceAutomatic,shouldAdvance,mainActions,attackers,finish};
}
root.RelicEngine={createEngine};
if(typeof module!=="undefined"&&module.exports)module.exports=root.RelicEngine;
})(typeof globalThis!=="undefined"?globalThis:this);
