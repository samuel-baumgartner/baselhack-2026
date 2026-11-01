import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Experience from "./merchant-experience";
import { newState,snapshot } from "../lib/hotel/stay";
test("generated experience renders actual hotel rooms, date inputs and canonical hotel images",()=>{
 const html=renderToStaticMarkup(<Experience state={snapshot(newState())} onAction={async()=>{}}/>);
 assert.equal((html.match(/class="hotel"/g)??[]).length,1);
 assert.match(html,/Double Room River/);assert.match(html,/merchants\/krafft\/river-double.jpg/);assert.match(html,/type="date"/);assert.match(html,/Demo stay/);assert.doesNotMatch(html,/headphones|Galaxus|RetailView/i);
});
