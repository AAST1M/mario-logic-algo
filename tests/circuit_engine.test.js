import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitEngine } from '../src/logic/CircuitEngine.js';
import { COMPONENT_SPECS } from '../src/logic/Components.js';

describe('CircuitEngine & Component Logic', () => {

  test('Component Creation for all Specs', () => {
    const engine = new CircuitEngine();
    Object.keys(COMPONENT_SPECS).forEach(type => {
      const comp = engine.addComponent(type, 100, 100);
      assert.ok(comp, `Failed to create component ${type}`);
      assert.strictEqual(comp.type, type);
      assert.ok(comp.id.startsWith(type.toLowerCase()), `ID format invalid: ${comp.id}`);
    });
    assert.strictEqual(engine.components.length, Object.keys(COMPONENT_SPECS).length);
  });

  test('AND Gate Signal Evaluation', () => {
    const engine = new CircuitEngine();
    const sw1 = engine.addComponent('SWITCH', 0, 0);
    const sw2 = engine.addComponent('SWITCH', 0, 100);
    const andGate = engine.addComponent('AND', 100, 50);
    const led = engine.addComponent('LED', 200, 50);

    // Connect wires
    engine.addWire(sw1.id, sw1.outputs[0].id, andGate.id, andGate.inputs[0].id);
    engine.addWire(sw2.id, sw2.outputs[0].id, andGate.id, andGate.inputs[1].id);
    engine.addWire(andGate.id, andGate.outputs[0].id, led.id, led.inputs[0].id);

    // Initial: 0 AND 0 => 0
    engine.step();
    assert.strictEqual(led.inputs[0].value, 0);

    // 1 AND 0 => 0
    engine.toggleInputState(sw1.id);
    engine.step();
    assert.strictEqual(led.inputs[0].value, 0);

    // 1 AND 1 => 1
    engine.toggleInputState(sw2.id);
    engine.step();
    assert.strictEqual(led.inputs[0].value, 1);
  });

  test('OR Gate Signal Evaluation', () => {
    const engine = new CircuitEngine();
    const sw1 = engine.addComponent('SWITCH', 0, 0);
    const sw2 = engine.addComponent('SWITCH', 0, 100);
    const orGate = engine.addComponent('OR', 100, 50);
    const led = engine.addComponent('LED', 200, 50);

    engine.addWire(sw1.id, sw1.outputs[0].id, orGate.id, orGate.inputs[0].id);
    engine.addWire(sw2.id, sw2.outputs[0].id, orGate.id, orGate.inputs[1].id);
    engine.addWire(orGate.id, orGate.outputs[0].id, led.id, led.inputs[0].id);

    engine.step();
    assert.strictEqual(led.inputs[0].value, 0);

    engine.toggleInputState(sw1.id); // 1 OR 0 => 1
    engine.step();
    assert.strictEqual(led.inputs[0].value, 1);
  });

  test('NOT Gate Inversion Evaluation', () => {
    const engine = new CircuitEngine();
    const sw = engine.addComponent('SWITCH', 0, 0);
    const notGate = engine.addComponent('NOT', 100, 0);
    const led = engine.addComponent('LED', 200, 0);

    engine.addWire(sw.id, sw.outputs[0].id, notGate.id, notGate.inputs[0].id);
    engine.addWire(notGate.id, notGate.outputs[0].id, led.id, led.inputs[0].id);

    // 0 inverted => 1
    engine.step();
    assert.strictEqual(led.inputs[0].value, 1);

    // 1 inverted => 0
    engine.toggleInputState(sw.id);
    engine.step();
    assert.strictEqual(led.inputs[0].value, 0);
  });

  test('Half Adder Circuit (XOR + AND)', () => {
    const engine = new CircuitEngine();
    const swA = engine.addComponent('SWITCH', 0, 0);
    const swB = engine.addComponent('SWITCH', 0, 100);
    const xorGate = engine.addComponent('XOR', 150, 20);
    const andGate = engine.addComponent('AND', 150, 100);
    const sumLed = engine.addComponent('LED', 300, 20);
    const carryLed = engine.addComponent('LED', 300, 100);

    engine.addWire(swA.id, swA.outputs[0].id, xorGate.id, xorGate.inputs[0].id);
    engine.addWire(swB.id, swB.outputs[0].id, xorGate.id, xorGate.inputs[1].id);
    engine.addWire(swA.id, swA.outputs[0].id, andGate.id, andGate.inputs[0].id);
    engine.addWire(swB.id, swB.outputs[0].id, andGate.id, andGate.inputs[1].id);

    engine.addWire(xorGate.id, xorGate.outputs[0].id, sumLed.id, sumLed.inputs[0].id);
    engine.addWire(andGate.id, andGate.outputs[0].id, carryLed.id, carryLed.inputs[0].id);

    // 0 + 0 => Sum=0, Carry=0
    engine.step();
    assert.strictEqual(sumLed.inputs[0].value, 0);
    assert.strictEqual(carryLed.inputs[0].value, 0);

    // 1 + 0 => Sum=1, Carry=0
    engine.toggleInputState(swA.id);
    engine.step();
    assert.strictEqual(sumLed.inputs[0].value, 1);
    assert.strictEqual(carryLed.inputs[0].value, 0);

    // 1 + 1 => Sum=0, Carry=1
    engine.toggleInputState(swB.id);
    engine.step();
    assert.strictEqual(sumLed.inputs[0].value, 0);
    assert.strictEqual(carryLed.inputs[0].value, 1);
  });

  test('Undo / Redo Functionality', () => {
    const engine = new CircuitEngine();
    assert.strictEqual(engine.components.length, 0);

    engine.addComponent('SWITCH', 0, 0);
    assert.strictEqual(engine.components.length, 1);

    engine.undo();
    assert.strictEqual(engine.components.length, 0);

    engine.redo();
    assert.strictEqual(engine.components.length, 1);
  });

  test('JSON Export and Import', () => {
    const engine = new CircuitEngine();
    const sw = engine.addComponent('SWITCH', 50, 50);
    const led = engine.addComponent('LED', 200, 50);
    engine.addWire(sw.id, sw.outputs[0].id, led.id, led.inputs[0].id);

    const json = engine.exportJSON();
    assert.ok(json, 'Export JSON returned empty data');

    const newEngine = new CircuitEngine();
    newEngine.importJSON(json);

    assert.strictEqual(newEngine.components.length, 2);
    assert.strictEqual(newEngine.wires.length, 1);
  });
});
