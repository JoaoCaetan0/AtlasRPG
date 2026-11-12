const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(file,values={}){const c=vm.createContext(values);vm.runInContext(fs.readFileSync(__dirname+'/../web/'+file,'utf8'),c);return c;}
test('saved order ignores unknown roles, duplicates and malformed data',()=>{
 const c=load('panel-preferences.js'),available=['chat','characters','notes'];
 assert.deepEqual(Array.from(c.normalizePanelOrder(['admin','notes','notes'],available)),['notes','chat','characters']);
 assert.deepEqual(Array.from(c.normalizePanelOrder({},available)),available);
});
test('movement handles boundaries without mutating default order',()=>{
 const c=load('panel-preferences.js'),a=['chat','notes','characters'];
 assert.deepEqual(Array.from(c.movePanelOrder(a,'characters',-1)),['characters','chat','notes']);
 assert.deepEqual(Array.from(c.movePanelOrder(a,'chat',99)),['notes','characters','chat']);
 assert.deepEqual(a,['chat','notes','characters']);
});
function node(id){return {dataset:{tab:id},children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(k,f){this.handlers[k]=f},focus(){},insertBefore(b,c){this.children=this.children.filter(x=>x!==b);this.children.splice(this.children.indexOf(c),0,b)},append(b){this.children=this.children.filter(x=>x!==b);this.children.push(b)},querySelectorAll(){return this.children.filter(x=>x.dataset?.tab)}};}
test('order is stored per user and restored without opening a panel',()=>{
 const saved=new Map(),c=load('panel-preferences.js',{document:{createElement:()=>node()},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},showFeedback(){},Date});
 function rail(){const r=node();r.children=['chat','notes','characters'].map(node);return r;}
 let r=rail();c.mountPanelPreferences(r,'alice');
 r.children[1].handlers.keydown({altKey:true,key:'ArrowUp',preventDefault(){}});
 assert.equal(r.children[0].dataset.tab,'notes');
 r=rail();c.mountPanelPreferences(r,'alice');assert.equal(r.children[0].dataset.tab,'notes');
 r=rail();c.mountPanelPreferences(r,'bob');assert.equal(r.children[0].dataset.tab,'chat');
});
test('drag suppresses accidental menu activation',()=>{
 const c=load('panel-preferences.js',{document:{createElement:()=>node()},localStorage:{getItem:()=>null,setItem(){}},Date});const r=node();r.children=['chat','notes'].map(node);c.mountPanelPreferences(r,'a');
 let stopped=false;const b=r.children[0];b.handlers.dragstart({dataTransfer:{setData(){}}});b.handlers.dragend();b.handlers.click({preventDefault(){},stopImmediatePropagation(){stopped=true}});assert.ok(stopped);
});
test('dirty sheet survives switching to a dedicated tool and minimizing',async()=>{
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,{...node(),scrollTop:70,style:{},removeAttribute(){},childElementCount:1,replaceChildren(){throw Error('discarded sheet')}});return nodes.get(s)};
 const c=load('workspace.js',{$:get,document:{querySelectorAll:()=>[],querySelector:()=>null},window:{dispatchEvent(){}},CustomEvent:function(){},currentPane:'scene',isMaster:()=>true,dirty:true,canLeave(){throw Error('unexpected discard prompt')}});
 vm.runInContext('workspaceView="characters";currentPanel="characters"',c);
 await c.openWorkspacePanel('dice');c.setSidebar(null,false);await c.openWorkspacePanel('characters');
 assert.equal(vm.runInContext('workspaceView',c),'characters');assert.equal(c.dirty,true);assert.equal(get('.drawer-scroll').scrollTop,70);
});
test('collection tabs are master-only and retain separate labels',()=>{
 const c=load('characters.js',{isMaster:()=>false});assert.equal(c.characterSections('saved'),'');c.isMaster=()=>true;assert.match(c.characterSections('saved'),/Tokens salvos/);assert.match(c.characterSections('saved'),/data-collection="saved" aria-pressed="true"/);
});
