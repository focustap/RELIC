const fs=require('node:fs');
const vm=require('node:vm');
const sharp=require('sharp');
const cards=vm.runInNewContext(fs.readFileSync('cards.js','utf8')+';RELIC_CARDS');
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 const existing=cards.filter(c=>fs.existsSync(c.artwork));
 for(let start=0;start<existing.length;start+=20){
  const page=existing.slice(start,start+20),layers=[];
  for(let i=0;i<page.length;i++){
   const c=page[i],left=(i%5)*200,top=Math.floor(i/5)*224;
   layers.push({input:await sharp(c.artwork).resize(196,196).toBuffer(),left,top});
   const label=Buffer.from('<svg width="196" height="26"><rect width="196" height="26" fill="#141d17"/><text x="7" y="17" fill="#dfc083" font-size="11" font-family="sans-serif">'+escape(c.name)+'</text></svg>');
   layers.push({input:label,left,top:top+196});
  }
  await sharp({create:{width:1000,height:Math.ceil(page.length/5)*224,channels:3,background:'#0b110e'}}).composite(layers).png().toFile('test-results/art-review-'+(start/20+1)+'.png');
 }
 console.log('Review sheets created for '+existing.length+' illustrations.');
})();
