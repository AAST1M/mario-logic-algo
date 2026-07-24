/**
 * EZ Logic Pro - Boolean Expression Lexer, Parser & AST Generator
 */

export class BooleanParser {
  static tokenize(input) {
    let str = input || '';
    const tokens = [];

    let i = 0;
    while (i < str.length) {
      const char = str[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN' });
        i++;
      } else if (char === ')') {
        tokens.push({ type: 'RPAREN' });
        i++;
      } else if (char === '+' || char === '|' || char === '∨') {
        tokens.push({ type: 'OR' });
        i++;
      } else if (char === '*' || char === '&' || char === '∧' || char === '·') {
        tokens.push({ type: 'AND' });
        i++;
      } else if (char === '^' || char === '⊕') {
        tokens.push({ type: 'XOR' });
        i++;
      } else if (char === '!' || char === '~' || char === '¬') {
        tokens.push({ type: 'NOT' });
        i++;
      } else if (char === "'") {
        tokens.push({ type: 'POST_NOT' });
        i++;
      } else if (/[A-Za-z0-9]/.test(char)) {
        // Match word operators (AND, OR, NOT, XOR) or Variable Names
        let name = '';
        while (i < str.length && /[A-Za-z0-9_]/.test(str[i])) {
          name += str[i];
          i++;
        }
        const upper = name.toUpperCase();
        if (upper === 'AND') tokens.push({ type: 'AND' });
        else if (upper === 'OR') tokens.push({ type: 'OR' });
        else if (upper === 'NOT') tokens.push({ type: 'NOT' });
        else if (upper === 'XOR') tokens.push({ type: 'XOR' });
        else tokens.push({ type: 'VAR', name });
      } else {
        i++; // Skip unknown chars
      }
    }

    return tokens;
  }

  static parse(tokens) {
    let index = 0;

    function peek() {
      return tokens[index];
    }

    function consume() {
      return tokens[index++];
    }

    // Grammar:
    // Expression -> OrExpr
    // OrExpr     -> XorExpr ( ( 'OR' ) XorExpr )*
    // XorExpr    -> AndExpr ( ( 'XOR' ) AndExpr )*
    // AndExpr    -> NotExpr ( ( 'AND' | implicit ) NotExpr )*
    // NotExpr    -> 'NOT' Primary | Primary ( " ' " )*
    // Primary    -> VAR | '(' Expression ')'

    function parseExpression() {
      return parseOrExpr();
    }

    function parseOrExpr() {
      let node = parseXorExpr();
      while (peek() && peek().type === 'OR') {
        consume();
        const right = parseXorExpr();
        node = { type: 'OR', left: node, right };
      }
      return node;
    }

    function parseXorExpr() {
      let node = parseAndExpr();
      while (peek() && peek().type === 'XOR') {
        consume();
        const right = parseAndExpr();
        node = { type: 'XOR', left: node, right };
      }
      return node;
    }

    function parseAndExpr() {
      let node = parseNotExpr();
      while (peek() && (peek().type === 'AND' || peek().type === 'LPAREN' || peek().type === 'VAR' || peek().type === 'NOT')) {
        if (peek().type === 'AND') consume();
        const right = parseNotExpr();
        node = { type: 'AND', left: node, right };
      }
      return node;
    }

    function parseNotExpr() {
      if (peek() && peek().type === 'NOT') {
        consume();
        const expr = parseNotExpr();
        return { type: 'NOT', expr };
      }

      let node = parsePrimary();

      while (peek() && peek().type === 'POST_NOT') {
        consume();
        node = { type: 'NOT', expr: node };
      }

      return node;
    }

    function parsePrimary() {
      const tok = peek();
      if (!tok) throw new Error('Unexpected end of expression');

      if (tok.type === 'VAR') {
        consume();
        return { type: 'VAR', name: tok.name };
      }

      if (tok.type === 'LPAREN') {
        consume();
        const expr = parseExpression();
        if (!peek() || peek().type !== 'RPAREN') {
          throw new Error('Missing closing parenthesis )');
        }
        consume();
        return expr;
      }

      throw new Error(`Unexpected token: ${tok.type}`);
    }

    return parseExpression();
  }

  static evaluateAST(ast, env) {
    if (!ast) return 0;
    if (ast.type === 'VAR') return env[ast.name] || 0;
    if (ast.type === 'NOT') return BooleanParser.evaluateAST(ast.expr, env) ? 0 : 1;
    if (ast.type === 'AND') return (BooleanParser.evaluateAST(ast.left, env) && BooleanParser.evaluateAST(ast.right, env)) ? 1 : 0;
    if (ast.type === 'OR') return (BooleanParser.evaluateAST(ast.left, env) || BooleanParser.evaluateAST(ast.right, env)) ? 1 : 0;
    if (ast.type === 'XOR') return (BooleanParser.evaluateAST(ast.left, env) ^ BooleanParser.evaluateAST(ast.right, env)) ? 1 : 0;
    return 0;
  }

  static extractVariables(ast) {
    const vars = new Set();
    function traverse(node) {
      if (!node) return;
      if (node.type === 'VAR') vars.add(node.name);
      if (node.expr) traverse(node.expr);
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    }
    traverse(ast);
    return Array.from(vars).sort();
  }

  static buildCircuitFromAST(ast, engine) {
    engine.clear();
    const vars = BooleanParser.extractVariables(ast);
    if (vars.length === 0) return;

    const startX = 100;
    const startY = 100;

    const inputComps = {};
    vars.forEach((v, idx) => {
      inputComps[v] = engine.addComponent('SWITCH', startX, startY + idx * 80, v);
    });

    let currentX = startX + 180;

    function buildSubCircuit(node, yOffset) {
      if (node.type === 'VAR') {
        return { comp: inputComps[node.name], pinId: inputComps[node.name].outputs[0].id };
      }

      if (node.type === 'NOT') {
        const child = buildSubCircuit(node.expr, yOffset);
        const notComp = engine.addComponent('NOT', currentX, yOffset, 'NOT');
        currentX += 100;
        engine.addWire(child.comp.id, child.pinId, notComp.id, notComp.inputs[0].id);
        return { comp: notComp, pinId: notComp.outputs[0].id };
      }

      if (['AND', 'OR', 'XOR'].includes(node.type)) {
        const left = buildSubCircuit(node.left, yOffset - 30);
        const right = buildSubCircuit(node.right, yOffset + 30);

        const gateComp = engine.addComponent(node.type, currentX, yOffset, node.type);
        currentX += 120;

        engine.addWire(left.comp.id, left.pinId, gateComp.id, gateComp.inputs[0].id);
        engine.addWire(right.comp.id, right.pinId, gateComp.id, gateComp.inputs[1].id);

        return { comp: gateComp, pinId: gateComp.outputs[0].id };
      }

      return null;
    }

    const finalResult = buildSubCircuit(ast, startY + (vars.length * 40));
    if (finalResult) {
      const led = engine.addComponent('LED', currentX + 40, startY + (vars.length * 40), 'Result');
      engine.addWire(finalResult.comp.id, finalResult.pinId, led.id, led.inputs[0].id);
    }
  }
}
