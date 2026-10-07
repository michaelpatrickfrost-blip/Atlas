import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Finding } from "../../src/core/guardian/report";

export function filesIn(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? filesIn(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
export function routeFromFile(file: string) {
  return "/" + file.replaceAll("\\", "/").replace(/^.*?src\/app\//, "").replace(/\/(page|route)\.[tj]sx?$/, "").replace(/^(page|route)\.[tj]sx?$/, "").split("/").filter(part => part && !part.startsWith("(") && !part.startsWith("@")).join("/");
}
export function routeMatches(route: string, destination: string) {
  const parts = route.split("/").filter(Boolean);
  const target = destination.split(/[?#]/)[0].replace(/\/$/, "").split("/").filter(Boolean);
  let i = 0;
  for (const part of parts) {
    if (part.startsWith("[[...")) return true;
    if (part.startsWith("[...")) return target.length > i;
    if (i >= target.length || (!part.startsWith("[") && part !== target[i])) return false;
    i++;
  }
  return i === target.length;
}
function attr(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement, name: string) {
  return node.attributes.properties.find((item): item is ts.JsxAttribute => ts.isJsxAttribute(item) && item.name.getText() === name);
}
function literal(node: ts.Node | undefined): string | undefined {
  if (!node) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node)) return literal(node.expression);
}

export function auditSources(root: string) {
  const files = filesIn(path.join(root, "src")).filter(file => /\.[tj]sx?$/.test(file) && !file.includes("/generated/"));
  const routes = files.filter(file => /\/(page|route)\.[tj]sx?$/.test(file)).map(file => ({ path: routeFromFile(file), file: path.relative(root, file), api: /\/route\.[tj]s$/.test(file) }));
  const publicFiles = filesIn(path.join(root, "public")).map(file => "/" + path.relative(path.join(root, "public"), file));
  const findings: Finding[] = [];
  let links = 0, controls = 0, dynamicLinks = 0;
  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const relative = path.relative(root, file);
    function checkLink(destination: string, node: ts.Node) {
      links++;
      if (!destination.startsWith("/") || destination.startsWith("//")) return;
      const clean = destination.split(/[?#]/)[0];
      if (routes.some(route => routeMatches(route.path, clean)) || publicFiles.includes(clean)) return;
      const sourceLocation = `${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      findings.push({ key: `link:${relative}:${destination}`, title: `Link points to a missing page: ${clean}`, kind: "BROKEN_LINK", severity: "HIGH", route: clean, source: sourceLocation, expected: "Every internal navigation destination has a real page or handler.", actual: "No matching App Router page, handler or public asset exists.", steps: [`Open the control defined at ${sourceLocation}.`, `Follow its link to ${clean}.`], evidence: [`Literal destination ${destination}`, "Checked static, dynamic and catch-all routes plus public assets."] });
    }
    function visit(node: ts.Node) {
      if (/\/page\.[tj]sx?$/.test(file) && ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) && node.body?.statements.some(statement => ts.isReturnStatement(statement) && statement.expression?.kind === ts.SyntaxKind.NullKeyword)) {
        const route = routeFromFile(relative);
        findings.push({ key: `empty-page:${relative}`, title: `Page renders nothing: ${route}`, kind: "EMPTY_PAGE", severity: "HIGH", route, source: relative, expected: "An advertised page renders its real workspace or a clear access/unavailable state.", actual: "The default page function returns null. Verify whether the route is reachable; do not present a blank screen as completed functionality.", steps: [`Open ${route} using an authorised profile.`, `Inspect ${relative} and the module registration.`], evidence: ["AST found a direct null return in the default page function."] });
      }
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "href") {
        const destination = literal(node.initializer);
        if (destination !== undefined) checkLink(destination, node); else dynamicLinks++;
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const href = attr(node, "href");
        if (href) { const destination = literal(href.initializer); if (destination !== undefined) checkLink(destination, node); else dynamicLinks++; }
        if (["button", "Button"].includes(node.tagName.getText())) controls++;
        // This is a review candidate, not a claim that delegated handlers cannot exist.
        if (node.tagName.getText() === "button" && literal(attr(node, "type")?.initializer) === "button" && !attr(node, "onClick") && !attr(node, "onMouseDown") && !attr(node, "disabled") && !attr(node, "formAction") && !node.attributes.properties.some(ts.isJsxSpreadAttribute)) {
          const sourceLocation = `${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
          findings.push({ key: `control:${sourceLocation}`, title: "Button needs interaction verification", kind: "CONTROL_REVIEW", severity: "MEDIUM", route: relative.startsWith("src/app/") ? routeFromFile(relative.replace(/\/[^/]+$/, "/page.tsx")) : "/unknown", source: sourceLocation, expected: "An enabled button produces its intended visible result.", actual: "Explicit non-submit button has no local click handler. Check delegated/parent behaviour before treating it as a defect.", steps: [`Inspect ${sourceLocation} and its parent component.`, "Click the button with an authorised test fixture and assert its intended result."], evidence: ["Source heuristic only; not a confirmed dead button."] });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { routes, findings, coverage: { sourceFiles: files.length, routes: routes.filter(route => !route.api).length, staticLinksChecked: links, controlsInventoried: controls, dynamicLinksRequiringBrowserCoverage: dynamicLinks } };
}
