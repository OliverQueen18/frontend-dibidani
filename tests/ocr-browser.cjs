// Exercises the component's actual read() implementation under the production CSP.
const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const csp = fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8').match(/Content-Security-Policy "([^"]+)"/)[1];
function compile(file) {
  return ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true}
  }).outputText;
}
const runner = `
const modules = {};
function require(name) {
  if(name==='@angular/core') return {Component:()=>x=>x,Input:()=>()=>{},Output:()=>()=>{},EventEmitter:class {emit(){}}};
  if(name==='tesseract.js') return Tesseract;
  return modules[name] || {};
}
{const exports={}; ${compile('src/app/core/image-upload.ts')}; modules['../core/image-upload']=exports;}
{const exports={}; ${compile('src/app/shared/ocr-capture.component.ts')}; window.component=new exports.OcrCaptureComponent();}
`;
const server = http.createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',csp);
  if(req.url==='/') {res.setHeader('Content-Type','text/html');res.end('<base href="/"><script src="/tesseract.js"></script><script src="/runner.js"></script>');return;}
  if(req.url==='/runner.js') {res.setHeader('Content-Type','application/javascript');res.end(runner);return;}
  const files={
    '/tesseract.js':'node_modules/tesseract.js/dist/tesseract.min.js',
    '/fixture.png':'tests/fixtures/ocr-text.png'
  };
  const relative=files[req.url] || (req.url.startsWith('/assets/ocr/') ? 'dist/dibidani/browser'+req.url : '');
  const file=path.resolve(root,relative);
  if(!relative || !file.startsWith(root+path.sep) || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':file.endsWith('.png')?'image/png':'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  let browser;
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result=await page.evaluate(async()=>{
      const blob=await (await fetch('/fixture.png')).blob();
      await window.component.read({target:{files:[new File([blob],'text.png',{type:'image/png'})],value:'fixture'}});
      return {text:window.component.text,error:window.component.error,busy:window.component.busy};
    });
    assert.equal(result.error,''); assert.equal(result.busy,false);
    assert.match(result.text,/DIBIDANI/); assert.match(result.text,/Description du produit/i);
    await page.route('**/fra.traineddata.gz',route=>route.fulfill({status:404,body:'missing language'}));
    const failure=await page.evaluate(async()=>{
      const blob=await (await fetch('/fixture.png')).blob();
      await window.component.read({target:{files:[new File([blob],'text.png',{type:'image/png'})],value:''}});
      return {error:window.component.error,busy:window.component.busy};
    });
    assert.equal(failure.busy,false); assert.match(failure.error,/moteur OCR/);
    await page.unroute('**/fra.traineddata.gz');
    const retried=await page.evaluate(async()=>{
      const blob=await (await fetch('/fixture.png')).blob();
      await window.component.read({target:{files:[new File([blob],'text.png',{type:'image/png'})],value:''}});
      return {text:window.component.text,error:window.component.error};
    });
    assert.equal(retried.error,''); assert.match(retried.text,/DIBIDANI/);
    assert.deepEqual(errors,[]);
    console.log('PASS: actual OCR component in Edge under production CSP',JSON.stringify(result));
  } finally {if(browser) await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
