/* The GitHub Pages build stays self-contained. Only the Liara entry document
   declares this environment and uses its first-party authenticated API. */
export const isLiveWorkspace = !!document.querySelector('meta[name="moriyati-environment"][content="live"]');

async function request(path, data, userId) {
  const headers = {Accept:'application/json'};
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  if (userId) headers['X-Workspace-User'] = userId;
  let response;
  try {
    response = await fetch('/api/live/' + path, {
      method:data === undefined ? 'GET' : 'POST',
      cache:'no-store', credentials:'same-origin', redirect:'error',
      headers, body:data === undefined ? undefined : JSON.stringify(data)
    });
  } catch {
    throw new Error('ارتباط با سرور برقرار نشد. اتصال را بررسی کنید و دوباره تلاش کنید.');
  }
  const value = await response.json().catch(() => null);
  if (!response.ok || !value) {
    throw Object.assign(new Error(value?.error || 'پاسخ معتبر از سرور دریافت نشد.'), {status:response.status});
  }
  return value;
}

function loginForm(expectedPerson) {
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--bg,#fff);overflow:auto';
  panel.innerHTML = '<main class="ws login"><b>MORIYATI</b><h1>ورود به فضای کار</h1><form><label>نام کاربری<input name="user" required autocomplete="username"></label><label>رمز عبور<input name="pass" type="password" required autocomplete="current-password"></label><button class="primary">ورود</button><p role="status" aria-live="polite"></p></form></main>';
  document.body.append(panel);
  const form = panel.querySelector('form');
  if (expectedPerson) {
    form.elements.user.value = expectedPerson.displayName;
    form.elements.user.readOnly = true;
    form.querySelector('p').textContent = 'برای ادامهٔ همین کار دوباره وارد حساب خود شوید.';
  }
  return new Promise(resolve => {
    form.onsubmit = async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      if (button.disabled) return;
      button.disabled = true;
      try {
        const person = await request('login', {username:expectedPerson?.userId || form.elements.user.value, password:form.elements.pass.value});
        if (!person.userId || (expectedPerson && person.userId !== expectedPerson.userId)) {
          throw new Error('حساب این نشست تغییر کرده است. صفحه را دوباره باز کنید.');
        }
        form.reset();
        panel.remove();
        resolve(person);
      } catch (error) {
        form.querySelector('p').textContent = error.message;
        form.elements.pass.select();
      } finally {
        button.disabled = false;
      }
    };
  });
}

function waitToRetry(message) {
  const app = document.getElementById('app');
  app.innerHTML = '<main class="ws login"><b>MORIYATI</b><h1>فضای کار</h1><p role="alert"></p><button class="primary">تلاش دوباره</button></main>';
  app.querySelector('p').textContent = message;
  return new Promise(resolve => app.querySelector('button').onclick = resolve);
}

function checkWorkspace(value, userId) {
  const state = value?.state;
  if (!Number.isSafeInteger(value?.revision) || !state ||
      !Array.isArray(state.tasks) || !Array.isArray(state.financeRecords) ||
      !state.factory || state.factory.version !== 3 || !state.accounts ||
      Object.keys(state.accounts).some(id => id !== userId)) {
    throw new Error('داده‌های میزکار از سرور کامل دریافت نشد. دوباره تلاش کنید.');
  }
  return value;
}

