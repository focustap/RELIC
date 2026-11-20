/* Presentation consumes engine events. Animation never changes duel rules. */
(function(root){
"use strict";
function play(events){
 const reduced=document.documentElement.dataset.motion==='reduced'||root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduced)return;
 for(const fx of events){
  if(fx.kind==='draw'){
   const hand=document.getElementById(fx.side==='you'?'player-hand':'enemy-hand');
   hand.lastElementChild?.classList.add('relic-draw');continue;
  }
  const zoneId=fx.zone==='monster'?(fx.side==='you'?'player-monsters':'enemy-monsters'):(fx.side==='you'?'player-spells':'enemy-spells');
  const zone=document.getElementById(zoneId);
  const node=fx.i<0?null:zone.querySelector('[data-'+(fx.zone==='monster'?'zone':'backrow')+'="'+fx.side+'-'+fx.i+'"]');
  if(node)node.classList.add('relic-enter-'+fx.kind);
  if(fx.kind==='fusion'){
   const arena=document.querySelector('.arena'),vortex=document.createElement('div');vortex.className='fusion-vortex';vortex.setAttribute('aria-hidden','true');
   const materials=RELIC_BY_ID[fx.cardId]?.materials||[];
   for(const id of materials){const image=document.createElement('img');image.src=RELIC_BY_ID[id].artwork;image.alt='';vortex.append(image);}
   arena.append(vortex);setTimeout(()=>vortex.remove(),1400);
  }else if(!node&&['spell','trap'].includes(fx.kind)){
   const arena=document.querySelector('.arena'),burst=document.createElement('div');
   burst.className='relic-effect-burst '+fx.kind;burst.setAttribute('aria-hidden','true');arena.append(burst);setTimeout(()=>burst.remove(),850);
  }
 }
}
root.RelicEffects={play};
})(typeof globalThis!=='undefined'?globalThis:this);
