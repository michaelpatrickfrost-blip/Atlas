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

describe("private administration response policy",()=>{
 for(const path of ["/19811171adminlogin","/19811171adminlogin/recovery","/atlas","/atlas/login","/atlas/team","/api/atlas/connections/template"]) it(`prevents indexing and referrer disclosure on ${path}`,()=>{
  const response=proxy(new NextRequest(`https://example.test${path}`));
  expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
 });
 it("does not reveal the private address on the customer login",()=>{
  const response=proxy(new NextRequest("https://example.test/login"));
  expect([...response.headers.values()].join(" ")).not.toContain("19811171adminlogin");
 });
});
