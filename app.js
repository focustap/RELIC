/* RELIC alpha — saved collection, deck builder and solo-duel controller */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const NAMES={home:"DASHBOARD",duel:"DUEL ARENA",packs:"CARD SHOP",collection:"COLLECTION",deck:"DECK BUILDER",rules:"HOW TO PLAY"};
const K="relic-alpha-save-2";
const start=()=>({gold:35,owned:Object.assign({},STARTER_LIST,{"emberstone-colossus":1,"verdant-leviathan":1}),deck:STARTER_DECK.slice(),extra:STARTER_EXTRA.slice(),wins:0,losses:0,daily:"",starter:"ember"});
function load(){try{const v=JSON.parse(localStorage.getItem(K));return v&&Array.isArray(v.deck)&&Array.isArray(v.extra)&&v.owned?Object.assign(start(),v):start();}catch(_){return start();}}
let save=load(),game=null,selected=null,attackSource=-1,page="home",serial=0;
const card=id=>RELIC_BY_ID[id];
const count=id=>Number(save.owned[id]||0);
const inDeck=id=>save.deck.filter(x=>x===id).length+save.extra.filter(x=>x===id).length;
const free=a=>a.findIndex(x=>!x);
const mine=s=>game[s],enemy=s=>s==="you"?"ai":"you";
const entries=a=>Object.entries(a).flatMap(([id,n])=>Array(Number(n)).fill(id));
const shuffle=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const SAVE=()=>{try{localStorage.setItem(K,JSON.stringify(save));}catch(_){}};
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;$("toasts").append(el);setTimeout(()=>el.remove(),3000);}
function label(c){return c.rarity[0].toUpperCase()+c.rarity.slice(1);}
function cardHTML(c,n){
 const t=c.type==="fusion"?"FUSION":c.type.toUpperCase();
 return '<div class="game-card" data-card-id="'+c.id+'" data-type="'+c.type+'" data-rarity="'+c.rarity+'"><div class="card-top"><span>'+c.name+'</span><span class="card-type">'+t+'</span></div><div class="card-stars">'+(c.level?"★".repeat(c.level):"✧")+'</div><div class="card-art"><span class="card-emoji">'+c.icon+'</span></div><div class="card-kind">'+c.element+' • '+t+'</div><div class="card-text">'+c.description+'</div>'+(typeof c.atk==="number"?'<div class="card-stats"><span>ATK '+c.atk+'</span><span>DEF '+c.def+'</span></div>':'<div class="card-stats">✦ '+t+'</div>')+'<div class="card-footer"><span>'+label(c)+'</span>'+(n===undefined?"":'<span class="owned-chip">×'+n+'</span>')+'</div></div>';
}
function showCard(c){$("modal-content").innerHTML='<div class="modal-card-layout">'+cardHTML(c)+'<div><div class="eyebrow">'+label(c)+' • '+c.type.toUpperCase()+'</div><h2>'+c.name+'</h2><div class="modal-detail">'+(c.level?"LEVEL "+c.level+" • ":"")+c.element+'</div><p>'+c.description+'</p>'+(c.materials?'<p><b>Exact Fusion materials:</b> '+c.materials.map(x=>card(x).name).join(" + ")+'</p>':"")+'<p>Owned: <b>'+count(c.id)+'</b></p></div></div>';$("card-modal").classList.remove("hidden");}
function route(q){page=NAMES[q]?q:"home";document.querySelectorAll(".page").forEach(e=>e.classList.toggle("active",e.id==="page-"+page));document.querySelectorAll(".nav-link").forEach(e=>e.classList.toggle("active",e.dataset.page===page));$("page-crumb").textContent=NAMES[page];location.hash=page;window.scrollTo(0,0);render();}
function render(){
 $("credits-header").textContent=save.gold;
 $("shop-credits").textContent=save.gold+" ◈";
 const n=RELIC_CARDS.filter(c=>count(c.id)>0).length;
 $("home-owned").textContent=n+" / "+RELIC_CARDS.length;
 $("home-record").textContent=save.wins+"W / "+save.losses+"L";
 $("collection-meter").style.width=(100*n/RELIC_CARDS.length)+"%";
 const claimed=save.daily===new Date().toDateString();
 $("claim-daily").disabled=claimed;$("claim-daily").textContent=claimed?"CLAIMED TODAY ✓":"CLAIM 10 GOLD";
 if(page==="collection")collection();
 if(page==="packs")shop();
 if(page==="deck")deck();
 if(page==="duel")showDuel();
}
function claim(){if(save.daily===new Date().toDateString())return;save.daily=new Date().toDateString();save.gold+=10;SAVE();render();toast("+10 Gold from your daily cache!");}
function packPick(r){const a=RELIC_CARDS.filter(c=>c.rarity===r);return a[Math.floor(Math.random()*a.length)];}
function openPack(size,cost){
 if(save.gold<cost)return toast("Not enough Gold. Win a duel or claim your daily cache.");
 save.gold-=cost;const drawn=[];
 for(let i=0;i<size;i++){let r="common";if(i%5===3)r=Math.random()<.15?"rare":"uncommon";if(i%5===4)r=Math.random()<.12?"epic":"rare";const c=packPick(r);drawn.push(c);save.owned[c.id]=count(c.id)+1;}
 SAVE();render();$("reveal-cards").innerHTML=drawn.map(c=>cardHTML(c)).join("");$("pack-reveal").classList.remove("hidden");toast(size+" cards added to your collection!");
}
function shop(){
 const basics=RELIC_CARDS.filter(c=>["common","uncommon"].includes(c.rarity));
 $("singles-grid").innerHTML=basics.map(c=>'<div class="single-tile">'+cardHTML(c,count(c.id))+'<div class="buy-row"><span>◈ '+(c.rarity==="common"?4:8)+'</span><button data-buy="'+c.id+'" '+(count(c.id)>=3?"disabled":"")+'>BUY</button></div></div>').join("");
}
function buy(id){
 const c=card(id);if(!c||!["common","uncommon"].includes(c.rarity))return;
 const cost=c.rarity==="common"?4:8;
 if(count(id)>=3)return toast("You already own three copies.");
 if(save.gold<cost)return toast("Not enough Gold.");
 save.gold-=cost;save.owned[id]=count(id)+1;SAVE();render();toast("Purchased "+c.name);
}
function collection(){
 const q=$("collection-search").value.trim().toLowerCase(),f=$("collection-filter").value,only=$("collection-owned").checked;
 const list=RELIC_CARDS.filter(c=>(f==="all"||c.type===f)&&(!only||count(c.id)>0)&&c.name.toLowerCase().includes(q));
 $("archive-count").textContent=RELIC_CARDS.filter(c=>count(c.id)>0).length+" / "+RELIC_CARDS.length;
 $("collection-grid").innerHTML=list.length?list.map(c=>'<div class="'+(count(c.id)?"":"muted")+'" data-inspect="'+c.id+'">'+cardHTML(c,count(c.id))+'</div>').join(""):'<div class="empty-state">No matching cards found.</div>';
}
function valid(){
 if(save.deck.length<40||save.deck.length>60||save.extra.length>15)return false;
 if(save.deck.some(id=>!card(id)||card(id).type==="fusion")||save.extra.some(id=>!card(id)||card(id).type!=="fusion"))return false;
 return [...new Set([...save.deck,...save.extra])].every(id=>inDeck(id)<=Math.min(count(id),3));
}
function deck(){
 const q=$("deck-search").value.trim().toLowerCase(),f=$("deck-filter").value;
 const a=RELIC_CARDS.filter(c=>count(c.id)>0&&(f==="all"||c.type===f)&&c.name.toLowerCase().includes(q));
 $("deck-library").innerHTML=a.map(c=>'<div class="deck-item"><div class="deck-mini">'+c.icon+'</div><div class="deck-item-meta"><strong>'+c.name+'</strong><small>'+label(c)+' • '+c.type+' • Owned '+count(c.id)+'</small></div><div class="qty-actions"><button data-deck-remove="'+c.id+'">−</button><b>'+inDeck(c.id)+'</b><button data-deck-add="'+c.id+'">+</button></div></div>').join("")||'<div class="empty-state">No cards found.</div>';
 $("deck-total").textContent=save.deck.length+" / 40–60";$("deck-status").textContent=valid()?"LEGAL DECK ✓":"INCOMPLETE / INVALID";
 $("deck-status").className=valid()?"status-good":"status-bad";$("deck-meter").style.width=(Math.min(60,save.deck.length)/60*100)+"%";
 $("extra-count").textContent=save.extra.length+"/15";
 const lines=arr=>{const counts={};arr.forEach(id=>counts[id]=(counts[id]||0)+1);return Object.entries(counts).map(([id,n])=>'<div class="deck-line"><span>×'+n+'</span>'+card(id).name+'</div>').join("");};
 $("deck-list").innerHTML=lines(save.deck);$("extra-list").innerHTML=lines(save.extra);
}
function changeDeck(id,delta){const c=card(id),arr=c.type==="fusion"?save.extra:save.deck;if(delta>0){if(inDeck(id)>=Math.min(3,count(id)))return toast("No more owned copies available.");if(arr.length>=(c.type==="fusion"?15:60))return toast("Deck is full.");arr.push(id);}else{let at=arr.indexOf(id);if(at<0)return;arr.splice(at,1);}SAVE();render();}
function resetDeck(){if(!confirm("Restore the default starter deck?"))return;save.deck=STARTER_DECK.slice();save.extra=STARTER_EXTRA.slice();for(const id of [...new Set([...save.deck,...save.extra])])save.owned[id]=Math.max(count(id),inDeck(id));SAVE();render();}
function side(deck,extra){return{lp:8000,deck:shuffle(deck),extra:extra.slice(),hand:[],monsters:Array(5).fill(null),spells:Array(5).fill(null),grave:[],normalUsed:false};}
function log(t){if(game)game.logs.unshift(t);}
function win(w,reason){
 if(!game||game.winner)return;
 game.winner=w;game.phase="over";selected=null;attackSource=-1;
 const earned=w==="you"?10:2;
 if(w==="you")save.wins++;else save.losses++;
 save.gold+=earned;SAVE();log(reason);log((w==="you"?"VICTORY!":"DEFEAT.")+" You earned "+earned+" Gold.");toast((w==="you"?"Victory! +10 Gold":"Defeat. +2 Gold"));
}
function hit(s,n){mine(s).lp=Math.max(0,mine(s).lp-Math.max(0,n));if(mine(s).lp===0)win(enemy(s),(s==="you"?"You":"The Warden")+" ran out of Life Points.");}
function draw(s,n=1){const p=mine(s);for(let i=0;i<n;i++){if(!p.deck.length){win(enemy(s),"Deck-out: "+s+" could not draw.");return;}p.hand.push(p.deck.shift());}}
function summonSlot(s){return free(mine(s).monsters);}
function tributeCount(id){let x=card(id).level;return x<=4?0:x<=6?1:2;}
function canNormal(s,id){const p=mine(s),n=tributeCount(id);return !p.normalUsed&&p.monsters.filter(Boolean).length>=n&&(free(p.monsters)>=0||n>0);}
function entity(id,pos="attack"){return{id,pos,played:game.round,attacked:false,moved:false,atkBonus:0};}
function spawn(s,id,pos,normal){
 const p=mine(s),at=free(p.monsters);if(at<0)return false;
 p.monsters[at]=entity(id,pos);
 if(normal)p.normalUsed=true;
 const c=card(id);
 log((s==="you"?"You":"Warden")+(pos==="set"?" Set ":" summoned ")+c.name+".");
 if(pos!=="set"&&c.effect==="draw-on-summon"){draw(s);log(c.name+" drew one card.");}
 if(pos!=="set"&&c.effect==="heal-on-summon"){p.lp+=400;log(c.name+" restored 400 LP.");}
 return true;
}
function summon(s,i,pos){
 const p=mine(s),id=p.hand[i];if(!id||card(id).type!=="monster"||!canNormal(s,id))return toast("Summoning requirements not met.");
 const n=tributeCount(id);
 if(n&&s==="you"&&!confirm("Tribute "+n+" of your lowest-ATK monsters to summon "+card(id).name+"?"))return;
 if(n){const targets=p.monsters.map((m,k)=>m?{k,atk:card(m.id).atk}:null).filter(Boolean).sort((a,b)=>a.atk-b.atk).slice(0,n);targets.forEach(({k})=>{p.grave.push(p.monsters[k].id);log("Tributed "+card(p.monsters[k].id).name);p.monsters[k]=null;});}
 p.hand.splice(i,1);spawn(s,id,pos,true);selected=null;showDuel();
}
function destroy(s,i){
 const p=mine(s),m=p.monsters[i];if(!m)return;
 p.monsters[i]=null;p.grave.push(m.id);log(card(m.id).name+" was destroyed.");
 if(card(m.id).effect==="heal-on-destroy"){p.lp+=300;log("+300 LP from Mossbound Guard.");}
}
function setBackrow(s,i){const p=mine(s),id=p.hand[i],c=card(id);if(!c||!["spell","trap"].includes(c.type)||free(p.spells)<0)return toast("No empty Spell/Trap zone.");p.spells[free(p.spells)]={id,setTurn:game.round};p.hand.splice(i,1);log((s==="you"?"You":"Warden")+" Set a card.");selected=null;showDuel();}
function materialPosition(s,id,used){
 const p=mine(s);
 for(let i=0;i<p.hand.length;i++)if(p.hand[i]===id&&!used.some(x=>x.where==="hand"&&x.i===i))return {where:"hand",i};
 for(let i=0;i<p.monsters.length;i++)if(p.monsters[i]&&p.monsters[i].id===id&&p.monsters[i].pos!=="set"&&!used.some(x=>x.where==="board"&&x.i===i))return{where:"board",i};
 return null;
}
function choices(s){
 return mine(s).extra.filter(id=>{const use=[];for(const mat of card(id).materials){const pos=materialPosition(s,mat,use);if(!pos)return false;use.push(pos);}return free(mine(s).monsters)!==-1||use.some(x=>x.where==="board");});
}
function fusion(s,where,i,fusionId){
 const p=mine(s),id=where==="hand"?p.hand[i]:p.spells[i]&&p.spells[i].id;
 if(id!=="relic-fusion"||!choices(s).includes(fusionId))return;
 const use=[];for(const mat of card(fusionId).materials)use.push(materialPosition(s,mat,use));
 const remove=use.filter(x=>x.where==="hand").map(x=>x.i);if(where==="hand")remove.push(i);
 [...new Set(remove)].sort((a,b)=>b-a).forEach(k=>p.hand.splice(k,1));
 use.filter(x=>x.where==="board").forEach(x=>p.monsters[x.i]=null);
 if(where==="set")p.spells[i]=null;
 p.grave.push("relic-fusion",...card(fusionId).materials);
 p.extra.splice(p.extra.indexOf(fusionId),1);
 spawn(s,fusionId,"attack",false);
 log("FUSION! "+card(fusionId).materials.map(id=>card(id).name).join(" + ")+" → "+card(fusionId).name);
 selected=null;showDuel();
}
function cast(s,where,i){
 const p=mine(s),id=where==="hand"?p.hand[i]:p.spells[i]&&p.spells[i].id,c=card(id);
 if(!c||c.type!=="spell"||game.winner)return;
 if(c.effect==="fusion"){const a=choices(s);if(!a.length)return toast("You don't have the exact Fusion materials.");if(s==="you"){selected={kind:"fusion",where,i};showDuel();}else fusion(s,where,i,a[0]);return;}
 if(c.effect==="shatter"&&!mine(enemy(s)).monsters.some(m=>m&&m.pos!=="set"&&card(m.id).atk<=1600))return toast("No valid enemy monster.");
 if(c.effect==="revive"&&(free(p.monsters)<0||!p.grave.some(id=>card(id).type==="monster"&&card(id).level<=4)))return toast("No Level 4 or lower monster to revive.");
 if(c.effect.startsWith("buff")&&!p.monsters.some(m=>m&&m.pos==="attack"))return toast("No Attack Position monster.");
 if(where==="hand")p.hand.splice(i,1);else p.spells[i]=null;p.grave.push(id);
 log((s==="you"?"You":"Warden")+" activated "+c.name+".");
 switch(c.effect){
 case "heal800":p.lp+=800;break;case "heal500":p.lp+=500;break;
 case "burn500":hit(enemy(s),500);break;case "burn700":hit(enemy(s),700);break;
 case "draw1":draw(s);break;case "insight":draw(s);p.lp+=200;break;
 case "buff400":case "buff600":{const target=p.monsters.filter(m=>m&&m.pos==="attack").sort((a,b)=>card(b.id).atk-card(a.id).atk)[0];target.atkBonus+=(c.effect==="buff400"?400:600);break;}
 case "shatter":{const foes=mine(enemy(s)).monsters.map((m,k)=>m&&m.pos!=="set"&&card(m.id).atk<=1600?{m,k}:null).filter(Boolean).sort((a,b)=>card(b.m.id).atk-card(a.m.id).atk);destroy(enemy(s),foes[0].k);break;}
 case "revive":{const k=p.grave.findLastIndex(id=>card(id).type==="monster"&&card(id).level<=4);const [revived]=p.grave.splice(k,1);spawn(s,revived,"defense",false);break;}
 }
 selected=null;showDuel();
}
function attack(s,from,to){
 if(game.winner||game.phase!=="battle"||s!==game.turn)return;
 const a=mine(s),d=mine(enemy(s)),m=a.monsters[from];
 if(!m||m.pos!=="attack"||m.attacked)return;
 if(s==="you"&&game.round===1)return;
 if(to===-1&&d.monsters.some(Boolean))return toast("You must target a monster.");
 if(to>=0&&!d.monsters[to])return;
 m.attacked=true;
 const cname=card(m.id).name;
 log((s==="you"?"Your ":"Warden's ")+cname+" attacks"+(to>=0?" "+(d.monsters[to].pos==="set"?"a face-down monster":card(d.monsters[to].id).name):" directly")+".");
 let bonusDEF=0,damageShield=false;
 // Alpha: traps auto-activate at the attack declaration window.
 for(let k=0;k<d.spells.length;k++){
  const t=d.spells[k];if(!t||card(t.id).type!=="trap"||t.setTurn===game.round)continue;
  const e=card(t.id).effect;
  if(!["negate-attack","snare","shield","rebuke","guard","veil","collapse"].includes(e))continue;
  if(e==="snare"&&card(m.id).atk+m.atkBonus>1800)continue;
  if(e==="collapse"&&card(m.id).atk+m.atkBonus>2200)continue;
  if(e==="guard"&&to<0)continue;
  d.spells[k]=null;d.grave.push(t.id);log("TRAP! "+card(t.id).name+" activated.");
  if(e==="snare"||e==="collapse"){destroy(s,from);showDuel();return;}
  if(e==="negate-attack"){showDuel();return;}
  if(e==="veil"){d.lp+=300;showDuel();return;}
  if(e==="shield"){damageShield=true;break;}
  if(e==="guard"){bonusDEF=500;break;}
  if(e==="rebuke"){hit(s,350);if(game.winner){showDuel();return;}break;}
 }
 const atk=card(m.id).atk+m.atkBonus;
 if(to===-1){hit(enemy(s),atk);log("Direct hit for "+atk+" LP.");}
 else{
  const target=d.monsters[to];
  if(target.pos==="set"){target.pos="defense";log("Revealed "+card(target.id).name+" in Defense Position.");}
  if(target.pos==="defense"){
   const diff=atk-card(target.id).def-bonusDEF;
   if(diff>0)destroy(enemy(s),to);
   else if(diff<0&&!damageShield)hit(s,-diff);
  }else{
   const diff=atk-(card(target.id).atk+target.atkBonus);
   if(diff>=0)destroy(enemy(s),to);
   if(diff<=0)destroy(s,from);
   if(!damageShield&&diff>0)hit(enemy(s),diff);
   if(!damageShield&&diff<0)hit(s,-diff);
  }
 }
 attackSource=-1;selected=null;showDuel();
}
function phaseNext(){
 if(!game||game.winner||game.turn!=="you")return;
 if(game.phase==="main1"){game.phase=game.round===1?"main2":"battle";log(game.phase==="battle"?"Battle Phase begins.":"First player cannot attack on their first turn.");}
 else if(game.phase==="battle")game.phase="main2";
 else if(game.phase==="main2"){turnEnd();return;}
 else return;
 selected=null;attackSource=-1;showDuel();
}
function turnEnd(){
 if(!game||game.winner||game.turn!=="you")return;
 log("Your turn ends.");game.turn="ai";game.phase="main1";selected=null;attackSource=-1;
 showDuel();setTimeout(aiTurn,350);
}
function aiTurn(){
 if(!game||game.winner||game.turn!=="ai")return;
 const a=mine("ai");
 for(let i=0;i<a.hand.length;){const c=card(a.hand[i]);if(c.type==="trap"&&free(a.spells)!==-1){setBackrow("ai",i);continue;}i++;}
 const fidx=a.hand.findIndex(id=>id==="relic-fusion");
 if(fidx!==-1&&choices("ai").length)fusion("ai","hand",fidx,choices("ai")[0]);
 let best=-1,score=-1;
 for(let i=0;i<a.hand.length;i++){const c=card(a.hand[i]);if(c.type!=="monster"||!canNormal("ai",c.id))continue;const value=c.atk-tributeCount(c.id)*500;if(value>score){score=value;best=i;}}
 if(best!==-1)summon("ai",best,"attack");
 for(let i=0;i<a.hand.length;){const c=card(a.hand[i]);if(c.type==="spell"&&c.effect!=="fusion"){const before=a.hand.length;cast("ai","hand",i);if(a.hand.length<before)continue;}i++;}
 game.phase="battle";
 for(let i=0;i<a.monsters.length&&!game.winner;i++){
  const m=a.monsters[i];if(!m||m.pos!=="attack")continue;
  const targets=mine("you").monsters.map((x,k)=>x?{k,x}:null).filter(Boolean);
  let dest=-1;
  if(targets.length){
   const winning=targets.filter(t=>card(m.id).atk+m.atkBonus>(t.x.pos==="attack"?card(t.x.id).atk+t.x.atkBonus:card(t.x.id).def)).sort((x,y)=>card(y.x.id).atk-card(x.x.id).atk);
   dest=winning.length?winning[0].k:targets.sort((x,y)=>card(x.x.id).atk-card(y.x.id).atk)[0].k;
  }
  attack("ai",i,dest);
 }
 if(game.winner){showDuel();return;}
 game.phase="end";log("The Warden ends the turn.");game.round++;game.turn="you";game.phase="main1";
 for(const s of ["you","ai"]){mine(s).normalUsed=false;mine(s).monsters.forEach(m=>{if(m){m.attacked=false;m.atkBonus=0;m.moved=false;}});}
 draw("you",1);log("Your turn "+game.round+". Draw 1 card.");showDuel();
}
function begin(){
 if(!valid()){route("deck");return toast("A legal 40–60 card deck is required.");}
 if(game&&!game.winner&&!confirm("Abandon the current duel?"))return;
 serial=0;game={you:side(save.deck,save.extra),ai:side(STARTER_DECK,STARTER_EXTRA),turn:"you",phase:"main1",round:1,winner:null,logs:[]};
 draw("you",5);draw("ai",5);selected=null;attackSource=-1;
 log("Both duelists begin with 8,000 LP and five cards.");log("You go first. No first-turn draw or battle.");showDuel();
}
function miniZone(m,s,i){
 if(!m)return '<div class="zone" data-zone="'+s+'-'+i+'"></div>';
 if(m.pos==="set")return '<div class="zone filled" data-zone="'+s+'-'+i+'"><div class="set-card defense" aria-label="Face-down RELIC card"><span>RELIC</span></div></div>';
 return '<div class="zone filled '+(attackSource===i&&s==="you"?"selected-target":"")+'" data-zone="'+s+'-'+i+'">'+cardHTML(card(m.id))+'</div>';
}
function backrowZone(m,s,i){
 if(!m)return '<div class="zone" data-backrow="'+s+'-'+i+'"></div>';
 if(s==="ai"||card(m.id).type==="trap")return '<div class="zone filled" data-backrow="'+s+'-'+i+'"><div class="set-card" aria-label="Face-down RELIC card"><span>RELIC</span></div></div>';
 return '<div class="zone filled" data-backrow="'+s+'-'+i+'">'+cardHTML(card(m.id))+'</div>';
}
function actions(){
 if(!game||game.winner||game.turn!=="you")return game&&game.winner?'<h3>'+(game.winner==="you"?"VICTORY":"DEFEAT")+'</h3><p>Start a new duel to play again.</p>':'<p>Waiting for the Warden...</p>';
 const p=mine("you");
 if(selected&&selected.kind==="fusion"){
  const opts=choices("you");return '<h3 class="selection-title">Choose a Fusion Monster</h3><p>Exact named materials will be sent to the Graveyard.</p><div class="selection-actions">'+opts.map(id=>'<button data-fusion="'+id+'">'+card(id).name+'</button>').join("")+'<button data-cancel>Cancel</button></div>';
 }
 if(!selected)return '<div class="empty-select">'+(game.phase==="battle"?"Select one of your Attack Position monsters to declare an attack.":"Select a card in your hand, or a card on the field.")+'</div>';
 if(selected.kind==="hand"){
  const c=card(p.hand[selected.i]);if(!c)return "";
  let buttons="";
  const active=["main1","main2"].includes(game.phase);
  if(active&&c.type==="monster")buttons='<button data-summon="attack">Summon (Attack)</button><button data-summon="set">Set (Defense)</button>';
  if(active&&c.type==="spell")buttons='<button data-cast="hand">Activate Spell</button>';
  if(active&&["spell","trap"].includes(c.type))buttons+='<button data-set-card>Set Face-down</button>';
  return '<div class="selection-title">'+c.name+'</div><p>'+c.description+'</p><div class="selection-actions">'+buttons+'<button data-cancel>Cancel</button></div>';
 }
 if(selected.kind==="spell"){
  const sp=p.spells[selected.i],c=sp&&card(sp.id);
  if(!c)return "";
  return '<div class="selection-title">'+c.name+'</div><p>'+c.description+'</p><div class="selection-actions">'+(c.type==="spell"&&["main1","main2"].includes(game.phase)?'<button data-cast="set">Activate Set Spell</button>':"")+'<button data-cancel>Cancel</button></div>';
 }
 if(selected.kind==="monster"){
  const m=p.monsters[selected.i];if(!m)return "";
  let acts="";
  if(game.phase==="battle"&&m.pos==="attack"&&!m.attacked)acts='<button data-attack>Declare Attack</button>';
  if(["main1","main2"].includes(game.phase)&&m.played!==game.round&&!m.moved){
   if(m.pos==="set")acts+='<button data-flip>Flip Summon</button>';
   else acts+='<button data-position>Switch to '+(m.pos==="attack"?"Defense":"Attack")+'</button>';
  }
  return '<div class="selection-title">'+card(m.id).name+'</div><p>'+card(m.id).description+'</p><div class="selection-actions">'+acts+'<button data-cancel>Cancel</button></div>';
 }
 return '<div class="empty-select">Select a card.</div>';
}
function showDuel(){
 $("duel-idle").classList.toggle("hidden",!!game);$("duel-play").classList.toggle("hidden",!game);if(!game)return;
 const a=mine("you"),b=mine("ai");
 $("player-lp").textContent=a.lp.toLocaleString();$("enemy-lp").textContent=b.lp.toLocaleString();
 $("duel-turn").textContent=game.winner?"DUEL FINISHED":"TURN "+game.round+" — "+(game.turn==="you"?"YOUR TURN":"WARDEN'S TURN");
 $("duel-phase").textContent=game.phase.toUpperCase().replace("MAIN1","MAIN PHASE 1").replace("MAIN2","MAIN PHASE 2");
 $("duel-hint").textContent=game.winner?"Duel complete.":"Select a card to play or advance phases.";
 $("enemy-hand").innerHTML=b.hand.map(()=>'<i title="RELIC card back"></i>').join("");
 for(const s of ["you","ai"]){const obj=mine(s);$(s==="you"?"player-monsters":"enemy-monsters").innerHTML=obj.monsters.map((m,i)=>miniZone(m,s,i)).join("");
 $(s==="you"?"player-spells":"enemy-spells").innerHTML=obj.spells.map((m,i)=>backrowZone(m,s,i)).join("");
 $(s==="you"?"player-grave":"enemy-grave").textContent=obj.grave.length;
 $(s==="you"?"player-field":"enemy-field").textContent="—";
 }
 $("player-hand").innerHTML=a.hand.map((id,i)=>'<div data-hand="'+i+'" class="'+(selected&&selected.kind==="hand"&&selected.i===i?"selected":"")+'">'+cardHTML(card(id))+'</div>').join("");
 $("hand-count").textContent=a.hand.length+" CARDS";
 $("selected-panel").innerHTML=actions();
 $("duel-log").innerHTML=game.logs.slice(0,20).map(s=>'<div class="log-item">'+s+'</div>').join("");
 $("advance-phase").disabled=game.turn!=="you"||!!game.winner;
 $("end-turn").disabled=game.turn!=="you"||!!game.winner;
}
function clickEvent(ev){
 const t=ev.target;
 const attr=(key)=>t.closest("["+key+"]");
 let x;
 if((x=attr("[data-page]")))return route(x.dataset.page);
 if((x=attr("[data-go]")))return route(x.dataset.go);
 if((x=attr("[data-inspect]")))return showCard(card(x.dataset.inspect));
 if((x=attr("[data-buy]")))return buy(x.dataset.buy);
 if((x=attr("[data-deck-add]")))return changeDeck(x.dataset.deckAdd,1);
 if((x=attr("[data-deck-remove]")))return changeDeck(x.dataset.deckRemove,-1);
 if((x=attr("[data-shop-tab]"))){document.querySelectorAll(".tab").forEach(y=>y.classList.toggle("active",y===x));document.querySelectorAll(".shop-section").forEach(y=>y.classList.toggle("hidden",y.id!=="shop-"+x.dataset.shopTab));return;}
 if(attr("[data-close-modal]"))return $("card-modal").classList.add("hidden");
 if(attr("[data-close-pack]"))return $("pack-reveal").classList.add("hidden");
 if((x=attr("[data-hand]"))&&game&&!game.winner&&game.turn==="you"){selected={kind:"hand",i:Number(x.dataset.hand)};showDuel();return;}
 if((x=attr("[data-zone]"))&&game&&!game.winner&&game.turn==="you"){
  const [s,i]=x.dataset.zone.split("-"),n=Number(i);
  if(s==="ai"&&attackSource!==-1){attack("you",attackSource,n);return;}
  if(s==="you"&&mine("you").monsters[n]){selected={kind:"monster",i:n};attackSource=-1;showDuel();return;}
 }
 if((x=attr("[data-backrow]"))&&game&&!game.winner&&game.turn==="you"){
  const[s,i]=x.dataset.backrow.split("-");if(s==="you"&&mine(s).spells[Number(i)]){selected={kind:"spell",i:Number(i)};showDuel();}return;
 }
 if(t.closest("[data-cancel]")){selected=null;attackSource=-1;showDuel();return;}
 if(t.closest("[data-summon]")&&selected)return summon("you",selected.i,t.closest("[data-summon]").dataset.summon);
 if(t.closest("[data-set-card]")&&selected)return setBackrow("you",selected.i);
 if(t.closest("[data-cast]")&&selected)return cast("you",selected.kind==="hand"?"hand":"set",selected.i);
 if((x=t.closest("[data-fusion]"))&&selected&&selected.kind==="fusion")return fusion("you",selected.where,selected.i,x.dataset.fusion);
 if(t.closest("[data-attack]")&&selected){attackSource=selected.i;selected=null;if(!mine("ai").monsters.some(Boolean))attack("you",attackSource,-1);else{toast("Select an enemy monster to attack.");showDuel();}return;}
 if(t.closest("[data-position]")&&selected){const m=mine("you").monsters[selected.i];m.pos=m.pos==="attack"?"defense":"attack";m.moved=true;selected=null;showDuel();return;}
 if(t.closest("[data-flip]")&&selected){const m=mine("you").monsters[selected.i];m.pos="attack";m.moved=true;selected=null;showDuel();return;}
}
function wire(){
 document.addEventListener("click",clickEvent);
 $("claim-daily").onclick=claim;
 $("open-pack").onclick=()=>openPack(5,10);
 $("new-duel").onclick=begin;$("idle-start").onclick=begin;
 $("advance-phase").onclick=phaseNext;$("end-turn").onclick=turnEnd;
 $("surrender").onclick=()=>{if(game&&!game.winner&&confirm("Surrender the duel?")){win("ai","You surrendered.");showDuel();}};
 $("reset-deck").onclick=resetDeck;
 for(const id of ["collection-search","collection-filter","collection-owned","deck-search","deck-filter"]){$(id).addEventListener("input",render);}
 // Bigger packs award extra value per card. All rewards are free-to-earn Gold only.
 const packBtn=$("open-pack");
 packBtn.textContent="◈ OPEN 5-CARD PACK — 10 GOLD";
 const big=document.createElement("div");big.className="phase-buttons pack-upgrades";big.innerHTML='<button class="btn btn-outline btn-small" data-bundle="12">12 CARDS — 22 GOLD</button><button class="btn btn-outline btn-small" data-bundle="25">25 CARDS — 40 GOLD</button>';
 packBtn.after(big);
 big.addEventListener("click",e=>{const button=e.target.closest("[data-bundle]");if(!button)return;const n=Number(button.dataset.bundle);openPack(n,n===12?22:40);});
 const fields=["credits-header","shop-credits"];
 for(const id of fields)$(id).closest(id==="credits-header"?".coin-balance":".shop-balance").innerHTML=$(id).closest(id==="credits-header"?".coin-balance":".shop-balance").innerHTML.replaceAll("SHARDS","GOLD");
 document.querySelectorAll("p,small,button,li,.stat-card span").forEach(el=>{if(el.children.length===0&&el.textContent.includes("shards"))el.textContent=el.textContent.replaceAll("shards","Gold").replaceAll("Shards","Gold");});
 document.querySelectorAll("[data-go]").forEach(()=>{});
 const hash=location.hash.replace("#","");route(NAMES[hash]?hash:"home");
}
wire();
})();