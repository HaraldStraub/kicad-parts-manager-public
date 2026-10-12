import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('external development page preserves all planning rows and filters without a server',async t=>{
 try{await access(new URL('../../Entwicklungsplanung/index.html',import.meta.url));}catch{t.skip('External planning is not distributed in the source repository');return;}
 const html=await readFile(new URL('../../Entwicklungsplanung/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously'}),d=dom.window.document;
 const data=JSON.parse(await readFile(new URL('../../Entwicklungsplanung/entwicklungsdaten.json',import.meta.url),'utf8'));
 const completed=data.backlog.filter(row=>row[2]==='Umgesetzt'&&row[5]==='Erledigt');
 const deferred=data.backlog.filter(row=>row[2]==='Zurückgestellt');
 const backlog=data.backlog.filter(row=>!completed.includes(row)&&!deferred.includes(row));
 assert.equal(d.querySelectorAll('#zurueckgestellt tbody tr').length,deferred.length);
 assert.equal(d.querySelectorAll('#backlog tbody tr').length,backlog.length);
 assert.equal(d.querySelectorAll('#erledigt tbody tr').length,completed.length);
 assert.deepEqual([...d.querySelectorAll('#backlog tbody tr,#erledigt tbody tr,#zurueckgestellt tbody tr')].map(row=>row.cells[0].textContent).sort(),data.backlog.map(row=>row[0]).sort());
 assert.ok(data.backlog.some(row=>row[0]==='31'&&row[1].includes('PayPal')));
 assert.equal(d.querySelectorAll('#verlauf tbody tr').length,data.history.length);
 assert.ok(data.history.length>=19);
 const status=d.querySelector('#status');status.value='Offen';status.dispatchEvent(new dom.window.Event('input'));
 assert.equal([...d.querySelectorAll('#backlog tbody tr')].filter(r=>!r.hidden).length,backlog.filter(row=>row[2]==='Offen').length);
 status.value='';const search=d.querySelector('#search');search.value='Sprache';search.dispatchEvent(new dom.window.Event('input'));
 assert.ok([...d.querySelectorAll('#backlog tbody tr')].filter(r=>!r.hidden).every(r=>r.textContent.toLowerCase().includes('sprache')));
 search.value='';search.dispatchEvent(new dom.window.Event('input'));
 const nr=d.querySelectorAll('#backlog th button')[0];nr.click();nr.click();
 assert.equal(d.querySelector('#backlog tbody tr').cells[0].textContent,String(Math.max(...backlog.map(row=>Number(row[0])))));
 assert.equal(nr.parentElement.getAttribute('aria-sort'),'descending');
 for(const col of [2,3,4,5]){const th=d.querySelectorAll('#backlog th')[col];th.querySelector('button').click();assert.equal(th.getAttribute('aria-sort'),'ascending');th.querySelector('button').click();assert.equal(th.getAttribute('aria-sort'),'descending');}
 status.value='Offen';status.dispatchEvent(new dom.window.Event('input'));
 assert.equal([...d.querySelectorAll('#backlog tbody tr')].filter(r=>!r.hidden).length,backlog.filter(row=>row[2]==='Offen').length);
 status.value='';status.dispatchEvent(new dom.window.Event('input'));
 const efforts=[...d.querySelectorAll('#effort-filter input')];assert.ok(efforts.length>2);
 for(const input of efforts.slice(0,2)){input.checked=true;input.dispatchEvent(new dom.window.Event('change'));}
 const chosen=efforts.slice(0,2).map(input=>input.value),visible=()=>[...d.querySelectorAll('#backlog tbody tr')].filter(r=>!r.hidden);
 assert.equal(visible().length,backlog.filter(row=>chosen.includes(row[5])).length);
 status.value='Offen';status.dispatchEvent(new dom.window.Event('input'));
 assert.equal(visible().length,backlog.filter(row=>row[2]==='Offen'&&chosen.includes(row[5])).length);
 d.querySelector('#backlog th button').click();assert.ok(visible().every(row=>chosen.includes(row.cells[5].textContent)));
 d.getElementById('effort-clear').click();assert.ok(efforts.every(input=>!input.checked));assert.equal(d.getElementById('effort-caption').textContent,'Alle');
 assert.equal(d.querySelectorAll('script[src]').length,0);dom.window.close();
});
