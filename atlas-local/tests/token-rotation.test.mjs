import test from 'node:test';
globalThis.window={addEventListener(){},removeEventListener(){}};
import assert from 'node:assert/strict';
import {mountTokenRotation} from '../web/combat/token-rotation.mjs';
function setup(permit=true){
 const events=new Map(),token={id:'a',vision:{direction:0}},saved=[],previews=[];
 const svg={classList:{add(){},remove(){}},addEventListener(n,fn){events.set(n,fn)},removeEventListener(n){events.delete(n)},setPointerCapture(){},hasPointerCapture(){return false},releasePointerCapture(){}};
 const component=mountTokenRotation({svg,get:()=>({tokens:[token]}),allowed:()=>permit,point:e=>({x:e.clientX,y:e.clientY}),center:()=>[0,0],preview:(id,angle)=>previews.push(angle),commit:async(id,angle)=>saved.push(angle),status(){}});
 const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,target:{closest:()=>({dataset:{token:'a'}})},preventDefault(){},stopImmediatePropagation(){}});
 return {events,event,component,saved,previews};
}
test('primary drag rotates freely and commits once on release',async()=>{const x=setup();x.events.get('pointerdown')(x.event(10,0));x.events.get('pointermove')(x.event(0,20));assert.equal(x.previews.at(-1),90);assert.equal(x.saved.length,0);await x.events.get('pointerup')(x.event(0,20));assert.deepEqual(x.saved,[90]);x.component.destroy();});
test('brief click and unauthorized drag do not rotate',async()=>{for(const permit of [true,false]){const x=setup(permit);x.events.get('pointerdown')(x.event(10,0));if(!permit)x.events.get('pointermove')(x.event(0,20));await x.events.get('pointerup')(x.event(10,0));assert.equal(x.saved.length,0);x.component.destroy();}});
test('cancel restores the direction without saving',()=>{const x=setup();x.events.get('pointerdown')(x.event(10,0));x.events.get('pointermove')(x.event(-20,0));x.events.get('pointercancel')();assert.equal(x.previews.at(-1),0);assert.equal(x.saved.length,0);x.component.destroy();});
test('quick drag moves while a held token rotates; a plain click never captures',async()=>{
 const events=new Map(),saved=[],moves=[],captures=[];
 const svg={classList:{add(){},remove(){}},addEventListener(n,fn){events.set(n,fn)},removeEventListener(){},setPointerCapture(id){captures.push(id)},hasPointerCapture(){return false},releasePointerCapture(){}};
 const component=mountTokenRotation({svg,get:()=>({tokens:[{id:'a',vision:{direction:0}}]}),allowed:()=>true,point:e=>({x:e.clientX,y:e.clientY}),center:()=>[0,0],preview(){},commit:async(id,v)=>saved.push(v),status(){},previewMove(){},commitMove:async(id,p)=>moves.push(p)});
 const e=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,target:{closest:()=>({dataset:{token:'a'}})},preventDefault(){},stopImmediatePropagation(){}});
 events.get('pointerdown')(e(10,0));assert.equal(captures.length,0);await events.get('pointerup')(e(10,0));assert.equal(captures.length,0);
 events.get('pointerdown')(e(10,0));events.get('pointermove')(e(40,20));await events.get('pointerup')(e(40,20));assert.deepEqual(moves,[{x:40,y:20}]);assert.equal(saved.length,0);
 events.get('pointerdown')(e(10,0));await new Promise(resolve=>setTimeout(resolve,350));events.get('pointermove')(e(0,20));await events.get('pointerup')(e(0,20));assert.deepEqual(saved,[90]);component.destroy();
});
