from pathlib import Path
import re,json
R=Path(__file__).resolve().parents[1];D=R/'dist'
p=D/'coin-geometry.js';s=p.read_text()
ann=(D/'assets/v8/annulus-engraved.svg').read_text()
ann=re.sub(r'<\?xml[^>]+>','',ann)
ann=re.sub(r'^\s*<svg\b[^>]*>','',ann).strip().removesuffix('</svg>').strip()
s=re.sub(r'  const annulus = .*?;\n',lambda _: '  const annulus = '+json.dumps(ann)+';\n',s,count=1)
old='const rim=annulus.replace(/id="([^\"]+)"/g,(_,n)=>`id="${id(\'rim-\'+n)}"`).replace(/url\\(#([^)]*)\\)/g,(_,n)=>`url(#${id(\'rim-\'+n)})`);'
# Explicitly prefix shared guilloche <use> references as well as ids and mask URLs.
for l in s.splitlines():
    if 'const rim=annulus.replace(' in l:
        s=s.replace(l,'    const rim=annulus.replace(/id="([^\"]+)"/g,(_,n)=>`id="${id(\'rim-\'+n)}"`).replace(/url\\(#([^)]*)\\)/g,(_,n)=>`url(#${id(\'rim-\'+n)})`).replace(/href="#([^\"]+)"/g,(_,n)=>`href="#${id(\'rim-\'+n)}"`);')
        break
if "${trees.map((d,i)=>clip('tree-'" not in s:
    s=s.replace("${clip('foliage-region','<path d=\"M0 0H1254V869H0Z\"/>')}","${trees.map((d,i)=>clip('tree-'+i,`<path d=\"${d}\"/>`)).join('')}")
    s=re.sub(r'<g class="coin-relief-layer coin-relief-trees"[^\n]*', '<g class="coin-relief-layer coin-relief-trees" data-coin-layer="trees" style="opacity:1">${trees.map((d,i)=>`<g data-coin-tree="${i}" opacity="0"><image href="assets/motion/v7/pavilion-foliage-complete.webp" width="1254" height="1254" clip-path="url(#${id(\'tree-\'+i)})"/></g>`).join(\'\')}</g>',s)
s=s.replace('<g data-coin-lion="">','<g data-coin-lion="" transform="translate(626 635) scale(1.28) translate(-626 -635)">')
s=s.replace('pivots:pivot,joints,source,blank,clean','foliageCount:trees.length,pivots:pivot,joints,source,blank,clean')
p.write_text(s)
p=D/'enhancements.js';s=p.read_text()
s=s.replace('trees:[.33,.45],','')
s=s.replace("relief.querySelector('[data-coin-lion]').style.opacity=reduced?0:.42*(1-smooth(0,.035,entry));", """// Keep the original foliage phase and the carriage's later arrival.
      relief.querySelector('[data-coin-layer="trees"]').style.opacity='1';
      const treeGroups=[[0,5,8,12],[2,6,9,1],[3,4,7,10,11]];
      treeGroups.forEach((indices,group)=>{
        const p=reduced?1:smooth(.33+group*.03,.39+group*.03,entry);
        indices.forEach(index=>{
          const layer=relief.querySelector('[data-coin-tree="'+index+'"]');
          if(!layer)return;
          layer.style.opacity=p;
          layer.style.filter=p>=.999?'none':'blur('+((1-p)*2.5).toFixed(2)+'px)';
        });
      });
      relief.querySelector('[data-coin-lion]').style.opacity=reduced?0:.64*(1-smooth(0,.035,entry));""")
p.write_text(s)
print('Applied engraved circular annulus, three scattered foliage groups and larger embossed lion.')
