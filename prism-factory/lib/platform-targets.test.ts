import assert from 'node:assert/strict';
import test from 'node:test';
import {platformConnection,hasPublicHttpsEndpoint,platforms} from './platform-targets';
import {toolsFor,flowsFor} from './contracts';
const endpoint='https://prism.mvps.ch/apps/example/mcp';
test('provider configurations use their native schemas and actual line breaks',()=>{
 const cursor=JSON.parse(platformConnection('cursor',endpoint,'Krafft Basel').content);assert.equal(cursor.mcpServers['prism-krafft-basel'].url,endpoint);
 const vscode=JSON.parse(platformConnection('vscode',endpoint,'Krafft Basel').content);assert.deepEqual(vscode.servers['prism-krafft-basel'],{type:'http',url:endpoint});
 const goose=platformConnection('goose',endpoint,'Krafft Basel').content;assert.match(goose,/extensions:\n  prism-krafft-basel:\n    type: streamable_http/);assert.ok(!goose.includes('\\n'));
 assert.equal(platforms.filter(p=>p.capability!=='preview').length,8);
 for(const id of ['perplexity','mistral'])assert.ok(platformConnection(id,endpoint,'Krafft').content.includes('Tools only'));
});
test('cloud connectors distinguish public HTTPS from local reachability',()=>{
 for(const url of ['http://localhost:3040/mcp','https://127.0.0.1/mcp','https://100.98.187.105/mcp','https://machine.ts.net/mcp'])assert.equal(hasPublicHttpsEndpoint(url),false);
 assert.equal(hasPublicHttpsEndpoint(endpoint),true);
 assert.match(platformConnection('claude','http://localhost:3040/mcp','Krafft').instructions[0],/publicly reachable HTTPS/);
});
test('hotel selection exposes hotel capabilities without retail writes',()=>{
 const names=toolsFor(['discover','purchase','updates'],'hotel');assert.equal(names.length,10);assert.ok(names.includes('reserve_demo_stay'));assert.ok(!names.includes('place_demo_order'));
 assert.deepEqual(toolsFor(['discover'],'hotel'),['search_rooms','get_stay_session','update_stay_filters','get_room']);assert.ok(flowsFor('hotel')[0].title);
});
