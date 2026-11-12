import test from 'node:test';
import assert from 'node:assert/strict';
import {mountMapPan} from '../web/combat/camera.mjs';
function setup(){
 const events=new Map(),globalEvents=new Map(),classes=new Set();let captured=null;
 globalThis.window={addEventListener:(n,f)=>globalEvents.set(n,f),removeEventListener:n=>globalEvents.delete(n)};
 const board={scrollLeft:200,scrollTop:150,classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null,addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
 const pan=mountMapPan(board);
 const event=(button,x,y)=>({button,pointerId:3,clientX:x,clientY:y,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 return {events,globalEvents,board,pan,event,classes};
}
test('middle drag pans both axes and consumes events before combat tools',()=>{const x=setup();const down=x.event(1,50,50);x.events.get('pointerdown')(down);assert.ok(down.prevented&&down.stopped);x.events.get('pointermove')(x.event(1,80,90));assert.equal(x.board.scrollLeft,170);assert.equal(x.board.scrollTop,110);x.events.get('pointerup')(x.event(1,80,90));assert.equal(x.classes.size,0);x.pan.destroy();assert.equal(x.events.size,0);});
test('left click stays available; blur releases a middle drag',()=>{const x=setup();for(const b of [0]){const e=x.event(b,20,20);x.events.get('pointerdown')(e);assert.equal(e.prevented,undefined);}x.events.get('pointerdown')(x.event(1,50,50));x.globalEvents.get('blur')({});assert.equal(x.classes.size,0);x.events.get('pointermove')(x.event(1,80,90));assert.equal(x.board.scrollLeft,200);x.pan.destroy();});
test('map text selection and native image dragging are prevented',()=>{const x=setup();for(const name of ['selectstart','dragstart']){const e=x.event(0,0,0);x.events.get(name)(e);assert.equal(e.prevented,true);}x.pan.destroy();});

test('right drag has a threshold and suppresses native context menus',()=>{
 const x=setup();x.events.get('pointerdown')(x.event(2,50,50));
 x.events.get('pointermove')(x.event(2,52,52));assert.equal(x.board.scrollLeft,200);
 const early=x.event(2,50,50);x.events.get('contextmenu')(early);assert.ok(early.prevented);
 x.events.get('pointermove')(x.event(2,70,80));assert.equal(x.board.scrollLeft,180);assert.equal(x.board.scrollTop,120);
 x.events.get('pointerup')(x.event(2,70,80));const late=x.event(2,70,80);x.events.get('contextmenu')(late);assert.ok(late.prevented);assert.equal(x.classes.size,0);x.pan.destroy();
});
test('right click dispatches exactly once to the original token; cancel never opens',()=>{
 const x=setup();let opened=0;globalThis.MouseEvent=class{constructor(type,args){Object.assign(this,args);this.type=type}};
 const down=x.event(2,50,50);down.target={dispatchEvent:e=>{assert.equal(e.type,'contextmenu');opened++;}};
 x.events.get('pointerdown')(down);x.events.get('pointerup')(x.event(2,51,50));assert.equal(opened,1);
 x.events.get('pointerdown')(down);x.events.get('pointercancel')(x.event(2,50,50));assert.equal(opened,1);x.pan.destroy();
});
