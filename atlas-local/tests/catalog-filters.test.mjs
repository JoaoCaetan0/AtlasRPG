import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {filterCatalog,groupTokenFamilies,makeBatch} from '../web/combat/token-model.mjs';
const source=fs.readFileSync(new URL('../web/files.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source.slice(0,source.indexOf('async function mapView()')),context);
test('legacy and current map types share the same filter key',()=>{
 for(const k of ['Geográfico','geografico','regional',' Geographic '])assert.equal(context.mapKind(k),'regional');
 for(const k of ['Encontro','encounter',' ENCONTRO '])assert.equal(context.mapKind(k),'encounter');
 assert.equal(context.mapKind(null),'unclassified');
});
const catalog=JSON.parse(fs.readFileSync(new URL('../web/tokens/catalog.json',import.meta.url)));
test('all populated token category and subgroup combinations remain searchable',()=>{
 for(const token of catalog){const filtered=filterCatalog(catalog,token.family_name,token.category,[],[]);const groups=groupTokenFamilies(filtered,token.subgroup);assert.ok(groups.some(g=>g.items.some(t=>t.id===token.id)),token.id);}
 const custom={id:'recent-1',name:'Urso especial',category:'Personalizados',custom:true};
 assert.equal(groupTokenFamilies(filterCatalog([custom],'urso','custom-recent',[],[]),'Personalizados')[0].items.length,1);
});
test('new tokens face north while saved explicit directions are preserved',()=>{
 const state={tokens:[],grid:{size:35}},options={count:1,name:'Teste',budget:10,hidden:false};
 assert.equal(makeBatch(state,{id:'bandido-espada',color:'#123456'},options,{x:500,y:350},700,()=> 'a')[0].vision.direction,270);
 assert.equal(makeBatch(state,{id:'bandido-espada',color:'#123456',vision:{direction:0}},options,{x:500,y:350},700,()=> 'a')[0].vision.direction,0);
});
