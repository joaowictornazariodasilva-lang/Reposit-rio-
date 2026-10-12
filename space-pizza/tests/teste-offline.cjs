const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = '' + require('path').resolve(__dirname, '..') + '/prints/';
(async()=>{
 const b = await chromium.launch({executablePath: process.env.PW_CHROMIUM_PATH || undefined});
 const ctx = await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true, offline:true, locale:'pt-BR', timezoneId:'America/Fortaleza'});
 // bloqueia qualquer requisição de rede (simula internet desligada)
 const net=[]; await ctx.route(/^https?:/, r=>{net.push(r.request().url()); r.abort();});
 const p = await ctx.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{ window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return null;}; });
 await p.goto('file://' + require('path').resolve(__dirname, '..') + '/index.html');
 await p.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
 await p.waitForTimeout(800);
 console.log('FONTES', await p.evaluate(async()=>{await document.fonts.ready; return [document.fonts.check('800 20px Fraunces'), document.fonts.check('400 16px "DM Sans"')]}));
 // força carregar lazy imgs
 await p.evaluate(async()=>{ for(const i of document.images){ i.loading='eager'; } window.scrollTo(0,document.body.scrollHeight); });
 await p.waitForTimeout(800);
 const imgs = await p.evaluate(()=>[...document.images].filter(i=>i.src).map(i=>({alt:i.alt.slice(0,40),ok:i.complete&&i.naturalWidth>0,w:i.naturalWidth})));
 console.log('IMGS', imgs.length, 'falhas:', imgs.filter(i=>!i.ok));
 await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300);
 await p.screenshot({path:OUT+'1-topo.jpg', quality:80});
 await p.evaluate(()=>window.scrollTo(0, document.getElementById('pizzas').offsetTop-60)); await p.waitForTimeout(400);
 await p.screenshot({path:OUT+'2-lista.jpg', quality:80});
 // pizza calabresa
 await p.click('.card[data-id="calabresa"]'); await p.waitForTimeout(500);
 await p.locator('#bordaOpts input[value="catupiry"]').evaluate(e=>{e.scrollIntoView({block:'center'}); e.click();});
 await p.click('#qPlus');
 await p.fill('#itemObs','bem assada');
 await p.screenshot({path:OUT+'3-painel-pizza.jpg', quality:80});
 await p.click('#addBtn'); await p.waitForTimeout(500);
 // promo
 await p.click('#promoCard'); await p.waitForTimeout(500);
 await p.click('#addBtn'); await p.waitForTimeout(200); // sem sabor -> erro
 const promoErr = await p.evaluate(()=>document.getElementById('flavorGroup').classList.contains('is-invalid'));
 await p.locator('#flavorOpts input[value="frango"]').evaluate(e=>{e.scrollIntoView({block:'center'}); e.click();});
 await p.waitForTimeout(2000); await p.evaluate(()=>document.querySelector('#itemSheet .sheet__scroll').scrollTop=0); await p.waitForTimeout(300);
 await p.screenshot({path:OUT+'4-painel-promo.jpg', quality:80});
 await p.click('#addBtn'); await p.waitForTimeout(500);
 // bebida
 await p.evaluate(()=>window.scrollTo(0, document.getElementById('bebidas').offsetTop-60)); await p.waitForTimeout(400);
 await p.waitForTimeout(2300); await p.screenshot({path:OUT+'5-bebidas.jpg', quality:80});
 await p.click('.card[data-id="lata"]'); await p.waitForTimeout(400); await p.click('#addBtn'); await p.waitForTimeout(500);
 await p.screenshot({path:OUT+'6-carrinho-barra.jpg', quality:80});
 await p.waitForTimeout(2300); await p.click('#cartOpen'); await p.waitForTimeout(500);
 await p.screenshot({path:OUT+'7-sacola.jpg', quality:80});
 await p.click('#nextBtn'); await p.waitForTimeout(400);
 await p.click('#nextBtn'); await p.waitForTimeout(400); // validação
 const invalid = await p.evaluate(()=>[...document.querySelectorAll('.is-invalid')].map(e=>e.id));
 await p.fill('#cName','Maria Teste');
 await p.fill('#cAddr','Rua Exemplo, 123, Conjunto Esperança');
 await p.fill('#cRef','Perto da praça');
 await p.locator('input[name=pag][value="Dinheiro"]').evaluate(e=>{e.scrollIntoView({block:'center'}); e.click();});
 await p.fill('#cTroco','150'); await p.click('#nextBtn'); await p.waitForTimeout(300); console.log('troco<total bloqueou:', await p.evaluate(()=>document.getElementById('fTroco').classList.contains('is-invalid'))); await p.fill('#cTroco','200');
 await p.fill('#cObs','Pedido de teste, não preparar');
 await p.screenshot({path:OUT+'8-finalizar.jpg', quality:80});
 await p.click('#nextBtn'); await p.waitForTimeout(300);
 const opened = await p.evaluate(()=>window.__opened);
 console.log('validacao vazia:', invalid, 'promo sem sabor bloqueou:', promoErr);
 console.log('ERROS', errs);
 console.log('REDE bloqueada:', net);
 console.log('URL', opened[0] ? opened[0].slice(0,60)+'…' : 'NENHUMA');
 if (opened[0]) console.log('---MSG---\n'+decodeURIComponent(opened[0].split('?text=')[1])+'\n---FIM---');
 // desktop
 const d = await b.newContext({viewport:{width:1440,height:900}, offline:true}); await d.route(/^https?:/, r=>r.abort());
 const dp = await d.newPage(); await dp.goto('file://' + require('path').resolve(__dirname, '..') + '/index.html'); await dp.waitForTimeout(600);
 await dp.screenshot({path:OUT+'9-desktop.jpg', quality:80});
 await b.close();
})();
