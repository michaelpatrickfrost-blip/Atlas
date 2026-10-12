import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, it } from 'vitest';

// Forwarded native calls must reach the same guarded server export as browser
// calls. This checks the deployment boundary without executing writers or DBs.
const modules = [
  'src/app/(studio)/design-studio/actions.ts',
  'src/app/(studio)/design-studio/setup/actions.ts',
  'src/app/(studio)/design-studio/dashboards/actions.ts',
  'src/app/(studio)/design-studio/documents/actions.ts',
  'src/app/(app)/screens/actions.ts',
  'src/app/(app)/business-dashboards/actions.ts',
  'src/app/(studio)/design-studio/draft-comparison-actions.ts',
];
it('ships every current guarded Studio forward to its exact server export, preserving alias wrapping', () => {
  const source = ts.createSourceFile('registry.ts', readFileSync('src/server/data-api/action-registry.ts', 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = new Map<string, { module: string; exported: string }>();
  const entries = new Map<string, string>();
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      for (const element of node.importClause.namedBindings.elements) imports.set(element.name.text, { module: node.moduleSpecifier.text, exported: element.propertyName?.text ?? element.name.text });
    }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
      let initializer = node.initializer;
      while (ts.isAsExpression(initializer) || ts.isParenthesizedExpression(initializer)) initializer = initializer.expression;
      if (ts.isIdentifier(initializer)) {
        expect(entries.has(node.name.text), `Duplicate forwarded action ${node.name.text}`).toBe(false);
        entries.set(node.name.text, initializer.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  expect(source.text).toContain('withAdminActionAliases({');
  for (const file of modules) {
    const actionSource = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    expect(actionSource.statements.some(node => ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use server')).toBe(true);
    const exports = actionSource.statements.filter((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && !!node.name && !!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
    expect(exports.length).toBeGreaterThan(0);
    for (const declaration of exports) {
      const name = declaration.name!.text, action = `${file.slice(0, -3)}:${name}`, alias = entries.get(action);
      expect(alias, `Native Studio action missing from released server: ${action}`).toBeDefined();
      expect(imports.get(alias!)).toEqual({ module: `@/${file.slice(4, -3)}`, exported: name });
    }
  }
});
