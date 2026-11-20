/* RELIC alpha — saved collection, deck builder and solo-duel controller */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const NAMES={home:"DASHBOARD",duel:"DUEL ARENA",packs:"CARD SHOP",collection:"COLLECTION",deck:"DECK BUILDER",rules:"HOW TO PLAY",profile:"PLAYER PROFILE",settings:"SETTINGS",online:"ONLINE MULTIPLAYER"};
const engine=RelicEngine.createEngine(RELIC_BY_ID);
const K="relic-alpha-save-2";
const start=()=>({gold:35,owned:Object.assign({},STARTER_LIST,{"emberstone-colossus":1,"verdant-leviathan":1}),deck:STARTER_DECK.slice(),extra:STARTER_EXTRA.slice(),wins:0,losses:0,daily:"",starter:"classic",decks:[{id:"classic",name:"Warden's Challenger",deck:STARTER_DECK.slice(),extra:STARTER_EXTRA.slice()}],activeDeck:"classic",deckName:"Warden's Challenger",settings:{motion:"system",performance:"high"}});
const store=RelicStorage.createStore(localStorage,K,start,RELIC_BY_ID);
let save=store.read(),committed=JSON.stringify(save),game=null,selected=null,attackSource=-1,page="home";
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=id=>RELIC_BY_ID[id];
const count=id=>Number(save.owned[id]||0);
const inDeck=id=>save.deck.filter(x=>x===id).length+save.extra.filter(x=>x===id).length;
const free=a=>a.findIndex(x=>!x);
const mine=s=>game[s],enemy=s=>s==="you"?"ai":"you";
function SAVE(){
 const previous=JSON.parse(committed);
 const item={id:save.activeDeck,name:save.deckName,deck:save.deck.slice(),extra:save.extra.slice()};
 const at=save.decks.findIndex(d=>d.id===item.id);if(at<0)save.decks.push(item);else save.decks[at]=item;
 const result=store.write(save);
 if(!result.ok){save=previous;toast(result.error);render();return false;}
 committed=JSON.stringify(save);return true;
}
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;$("toasts").append(el);setTimeout(()=>el.remove(),3000);}
function label(c){return c.rarity[0].toUpperCase()+c.rarity.slice(1);}
function artHTML(c){return '<img src="'+c.artwork+'" alt="'+c.name+' illustration" loading="lazy" decoding="async" width="768" height="768">';}
function cardHTML(c,n){
 const t=c.type==="fusion"?"FUSION":c.type.toUpperCase();
 return '<div class="game-card" data-card-id="'+c.id+'" data-type="'+c.type+'" data-rarity="'+c.rarity+'"><div class="card-top"><span>'+c.name+'</span><span class="card-type">'+t+'</span></div><div class="card-stars">'+(c.level?"★".repeat(c.level):"✧")+'</div><div class="card-art">'+artHTML(c)+'</div><div class="card-kind">'+c.element+' • '+(c.creatureType||t)+'</div><div class="card-text">'+c.description+'</div>'+(typeof c.atk==="number"?'<div class="card-stats"><span>ATK '+c.atk+'</span><span>DEF '+c.def+'</span></div>':'<div class="card-stats">✦ '+t+'</div>')+'<div class="card-footer"><span>'+label(c)+'</span>'+(n===undefined?"":'<span class="owned-chip">×'+n+'</span>')+'</div></div>';
}
let modalReturn=null;
function showCard(c){if(!c)return;modalReturn=document.activeElement;$("modal-content").innerHTML='<div class="modal-card-layout">'+cardHTML(c)+'<div><div class="eyebrow">'+label(c)+' • '+c.type.toUpperCase()+'</div><h2>'+c.name+'</h2><div class="modal-detail">'+(c.level?"LEVEL "+c.level+" • ":"")+c.element+'</div><p>'+c.description+'</p>'+(c.materials?'<p><b>Exact Fusion materials:</b> '+c.materials.map(x=>card(x).name).join(" + ")+'</p>':"")+'<p>Owned: <b>'+count(c.id)+'</b></p><a class="art-download" href="'+c.artwork+'" target="_blank" rel="noopener">VIEW FULL ILLUSTRATION ↗</a></div></div>';$("card-modal").classList.remove("hidden");$("card-modal").querySelector('.modal-close').focus?.();}
function closeModal(id){$(id).classList.add('hidden');modalReturn?.focus?.();}
function route(q){page=NAMES[q]?q:"home";document.querySelectorAll(".page").forEach(e=>e.classList.toggle("active",e.id==="page-"+page));document.querySelectorAll(".nav-link").forEach(e=>e.classList.toggle("active",e.dataset.page===page));$("page-crumb").textContent=NAMES[page];location.hash=page;window.scrollTo(0,0);render();}
function render(){
 $("featured-relic").innerHTML=cardHTML(card("ember-squire"));
 $("arena-deck").textContent="ACTIVE DECK: "+save.deckName;
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
 if(page==="profile"){$("profile-record").textContent=save.wins+" wins · "+save.losses+" losses";$("profile-deck").textContent=save.deckName;}
}
function claim(){if(save.daily===new Date().toDateString())return;save.daily=new Date().toDateString();save.gold+=10;if(!SAVE())return;render();toast("+10 Gold from your daily cache!");}
function packPick(r){const a=RELIC_CARDS.filter(c=>c.rarity===r);return a[Math.floor(Math.random()*a.length)];}
function openPack(size,cost){
 if(![[5,10],[12,22],[25,40]].some(([n,p])=>n===size&&p===cost))return toast("Invalid pack purchase.");
 if(save.gold<cost)return toast("Not enough Gold. Win a duel or claim your daily cache.");
 save.gold-=cost;const drawn=[];
 for(let i=0;i<size;i++){let r="common";if(i%5===3)r=Math.random()<.15?"rare":"uncommon";if(i%5===4)r=Math.random()<.12?"epic":"rare";const c=packPick(r);drawn.push(c);save.owned[c.id]=count(c.id)+1;}
 if(!SAVE())return;render();$("reveal-cards").innerHTML=drawn.map(c=>'<button class="reveal-one unrevealed" data-reveal-card data-rarity="'+c.rarity+'" aria-label="Reveal card">'+cardHTML(c)+'</button>').join("");modalReturn=document.activeElement;$("pack-reveal").classList.remove("hidden");$("reveal-all").focus?.();toast(size+" cards added to your collection!");
}
function shop(){
 const basics=RELIC_CARDS.filter(c=>["common","uncommon"].includes(c.rarity));
 $("singles-grid").innerHTML=basics.map(c=>'<div class="single-tile">'+cardHTML(c,count(c.id))+'<div class="buy-row"><span>◈ '+SINGLE_PRICES[c.rarity]+'</span><button data-buy="'+c.id+'" '+(count(c.id)>=3?"disabled":"")+'>BUY</button></div></div>').join("");
}
function buy(id){
 const c=card(id);if(!c||!["common","uncommon"].includes(c.rarity))return;
 const cost=SINGLE_PRICES[c.rarity];
 if(count(id)>=3)return toast("You already own three copies.");
 if(save.gold<cost)return toast("Not enough Gold.");
 save.gold-=cost;save.owned[id]=count(id)+1;if(!SAVE())return;render();toast("Purchased "+c.name);
}
function filtered(prefix,only){
 const q=$(prefix+'-search').value.trim().toLowerCase(),f=$(prefix+'-filter').value,element=$(prefix+'-element').value,sort=$(prefix+'-sort').value;
 return RELIC_CARDS.filter(c=>(f==='all'||c.type===f||c.category===f)&&(!only||count(c.id)>0)&&(element==='all'||c.element===element)&&c.name.toLowerCase().includes(q)).sort((a,b)=>sort==='level'?(b.level||0)-(a.level||0)||a.name.localeCompare(b.name):sort==='rarity'?RARITY_ORDER.indexOf(b.rarity)-RARITY_ORDER.indexOf(a.rarity)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
}
function collection(){
 const q=$("collection-search").value.trim().toLowerCase(),f=$("collection-filter").value,only=$("collection-owned").checked;
 const list=filtered("collection",only);
 $("archive-count").textContent=RELIC_CARDS.filter(c=>count(c.id)>0).length+" / "+RELIC_CARDS.length;
 $("collection-grid").innerHTML=list.length?list.map(c=>'<div class="'+(count(c.id)?"":"muted")+'" role="button" tabindex="0" aria-label="Inspect '+c.name+'" data-inspect="'+c.id+'">'+cardHTML(c,count(c.id))+'</div>').join(""):'<div class="empty-state">No matching cards found.</div>';
}
function valid(){
 return engine.validateDeck(save.deck,save.extra,save.owned);
}
function chooseStarter(id){
 const archetype=RELIC_STARTERS.find(x=>x.id===id);
 if(!archetype)return;
 if(game&&!game.winner)return toast("Finish the current duel before switching your deck.");
 if(!confirm("Switch to "+archetype.name+"? This replaces the active deck but keeps your collection."))return;
 save.activeDeck="starter-"+id;save.deckName=archetype.name;save.starter=id;save.deck=archetype.deck.slice();save.extra=archetype.extra.slice();
 const required={};[...save.deck,...save.extra].forEach(cid=>required[cid]=(required[cid]||0)+1);
 for(const [cid,n] of Object.entries(required))save.owned[cid]=Math.max(count(cid),n);
 if(!SAVE())return;render();toast(archetype.name+" is now your active deck!");
}
function renderStarterChoices(){
 let holder=$("starter-choices");
 if(!holder){
  holder=document.createElement("div");holder.id="starter-choices";holder.className="starter-grid";
  const heading=document.createElement("div");heading.className="section-heading";heading.innerHTML='<div><span class="eyebrow">CHOOSE A CHAMPION</span><h2>Five Starter Decks</h2></div>';
  const page=document.getElementById("page-deck");const layout=page.querySelector(".deck-layout");
  layout.before(heading,holder);
 }
 holder.innerHTML=RELIC_STARTERS.map(x=>{
  const commander=card(x.commander);
  return '<article class="starter-choice '+(save.starter===x.id?"current":"")+'"><div class="commander-illustration">'+artHTML(commander)+'</div><small>'+x.style+'</small><h3>'+x.name+'</h3><p>'+x.description+'</p><small>COMMANDER: '+commander.name+'</small><button data-starter="'+x.id+'">'+(save.starter===x.id?"SELECTED ✓":"SELECT STARTER")+'</button></article>';
 }).join("");
}
function deck(){
 $("deck-name").value=save.deckName;
 $("saved-decks").innerHTML=save.decks.map(d=>'<option value="'+escapeHTML(d.id)+'" '+(d.id===save.activeDeck?"selected":"")+'>'+escapeHTML(d.name)+'</option>').join("");
 renderStarterChoices();
 const q=$("deck-search").value.trim().toLowerCase(),f=$("deck-filter").value;
 const a=filtered("deck",true);
 $("deck-library").innerHTML=a.map(c=>'<div class="deck-item"><button class="deck-mini" data-inspect="'+c.id+'" aria-label="Inspect '+c.name+'">'+artHTML(c)+'</button><div class="deck-item-meta"><strong>'+c.name+'</strong><small>'+label(c)+' • '+c.type+' • Owned '+count(c.id)+'</small></div><div class="qty-actions"><button data-deck-remove="'+c.id+'">−</button><b>'+inDeck(c.id)+'</b><button data-deck-add="'+c.id+'">+</button></div></div>').join("")||'<div class="empty-state">No cards found.</div>';
 $("deck-total").textContent=save.deck.length+" / 40–60";$("deck-status").textContent=valid()?"LEGAL DECK ✓":"INCOMPLETE / INVALID";
 $("deck-status").className=valid()?"status-good":"status-bad";$("deck-meter").style.width=(Math.min(60,save.deck.length)/60*100)+"%";
 $("extra-count").textContent=save.extra.length+"/15";
 const lines=arr=>{const counts={};arr.forEach(id=>counts[id]=(counts[id]||0)+1);return Object.entries(counts).map(([id,n])=>'<div class="deck-line"><span>×'+n+'</span>'+card(id).name+'</div>').join("");};
 $("deck-list").innerHTML=lines(save.deck);$("extra-list").innerHTML=lines(save.extra);
}
function changeDeck(id,delta){const c=card(id);if(!c)return;const arr=c.type==="fusion"?save.extra:save.deck;if(delta>0){if(inDeck(id)>=Math.min(3,count(id)))return toast("No more owned copies available.");if(arr.length>=(c.type==="fusion"?15:60))return toast("Deck is full.");arr.push(id);}else{let at=arr.indexOf(id);if(at<0)return;arr.splice(at,1);}SAVE();render();}
function resetDeck(){if(!confirm("Restore the default starter deck?"))return;save.deck=STARTER_DECK.slice();save.extra=STARTER_EXTRA.slice();for(const id of [...new Set([...save.deck,...save.extra])])save.owned[id]=Math.max(count(id),inDeck(id));SAVE();render();}
function settle(){
 if(!game||!game.winner||game.rewarded)return;
 game.rewarded=true;const earned=10;
 if(game.winner==='you')save.wins++;else save.losses++;
 save.gold+=earned;if(!SAVE()){game.rewarded=false;return;}render();toast((game.winner==='you'?'Victory!':'Defeat.')+' +10 Gold');
}
function perform(method,...args){
 if(!game)return false;
 const result=engine[method](game,...args);
 if(!result){toast('That action is not legal right now.');return false;}
 selected=null;attackSource=-1;settle();showDuel();return true;
}
function win(w,reason){if(game){engine.finish(game,w,reason);settle();}}
function canNormal(s,id){return engine.canNormal(game,s,id);}
function choices(s){return engine.choices(game,s);}
function summon(s,i,pos){
 const id=game?.[s]?.hand[i],c=card(id);
 if(c&&c.level>=5&&s==='you'&&!confirm('Tribute your lowest-ATK monsters to summon '+c.name+'?'))return;
 return perform('summon',s,i,pos);
}
function setBackrow(s,i){return perform('setBackrow',s,i);}
function fusion(s,where,i,id){return perform('fusion',s,where,i,id);}
function cast(s,where,i){
 if(game&&engine.canCast(game,s,where,i)){
  const id=where==='hand'?game[s].hand[i]:game[s].spells[i]?.id;
  if(card(id).effect==='fusion'){selected={kind:'fusion',where,i};showDuel();return;}
 }
 return perform('cast',s,where,i);
}
function attack(s,from,to){return perform('attack',s,from,to);}
function scheduleAI(){
 if(game&&!game.winner&&game.turn==='ai'){
  const pending=game;setTimeout(()=>{if(game===pending)aiTurn();},650);
 }
}
function phaseNext(){if(perform('nextPhase','you'))scheduleAI();}
function turnEnd(){if(perform('endTurn','you'))scheduleAI();}
function aiTurn(){if(game&&game.turn==='ai')perform('aiTurn','ai');}
function begin(){
 if(!valid()){route('deck');return toast('A legal 40–60 card deck is required.');}
 if(game&&!game.winner&&!confirm('Abandon the current duel?'))return;
 const opponent=RELIC_STARTERS[Math.floor(Math.random()*RELIC_STARTERS.length)];
 game=engine.create(save.deck,save.extra,opponent.deck,opponent.extra);
 selected=null;attackSource=-1;showDuel();
}
function miniZone(m,s,i){
 if(!m)return '<div class="zone" role="button" tabindex="0" aria-label="'+s+' monster zone '+(i+1)+'" data-zone="'+s+'-'+i+'"></div>';
 if(m.pos==="set")return '<div class="zone filled" data-zone="'+s+'-'+i+'"><div class="set-card defense" aria-label="Face-down RELIC card"><span>RELIC</span></div></div>';
 return '<div data-battle-position="'+m.pos+'" data-atk="'+(card(m.id).atk+m.atkBonus)+'" data-def="'+card(m.id).def+'" class="zone filled '+(m.pos==="defense"?"is-defense ":"")+ (attackSource===i&&s==="you"?"selected-target":"")+'" data-zone="'+s+'-'+i+'">'+cardHTML({...card(m.id),atk:card(m.id).atk+m.atkBonus})+'</div>';
}
function backrowZone(m,s,i){
 if(!m)return '<div class="zone" data-backrow="'+s+'-'+i+'"></div>';
 if(m)return '<div class="zone filled" data-backrow="'+s+'-'+i+'"><div class="set-card" aria-label="Face-down RELIC card"><span>RELIC</span></div></div>';
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
  if(["main1","main2"].includes(game.phase)&&m.played!==game.turnNumber&&!m.moved&&!m.attacked){
   if(m.pos==="set")acts+='<button data-flip>Flip Summon</button>';
   else acts+='<button data-position>Switch to '+(m.pos==="attack"?"Defense":"Attack")+'</button>';
  }
  return '<div class="selection-title">'+card(m.id).name+'</div><p>'+card(m.id).description+'</p><div class="selection-actions">'+acts+'<button data-inspect="'+m.id+'">Inspect</button><button data-cancel>Cancel</button></div>';
 }
 return '<div class="empty-select">Select a card.</div>';
}
function showDuel(){
 $("duel-result").classList.toggle("hidden",!game?.winner);
 if(game?.winner){$("duel-result").className="result-banner "+(game.winner==='you'?'victory':'defeat');$("duel-result").innerHTML='<h2>'+(game.winner==='you'?'VICTORY':'DEFEAT')+'</h2><p>'+ (game.rewarded?'10 Gold earned · Your collection awaits.':'Reward not saved. Export your save and reload to resolve storage errors.')+'</p>';}
 $("duel-idle").classList.toggle("hidden",!!game);$("duel-play").classList.toggle("hidden",!game);if(!game)return;
 const a=mine("you"),b=mine("ai");
 for(const [id,hp] of [['player-lp',a.lp],['enemy-lp',b.lp]]){
  const el=$(id),next=hp.toLocaleString();if(el.textContent!==next){el.textContent=next;el.parentElement?.classList.add('hp-changed');setTimeout(()=>el.parentElement?.classList.remove('hp-changed'),700);}
 }
 $("duel-turn").textContent=game.winner?"DUEL FINISHED":"TURN "+game.turnNumber+" — "+(game.turn==="you"?"YOUR TURN":"WARDEN'S TURN");
 $("duel-phase").textContent=game.phase.toUpperCase().replace("MAIN1","MAIN PHASE 1").replace("MAIN2","MAIN PHASE 2");
 $("duel-hint").textContent=game.winner?"Duel complete.":"Select a card to play or advance phases.";
 $("enemy-hand").innerHTML=b.hand.map(()=>'<i title="RELIC card back"></i>').join("");
 for(const s of ["you","ai"]){const obj=mine(s);$(s==="you"?"player-monsters":"enemy-monsters").innerHTML=obj.monsters.map((m,i)=>miniZone(m,s,i)).join("");
 $(s==="you"?"player-spells":"enemy-spells").innerHTML=obj.spells.map((m,i)=>backrowZone(m,s,i)).join("");
 $(s==="you"?"player-grave":"enemy-grave").textContent=obj.grave.length;
 $(s==="you"?"player-field":"enemy-field").textContent=obj.deck.length;
 }
 $("player-hand").innerHTML=a.hand.map((id,i)=>'<div role="button" tabindex="0" aria-label="Select '+card(id).name+'" data-hand="'+i+'" class="'+(selected&&selected.kind==="hand"&&selected.i===i?"selected":"")+'">'+cardHTML(card(id))+'</div>').join("");
 $("hand-count").textContent=a.hand.length+" CARDS";
 $("selected-panel").innerHTML=actions();
 RelicEffects.play(game.events.splice(0));
 $("duel-log").innerHTML=game.logs.slice(0,20).map(s=>'<div class="log-item">'+s+'</div>').join("");
 $("advance-phase").disabled=game.turn!=="you"||!!game.winner;
 $("end-turn").disabled=game.turn!=="you"||!!game.winner;
}
function clickEvent(ev){
 const t=ev.target;
 const attr=(selector)=>t.closest(selector);
 let x;
 if((x=attr("[data-page]")))return route(x.dataset.page);
 if((x=attr("[data-go]")))return route(x.dataset.go);
 if((x=attr("[data-inspect]")))return showCard(card(x.dataset.inspect));
 if((x=attr("[data-reveal-card]"))){x.classList.remove("unrevealed");x.classList.add("revealed");x.setAttribute("aria-label","Revealed card");return;}
 if((x=attr("[data-buy]")))return buy(x.dataset.buy);
 if((x=attr("[data-starter]")))return chooseStarter(x.dataset.starter);
 if((x=attr("[data-deck-add]")))return changeDeck(x.dataset.deckAdd,1);
 if((x=attr("[data-deck-remove]")))return changeDeck(x.dataset.deckRemove,-1);
 if((x=attr("[data-shop-tab]"))){document.querySelectorAll(".tab").forEach(y=>y.classList.toggle("active",y===x));document.querySelectorAll(".shop-section").forEach(y=>y.classList.toggle("hidden",y.id!=="shop-"+x.dataset.shopTab));return;}
 if(attr("[data-close-modal]"))return closeModal("card-modal");
 if(attr("[data-close-pack]"))return closeModal("pack-reveal");
 if((x=attr("[data-hand]"))&&game&&!game.winner&&game.turn==="you"){selected={kind:"hand",i:Number(x.dataset.hand)};showDuel();return;}
 if((x=attr("[data-zone]"))&&game&&!game.winner&&game.turn==="you"){
  const [s,i]=x.dataset.zone.split("-"),n=Number(i);
  if(s==="ai"&&attackSource!==-1){attack("you",attackSource,n);return;}
  if(s==="ai"&&mine("ai").monsters[n]?.pos!=="set"&&mine("ai").monsters[n])return showCard(card(mine("ai").monsters[n].id));
  if(s==="you"&&mine("you").monsters[n]){selected={kind:"monster",i:n};attackSource=-1;showDuel();return;}
 }
 if((x=attr("[data-backrow]"))&&game&&!game.winner&&game.turn==="you"){
  const[s,i]=x.dataset.backrow.split("-");if(s==="you"&&mine(s).spells[Number(i)]){selected={kind:"spell",i:Number(i)};showDuel();}return;
 }
 if(t.closest("[data-cancel]")){selected=null;attackSource=-1;showDuel();return;}
 if(t.closest("[data-summon]")&&selected?.kind==="hand")return summon("you",selected.i,t.closest("[data-summon]").dataset.summon);
 if(t.closest("[data-set-card]")&&selected?.kind==="hand")return setBackrow("you",selected.i);
 if(t.closest("[data-cast]")&&selected)return cast("you",selected.kind==="hand"?"hand":"set",selected.i);
 if((x=t.closest("[data-fusion]"))&&selected&&selected.kind==="fusion")return fusion("you",selected.where,selected.i,x.dataset.fusion);
 if(t.closest("[data-attack]")&&selected?.kind==="monster"){attackSource=selected.i;selected=null;if(!mine("ai").monsters.some(Boolean))attack("you",attackSource,-1);else{toast("Select an enemy monster to attack.");showDuel();}return;}
 if(t.closest("[data-position]")&&selected?.kind==="monster")return perform("position","you",selected.i);
 if(t.closest("[data-flip]")&&selected?.kind==="monster")return perform("position","you",selected.i,true);
}
function applySettings(){
 document.documentElement.dataset.motion=save.settings.motion;
 document.documentElement.dataset.performance=save.settings.performance;
}
function wire(){
 $("import-save").onclick=()=>$("import-save-file").click();
 $("import-save-file").addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>2000000)throw new Error('Save file is too large.');
   const restored=store.parse(await file.text());if(!restored)throw new Error('This file is not a valid RELIC save.');
   if(!confirm('Replace your local progress with this backup? Your current save is retained as a recovery copy.'))return;
   save=restored;if(!SAVE())return;game=null;selected=null;applySettings();render();toast('Backup restored.');
  }catch(error){toast(error.message);}finally{event.target.value='';}
 });
 window.addEventListener?.("hashchange",()=>{const next=location.hash.slice(1);if(next!==page)route(next);});
 $("reveal-all").onclick=()=>document.querySelectorAll('[data-reveal-card]').forEach(x=>{x.classList.remove('unrevealed');x.classList.add('revealed');x.setAttribute('aria-label','Revealed card');});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeModal('card-modal');closeModal('pack-reveal');return;}
  if(event.key==='Tab'){
   const dialog=document.querySelector('.modal:not(.hidden)');if(dialog){const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')];
    const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role=button][tabindex]')){event.preventDefault();event.target.click();}
 });
 document.addEventListener("error",event=>{const img=event.target;if(img.tagName!=="IMG")return;const text=document.createElement("span");text.className="art-unavailable";text.textContent="Illustration unavailable";img.replaceWith(text);},true);
 if(store.warning)toast(store.warning);
 $("deck-name").addEventListener("change",()=>{save.deckName=$("deck-name").value.trim().slice(0,60)||"Untitled deck";SAVE();render();});
 $("save-new-deck").onclick=()=>{
  if(save.decks.length>=30)return toast("You can save up to 30 decks.");
  save.activeDeck="custom-"+Date.now();save.deckName=(save.deckName+" copy").slice(0,60);SAVE();render();
 };
 $("saved-decks").addEventListener("change",()=>{
  const d=save.decks.find(d=>d.id===$("saved-decks").value);if(!d)return;
  save.activeDeck=d.id;save.deckName=d.name;save.deck=d.deck.slice();save.extra=d.extra.slice();SAVE();render();
 });
 $("export-save").onclick=()=>{
  const blob=new Blob([JSON.stringify(save,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="relic-save.json";a.click();URL.revokeObjectURL(url);
 };
 for(const key of ["motion","performance"]){
  $("setting-"+key).value=save.settings[key];
  $("setting-"+key).addEventListener("change",()=>{save.settings[key]=$("setting-"+key).value;SAVE();applySettings();});
 }
 applySettings();
 document.addEventListener("click",clickEvent);
 $("claim-daily").onclick=claim;
 $("open-pack").onclick=()=>openPack(5,10);
 $("new-duel").onclick=begin;$("idle-start").onclick=begin;
 $("advance-phase").onclick=phaseNext;$("end-turn").onclick=turnEnd;
 $("surrender").onclick=()=>{if(game&&!game.winner&&confirm("Surrender the duel?")){win("ai","You surrendered.");showDuel();}};
 $("reset-deck").onclick=resetDeck;
 for(const id of ["collection-search","collection-filter","collection-owned","collection-element","collection-sort","deck-search","deck-filter","deck-element","deck-sort"]){$(id).addEventListener("input",render);}
 // Bigger packs award extra value per card. All rewards are free-to-earn Gold only.
 const packBtn=$("open-pack");
 packBtn.textContent="◈ OPEN 5-CARD PACK — 10 GOLD";
 const big=document.createElement("div");big.className="phase-buttons pack-upgrades";big.innerHTML='<button class="btn btn-outline btn-small" data-bundle="12">12 CARDS — 22 GOLD</button><button class="btn btn-outline btn-small" data-bundle="25">25 CARDS — 40 GOLD</button>';
 packBtn.after(big);
 big.addEventListener("click",e=>{const button=e.target.closest("[data-bundle]");if(!button)return;const n=Number(button.dataset.bundle);openPack(n,n===12?22:40);});
 // All labels use Gold directly in the HTML; do not rewrite live DOM nodes here.
 const hash=location.hash.replace("#","");route(NAMES[hash]?hash:"home");
}
wire();
})();
