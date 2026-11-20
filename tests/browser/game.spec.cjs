const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const vm=require('node:vm');
const {RELIC_CARDS:cards,RELIC_STARTERS:starters}=vm.runInNewContext(fs.readFileSync('cards.js','utf8')+'\n'+fs.readFileSync('starters.js','utf8')+'\n({RELIC_CARDS,RELIC_STARTERS})');
const errors=new WeakMap();
test.beforeEach(async({page})=>{
 const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));
 page.on('dialog',dialog=>dialog.accept());await page.goto('./');
});
test.afterEach(async({page})=>{expect(errors.get(page)).toEqual([]);});
async function go(page,id){await page.locator('[data-page="'+id+'"]').click();await expect(page.locator('#page-'+id)).toBeVisible();}
test('all navigation, settings, deck preservation and reload work',async({page})=>{
 for(const id of ['duel','packs','collection','deck','rules','online','profile','settings','home'])await go(page,id);
 await go(page,'deck');await page.locator('#deck-name').fill('My original deck');await page.locator('#deck-name').press('Tab');
 await page.locator('[data-starter="night"]').click();await expect(page.locator('#deck-name')).toHaveValue('Nightfall Syndicate');
 await page.locator('#deck-name').fill('Moonlit oath');await page.locator('#deck-name').press('Tab');
 await page.locator('#save-new-deck').click();await expect(page.locator('#saved-decks option')).toHaveCount(3);
 await page.reload();await expect(page.locator('#deck-name')).toHaveValue('Moonlit oath copy');
 await page.locator('#saved-decks').selectOption('classic');await expect(page.locator('#deck-name')).toHaveValue('My original deck');
 await go(page,'settings');await page.locator('#setting-motion').selectOption('reduced');await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
 await go(page,'profile');const download=page.waitForEvent('download');await page.locator('#export-save').click();const backup=await download;expect(backup.suggestedFilename()).toBe('relic-save.json');
 await page.locator('#import-save-file').setInputFiles(await backup.path());await expect(page.locator('#toasts')).toContainText('Backup restored.');
});
test('collection illustrations load, inspect correctly, and filter by element',async({page},info)=>{
 await go(page,'collection');await page.locator('#collection-owned').uncheck();
 await page.locator('#collection-grid img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>{img.loading='eager';return img.decode();}));});
 await expect(page.locator('#collection-grid img')).toHaveCount(53);
 expect(await page.locator('#collection-grid img').evaluateAll(imgs=>imgs.every(img=>img.naturalWidth===768))).toBe(true);
 await page.locator('#collection-element').selectOption('Fire');
 expect(await page.locator('#collection-grid [data-card-id]').count()).toBeGreaterThan(0);
 await page.locator('#collection-search').fill('Ember Squire');await page.locator('#collection-grid [data-inspect]').click();
 await expect(page.locator('#card-modal')).toBeVisible();await expect(page.locator('#modal-content h2')).toHaveText('Ember Squire');
 await page.keyboard.press('Escape');await expect(page.locator('#card-modal')).toBeHidden();
 await go(page,'home');await page.screenshot({path:'test-results/home-'+info.project.name+'.png',fullPage:true,animations:"disabled"});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow).toBe(false);
});
test('packs charge once, reveal cards individually, and persist inventory',async({page})=>{
 await go(page,'packs');
 await page.locator('#open-pack').click();await expect(page.locator('.reveal-one.unrevealed')).toHaveCount(5);
 await page.locator('.reveal-one').first().click();await expect(page.locator('.reveal-one.unrevealed')).toHaveCount(4);
 await page.locator('#reveal-all').click();await expect(page.locator('.reveal-one.unrevealed')).toHaveCount(0);
 const purchased=await page.evaluate(()=>JSON.parse(localStorage.getItem('relic-alpha-save-2')));expect(purchased.gold).toBe(25);
 const sum=o=>Object.values(o).reduce((a,n)=>a+n,0);expect(sum(purchased.owned)).toBe(47);
 await page.locator('#pack-reveal .btn[data-close-pack]').click();await page.reload();await expect(page.locator('#credits-header')).toHaveText('25');
 await page.locator('[data-bundle="25"]').click();await expect(page.locator('#credits-header')).toHaveText('25');
});
test('solo opening, summoning, phase progression, AI and surrender are usable',async({page},info)=>{
 await go(page,'deck');await page.locator('[data-starter="ember"]').click();await go(page,'duel');await page.locator('#idle-start').click();
 await expect(page.locator('#player-hand [data-hand]')).toHaveCount(5);
 const playable=await page.locator('#player-hand .game-card').evaluateAll(els=>els.map(e=>({id:e.dataset.cardId,index:Number(e.parentElement.dataset.hand)})));
 const normal=playable.find(p=>cards.some(c=>c.id===p.id&&c.type==='monster'&&c.level<=4));
 if(normal){await page.locator('[data-hand="'+normal.index+'"]').click();await page.locator('[data-summon="attack"]').click();await expect(page.locator('#player-monsters .filled')).toHaveCount(1);}
 await page.locator('#advance-phase').click();await expect(page.locator('#duel-phase')).toHaveText('MAIN PHASE 2');
 await page.locator('#end-turn').click();await expect(page.locator('#duel-turn')).toContainText('TURN 3 — YOUR TURN');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/arena-'+info.project.name+'.png',fullPage:true,animations:"disabled"});
 await page.locator('#surrender').click();await expect(page.locator('#duel-result')).toContainText('DEFEAT');await expect(page.locator('#credits-header')).toHaveText('45');
 await page.locator('#surrender').click();await expect(page.locator('#credits-header')).toHaveText('45');
});
test('single purchases and deck edits respect owned copies',async({page})=>{
 await go(page,'packs');await page.locator('[data-shop-tab="singles"]').click();
 const buy=page.locator('[data-buy="mist-sprite"]');
 for(let i=0;i<3;i++)await buy.click();
 await expect(page.locator('#credits-header')).toHaveText('23');await expect(buy).toBeDisabled();
 await go(page,'deck');await page.locator('#deck-search').fill('Mist Sprite');
 for(let i=0;i<4;i++)await page.locator('[data-deck-add="mist-sprite"]').click();
 await expect(page.locator('#deck-total')).toHaveText('43 / 40–60');
 await page.locator('[data-deck-remove="mist-sprite"]').click();await page.reload();
 await expect(page.locator('#deck-total')).toHaveText('42 / 40–60');await expect(page.locator('#credits-header')).toHaveText('23');
});
