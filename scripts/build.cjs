/* Verify the production catalogue, then assemble a GitHub Pages-compatible site. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sharp=require('sharp');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
async function build(){
 const read=name=>fs.readFileSync(path.join(root,name),'utf8');
 const cards=vm.runInNewContext(read('cards.js')+';RELIC_CARDS');
 const files=['index.html','styles.css','effects.css','presentation.css','arena.css','cards.js','starters.js','storage.js','engine.js','effects.js','app.js','relic-card-back.svg'];
 for(const file of files)if(file.endsWith('.js'))new vm.Script(read(file),{filename:file});
 const assets=[];
 for(const c of cards){
  const filename=path.resolve(root,c.artwork);
  if(!filename.startsWith(path.join(root,'public','assets','cards')+path.sep))throw Error('Unsafe artwork path '+c.id);
  const buffer=fs.readFileSync(filename),metadata=await sharp(buffer).metadata();
  if(metadata.width!==768||metadata.height!==768||metadata.format!=='webp')throw Error('Invalid artwork '+c.id);
  assets.push({id:c.id,path:c.artwork,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
 }
 if(new Set(assets.map(x=>x.sha256)).size!==cards.length)throw Error('Duplicate artwork files');
 for(const match of read('index.html').matchAll(/(?:src|href)="\.\/([^"#]+)"/g))if(!fs.existsSync(path.join(root,match[1])))throw Error('Missing HTML asset '+match[1]);
 for(const css of files.filter(file=>file.endsWith('.css')))for(const match of read(css).matchAll(/url\(['"]?(\.\/[^'"\)]+)['"]?\)/g))if(!fs.existsSync(path.resolve(root,match[1])))throw Error('Missing CSS asset '+match[1]);
 const arena=await sharp(path.join(root,'public','assets','arena','overgrown-sanctum.webp')).metadata();
 if(arena.width!==1920||arena.height!==1080||arena.format!=='webp')throw Error('Invalid arena background');
 const output=path.join(root,'dist');fs.mkdirSync(output,{recursive:true});
 for(const file of files)fs.copyFileSync(path.join(root,file),path.join(output,file));
 fs.cpSync(path.join(root,'public'),path.join(output,'public'),{recursive:true});
 fs.writeFileSync(path.join(output,'.nojekyll'),'');
 fs.writeFileSync(path.join(root,'artwork','manifest.json'),JSON.stringify({generator:'built-in image_gen',illustrations:assets},null,2)+'\n');
 console.log('Built static site: '+output+'; verified '+assets.length+' distinct illustrations ('+(assets.reduce((n,x)=>n+x.bytes,0)/1048576).toFixed(2)+' MiB).');
}
build().catch(error=>{console.error(error.message);process.exitCode=1;});
