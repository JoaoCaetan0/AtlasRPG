import {test} from 'node:test';
import assert from 'node:assert/strict';
import {menuPosition} from '../web/combat/token-menu.mjs';
import {resourceBarMarkup} from '../web/combat/renderer.mjs';
test('menu clamps to viewport edges including narrow screens',()=>{
 assert.deepEqual(menuPosition(380,700,304,500,390,720),{left:78,top:212});
 assert.deepEqual(menuPosition(-100,-100,300,200,390,720),{left:8,top:8});
});
test('bars clamp filled width and omit hidden numeric values',()=>{
 const html=resourceBarMarkup([{kind:'pv',ratio:2,numbers:false}],100,100,40);
 assert.match(html,/width="72"/);assert.doesNotMatch(html,/<text/);
 const negative=resourceBarMarkup([{kind:'pd',ratio:-2,numbers:true,current:-3,maximum:8}],100,100,40);
 assert.match(negative,/width="0"/);assert.match(negative,/PD -3\/8/);
});
