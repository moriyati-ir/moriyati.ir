(() => {
 'use strict';
 const hero=document.querySelector('.hero'),canvas=document.querySelector('#hero-metal-canvas'),ctx=canvas.getContext('2d'),sweep=document.querySelector('.ribbon-light');
 let w=0,h=0,scheduled=false;const reduced=()=>document.documentElement.classList.contains('motion-reduced');
 const particles=Array.from({length:32},(_,i)=>({x:.05+((i*37)%61)/130,y:.73+((i*19)%16)/100,r:2+(i*7)%8,delay:(i%9)/14}));
 function size(){const r=hero.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);request();}
 function draw(){scheduled=false;const rect=hero.getBoundingClientRect();if(rect.bottom<0)return;const p=reduced()?0:Math.max(0,Math.min(1,-rect.top/h));
  hero.style.setProperty('--ribbon-light',p);hero.style.setProperty('--ribbon-light-x',`${p*110-30}%`);
  ctx.clearRect(0,0,w,h);particles.forEach((v,i)=>{const t=reduced()?0:Math.sin(p*5+v.delay)*9;const x=v.x*w+t*(i%2?1:-1),y=v.y*h-p*22*(i%4),r=v.r*(w<700?.45:.7);const g=ctx.createRadialGradient(x-r*.3,y-r*.4,.2,x,y,r);g.addColorStop(0,'rgba(255,255,249,.94)');g.addColorStop(.22,'rgba(230,226,213,.9)');g.addColorStop(.46,'rgba(118,115,104,.82)');g.addColorStop(.66,'rgba(252,247,224,.95)');g.addColorStop(1,'rgba(86,82,72,.45)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();if((i+Math.floor(p*23))%11===0){ctx.strokeStyle='rgba(255,255,245,.9)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x-r*1.9,y);ctx.lineTo(x+r*1.9,y);ctx.moveTo(x,y-r*1.9);ctx.lineTo(x,y+r*1.9);ctx.stroke();}});
 }
 function request(){if(!scheduled){scheduled=true;requestAnimationFrame(draw);}}
 addEventListener('resize',size,{passive:true});addEventListener('scroll',request,{passive:true});addEventListener('moriyati:language',request);size();
})();
