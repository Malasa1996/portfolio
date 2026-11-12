import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('dist');
if (!process.argv[2]) throw new Error('Pass the output directory');
const output = path.resolve(process.argv[2]);
if (fs.existsSync(output)) throw new Error(`Output already exists: ${output}`);

fs.cpSync(source, output, {
  recursive: true,
  filter: file => {
    const relative = path.relative(source, file);
    return relative !== 'client' && !relative.startsWith(`client${path.sep}`);
  },
});

const rootPath = /(?<=["'(=])\/(?=assets\/|cases\/|[A-Za-z0-9._-]+\.(?:css|js)|#)/g;
function rewrite(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) rewrite(file);
    else if (/\.(?:html|css|js)$/.test(entry.name)) {
      const before = fs.readFileSync(file, 'utf8');
      const after = before.replace(rootPath, '/portfolio/');
      if (after !== before) fs.writeFileSync(file, after);
    }
  }
}
rewrite(output);
for (const page of ['index.html', 'cases/designers.html', 'cases/sovcombank.html']) {
  if (!fs.existsSync(path.join(output, page))) throw new Error(`Missing page: ${page}`);
}
