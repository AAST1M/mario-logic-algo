import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BooleanParser } from '../src/tools/BooleanParser.js';
import { CircuitEngine } from '../src/logic/CircuitEngine.js';

describe('Boolean Algebra Parser & Circuit Generator Suite', () => {

  test('Tokenization of Boolean Algebra Strings', () => {
    const tokens = BooleanParser.tokenize('(A AND B) OR NOT C');
    assert.strictEqual(tokens.length, 8);
    assert.strictEqual(tokens[0].type, 'LPAREN');
    assert.strictEqual(tokens[1].name, 'A');
    assert.strictEqual(tokens[2].type, 'AND');
    assert.strictEqual(tokens[3].name, 'B');
    assert.strictEqual(tokens[4].type, 'RPAREN');
    assert.strictEqual(tokens[5].type, 'OR');
    assert.strictEqual(tokens[6].type, 'NOT');
    assert.strictEqual(tokens[7].name, 'C');
  });

  test('AST Parsing & Circuit Generation', () => {
    const engine = new CircuitEngine();
    const tokens = BooleanParser.tokenize('A AND B');
    const ast = BooleanParser.parse(tokens);

    assert.ok(ast, 'Failed to parse AST');
    assert.strictEqual(ast.type, 'AND');
    assert.strictEqual(ast.left.name, 'A');
    assert.strictEqual(ast.right.name, 'B');

    BooleanParser.buildCircuitFromAST(ast, engine);

    // 2 Inputs (A, B) + 1 AND Gate + 1 LED Output = 4 Components
    assert.strictEqual(engine.components.length, 4);
    assert.strictEqual(engine.wires.length, 3);
  });

  test('AST Evaluation', () => {
    const tokens = BooleanParser.tokenize('(A AND B) OR NOT C');
    const ast = BooleanParser.parse(tokens);

    // A=0, B=0, C=0 => (0 AND 0) OR NOT 0 => 0 OR 1 => 1
    assert.strictEqual(BooleanParser.evaluateAST(ast, { A: 0, B: 0, C: 0 }), 1);

    // A=0, B=0, C=1 => (0 AND 0) OR NOT 1 => 0 OR 0 => 0
    assert.strictEqual(BooleanParser.evaluateAST(ast, { A: 0, B: 0, C: 1 }), 0);

    // A=1, B=1, C=1 => (1 AND 1) OR NOT 1 => 1 OR 0 => 1
    assert.strictEqual(BooleanParser.evaluateAST(ast, { A: 1, B: 1, C: 1 }), 1);
  });
});
