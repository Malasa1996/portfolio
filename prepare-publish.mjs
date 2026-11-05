import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const output = path.join(root, 'client');
const unusedArchive = path.join(root, 'assets', 'archive');
fs.mkdirSync(output, {recursive:true});
for (const entry of fs.readdirSync(root, {withFileTypes:true})) {
  if (entry.name === 'client') continue;
  fs.cpSync(path.join(root, entry.name), path.join(output, entry.name), {
    recursive:true,
    force:true,
    filter:source => source !== unusedArchive && !source.startsWith(unusedArchive + path.sep),
  });
}
console.log('Prepared Site output without unused archive duplicates');
