/* The approved front and existing architectural reverse share one circular rig.
 * This module uses the homepage's scroll frame; it starts no timers or sensors. */
(() => {
  'use strict';
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>value*value*(3-2*value);
  const turnStart=.012,turnEnd=.19;
  const diameter=1254,center=627,radius=610;
  const front='assets/motion/v16/moriyati-lion-front-isfahan.webp';
  // Visual model only: 2.4 mm across a 40 mm reference diameter. Thickness
  // scales with the coin, rather than a fixed screen-pixel hairline.
  const referenceDiameterMm=40,thicknessMm=2.4;
  const thicknessRatio=thicknessMm/referenceDiameterMm;
  const reedCount=192,edgeSegments=96;
  const silver=Object.freeze({highlight:'#faf8f5',mid:'#cfcdca',shadow:'#686664'});

  function sequence(entry,reduced=false){
    const progress=clamp(entry);
    // A reduced-motion homepage keeps the approved front as a still image.
    const turn=reduced?0:smooth(clamp((progress-turnStart)/(turnEnd-turnStart)));
    const angle=turn*180;
    // Building starts only AFTER the complete flip, then follows the original
    // pavilion / windows / scattered foliage / ground / carriage timeline.
    const buildEntry=reduced||progress<=turnEnd?0:.04+.96*clamp((progress-turnEnd)/(1-turnEnd));
    return {angle,buildEntry,face:angle<=90?'front':'reverse',phase:angle===0?'front':angle<180?'turning':'reverse'};
  }

  function createFront(prefix){
    // Registration compensates for the supplied photograph's margins and tiny
    // elliptical projection. The image bytes and all lettering remain intact.
    const sx=radius/598,sy=radius/604;
    const tx=center-619.5*sx,ty=center-620*sy;
    return `<svg class="coin-front-art" viewBox="0 0 ${diameter} ${diameter}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><clipPath id="${prefix}-front-boundary"><circle cx="${center}" cy="${center}" r="${radius}"/></clipPath></defs><g clip-path="url(#${prefix}-front-boundary)"><image href="${front}" width="1254" height="1254" transform="matrix(${sx} 0 0 ${sy} ${tx} ${ty})"/></g>${createRim(prefix)}</svg>`;
  }

  function createRim(prefix){
    const point=(r,a)=>`${(center+r*Math.cos(a)).toFixed(3)} ${(center+r*Math.sin(a)).toFixed(3)}`;
    const crests=Array.from({length:reedCount},(_,index)=>{
      const angle=(index+.5)*2*Math.PI/reedCount;
      return `M${point(600.5,angle)}L${point(609.2,angle)}`;
    }).join(' ');
    const grooves=Array.from({length:reedCount},(_,index)=>{
      const angle=index*2*Math.PI/reedCount;
      return `M${point(601,angle)}L${point(609.4,angle)}`;
    }).join(' ');
    return `<defs><linearGradient id="${prefix}-reed-metal" x1="12%" y1="0%" x2="86%" y2="100%"><stop stop-color="${silver.highlight}"/><stop offset=".28" stop-color="${silver.mid}"/><stop offset=".48" stop-color="#f1efec"/><stop offset=".73" stop-color="#aaa8a5"/><stop offset="1" stop-color="${silver.highlight}"/></linearGradient></defs><g data-coin-reeded-rim="" data-reed-count="${reedCount}" fill="none"><circle cx="627" cy="627" r="605" stroke="url(#${prefix}-reed-metal)" stroke-width="10"/><path d="${grooves}" stroke="${silver.shadow}" stroke-width="1.55" opacity=".85"/><path d="${crests}" stroke="${silver.highlight}" stroke-width="2.65" stroke-linecap="round"/><circle cx="627" cy="627" r="599.9" stroke="#74716f" stroke-width="1.5"/><circle cx="627" cy="627" r="601.4" stroke="${silver.highlight}" stroke-width="1.4"/></g>`;
  }

  function prepareReverse(markup,prefix){
    // The intricate annulus is a cached image layer: rotating it no longer
    // invalidates all the vector paths and masks in the animated relief.
    const ringSource='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(window.MORIYATI_COIN_GEOMETRY.ringSvg);
    return `<img class="coin-ring-texture" decoding="async" src="${ringSource}" width="1254" height="1254" alt="" aria-hidden="true">${markup}<svg class="coin-reeded-face" viewBox="0 0 1254 1254" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${createRim(prefix)}</svg>`;
  }

  function createEdge(){
    const count=edgeSegments,r=radius/diameter;
    const width=2*r*Math.tan(Math.PI/count)*100+.025;
    return Array.from({length:count},(_,index)=>{
      const theta=(index+.5)*2*Math.PI/count;
      const x=50+r*Math.cos(theta)*100,y=50+r*Math.sin(theta)*100;
      const tone=Math.round(180+Math.cos(theta-2.2)*36);
      return `<span class="coin-edge-segment" data-edge-reeds="${reedCount/count}" style="left:${x.toFixed(5)}%;top:${y.toFixed(5)}%;width:${width.toFixed(5)}%;--edge-turn:${(theta*180/Math.PI+90).toFixed(5)}deg;--edge-tone:${tone}" aria-hidden="true"></span>`;
    }).join('');
  }

  function mount(coin,reverse,alt){
    const cached=!!(window.MORIYATI_COIN_RENDERER&&window.MORIYATI_COIN_ATLAS);
    const ambient='<span class="coin-ambient" aria-hidden="true"></span>';
    const back=cached?`<canvas class="coin-back-canvas" aria-hidden="true"></canvas><svg class="coin-reeded-face" viewBox="0 0 1254 1254" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${createRim('home-coin-back')}</svg>`:prepareReverse(reverse,'home-coin-back');
    coin.innerHTML=`<div class="coin-layers coin-two-sided" role="img" aria-label="${alt}">${cached?'<canvas class="coin-edge-canvas" aria-hidden="true"></canvas>':''}<div class="coin-turntable"><div class="coin-face coin-front">${createFront('home-coin-front')}${ambient}</div><div class="coin-face coin-reverse">${back}${ambient}</div>${cached?'':`<div class="coin-edge-wall">${createEdge()}</div>`}</div></div>`;
    const layers=coin.querySelector('.coin-layers');
    const turntable=coin.querySelector('.coin-turntable');
    const obverse=coin.querySelector('.coin-front');
    const reverseFace=coin.querySelector('.coin-reverse');
    let edgeWall=coin.querySelector('.coin-edge-wall');
    let ring=coin.querySelector('.coin-ring-texture');
    ring?.decode?.().catch(()=>{});
    let lastAngle,lastFace,lastPhase,lastRim,lastEdges;
    let renderer=null,edgeRenderer=null,controller;
    const notify=()=>window.dispatchEvent(new Event('moriyati:assets-ready'));
    function fallback(){
      renderer=null;
      reverseFace.innerHTML=prepareReverse(reverse,'home-coin-back')+ambient;
      ring=reverseFace.querySelector('.coin-ring-texture');lastRim=undefined;
      if(controller){controller.renderer=null;controller.relief=reverseFace.querySelector('.coin-engraving');controller.revision++;notify();}
      layers.dataset.coinRenderer='svg';
    }
    if(cached){
      renderer=window.MORIYATI_COIN_RENDERER.createReverse(coin.querySelector('.coin-back-canvas'),{ready:()=>{layers.dataset.coinReady='true';notify();},failed:fallback});
      edgeRenderer=window.MORIYATI_COIN_RENDERER.createEdge(coin.querySelector('.coin-edge-canvas'),{thicknessRatio,reedCount});
      if(!renderer)fallback();
      if(!edgeRenderer){
        coin.querySelector('.coin-edge-canvas')?.remove();
        edgeWall=document.createElement('div');edgeWall.className='coin-edge-wall';edgeWall.innerHTML=createEdge();turntable.append(edgeWall);
      }
    }
    layers.dataset.coinRenderer=renderer?'canvas':'svg';
    let lastWidth,lastDpr;
    const sizeEdge=()=>{
      const width=coin.clientWidth,dpr=window.devicePixelRatio||1;
      if(width===lastWidth&&dpr===lastDpr)return;
      lastWidth=width;lastDpr=dpr;
      const diameterPx=width*2*radius/diameter;
      if(diameterPx>0)layers.style.setProperty('--coin-thickness',`${(diameterPx*thicknessRatio).toFixed(3)}px`);
      const small=(window.innerWidth||1000)<=700;
      renderer?.resize(width,dpr,small);edgeRenderer?.resize(width,dpr,small);
    };
    sizeEdge();
    // Resize only; the existing parent transform already scales thickness on scroll.
    if(window.ResizeObserver)new window.ResizeObserver(sizeEdge).observe(coin);
    controller={
      relief:coin.querySelector('.coin-engraving'),
      renderer,revision:0,
      draw(entry,reduced){
        const state=sequence(entry,reduced);
        const angle=state.angle.toFixed(4);
        if(angle!==lastAngle){
          turntable.style.transform=`rotateY(${angle}deg)`;
          layers.style.setProperty('--coin-shadow-scale',Math.max(thicknessRatio,Math.abs(Math.cos(state.angle*Math.PI/180))).toFixed(4));
          edgeRenderer?.draw(state.angle);
          lastAngle=angle;
        }
        const showEdges=state.angle>0&&state.angle<180;
        if(showEdges!==lastEdges){(edgeRenderer?.canvas||edgeWall).style.visibility=showEdges?'visible':'hidden';lastEdges=showEdges;}
        const rim=(reduced?0:smooth(clamp((state.buildEntry-.02)/.78))*360).toFixed(3);
        if(ring&&rim!==lastRim){ring.style.transform=`rotate(${rim}deg) translateZ(0)`;lastRim=rim;}
        renderer?.draw(state.buildEntry,reduced);
        // Explicit face visibility also prevents backface bleed on mobile Safari.
        const visibleFace=state.angle===90?'edge':state.face;
        if(visibleFace!==lastFace){
          obverse.style.visibility=state.angle<90?'visible':'hidden';
          reverseFace.style.visibility=state.angle>90?'visible':'hidden';
          layers.dataset.coinFace=state.face;lastFace=visibleFace;
        }
        if(state.phase!==lastPhase){layers.dataset.coinPhase=state.phase;lastPhase=state.phase;}
        return state;
      }
    };
    return controller;
  }
  window.MORIYATI_COIN_FLIP=Object.freeze({sequence,mount,createFront,createEdge,createRim,prepareReverse,front,center,radius,diameter,turnStart,turnEnd,referenceDiameterMm,thicknessMm,thicknessRatio,reedCount,edgeSegments,silver});
})();
