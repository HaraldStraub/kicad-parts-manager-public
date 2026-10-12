import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('light theme keeps body, secondary, action and selected text readable',async()=>{
 const css=await readFile(new URL('../src/kicad_parts_manager/web/design-tokens.css',import.meta.url),'utf8');
 const raw=Object.fromEntries([...css.split('body.light')[1].matchAll(/--([\w-]+):([^;{}]+)/g)].map(m=>[m[1],m[2].trim()]));
 const resolve=key=>raw[key]?.startsWith('var(')?resolve(raw[key].slice(6,-1)):raw[key];
 const tokens=Object.fromEntries(Object.keys(raw).map(key=>{let value=resolve(key);return [key,value?.length===4?'#'+[...value.slice(1)].map(c=>c+c).join(''):value];}));
 function luminance(hex){return hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
 for(const [foreground,background] of [['text','bg'],['muted','surface'],['accent','field'],['text','selected']]){
  const a=luminance(tokens[foreground]),b=luminance(tokens[background]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,foreground+' on '+background);
 }
 const b=luminance(tokens.button);assert.ok(1.05/(b+.05)>=4.5,'white primary-button text');
});
