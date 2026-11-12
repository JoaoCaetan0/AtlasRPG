const {test}=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const assert=require('node:assert/strict');
test('player cannot open administrative map and fog panels through direct calls',async()=>{
 let touched=false;
 const context=vm.createContext({currentPane:'scene',isMaster:()=>false,$:()=>{touched=true;throw Error('Unexpected DOM access')},api:()=>{touched=true;throw Error('Unexpected API call')}});
 for(const file of ['workspace.js','files.js'])vm.runInContext(fs.readFileSync(__dirname+'/../web/'+file,'utf8'),context);
 for(const name of ['fog','maps']){await context.openWorkspacePanel(name);context.setSidebar(name);}
 await context.mapView();assert.equal(touched,false);
});
