const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../src/app/pages/checkout.component.ts'),'utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
function setup(order, result, failOnce=false) {
  const calls={create:0,pay:0,clear:0,paths:[],redirects:[]};
  const context={exports:{},require:()=>({Component:()=>x=>x}),window:{location:{assign:u=>calls.redirects.push(u)}}};
  vm.runInNewContext(compiled,context);
  const api={createOrder:()=>{calls.create++;return {subscribe:o=>o.next(order)}},payOrder:()=>{calls.pay++;return {subscribe:o=>failOnce && calls.pay===1 ? o.error({error:{message:'Indisponible'}}) : o.next(result)}}};
  const cart={items:()=>[{product:{id:1},quantity:1}],clear:()=>calls.clear++};
  const component=new context.exports.CheckoutComponent(cart,api,{token:()=>true},{navigate:p=>calls.paths.push(Array.from(p))});
  component.phone='76000000';
  return {component,calls};
}
test('cash on delivery is confirmed without requesting online payment',()=>{
  const {component,calls}=setup({orderNumber:'COD-1',status:'NEW',paymentMethod:'CASH_ON_DELIVERY'});
  component.submit(); assert.equal(calls.pay,0); assert.deepEqual(calls.paths,[['/confirmation','COD-1']]);
});
test('online payment uses the nested order response',()=>{
  const order={orderNumber:'ONLINE-1',status:'PENDING_PAYMENT',paymentMethod:'MOBILE_MONEY'};
  const {component,calls}=setup(order,{order,nextAction:'AWAIT_CONFIRMATION',payment:null});
  component.submit(); assert.equal(calls.pay,1); assert.deepEqual(calls.paths,[['/confirmation','ONLINE-1']]);
});
test('payment failure retries the existing order without creating a duplicate',()=>{
  const order={orderNumber:'RETRY-1',status:'PENDING_PAYMENT',paymentMethod:'MOBILE_MONEY'};
  const {component,calls}=setup(order,{order,nextAction:'CONFIRMED',payment:null},true);
  component.submit(); assert.equal(component.loading,false); component.submit();
  assert.equal(calls.create,1); assert.equal(calls.pay,2);
});
test('payment redirect follows the gateway checkout URL',()=>{
  const order={orderNumber:'CARD-1',status:'PENDING_PAYMENT',paymentMethod:'BANK_CARD'};
  const {component,calls}=setup(order,{order,nextAction:'REDIRECT',payment:{checkoutUrl:'https://pay.example.test/session'}});
  component.submit(); assert.deepEqual(calls.redirects,['https://pay.example.test/session']); assert.equal(calls.paths.length,0);
});
