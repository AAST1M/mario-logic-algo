/**
 * EZ Logic Pro - Circuit Engine & Signal Propagation Matrix
 */

import { COMPONENT_SPECS, createComponentInstance } from './Components.js';

export class CircuitEngine {
  constructor() {
    this.components = [];
    this.wires = [];
    this.isPaused = false;
    this.listeners = [];
    this.wireIdCounter = 1;
    this.historyStack = [];
    this.redoStack = [];
    this.lastTickTime = performance.now();
  }

  onChange(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  saveHistory() {
    if (this.historyStack.length > 50) this.historyStack.shift();
    this.historyStack.push(this.exportJSON());
    this.redoStack = [];
  }

  undo() {
    if (this.historyStack.length === 0) return;
    const currentState = this.exportJSON();
    this.redoStack.push(currentState);
    const prevState = this.historyStack.pop();
    this.importJSON(prevState, false);
    this.notify();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentState = this.exportJSON();
    this.historyStack.push(currentState);
    const nextState = this.redoStack.pop();
    this.importJSON(nextState, false);
    this.notify();
  }

  clear() {
    this.saveHistory();
    this.components = [];
    this.wires = [];
    this.notify();
  }

  addComponent(type, x, y, label = '') {
    this.saveHistory();
    const comp = createComponentInstance(type, x, y, label);
    this.components.push(comp);
    this.step();
    this.notify();
    return comp;
  }

  removeComponent(id) {
    this.saveHistory();
    this.components = this.components.filter(c => c.id !== id);
    this.wires = this.wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
    this.step();
    this.notify();
  }

  addWire(fromCompId, fromPinId, toCompId, toPinId) {
    // Check if duplicate wire exists
    const existing = this.wires.find(
      w => w.fromCompId === fromCompId && w.fromPinId === fromPinId &&
           w.toCompId === toCompId && w.toPinId === toPinId
    );
    if (existing) return existing;

    // Remove any previous wire connected to the destination input pin (1 input can only have 1 wire)
    this.saveHistory();
    this.wires = this.wires.filter(w => !(w.toCompId === toCompId && w.toPinId === toPinId));

    const wire = {
      id: `wire_${this.wireIdCounter++}`,
      fromCompId,
      fromPinId,
      toCompId,
      toPinId,
      value: 0
    };
    this.wires.push(wire);
    this.step();
    this.notify();
    return wire;
  }

  removeWire(id) {
    this.saveHistory();
    this.wires = this.wires.filter(w => w.id !== id);
    this.step();
    this.notify();
  }

  getComponent(id) {
    return this.components.find(c => c.id === id);
  }

  getPinAbsolutePos(compId, pinId) {
    const comp = this.getComponent(compId);
    if (!comp) return null;
    let pin = comp.inputs.find(p => p.id === pinId) || comp.outputs.find(p => p.id === pinId);
    if (!pin) return null;
    return {
      x: comp.x + pin.relX,
      y: comp.y + pin.relY,
      value: pin.value
    };
  }

  toggleInputState(compId) {
    const comp = this.getComponent(compId);
    if (!comp) return;
    if (comp.type === 'SWITCH') {
      comp.state.value = comp.state.value ? 0 : 1;
      this.step();
      this.notify();
    }
  }

  setButtonState(compId, isPressed) {
    const comp = this.getComponent(compId);
    if (!comp) return;
    if (comp.type === 'BUTTON') {
      comp.state.value = isPressed ? 1 : 0;
      this.step();
      this.notify();
    }
  }

  step() {
    if (this.isPaused) return;

    const maxIterations = 20;
    let stable = false;

    for (let iter = 0; iter < maxIterations && !stable; iter++) {
      stable = true;

      // 1. Evaluate all components to compute their output pin values
      for (const comp of this.components) {
        const spec = COMPONENT_SPECS[comp.type];
        if (spec && spec.evaluate) {
          spec.evaluate(comp);
        }
      }

      // 2. Propagate values through wires from output pins to input pins
      for (const wire of this.wires) {
        const sourceComp = this.getComponent(wire.fromCompId);
        const destComp = this.getComponent(wire.toCompId);

        if (sourceComp && destComp) {
          const outPin = sourceComp.outputs.find(p => p.id === wire.fromPinId);
          const inPin = destComp.inputs.find(p => p.id === wire.toPinId);

          if (outPin && inPin) {
            wire.value = outPin.value;
            if (inPin.value !== outPin.value) {
              inPin.value = outPin.value;
              stable = false;
            }
          }
        }
      }
    }
  }

  updateClocks(currentTime = performance.now()) {
    const deltaSec = (currentTime - this.lastTickTime) / 1000;
    this.lastTickTime = currentTime;

    let toggled = false;

    for (const comp of this.components) {
      if (comp.type === 'CLOCK') {
        const freq = comp.state.freqHz || 1;
        const halfPeriod = 0.5 / freq;
        comp.state.timer = (comp.state.timer || 0) + deltaSec;

        if (comp.state.timer >= halfPeriod) {
          comp.state.timer %= halfPeriod;
          comp.state.value = comp.state.value ? 0 : 1;
          toggled = true;
        }
      }
    }

    if (toggled && !this.isPaused) {
      this.step();
      this.notify();
    }
  }

  exportJSON() {
    return JSON.stringify({
      version: '1.0',
      components: this.components,
      wires: this.wires
    }, null, 2);
  }

  importJSON(jsonString, saveHistory = true) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (saveHistory) this.saveHistory();
      this.components = data.components || [];
      this.wires = data.wires || [];
      this.step();
      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to import circuit JSON:', e);
      return false;
    }
  }
}
