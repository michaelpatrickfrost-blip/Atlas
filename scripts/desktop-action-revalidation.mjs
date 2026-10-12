import ts from 'typescript';

/** Resolve only direct calls in this exact source snapshot. No filesystem,
 * imported helper traversal or application code executes during classification.
 * Symbol identity prevents parameters/block locals from masquerading as refresh.
 * @param {import('typescript').SourceFile} source
 * @returns {ReadonlyMap<string, boolean>}
 */
export function desktopActionRevalidation(source) {
  const program = ts.createProgram([source.fileName], { noLib: true, noResolve: true }, {
    getSourceFile: name => name === source.fileName ? source : undefined,
    getDefaultLibFileName: () => '', writeFile: () => {}, getCurrentDirectory: () => '',
    getDirectories: () => [], fileExists: name => name === source.fileName,
    readFile: name => name === source.fileName ? source.text : undefined,
    getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  });
  const checker = program.getTypeChecker();
  /** @type {Set<import('typescript').Symbol>} */
  const refreshImports = new Set();
  /** @type {Map<import('typescript').Symbol, import('typescript').Node>} */
  const helpers = new Map();
  /** @type {Map<string, import('typescript').Node>} */
  const actions = new Map();
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)
      && statement.moduleSpecifier.text === 'next/cache' && !statement.importClause?.isTypeOnly) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
        if (binding.isTypeOnly || (binding.propertyName ?? binding.name).text !== 'revalidatePath') continue;
        const symbol = checker.getSymbolAtLocation(binding.name);
        if (symbol) refreshImports.add(symbol);
      }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
      const symbol = checker.getSymbolAtLocation(statement.name);
      if (symbol) helpers.set(symbol, statement.body);
      actions.set(statement.name.text, statement.body);
    } else if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer
          || !(ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) continue;
        const symbol = checker.getSymbolAtLocation(declaration.name);
        if (symbol) helpers.set(symbol, declaration.initializer.body);
      }
    }
  }
  /** @param {import('typescript').Node} body
   * @param {Set<import('typescript').Symbol>} visited */
  const reachesRefresh = (body, visited) => {
    let found = false;
    /** @param {import('typescript').Node} node */
    const walk = node => {
      if (found) return;
      // A declared local helper is not invoked merely by declaring it. Inline
      // callback arguments remain traversed, preserving direct callback refresh.
      if (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)
        && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) return;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const symbol = checker.getSymbolAtLocation(node.expression);
        if (symbol && refreshImports.has(symbol)) { found = true; return; }
        const helper = symbol && helpers.get(symbol);
        if (symbol && helper && !visited.has(symbol)) {
          const next = new Set(visited); next.add(symbol);
          if (reachesRefresh(helper, next)) { found = true; return; }
        }
      }
      ts.forEachChild(node, walk);
    };
    walk(body);
    return found;
  };
  return new Map([...actions].map(([name, body]) => [name, reachesRefresh(body, new Set())]));
}
