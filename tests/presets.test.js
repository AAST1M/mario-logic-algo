import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitEngine } from '../src/logic/CircuitEngine.js';
import { PRESETS } from '../src/ui/Presets.js';

describe('Circuit Presets Validation Suite', () => {

  test('All Presets Load Cleanly without Exceptions', () => {
    assert.ok(PRESETS.length >= 4, 'Expected at least 4 built-in circuit presets');

    PRESETS.forEach(preset => {
      const engine = new CircuitEngine();
      assert.doesNotThrow(() => {
        preset.load(engine);
      }, `Preset "${preset.title}" failed to load`);

      assert.ok(engine.components.length > 0, `Preset "${preset.title}" loaded 0 components`);
    });
  });
});
