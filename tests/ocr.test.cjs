const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {createWorker} = require('tesseract.js');

test('recognizes product text with the language files delivered in the build', {timeout:60000}, async()=>{
  const assets=path.join(__dirname,'../dist/dibidani/browser/assets/ocr/v2');
  for (const file of ['worker.min.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-lstm.wasm','lang/fra.traineddata.gz','lang/eng.traineddata.gz']) {
    assert.ok(fs.statSync(path.join(assets,file)).size>0,file);
  }
  const worker=await createWorker('fra+eng',1,{langPath:path.join(assets,'lang'),cacheMethod:'none',errorHandler:()=>{}});
  try {
    const result=await worker.recognize(path.join(__dirname,'fixtures/ocr-text.png'));
    assert.match(result.data.text,/DIBIDANI/);
    assert.match(result.data.text,/12345/);
    assert.match(result.data.text,/Description du produit/i);
  } finally { await worker.terminate(); }
});
