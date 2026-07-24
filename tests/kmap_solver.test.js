import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { KMapSolver } from '../src/tools/KMapSolver.js';

describe('Karnaugh Map (K-Map) Solver Suite', () => {

  test('2-Variable K-Map (A, B) Minimization', () => {
    const solver = new KMapSolver(2);
    // Minterms for A AND B (m3 = 1)
    solver.setMinterm(3, 1);

    const result = solver.solveSOP();
    assert.ok(result.sop.includes('A') && result.sop.includes('B'), `Expected AB SOP expression, got: ${result.sop}`);
  });

  test('3-Variable K-Map (A, B, C) Minimization', () => {
    const solver = new KMapSolver(3);
    // Minterms 4, 5, 6, 7 => A = 1
    solver.setMinterm(4, 1);
    solver.setMinterm(5, 1);
    solver.setMinterm(6, 1);
    solver.setMinterm(7, 1);

    const result = solver.solveSOP();
    assert.strictEqual(result.sop, 'A', `Expected simplified expression 'A', got: ${result.sop}`);
  });

  test('4-Variable K-Map (A, B, C, D) All Ones', () => {
    const solver = new KMapSolver(4);
    for (let i = 0; i < 16; i++) {
      solver.setMinterm(i, 1);
    }

    const result = solver.solveSOP();
    assert.strictEqual(result.sop, '1', `Expected '1' for all ones K-Map, got: ${result.sop}`);
  });

  test('All Zeros Edge Case', () => {
    const solver = new KMapSolver(4);
    const result = solver.solveSOP();
    assert.strictEqual(result.sop, '0', `Expected '0' for empty K-Map, got: ${result.sop}`);
  });
});
