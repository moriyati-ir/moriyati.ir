(() => {
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  const craft=document.querySelector('.craft-detail');
  if(craft && window.MORIYATI_CRAFT_SVG)craft.innerHTML=window.MORIYATI_CRAFT_SVG;
  if(craft){
    let inView=false;
    const play=()=>craft.classList.toggle('is-playing',inView&&!document.hidden);
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;play();},{rootMargin:'40px'}).observe(craft);
    document.addEventListener('visibilitychange',play);
  }
  const paths=[...document.querySelectorAll('.scene-draw')];
  paths.forEach(path=>{const length=path.getTotalLength();path.style.setProperty('--length',length);path.style.strokeDasharray=length;});
  const coin=document.querySelector('.medallion-tilt');
  let relief=null,flip=null;
  if(coin){
    const alt=coin.querySelector('img').alt;
    flip=window.MORIYATI_COIN_FLIP.mount(coin,window.MORIYATI_COIN_GEOMETRY.create('home-relief',{includeRing:false}),alt);
    relief=flip.relief;
  }
  const diagrams=[...document.querySelectorAll('.stage-diagram')].map(node=>({node,paths:[...node.querySelectorAll('.scene-draw')],progress:null}));
  const panorama=document.querySelector('.heritage-panorama');
  let stageLayers=[];
  const treeGroups=[[0,5,8,12],[2,6,9,1],[3,4,7,10,11]];
  let treeNodes=[],carriage=null,final=null;
  function bindRelief(){
    stageLayers=relief?['body','windows','ground'].map(name=>({name,node:relief.querySelector('[data-coin-layer="'+name+'"]')})):[];
    treeNodes=relief?Array.from({length:13},(_,i)=>relief.querySelector('[data-coin-tree="'+i+'"]')):[];
    carriage=relief?.querySelector('[data-coin-carriage]');final=relief?.querySelector('[data-coin-final]');
    if(relief)relief.querySelector('[data-coin-layer="trees"]').style.opacity='1';
  }
  bindRelief();
  const opacities=new WeakMap();
  function opacity(node,value){
    const next=value.toFixed(3);
    if(node&&opacities.get(node)!==next){node.style.opacity=next;opacities.set(node,next);}
  }
  let lastEntry,lastReduced,lastStage,lastCurrentStage,lastHeritage,lastRevision;
  window.MoriMotion={draw({entry,stage,heritage,reduced,currentStage}){
    const changedMotion=reduced!==lastReduced;
    if(coin&&(entry!==lastEntry||changedMotion||flip.revision!==lastRevision)){
      if(flip.relief!==relief){relief=flip.relief;bindRelief();}
      const {buildEntry:build}=flip.draw(entry,reduced);
      if(!flip.renderer&&relief){
      const stages={body:[.04,.18],windows:[.2,.31],ground:[.47,.55]};
      stageLayers.forEach(({name,node})=>{const[a,b]=stages[name];opacity(node,smooth(a,b,build));});
      // The original scattered foliage thirds and carriage timing stay exact.
      treeGroups.forEach((indices,group)=>{
        const p=smooth(.33+group*.03,.39+group*.03,build);
        indices.forEach(index=>opacity(treeNodes[index],p));
      });
      const arrival=smooth(.57,.79,build),travel=(1-arrival)*-685;
      window.MORIYATI_COIN_GEOMETRY.walk(relief,{travel,energy:reduced?0:Math.sin(Math.PI*arrival)*.94});
      opacity(carriage,smooth(.57,.595,build));
      opacity(final,smooth(.81,.87,build));
      const phase=build===0?'waiting':build<.2?'body':build<.33?'windows':build<.47?'trees':build<.57?'ground':build<.81?'carriage':'complete';
      if(relief.dataset.buildStage!==phase)relief.dataset.buildStage=phase;
      }
      lastEntry=entry;
      lastRevision=flip.revision;
    }
    if(stage!==lastStage||currentStage!==lastCurrentStage||changedMotion){
      diagrams.forEach((diagram,i)=>{
        if(currentStage!==lastCurrentStage){diagram.node.classList.toggle('active',i===currentStage);diagram.node.setAttribute('aria-hidden',String(i!==currentStage));}
        if(i!==currentStage)return;
        const progress=(reduced?1:smooth(0,.67,clamp(stage*4-i)+.08)).toFixed(3);
        if(progress===diagram.progress)return;
        diagram.paths.forEach((p,k)=>p.style.strokeDashoffset=Number(p.style.getPropertyValue('--length'))*(1-clamp(Number(progress)*1.35-k*.016)));
        diagram.progress=progress;
      });
      lastStage=stage;lastCurrentStage=currentStage;
    }
    if(panorama&&(heritage!==lastHeritage||changedMotion)){
      panorama.style.setProperty('--heritage-reveal',reduced?1:smooth(.04,.4,heritage));
      panorama.style.setProperty('--heritage-drift',`${reduced?0:(.5-heritage)*20}px`);
      lastHeritage=heritage;
    }
    lastReduced=reduced;
  }};
  document.querySelectorAll('.heritage-panorama').forEach(e=>{new IntersectionObserver(entries=>{if(entries[0].isIntersecting)e.classList.add('is-visible');},{threshold:.1}).observe(e);});
})();
