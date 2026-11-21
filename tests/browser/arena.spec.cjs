const {test,expect}=require('@playwright/test');
async function openArena(page){
 page.on('dialog',d=>d.accept());await page.goto('./');await page.locator('[data-page="duel"]').click();await page.locator('#idle-start').click();
 await expect(page.locator('#duel-play')).toHaveAttribute('data-phase','main1');
}
test('arena fills the viewport and waits at a playable Main Phase',async({page},info)=>{
 await openArena(page);
 await expect(page.locator('body')).toHaveClass(/in-duel/);await expect(page.locator('.sidebar')).toBeHidden();
 expect(await page.locator('.arena .zone').count()).toBe(20);
 const bounds=await page.locator('#duel-play').boundingBox(),viewport=page.viewportSize();expect(bounds.width).toBe(viewport.width);expect(bounds.height).toBe(viewport.height);
 await page.waitForTimeout(1200);await expect(page.locator('#duel-play')).toHaveAttribute('data-phase','main1');
 await expect(page.locator('#player-hand [data-hand]')).toHaveCount(5);
 await page.locator('#player-hand img').evaluateAll(imgs=>Promise.all(imgs.map(img=>{img.loading='eager';return img.decode();})));
 await page.screenshot({path:'test-results/immersive-arena-'+info.project.name+'.png',animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
});
test('automatic phases pause for inspection and AI actions are paced',async({page})=>{
 await openArena(page);
 await page.evaluate(()=>{window.observedPhases=[];const el=document.querySelector('#duel-play');new MutationObserver(()=>window.observedPhases.push(el.dataset.turn+':'+el.dataset.phase)).observe(el,{attributes:true,attributeFilter:['data-phase']});});
 await page.locator('#end-turn').click();await page.locator('[data-pile="you-extra"]').click();await expect(page.locator('#card-modal')).toBeVisible();
 await page.waitForTimeout(1100);await expect(page.locator('#duel-play')).toHaveAttribute('data-phase','end');
 await page.keyboard.press('Escape');await expect(page.locator('#duel-turn')).toContainText('TURN 3 — YOUR TURN',{timeout:20000});
 await expect(page.locator('#duel-play')).toHaveAttribute('data-phase','main1');
 const phases=await page.evaluate(()=>window.observedPhases);
 for(const phase of ['ai:draw','ai:standby','ai:main1','ai:battle','ai:main2','ai:end','you:draw','you:standby','you:main1'])expect(phases).toContain(phase);
 await page.locator('#surrender').click();await expect(page.locator('#duel-result')).toBeVisible();
 await page.locator('[data-restart-duel]').click();await expect(page.locator('#duel-play')).toHaveAttribute('data-phase','main1');
 await page.waitForTimeout(1200);await expect(page.locator('#player-lp')).toHaveText('8,000');await expect(page.locator('#player-hand [data-hand]')).toHaveCount(5);
});
test('leaving the arena cancels pending progression and returning resumes it',async({page})=>{
 await openArena(page);await page.locator('#end-turn').click();await page.locator('.arena-toolbar [data-go="home"]').click();
 await expect(page.locator('#page-home')).toBeVisible();await expect(page.locator('body')).not.toHaveClass(/in-duel/);
 const before=await page.locator('#duel-play').getAttribute('data-phase');await page.waitForTimeout(1200);
 await expect(page.locator('#duel-play')).toHaveAttribute('data-phase',before);
 await page.locator('[data-page="duel"]').click();await expect(page.locator('#duel-turn')).toContainText('TURN 3 — YOUR TURN',{timeout:20000});
});
