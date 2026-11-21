const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const vm=require('node:vm');
const byId=vm.runInNewContext(fs.readFileSync('cards.js','utf8')+';RELIC_BY_ID');
async function state(page){return page.locator('#duel-play').evaluate(el=>({...el.dataset}));}
async function hand(page){return page.locator('#player-hand [data-hand]').evaluateAll(els=>els.map(el=>({i:Number(el.dataset.hand),id:el.querySelector('[data-card-id]').dataset.cardId})));}
async function board(page,who){return page.locator('#'+who+'-monsters .filled').evaluateAll(els=>els.map(el=>({i:Number(el.dataset.zone.split('-')[1]),id:el.querySelector('[data-card-id]')?.dataset.cardId,pos:el.dataset.battlePosition||'set',atk:Number(el.dataset.atk),def:Number(el.dataset.def)})));}
async function handAction(page,i,action){
 const s=await state(page);if(s.interactive!=='true'||!['main1','main2'].includes(s.phase))return;
 const source=page.locator('[data-hand="'+i+'"]');if(!await source.count())return;
 await source.click();const button=page.locator('#selected-panel '+action);if(await button.count())await button.click();
}
for(const starter of ['ember','night'])test('complete '+starter+' match through real interface actions',async({page})=>{
 test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('./');await page.evaluate(()=>{let seed=93;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};});
 await page.locator('[data-page="deck"]').click();await page.locator('[data-starter="'+starter+'"]').click();
 await page.locator('[data-page="duel"]').click();await page.locator('#idle-start').click();
 for(let turn=0;turn<100;turn++){
  await page.waitForFunction(()=>document.querySelector('#duel-play').dataset.interactive==='true'||!document.querySelector('#duel-result').classList.contains('hidden'));
  let s=await state(page);if(s.phase==='over')break;const turnNumber=s.turnNumber;
  if(['main1','main2'].includes(s.phase)){
   const fusion=(await hand(page)).find(x=>x.id==='relic-fusion');
   if(fusion){await handAction(page,fusion.i,'[data-cast]');const choices=page.locator('[data-fusion]');if(await choices.count())await choices.first().click();}
   let own=await board(page,'player');const costs=own.filter(x=>x.pos!=='set').map(x=>x.atk).sort((a,b)=>a-b);
   const candidates=(await hand(page)).map(x=>({...x,c:byId[x.id]})).filter(x=>x.c.type==='monster'&&(x.c.level<=4?own.length<5:x.c.level<=6?own.length>=1:own.length>=2)).map(x=>({...x,value:x.c.atk-costs.slice(0,x.c.level<=4?0:x.c.level<=6?1:2).reduce((a,n)=>a+n,0)})).sort((a,b)=>b.value-a.value);
   if(candidates[0])await handAction(page,candidates[0].i,'[data-summon="attack"]');
   for(const x of (await hand(page)).reverse()){
    const current=(await hand(page)).find(p=>p.i===x.i&&p.id===x.id);if(!current)continue;
    if(byId[x.id].type==='spell'&&x.id!=='relic-fusion')await handAction(page,x.i,'[data-cast]');
    if(byId[x.id].type==='trap')await handAction(page,x.i,'[data-set-card]');
    if((await state(page)).phase==='over')break;
   }
   s=await state(page);if(s.phase==='over')break;
   if(s.turnNumber===turnNumber&&s.phase==='main1'&&await page.locator('#advance-phase').isEnabled())await page.locator('#advance-phase').click();
  }
  s=await state(page);
  if(s.phase==='battle'&&s.turn==='you'&&s.turnNumber===turnNumber){
   const own=(await board(page,'player')).filter(m=>m.pos==='attack').sort((a,b)=>b.atk-a.atk);
   for(const m of own){
    s=await state(page);if(s.phase!=='battle'||s.turn!=='you')break;
    const current=(await board(page,'player')).find(x=>x.i===m.i);if(!current)continue;
    const foes=await board(page,'enemy');const target=foes.filter(x=>x.pos!=='set'&&m.atk>(x.pos==='attack'?x.atk:x.def)).sort((a,b)=>b.atk-a.atk)[0]||foes.find(x=>x.pos==='set');
    if(foes.length&&!target)continue;
    await page.locator('[data-zone="you-'+m.i+'"]').click();const button=page.locator('[data-attack]');if(!await button.count())continue;
    await button.click();if(target)await page.locator('[data-zone="ai-'+target.i+'"]').click();
   }
  }
  s=await state(page);if(s.phase==='over')break;
  if(s.turn==='you'&&s.turnNumber===turnNumber&&s.interactive==='true')await page.locator('#end-turn').click();
  await page.waitForFunction(old=>document.querySelector('#duel-play').dataset.turnNumber!==old||document.querySelector('#duel-play').dataset.phase==='over',turnNumber);
 }
 await expect(page.locator('#duel-result')).toBeVisible();await expect(page.locator('#credits-header')).toHaveText('45');
 console.log(starter+': '+await page.locator('#duel-result h2').textContent());expect(errors).toEqual([]);
});
