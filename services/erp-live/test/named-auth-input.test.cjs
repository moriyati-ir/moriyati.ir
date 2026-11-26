'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {randomBytes, scryptSync} = require('node:crypto');
const auth = require('../live/named-auth.cjs');

test('Sonia can paste the name and issued password from the RTL account sheet', async () => {
 const password = randomBytes(18).toString('hex');
 const salt = randomBytes(16).toString('hex');
 const password_hash = scryptSync(password, salt, 64).toString('hex');
 const sheetValue = value => '\u202b\u202a' + value + '\u202c\u202c';
 const cookies = [];
 const response = {setHeader: (key, value) => cookies.push(...value)};
 const request = {headers: {}};
 const db = {query: async (sql, params) => {
  if (sql.includes('RETURNING salt,password_hash')) {
   assert.deepEqual(params, ['sonia']);
   return {rows: [{salt, password_hash}]};
  }
  return {rowCount: 1};
 }};
 await auth.directory();
 for (const username of ['سونیا', 'سونيا', 'Sonia', 'Sonya']) {
  const result = await auth.login(db, request, response, {
   username: sheetValue(username), password: sheetValue(password)
  });
  assert.equal(result.userId, 'sonia');
 }
 assert.ok(cookies.some(value => value.startsWith('__Host-mori-person=') && value.includes('HttpOnly')));
 for (const wrong of [sheetValue(''), ' ' + password, password.slice(0, 2) + '\u202a' + password.slice(2)]) {
  await assert.rejects(auth.login(db, request, response, {username: 'سونیا', password: wrong}), {status: 401});
 }
});
