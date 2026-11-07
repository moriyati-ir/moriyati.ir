/* Animate the original painting itself. Architecture outside foliage regions
 * remains the unchanged base image; no frame or new scenery is introduced. */
(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 const canopies=[
  {box:[157,306,90,219],origin:[196,515],angle:3.1,d:'M167 516L170 418L180 347L190 315L200 337L208 381L215 350L226 361L234 433L233 516Z'},
  {box:[227,425,282,178],origin:[337,599],angle:1.65,d:'M243 550C224 535 240 509 265 502C248 482 281 462 307 466C303 446 339 433 358 447C382 426 413 437 425 456C456 443 476 459 470 479C507 483 512 513 488 527C503 549 475 569 446 567C422 589 386 575 369 583C348 605 312 590 298 580C270 589 250 576 243 550Z'},
  {box:[518,517,150,111],origin:[593,623],angle:2.0,d:'M535 603C515 585 528 564 551 562C543 542 568 531 586 537C600 514 625 530 627 548C659 544 671 568 650 584C664 604 636 619 615 613C589 634 559 618 535 603Z'},
  {box:[584,310,74,139],origin:[621,439],angle:3.0,d:'M590 441L596 372L608 323L617 335L625 364L631 318L639 321L647 367L654 439Z'},
  {box:[646,345,98,81],origin:[695,422],angle:2.35,d:'M654 405C641 388 654 370 672 373C675 350 696 350 708 361C730 353 745 372 735 388C749 409 723 419 704 415C686 433 663 422 654 405Z'},
  {box:[768,560,147,95],origin:[839,651],angle:1.8,d:'M781 631C760 617 777 594 794 595C792 573 821 570 834 580C849 560 875 572 876 589C904 586 919 608 901 623C912 644 882 648 865 640C841 660 817 644 803 646Z'},
  {box:[970,368,109,103],origin:[1025,465],angle:2.2,d:'M982 437C966 417 978 395 998 396C996 375 1024 376 1036 385C1052 370 1077 387 1069 403C1087 423 1072 440 1053 442L1043 463L1014 465L1009 444Z'},
  {box:[1094,493,239,182],origin:[1210,671],angle:1.65,d:'M1112 622C1087 605 1108 577 1133 575C1119 554 1145 535 1165 540C1160 516 1189 505 1205 516C1224 494 1246 511 1249 529C1271 511 1297 531 1289 549C1320 542 1337 567 1317 585C1336 605 1310 627 1289 623C1285 650 1250 646 1236 642C1223 675 1193 671 1175 654C1144 664 1113 652 1112 622Z'},
  {box:[1341,307,76,144],origin:[1379,442],angle:3.0,d:'M1348 443L1354 372L1365 319L1375 345L1381 375L1390 340L1400 364L1409 443Z'},
  {box:[1527,350,89,101],origin:[1570,447],angle:2.5,d:'M1536 440L1539 397L1547 363L1554 374L1562 351L1570 371L1577 357L1583 384L1593 367L1601 409L1608 441Z'},
  {box:[1905,323,167,103],origin:[1986,418],angle:2.15,d:'M1920 395C1902 380 1914 357 1940 356C1940 335 1965 330 1978 340C1998 320 2023 335 2029 351C2055 343 2074 365 2060 381C2074 397 2044 411 2025 408C2009 428 1981 416 1968 412C1948 425 1926 412 1920 395Z'}
 ];
 document.querySelectorAll('.heritage-city-portrait,.heritage-panorama').forEach((host,i)=>{
  const img=host.querySelector('img[src*="isfahan-qajar"]');if(!img)return;
  const source=img.getAttribute('src'),prefix='qajar-breeze-'+i;
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 2172 724');svg.setAttribute('class','wind-panorama');svg.setAttribute('role','img');
  svg.dataset.faLabel=img.alt;svg.dataset.enLabel='A painterly view of Qajar-era Isfahan with a living breeze in the trees';
  svg.setAttribute('aria-label',window.MoriyatiLocale?.language==='en'?svg.dataset.enLabel:img.alt);
  const definitions=canopies.map((c,j)=>{
   const [x,y,w,h]=c.box;
   return `<filter id="${prefix}-soft-${j}" filterUnits="userSpaceOnUse" x="${x-22}" y="${y-22}" width="${w+44}" height="${h+44}"><feGaussianBlur stdDeviation="1.3"/></filter><mask id="${prefix}-mask-${j}" maskUnits="userSpaceOnUse" x="${x-22}" y="${y-22}" width="${w+44}" height="${h+44}" style="mask-type:luminance"><path d="${c.d}" fill="white" stroke="white" stroke-width="18" stroke-linejoin="round" filter="url(#${prefix}-soft-${j})"/></mask><filter id="${prefix}-leaves-${j}" filterUnits="userSpaceOnUse" x="${x-22}" y="${y-22}" width="${w+44}" height="${h+44}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".025 .055" numOctaves="2" seed="${j+11}" result="leaf-noise"/><feDisplacementMap in="SourceGraphic" in2="leaf-noise" scale="5" xChannelSelector="R" yChannelSelector="G"><animate attributeName="scale" values="3;8;4;10;3" dur="${10.5+j*.47}s" begin="-${j*.9}s" repeatCount="indefinite"/></feDisplacementMap></filter>`;
  }).join('');
  svg.innerHTML=`<defs>${definitions}</defs><image class="wind-city-base" href="${source}" width="2172" height="724"/>`+canopies.map((c,j)=>`<g mask="url(#${prefix}-mask-${j})"><image class="wind-canopy" href="${source}" width="2172" height="724" filter="url(#${prefix}-leaves-${j})" style="--wind-origin:${c.origin[0]}px ${c.origin[1]}px;--wind-angle:${c.angle}deg;--wind-duration:${7.8+j*.43}s;--wind-delay:-${j*1.17}s"/></g>`).join('');
  img.replaceWith(svg);
  let visible=false;
  const sync=()=>{
   const active=visible&&!document.hidden&&!document.documentElement.classList.contains('motion-reduced');
   svg.classList.toggle('is-windy',active);
   if(active)svg.unpauseAnimations?.();else svg.pauseAnimations?.();
  };
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'80px',threshold:0}).observe(svg);
  addEventListener('moriyati:motion',sync);document.addEventListener('visibilitychange',sync);sync();
 });
})();
