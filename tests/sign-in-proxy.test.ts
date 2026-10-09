import {describe,it,expect} from "vitest";
import {NextRequest} from "next/server";
import {proxy,config} from "@/proxy";
describe("trusted sign-in routing hint",()=>{
 for(const path of ["/business/first/login","/api/desktop/action"]) it(`overwrites a forged request hint on ${path}`,()=>{
  const response=proxy(new NextRequest(`https://example.test${path}`,{headers:{"x-atlas-request-path":"/business/second/login",cookie:"atlas_session=signed"}}));
  expect(response.headers.get("x-middleware-request-x-atlas-request-path")).toBe(path);
  expect(response.headers.get("x-middleware-request-cookie")).toBe("atlas_session=signed");
  expect(new RegExp(`^${config.matcher[0]}$`).test(path)).toBe(true);
 });
});