export async function connectWorkspace() {
  if (location.hash.startsWith('#/verify/')) {
    await showPublicVerification();
    // Public verification requires no staff session. Switching QR records or
    // returning to the normal application restarts from the appropriate route.
    await new Promise(() => window.addEventListener('hashchange',()=>location.reload(),{once:true}));
  }
  let person, first;
  for (;;) {
    try {
      if (!person) {
        try { person = await request('session'); }
        catch (error) {
          if (error.status !== 401) throw error;
          person = await loginForm();
        }
      }
      first = checkWorkspace(await request('workspace', undefined, person.userId), person.userId);
      break;
    } catch (error) {
      if (error.status === 401 || error.status === 403) person = null;
      await waitToRetry(error.message);
    }
  }

  let revision = first.revision;
  let confirmed = JSON.stringify(first.state);
  let pending = null, saving = null, commandInFlight = false, replacing = null;
  let sessionPrompt = null, pullInFlight = false, commandResponse = null;
  const confirmations = new Set();
  const status = document.createElement('aside');
  status.hidden = true;
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.style.cssText = 'position:fixed;z-index:9998;inset-inline:1rem;bottom:calc(5.2rem + env(safe-area-inset-bottom));max-width:40rem;margin:auto;padding:.55rem 1rem;border:1px solid var(--line,#aaa);border-radius:.65rem;background:var(--surface,#fff);color:var(--ink,#151515);box-shadow:0 2px 12px #0002;line-height:1.6';
  document.body.append(status);

  async function scoped(path, data) {
    try { return await request(path, data, person.userId); }
    catch (error) {
      if (error.status !== 401) throw error;
      sessionPrompt ||= loginForm(person).finally(() => {sessionPrompt = null;});
      await sessionPrompt;
      return request(path, data, person.userId);
    }
  }
  function show(message, buttons = []) {
    status.replaceChildren(document.createTextNode(message));
    for (const [label, click] of buttons) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.className = 'text-link';
      b.style.marginInlineStart = '.65rem'; b.onclick = click;
      status.append(b);
    }
    status.hidden = !message;
  }
  function copyPending() {
    if (!pending) return;
    const href = URL.createObjectURL(new Blob([pending],{type:'application/json'}));
    const link = document.createElement('a');
    link.href = href; link.download = 'moriyati-unsaved-' + person.userId + '.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(href),3000);
  }
  function showFailure(error) {
    const actions = [['تلاش دوباره', () => flush().catch(() => {})]];
    if (pending) actions.push(['دریافت نسخهٔ تغییرات ثبت‌نشده', copyPending]);
    if (pending && error.conflict) actions.push(['باز کردن نسخهٔ سرور',() => {
      if (!window.confirm('با بازکردن نسخهٔ سرور، ویرایش ثبت‌نشدهٔ این صفحه کنار گذاشته می‌شود. ادامه دهید؟')) return;
      pending = null; location.reload();
    }]);
    show('تغییرات روی سرور ثبت نشد. ' + error.message, actions);
  }
  async function drain() {
    while (pending !== null) {
      const snapshot = pending;
      if (snapshot !== confirmed) {
        try {
          const response = await scoped('workspace', {revision,state:JSON.parse(snapshot)});
          if (!Number.isSafeInteger(response.revision)) throw new Error('تأیید ذخیره دریافت نشد.');
          revision = response.revision;
          if (response.state) {
            const canonical = checkWorkspace(response,person.userId).state;
            const next = pending === snapshot ? canonical : mergeEdits(JSON.parse(snapshot),JSON.parse(pending),canonical);
            confirmed = JSON.stringify(canonical);
            pending = sameState(next,canonical) ? null : JSON.stringify(next);
            replacing?.(next,false);
            continue;
          }
        } catch (error) {
          if (error.status !== 409) throw error;
          // A response can be lost after a successful commit. Re-read before
          // retrying, and never overwrite edits visible from another session.
          const latest = checkWorkspace(await scoped('workspace'),person.userId);
          const remote = JSON.stringify(latest.state);
          if (!sameState(latest.state,JSON.parse(snapshot))) {
            const merged = mergeEdits(JSON.parse(confirmed),JSON.parse(pending),latest.state);
            pending = JSON.stringify(merged);
            revision = latest.revision; confirmed = remote;
            if (replacing) replacing(merged,false);
            continue;
          }
          revision = latest.revision;
        }
      }
      confirmed = snapshot;
      if (pending === snapshot) pending = null;
    }
    show('');
    for (const resolve of confirmations) resolve();
    confirmations.clear();
  }
  function confirmedWrite() {
    if (pending === null) return Promise.resolve();
    return new Promise(resolve => {
      confirmations.add(resolve);
      flush().catch(() => {}); // The persistent retry control resumes this submission.
    });
  }
  function flush() {
    if (commandResponse) return commandResponse.then(flush);
    if (!pending) return saving || Promise.resolve();
    if (!saving) {
      show('در حال ذخیره روی سرور…');
      saving = drain().catch(error => {showFailure(error);throw error;}).finally(() => {saving = null;});
    }
    return saving;
  }
  function save(state) {
    pending = JSON.stringify(state);
    flush().catch(() => {});
    return true;
  }
  async function command(name,data) {
    if (commandInFlight) throw new Error('منتظر پایان ثبت قبلی بمانید.');
    commandInFlight = true;
    const app = document.getElementById('app'), overlays = document.getElementById('overlays');
    app.inert = true; overlays.inert = true;
    try {
      await flush();
      const base = confirmed;
      let release;
      commandResponse = new Promise(resolve => {release = resolve;});
      let reply;
      try {
        reply = checkWorkspace(await scoped('workspace/command',{revision,command:name,data}),person.userId);
        // An incoming message or reminder may have queued a personal edit
        // while a factory command was being committed.
        const current = pending === null ? reply.state : mergeEdits(JSON.parse(base),JSON.parse(pending),reply.state);
        revision = reply.revision; confirmed = JSON.stringify(reply.state);
        if (pending !== null) pending = JSON.stringify(current);
        replacing(current);
      } finally {
        commandResponse = null; release();
      }
      return reply;
    } catch (error) {
      if (error.status === 409 && pending === null) {
        const current = checkWorkspace(await scoped('workspace'),person.userId);
        revision = current.revision; confirmed = JSON.stringify(current.state);
        replacing(current.state);
        throw new Error('اطلاعات تغییر کرده است. اطلاعات تازه را بازبینی کنید و دوباره ثبت کنید.');
      }
      throw error;
    } finally {
      app.inert = false; overlays.inert = false; commandInFlight = false;
    }
  }
  async function refresh() {
    if (saving || pending || commandInFlight || pullInFlight || !replacing ||
        document.visibilityState !== 'visible' || document.querySelector('.overlay') ||
        ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    pullInFlight = true;
    const previous = revision;
    try {
      const next = checkWorkspace(await scoped('workspace'),person.userId);
      if (revision === previous && !pending && !saving && !commandInFlight &&
          revision !== next.revision && !document.querySelector('.overlay') &&
          !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        revision = next.revision; confirmed = JSON.stringify(next.state);
        replacing(next.state,true);
      }
    } catch (error) {
      if (!pending && error.status === 403) location.reload();
    } finally { pullInFlight = false; }
  }
  window.addEventListener('beforeunload', event => {
    if (pending !== null || commandInFlight) {event.preventDefault();event.returnValue = '';}
  });
  window.addEventListener('online',()=>{if (pending) flush().catch(()=>{});else refresh();});
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',refresh);
  return {person,state:first.state,save,flush,command,confirmedWrite,
    async upload(data) {
      const reply = await scoped('workspace/assets',{data});
      if (typeof reply.url !== 'string' || !reply.url.startsWith('/api/live/') || reply.url.startsWith('//')) {
        throw new Error('نشانی فایل از سرور دریافت نشد.');
      }
      return reply.url;
    },
    listen(fn) {replacing = fn;},
    async logout() {
      if (commandInFlight) throw new Error('منتظر پایان ثبت قبلی بمانید.');
      await flush();
      await scoped('logout',{});
      if (window.parent !== window) window.parent.location.reload();
      else location.reload();
    }
  };
}

