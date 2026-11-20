const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createStore}=require('../storage.js');
const initial=()=>({gold:35,wins:0,losses:0,owned:{a:3},deck:['a'],extra:[],decks:[]});
function memory(){const data={};return {data,getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v};}
test('legacy saves survive migration and successful writes keep a recovery backup',()=>{
 const mem=memory();mem.setItem('save',JSON.stringify({...initial(),gold:99}));
 const store=createStore(mem,'save',initial,{a:{}}),s=store.read();assert.equal(s.gold,99);
 s.gold=89;assert.equal(store.write(s).ok,true);assert.equal(JSON.parse(mem.getItem('save-backup')).gold,99);
 assert.equal(JSON.parse(mem.getItem('save')).schemaVersion,3);
});
test('malformed saves are preserved and the last valid backup is recovered',()=>{
 const mem=memory();mem.setItem('save','broken-json');mem.setItem('save-backup',JSON.stringify({...initial(),gold:77}));
 const store=createStore(mem,'save',initial,{a:{}});assert.equal(store.read().gold,77);
 assert.ok(Object.keys(mem.data).some(k=>k.startsWith('save-recovery-')));assert.ok(store.warning);
});
test('migrating a customized legacy deck archives its exact contents',()=>{
 const mem=memory(),legacy={...initial(),deck:['a','a']};delete legacy.decks;
 mem.setItem('save',JSON.stringify(legacy));
 const defaults=()=>({...initial(),activeDeck:'classic',deckName:'My legacy deck',decks:[{id:'classic',name:'Original',deck:['a'],extra:[]}]});
 const restored=createStore(mem,'save',defaults,{a:{}}).read();
 assert.deepEqual(restored.decks[0].deck,['a','a']);assert.equal(restored.decks[0].name,'My legacy deck');
});
test('stale tabs cannot overwrite newer currency or inventory',()=>{
 const mem=memory(),a=createStore(mem,'save',initial,{a:{}}),b=createStore(mem,'save',initial,{a:{}});
 const av=a.read(),bv=b.read();av.gold=25;assert.equal(a.write(av).ok,true);
 bv.gold=1;assert.equal(b.write(bv).conflict,true);assert.equal(JSON.parse(mem.getItem('save')).gold,25);
});
test('negative balances, unknown cards and failed writes are explicitly rejected',()=>{
 const mem=memory(),store=createStore(mem,'save',initial,{a:{}});const state=store.read();
 assert.equal(store.write({...state,gold:-1}).ok,false);
 assert.equal(store.write({...state,deck:['missing']}).ok,false);
 assert.equal(store.parse(JSON.stringify({...state,settings:null})),null);
 assert.equal(store.parse(JSON.stringify({...state,decks:null})),null);
 mem.setItem=()=>{throw Error('quota');};assert.equal(store.write(state).ok,false);
});
