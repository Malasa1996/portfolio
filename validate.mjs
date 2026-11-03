import fs from 'node:fs';
const html=['dist/index.html','dist/cases/designers.html'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const css=['styles.css','artwork.css','motion.css','stickers.css'].map(file=>fs.readFileSync('dist/'+file,'utf8')).join('\n');
const assets=[...new Set([...html.matchAll(/(?:src|href)="\/?(assets\/[^\"]+)"/g)].map(m=>m[1]).concat([...css.matchAll(/url\(['"]?(assets\/[^)'"?]+)(?:\?[^)'" ]+)?['"]?\)/g)].map(m=>m[1])))];
const missing=assets.filter(p=>!fs.existsSync('dist/'+p)||!fs.statSync('dist/'+p).size);
const temporaryUrls=/figma.com\/api\/mcp\/asset/.test(html+css);
const expectedMotion=JSON.parse(fs.readFileSync('reference/motion.json','utf8')).nodes;
const unmappedMotion=expectedMotion.filter(n=>!html.includes(`data-node-id="${n.nodeId}"`));
const missingRuntime=[...html.matchAll(/(?:src|href)="([^\"]+\.(?:css|js))"/g)].map(m=>m[1]).filter(file=>!fs.existsSync('dist/'+file)||!fs.statSync('dist/'+file).size);
console.log(JSON.stringify({assetFiles:assets.length,missing,missingRuntime,temporaryUrls,animations:expectedMotion.length,unmappedMotion:unmappedMotion.map(n=>n.nodeId)}));
if(missing.length||missingRuntime.length||temporaryUrls||unmappedMotion.length)process.exit(1);

// Check the dynamically loaded scene: no missing decoder or remote textures.
const model=fs.readFileSync('dist/assets/badge-3d/badge.glb');
if(model.readUInt32LE(0)!==0x46546c67||model.readUInt32LE(4)!==2||model.readUInt32LE(8)!==model.length)throw Error('Invalid GLB');
const scene=JSON.parse(model.subarray(20,20+model.readUInt32LE(12)).toString());
const camera=JSON.parse(fs.readFileSync('dist/assets/badge-3d/scene.json','utf8'));
if(!scene.cameras?.length||!scene.animations?.length||camera.projection.length!==16||!camera.projection.every(Number.isFinite))throw Error('Missing camera or animation');
if([...scene.buffers,...scene.images].some(asset=>asset.uri))throw Error('3D assets must be embedded');
for(const file of ['dist/vendor/draco/draco_decoder.wasm','dist/vendor/draco/draco_wasm_wrapper.js'])if(!fs.statSync(file).size)throw Error('Missing local decoder');
console.log(JSON.stringify({badgeBytes:model.length,meshes:scene.meshes.length,animations:scene.animations.length,embeddedImages:scene.images.length}));
