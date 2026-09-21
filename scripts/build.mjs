import { readFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseMatrix, isScored } from '../site/data.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tools = parseMatrix(await readFile(path.join(root,'site/data/tool-matrix.csv'),'utf8'));
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
await cp(path.join(root,'site'),path.join(root,'dist'),{recursive:true});
console.log(`Built ${tools.length} tools (${tools.filter(isScored).length} complete score profiles) into dist/.`);