// PostgreSQL JSONB does not preserve JS object key order.
function sameState(a,b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key =>
    Object.prototype.hasOwnProperty.call(b,key) && sameState(a[key],b[key]));
}


// Merge only independently changed fields or distinct record IDs. When both
// sessions edited the same scalar, removed an edited record, or reordered
// the same list, preserve the local copy and ask for manual reconciliation.
const missing = Symbol('absent');
function mergeEdits(base, local, remote) {
  if (sameState(local,base)) return remote;
  if (sameState(remote,base) || sameState(local,remote)) return local;
  const records = value => value !== null && typeof value === 'object';
  if (records(base) && records(local) && records(remote)) {
    if ([base,local,remote].every(value => !Array.isArray(value))) {
      const entries = [];
      const keys = new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
      for (const key of keys) {
        const field = obj => Object.hasOwn(obj,key) ? obj[key] : missing;
        const value = mergeEdits(field(base),field(local),field(remote));
        if (value !== missing) entries.push([key,value]);
      }
      return Object.fromEntries(entries);
    }
    const identified = list => Array.isArray(list) &&
      list.every(row => row && (typeof row.id === 'string' || typeof row.id === 'number')) &&
      new Set(list.map(row => row.id)).size === list.length;
    if ([base,local,remote].every(identified)) {
      const [b,l,r] = [base,local,remote].map(list => new Map(list.map(row => [row.id,row])));
      const before = [...b.keys()].filter(id => l.has(id) && r.has(id));
      const order = map => [...map.keys()].filter(id => b.has(id) && l.has(id) && r.has(id));
      const leftOrder = order(l),rightOrder = order(r);
      if (!sameState(before,leftOrder) && !sameState(before,rightOrder) && !sameState(leftOrder,rightOrder)) {
        throw conflictError();
      }
      const [primary,secondary] = !sameState(before,leftOrder) ? [l,r] : [r,l];
      const merged = new Map();
      for (const id of new Set([...primary.keys(),...secondary.keys(),...b.keys()])) {
        const item = map => map.has(id) ? map.get(id) : missing;
        const row = mergeEdits(item(b),item(l),item(r));
        if (row !== missing) merged.set(id,row);
      }
      const ids = [...primary.keys()].filter(id => merged.has(id));
      const others = [...secondary.keys()].filter(id => merged.has(id));
      for (let i = others.length-1;i >= 0;i--) {
        const id = others[i];
        if (primary.has(id)) continue;
        const next = ids.indexOf(others[i+1]);
        ids.splice(next < 0 ? ids.length : next,0,id);
      }
      return ids.map(id => merged.get(id));
    }
  }
  throw conflictError();
}
function conflictError() {
  return Object.assign(new Error('همین مورد در یک نشست دیگر ویرایش شده است. تغییرات این صفحه را دریافت کنید و نسخهٔ جدید را باز کنید.'),{conflict:true});
}

