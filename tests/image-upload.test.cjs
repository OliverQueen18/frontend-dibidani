const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/app/core/image-upload.ts'),'utf8');
function loader() {
  let decodes=0;
  const context={exports:{},File,Error,createImageBitmap:async()=>{decodes++;return {width:8000,height:6000,close(){}}},
    document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},fillRect(){}}),toBlob(callback,type){callback(new Blob([new Uint8Array(Math.round(this.width*this.height/2))],{type}))}})}};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
  return {...context.exports,decodes:()=>decodes};
}
test('large camera photos are resized and reduced below the upload target',async()=>{
  const api=loader(); const photo=new File([new Uint8Array(25*1024*1024)],'camera.jpg',{type:'image/jpeg'});
  const output=await api.prepareImageUpload(photo,true);
  assert.ok(output.size<=900000); assert.equal(output.type,'image/jpeg'); assert.ok(output.size<photo.size);
});
test('studio checks dimensions even for a small compressed high-resolution photo',async()=>{
  const api=loader(); const photo=new File(['small'],'camera.jpg',{type:'image/jpeg'});
  await api.prepareImageUpload(photo,true); assert.equal(api.decodes(),1);
});
test('oversized input is rejected before image decoding',async()=>{
  const api=loader(); await assert.rejects(api.prepareImageUpload({size:41*1024*1024}),/40 Mo/);
  assert.equal(api.decodes(),0);
});
