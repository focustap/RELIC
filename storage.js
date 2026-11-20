/* Versioned local save adapter. Online wallets must live on an authoritative server. */
(function(root){
"use strict";
function createStore(storage,key,initial,cards){
 let raw=null,warning="";
 function valid(v){
  return v&&typeof v==='object'&&Number.isSafeInteger(v.gold)&&v.gold>=0&&
   Number.isSafeInteger(v.wins)&&v.wins>=0&&Number.isSafeInteger(v.losses)&&v.losses>=0&&
   v.owned&&typeof v.owned==='object'&&!Array.isArray(v.owned)&&
   Object.entries(v.owned).every(([id,n])=>Object.hasOwn(cards,id)&&Number.isSafeInteger(n)&&n>=0)&&
   ['deck','extra'].every(k=>Array.isArray(v[k])&&v[k].length<=100&&v[k].every(id=>Object.hasOwn(cards,id)))&&
   (v.settings===undefined||v.settings&&['system','reduced'].includes(v.settings.motion)&&['high','low'].includes(v.settings.performance))&&
   (v.deckName===undefined||typeof v.deckName==='string'&&v.deckName.length<=60)&&
   (v.activeDeck===undefined||typeof v.activeDeck==='string'&&v.activeDeck.length<=100)&&
   (v.decks===undefined||Array.isArray(v.decks)&&v.decks.length<=30&&v.decks.every(d=>d&&typeof d.id==='string'&&typeof d.name==='string'&&d.name.length<=60&&['deck','extra'].every(k=>Array.isArray(d[k])&&d[k].length<=100&&d[k].every(id=>Object.hasOwn(cards,id)))));
 }
 function decode(value){
  try{
   const v=JSON.parse(value);if(!valid(v))return null;
   const restored=Object.assign(initial(),v);
   // Legacy saves have only an active deck. Archive that exact deck before a starter switch.
   if(v.decks===undefined&&typeof restored.activeDeck==='string')restored.decks=[{id:restored.activeDeck,name:restored.deckName,deck:restored.deck.slice(),extra:restored.extra.slice()}];
   return restored;
  }catch{return null;}
 }
 function read(){
  try{
   raw=storage.getItem(key);if(!raw)return initial();
   const value=decode(raw);if(value)return value;
   // Preserve the exact bad data for recovery before presenting a fresh/recovered save.
   storage.setItem(key+'-recovery-'+Date.now(),raw);
   const backup=decode(storage.getItem(key+'-backup'));
   warning=backup?'Recovered your previous save; damaged data was preserved.':'Your save could not be read. A recovery copy was preserved; export it before changing browsers.';
   return backup||initial();
  }catch{warning='Browser storage is unavailable. Progress cannot be saved; enable storage before playing.';return initial();}
 }
 function write(value){
  if(!valid(value))return {ok:false,error:'Save rejected: invalid player data.'};
  try{
   if(storage.getItem(key)!==raw)return {ok:false,conflict:true,error:'Another tab changed your save. Reload to use the latest progress.'};
   const next=JSON.stringify({...value,schemaVersion:3});
   if(raw)storage.setItem(decode(raw)?key+'-backup':key+'-recovery-'+Date.now(),raw);
   storage.setItem(key,next);raw=next;return {ok:true};
  }catch{return {ok:false,error:'Saving failed. No purchase or edit was kept. Export your save and free browser storage.'};}
 }
 return {read,write,parse:decode,get warning(){return warning;}};
}
root.RelicStorage={createStore};
if(typeof module!=='undefined'&&module.exports)module.exports=root.RelicStorage;
})(typeof globalThis!=='undefined'?globalThis:this);