async function showPublicVerification() {
  const app = document.getElementById('app');
  const page = document.createElement('main');
  page.className = 'op-page';
  const section = document.createElement('section');
  const field = (el,value,parent = section) => {
    const node = document.createElement(el);
    node.textContent = String(value ?? '—'); parent.append(node); return node;
  };
  field('h1','استعلام اصالت محصول');
  const result = field('p','در حال بررسی سریال و بسته‌بندی…');
  page.append(section); app.replaceChildren(page);
  try {
    const [serial,event] = location.hash.slice('#/verify/'.length).split('/').map(decodeURIComponent);
    if (!serial || !event) throw new Error('شناسهٔ محصول و بسته‌بندی کامل نیست.');
    const query = new URLSearchParams({serial,event});
    const {product} = await request('verify?' + query.toString());
    if (!product) throw new Error('محصول پیدا نشد.');
    result.textContent = product.title;
    field('p',product.serial);
    field('p',product.active ? 'بسته‌بندی فعال' : 'این بسته‌بندی باطل شده است.');
    field('p',product.seal);
    const dl = document.createElement('dl');
    for (const [k,v] of [['وزن خالص (گرم)',product.net],['وزن با بسته (گرم)',product.gross],['عیار',product.purity]]) {
      field('dt',k,dl);field('dd',v,dl);
    }
    section.append(dl);
    for (const [position,source] of [['روی بسته',product.front],['پشت بسته',product.back]]) {
      if (!source) continue;
      const url = new URL(source,location.origin);
      if (url.origin !== location.origin) continue;
      const img = document.createElement('img');
      img.className = 'public-product-photo';img.alt = position;img.src = url.href;section.append(img);
    }
  } catch (error) {
    result.textContent = error.message;
    const retry = field('button','تلاش دوباره');retry.onclick = () => location.reload();
  }
}
