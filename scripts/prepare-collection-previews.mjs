// Produce the deliberately unreleased public collection previews once.
// Clear masters remain recoverable from Git; they are never copied to a release.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../dist');
const marker=resolve(root,'assets/collections/release-previews.json');
try { await readFile(marker); console.log('Collection previews already prepared'); process.exit(0); } catch(error) { if(error.code!=='ENOENT') throw error; }
async function walk(directory) {
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?walk(resolve(directory,entry.name)):[resolve(directory,entry.name)]));
  return nested.flat();
}
const files=(await walk(resolve(root,'assets/collections'))).filter(path=>/\.(webp|png|jpe?g)$/i.test(path));
const masters=[];
for(const path of files) {
  const original=await readFile(path),before=createHash('sha256').update(original).digest('hex');
  const size=spawnSync('magick',['identify','-format','%wx%h',path],{encoding:'utf8'});
  if(size.status!==0) throw new Error('Cannot identify '+relative(root,path));
  const converted=spawnSync('magick',['-','-strip','-resize','24x24','-blur','0x2.5','-resize',size.stdout.trim()+'!','-quality','80',extname(path).slice(1)+':-'],{input:original,maxBuffer:12*1024*1024});
  if(converted.status!==0) throw new Error('Cannot obscure '+relative(root,path)+': '+converted.stderr.toString());
  if(createHash('sha256').update(converted.stdout).digest('hex')===before) throw new Error('Unchanged collection master '+path);
  await writeFile(path,converted.stdout);
  masters.push({path:relative(root,path),originalSha256:before});
}
await writeFile(marker,JSON.stringify({mode:'coming-soon',clearMastersIncluded:false,images:masters},null,2)+'\n');
console.log('Prepared '+files.length+' baked, blurred collection images; no clear collection images remain in dist.');
