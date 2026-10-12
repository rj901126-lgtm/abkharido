import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const parser = require('next/dist/compiled/babel/bundle').parser();
function find(node, name) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'VariableDeclarator' && node.id.name === name) return node.init;
  for (const val of Object.values(node)) {
    if (Array.isArray(val)) { for (const child of val) { const r = find(child, name); if (r) return r; } }
    else if (val && typeof val === 'object') { const r = find(val, name); if (r) return r; }
  }
  return null;
}
async function extract(file, name) {
  const source = await fs.readFile(file, 'utf8');
  const node = find(parser.parse(source, { sourceType: 'module', plugins: ['jsx'] }), name);
  return source.slice(node.start, node.end);
}
const calls = [];
const payout = vm.runInNewContext('(' + await extract('src/context/AppContext.jsx', 'requestPayout') + ')', {
  currentUser: { walletCoins: 2000, withdrawableCoins: 2000, walletCash: 0 },
  showToast: message => calls.push(message), fetch: () => { throw new Error('Unexpected network call'); }
});
const payoutResult = await payout(1000, 'UPI');
const resets = [];
const submit = vm.runInNewContext('(' + await extract('src/views/PartnerCenter.jsx', 'handleWithdrawSubmit') + ')', {
  withdrawCoins: '1000', withdrawableCoins: 2000, withdrawMethod: 'upi', upiId: 'audit@upi', bankAcc: '',
  showToast: () => {}, requestPayout: async () => false,
  setWithdrawCoins: v => resets.push(['amount', v]), setUpiId: v => resets.push(['upi', v]), setBankAcc: v => resets.push(['bank', v])
});
submit({ preventDefault() {} });
const results = { coinBalance: 2000, withdrawal: 1000, payoutResult, messages: calls, failedRequestFormResets: resets };
await fs.writeFile('reports/bug-audit/payout-proof.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
