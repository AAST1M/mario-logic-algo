import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitEngine } from '../src/logic/CircuitEngine.js';
import { generateTruthTable } from '../src/tools/TruthTableGenerator.js';

describe('Truth Table Analysis Suite', () => {

  test('Generate Truth Table for AND Gate (2 Inputs, 1 Output)', () => {
    const engine = new CircuitEngine();
    const swA = engine.addComponent('SWITCH', 0, 0);
    const swB = engine.addComponent('SWITCH', 0, 100);
    const andGate = engine.addComponent('AND', 100, 50);
    const led = engine.addComponent('LED', 200, 50);

    engine.addWire(swA.id, swA.outputs[0].id, andGate.id, andGate.inputs[0].id);
    engine.addWire(swB.id, swB.outputs[0].id, andGate.id, andGate.inputs[1].id);
    engine.addWire(andGate.id, andGate.outputs[0].id, led.id, led.inputs[0].id);

    const result = generateTruthTable(engine);

    assert.ok(result.rows, 'Truth table rows missing');
    assert.strictEqual(result.rows.length, 4, '2 inputs should produce 2^2 = 4 rows');

    // Expected AND combinations:
    // [0, 0] => [0]
    // [0, 1] => [0]
    // [1, 0] => [0]
    // [1, 1] => [1]
    assert.deepStrictEqual(result.rows[0].inputs, [0, 0]);
    assert.deepStrictEqual(result.rows[0].outputs, [0]);

    assert.deepStrictEqual(result.rows[1].inputs, [0, 1]);
    assert.deepStrictEqual(result.rows[1].outputs, [0]);

    assert.deepStrictEqual(result.rows[2].inputs, [1, 0]);
    assert.deepStrictEqual(result.rows[2].outputs, [0]);

    assert.deepStrictEqual(result.rows[3].inputs, [1, 1]);
    assert.deepStrictEqual(result.rows[3].outputs, [1]);
  });

  test('Truth Table Empty Circuit Guard', () => {
    const engine = new CircuitEngine();
    const result = generateTruthTable(engine);
    assert.ok(result.message.includes('Add at least one input component'), 'Expected input component warning message');
  });
});
