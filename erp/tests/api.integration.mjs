import assert from 'node:assert/strict';

// Run only against a developer-owned local preview, never a hosted origin.
const origin=process.env.ERP_TEST_ORIGIN || 'http://127.0.0.1:4173';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const identity={'oai-authenticated-user-id':`local-qa-${crypto.randomUUID()}`,'oai-authenticated-user-email':'test@example.invalid'};
const api=async(path,options={})=>fetch(origin+path,{...options,headers:{...identity,...options.headers}});
let response=await fetch(origin+'/api/workspace');
assert.equal(response.status,401,'unauthenticated read');
response=await api('/api/workspace');assert.equal(response.status,200);
const initial=await response.json();assert.equal(initial.revision,0);
const command={type:'inventory_move',data:{materialId:'MAT-HNO3',operation:'consume',quantity:140,note:'Local API test',batchId:'MOR-AG-0048'}};
const post=()=>api('/api/workspace',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:0,command})});
// Competing requests against the same revision: exactly one may commit.
const competing=await Promise.all([post(),post()]);
assert.deepEqual(competing.map(x=>x.status).sort(),[200,409]);
response=await api('/api/workspace');const after=await response.json();
assert.equal(after.revision,1);assert.equal(after.state.inventory.find(x=>x.id==='MAT-HNO3').quantity,-20);
response=await api('/api/workspace',{method:'POST',headers:{origin:'https://untrusted.invalid','content-type':'application/json'},body:JSON.stringify({revision:1,command})});
assert.equal(response.status,403,'cross-origin writes rejected');
const file=new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDa0AAAAASUVORK5CYII=','base64')],'test.png',{type:'image/png'});
const form=new FormData();form.set('file',file);
response=await api('/api/photos',{method:'POST',body:form});assert.equal(response.status,200);
const uploaded=await response.json();assert.match(uploaded.url,/^\/api\/photos\/[a-f0-9-]{36}$/);
response=await api(uploaded.url);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');
assert.equal((await response.arrayBuffer()).byteLength,file.size);
response=await fetch(origin+uploaded.url,{headers:{'oai-authenticated-user-id':'another-test-user','oai-authenticated-user-email':'another@example.invalid'}});
assert.equal(response.status,404,'photos are owner scoped');
response=await fetch(origin+uploaded.url);assert.equal(response.status,401);
console.log('PASS: authentication, concurrent revision leases, durable D1 state, CSRF origin checks, R2 upload/retrieval, owner isolation.');
