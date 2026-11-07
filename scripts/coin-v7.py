"""Use complete reconstructed reliefs inside a mathematically circular native rim."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'dist/coin-geometry.js'
s=p.read_text()
if 'innerRadius:468' in s:
 print('Circular geometry is already installed.')
 raise SystemExit(0)
s=s.replace('/* Original-pixel relief geometry. All coordinates refer to the 1254 x 1254\n * approved medallion, never a regenerated carriage. No source raster is edited. */','/* Circular native geometry; complete reconstructed architectural stages.\n * The carriage preserves the original artwork and its articulated rest pose. */')
a=s.index('    const ellipse=');b=s.index('    const limb=',a)
s=s[:a]+s[b:]
a=s.index("      ${clip('interior',");b=s.index("      ${mask('carriage-body',",a)
s=s[:a]+'''      ${clip('interior','<circle cx="627" cy="627" r="468"/>')}
      ${clip('building',`<path d="${building}"/>`)}
      ${clip('foliage-region','<path d="M0 0H1254V869H0Z"/>')}
      ${clip('ground',`<path d="${ground}"/>`)}
'''+s[b:]
a=s.index('    <g clip-path="url(#${id(\'interior\')})">');b=s.index('      <g class="coin-carriage-travel"',a)
s=s[:a]+'''    <g clip-path="url(#${id('interior')})">
     <g data-coin-registration="" transform="translate(1 -8)">
      <image class="coin-base" href="${blank}" width="1254" height="1254"/>
      <g data-coin-lion=""><image href="assets/motion/v7/medallion-lion-emboss.webp" width="1254" height="1254"/></g>
      <g class="coin-relief-layer coin-relief-body" data-coin-layer="body" opacity="0"><image href="assets/motion/v7/pavilion-base-complete.webp" width="1254" height="1254" clip-path="url(#${id('building')})"/></g>
      <g class="coin-relief-layer coin-relief-windows" data-coin-layer="windows" opacity="0"><image href="assets/motion/v7/pavilion-detailed-complete.webp" width="1254" height="1254" clip-path="url(#${id('building')})"/></g>
      <g class="coin-relief-layer coin-relief-trees" data-coin-layer="trees" opacity="0"><image href="assets/motion/v7/pavilion-foliage-complete.webp" width="1254" height="1254" clip-path="url(#${id('foliage-region')})"/></g>
      <g class="coin-relief-layer coin-relief-ground" data-coin-layer="ground" opacity="0"><image href="assets/motion/v7/pavilion-foliage-complete.webp" width="1254" height="1254" clip-path="url(#${id('ground')})"/></g>
'''+s[b:]
a=s.index('    <g class="coin-ring-assembly"');b=s.index('    </svg>`;',a)
s=s[:a]+'''     <g class="coin-relief-final" data-coin-final="" opacity="0">${img()}</g>
     </g>
    </g>
    <g class="coin-ring-assembly" data-coin-ring=""><image href="assets/motion/v7/annulus-circular.svg" width="1254" height="1254"/></g>
'''+s[b:]
# Remove the older closure between the carriage and the new registration closure.
s=s.replace('      </g>\n    </g>\n     <g class="coin-relief-final"','      </g>\n     <g class="coin-relief-final"')
a=s.index('  // A small source-perspective');b=s.index('  window.MORIYATI_COIN_GEOMETRY=',a)
s=s[:a]+'''  // Every rail and both boundaries share this fixed centre. No perspective warp.
  function turn(root,angle=0){
    root.querySelector('[data-coin-ring]')?.setAttribute('transform',`rotate(${angle} 627 627)`);
  }
'''+s[b:]
s=s.replace('ringPivot:[626,635]','ringPivot:[627,627],innerRadius:468,outerRadius:610')
p.write_text(s)
p=ROOT/'dist/enhancements.js';s=p.read_text()
s=s.replace('body:[.025,.18]','body:[.04,.18]')
a=s.index('        const grow=');b=s.index('        layer.style.opacity=p;',a)
s=s[:a]+'''        // Complete renders crossfade in registration; no squashing or cut-out voids.
        layer.removeAttribute('transform');
'''+s[b:]
s=s.replace('      window.MORIYATI_COIN_GEOMETRY.turn(',"      relief.querySelector('[data-coin-lion]').style.opacity=reduced?0:1-smooth(0,.035,entry);\n      window.MORIYATI_COIN_GEOMETRY.turn(")
p.write_text(s)
print('Installed complete relief stages and a circular annulus.')
