import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const origin=process.env.CHECK_ORIGIN??'https://galaxus.prism.mvps.ch';
const client=new Client({name:'embedded-image-regression',version:'1.0'});
await client.connect(new StreamableHTTPClientTransport(new URL('/mcp',origin)));
try{
 const result=await client.callTool({name:'search_products',arguments:{}});
 const state=result.structuredContent.state;
 const resources=await client.listResources();
 const resource=await client.readResource({uri:resources.resources[0].uri});
 const html=resource.contents.find(c=>'text'in c).text;
 const logo=state.merchant.logo;
 assert.ok(html.includes('galaxus-widget.js'),'Actual MCP resource serves the standalone React widget');
 assert.ok(logo,'Logo is present in the canonical tool state');
 const assets=[logo,...state.allProducts.map(p=>p.image)];
 const failures=[];
 for(const asset of assets){
  // A host may strip/replace <base>. DOM images must still resolve to the merchant origin.
  const resolved=new URL(asset,'https://chatgpt.com/aip/widget');
  if(resolved.origin!==origin)failures.push(`${asset} resolves to ${resolved.origin}`);
 }
 console.log(JSON.stringify({resource:resources.resources[0].uri,assetCount:assets.length,failures},null,2));
 assert.deepEqual(failures,[],'Embedded assets must not depend on the host document base URL');
 for(const asset of assets){const response=await fetch(asset);assert.equal(response.status,200,asset);assert.ok(response.headers.get('content-type')?.startsWith('image/'),asset);await response.arrayBuffer();}
 console.log(`PASS: ${assets.length} embedded image URLs resolve and load independently of the host origin`);
}finally{await client.close();}
