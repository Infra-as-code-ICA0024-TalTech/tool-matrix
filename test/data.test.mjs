import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseMatrix, parseCSV, COLUMNS, METRICS, isScored, filterTools, radarPoints} from '../site/data.js';

const csv = await readFile(new URL('../site/data/tool-matrix.csv',import.meta.url),'utf8');
const tools = parseMatrix(csv);
test('source slide scores and unknown values are preserved',()=>{
  assert.deepEqual(tools.slice(0,3).map(t=>METRICS.map(([k])=>t[k])),[[9,10,5,8,1,5],[4,6,6,3,4,5],[9,9,8,7,6,8]]);
  assert.equal(tools.filter(isScored).length,3);
  const packer=tools.find(t=>t.tool==='Packer');
  assert.equal(packer.idempotent,null); assert.equal(radarPoints(packer),null);
});
test('CSV handles quoted commas, newlines, escaped quotes and CRLF',()=>{
  assert.deepEqual(parseCSV('\uFEFFone,two\r\n"a,b","say ""hi""\nnext"\r\n'),[['one','two'],['a,b','say "hi"\nnext']]);
  assert.throws(()=>parseCSV('"unclosed'),/Unclosed/);
});
test('bad scores, duplicates and missing provenance fail validation',()=>{
  assert.throws(()=>parseMatrix(csv.replace('Kubernetes,9,10','Kubernetes,11,10')),/0-10/);
  assert.throws(()=>parseMatrix(csv.replace('Ansible,','Kubernetes,')),/duplicate/);
  assert.throws(()=>parseMatrix('tool,idempotent\nPacker,\n'),/columns/);
  assert.throws(()=>parseMatrix(COLUMNS.join(',')+'\n'+['Empty',...Array(11).fill('')].join(',')),/provenance/);
});
test('filters support subset, no selection, category and demo search',()=>{
  const selected=new Set(tools.map(t=>t.tool));
  assert.equal(filterTools(tools,new Set()).length,0);
  assert.deepEqual(filterTools(tools,new Set(['Terraform'])).map(t=>t.tool),['Terraform']);
  assert.ok(filterTools(tools,selected,'Runtime').every(t=>t.category==='Runtime'));
  assert.ok(filterTools(tools,selected,'','demo-03c').some(t=>t.tool==='Puppet (OpenVox)'));
});
test('radar uses the source axis order and a zero-to-ten scale',()=>{
  const points=radarPoints(tools[0]);
  assert.equal(points.length,6); assert.equal(points[0][0],400);
  assert.ok(Math.abs(points[0][1]-(310-226*.9))<1e-8);
  const zero={...tools[0],...Object.fromEntries(METRICS.map(([k])=>[k,0]))};
  assert.ok(radarPoints(zero).every(([x,y])=>x===400&&y===310));
});
