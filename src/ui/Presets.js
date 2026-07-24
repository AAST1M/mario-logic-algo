/**
 * EZ Logic Pro - Educational Circuit Presets Library
 */

export const PRESETS = [
  {
    id: 'half_adder',
    title: 'Half Adder',
    description: 'Adds two 1-bit binary inputs (A, B) to produce Sum (Σ) and Carry (C).',
    load: (engine) => {
      engine.clear();
      const inA = engine.addComponent('SWITCH', 100, 100, 'Input A');
      const inB = engine.addComponent('SWITCH', 100, 200, 'Input B');

      const xorGate = engine.addComponent('XOR', 280, 100, 'XOR (Sum)');
      const andGate = engine.addComponent('AND', 280, 200, 'AND (Carry)');

      const ledSum = engine.addComponent('LED', 450, 105, 'Sum (Σ)');
      const ledCarry = engine.addComponent('LED', 450, 205, 'Carry (C)');

      // Wires A -> XOR, AND
      engine.addWire(inA.id, inA.outputs[0].id, xorGate.id, xorGate.inputs[0].id);
      engine.addWire(inA.id, inA.outputs[0].id, andGate.id, andGate.inputs[0].id);

      // Wires B -> XOR, AND
      engine.addWire(inB.id, inB.outputs[0].id, xorGate.id, xorGate.inputs[1].id);
      engine.addWire(inB.id, inB.outputs[0].id, andGate.id, andGate.inputs[1].id);

      // Wires -> LEDs
      engine.addWire(xorGate.id, xorGate.outputs[0].id, ledSum.id, ledSum.inputs[0].id);
      engine.addWire(andGate.id, andGate.outputs[0].id, ledCarry.id, ledCarry.inputs[0].id);
    }
  },
  {
    id: 'full_adder',
    title: 'Full Adder',
    description: 'Adds three inputs (A, B, Carry In) to compute Sum and Carry Out.',
    load: (engine) => {
      engine.clear();
      const inA = engine.addComponent('SWITCH', 80, 100, 'A');
      const inB = engine.addComponent('SWITCH', 80, 180, 'B');
      const inCin = engine.addComponent('SWITCH', 80, 260, 'Cin');

      const fullAdderBlock = engine.addComponent('ADDER_FULL', 260, 150, 'Full Adder Block');

      const ledSum = engine.addComponent('LED', 450, 160, 'Sum (Σ)');
      const ledCout = engine.addComponent('LED', 450, 230, 'Cout');

      engine.addWire(inA.id, inA.outputs[0].id, fullAdderBlock.id, fullAdderBlock.inputs[0].id);
      engine.addWire(inB.id, inB.outputs[0].id, fullAdderBlock.id, fullAdderBlock.inputs[1].id);
      engine.addWire(inCin.id, inCin.outputs[0].id, fullAdderBlock.id, fullAdderBlock.inputs[2].id);

      engine.addWire(fullAdderBlock.id, fullAdderBlock.outputs[0].id, ledSum.id, ledSum.inputs[0].id);
      engine.addWire(fullAdderBlock.id, fullAdderBlock.outputs[1].id, ledCout.id, ledCout.inputs[0].id);
    }
  },
  {
    id: 'mux_21',
    title: '2-to-1 Multiplexer',
    description: 'Selects between two data inputs (I0, I1) using a Select signal (S).',
    load: (engine) => {
      engine.clear();
      const i0 = engine.addComponent('SWITCH', 100, 100, 'Data I0');
      const i1 = engine.addComponent('SWITCH', 100, 180, 'Data I1');
      const s = engine.addComponent('SWITCH', 100, 260, 'Select S');

      const muxBlock = engine.addComponent('MUX21', 280, 150, '2:1 MUX');
      const ledY = engine.addComponent('LED', 440, 165, 'Output Y');

      engine.addWire(i0.id, i0.outputs[0].id, muxBlock.id, muxBlock.inputs[0].id);
      engine.addWire(i1.id, i1.outputs[0].id, muxBlock.id, muxBlock.inputs[1].id);
      engine.addWire(s.id, s.outputs[0].id, muxBlock.id, muxBlock.inputs[2].id);
      engine.addWire(muxBlock.id, muxBlock.outputs[0].id, ledY.id, ledY.inputs[0].id);
    }
  },
  {
    id: 'd_flipflop_clock',
    title: 'D Flip-Flop with Clock',
    description: 'Edge-triggered D Flip-Flop storing data state on clock pulses.',
    load: (engine) => {
      engine.clear();
      const inD = engine.addComponent('SWITCH', 100, 120, 'Data D');
      const clk = engine.addComponent('CLOCK', 100, 220, 'Clock Signal');

      const dff = engine.addComponent('D_FLIPFLOP', 280, 150, 'D Flip-Flop');
      const ledQ = engine.addComponent('LED', 450, 155, 'Output Q');
      const ledQBar = engine.addComponent('LED', 450, 225, 'Output Q̅');

      engine.addWire(inD.id, inD.outputs[0].id, dff.id, dff.inputs[0].id);
      engine.addWire(clk.id, clk.outputs[0].id, dff.id, dff.inputs[1].id);
      engine.addWire(dff.id, dff.outputs[0].id, ledQ.id, ledQ.inputs[0].id);
      engine.addWire(dff.id, dff.outputs[1].id, ledQBar.id, ledQBar.inputs[0].id);
    }
  },
  {
    id: 'majority_gate',
    title: '3-Input Majority Gate',
    description: 'Outputs 1 if two or more inputs (A, B, C) are HIGH.',
    load: (engine) => {
      engine.clear();
      const inA = engine.addComponent('SWITCH', 80, 80, 'Input A');
      const inB = engine.addComponent('SWITCH', 80, 180, 'Input B');
      const inC = engine.addComponent('SWITCH', 80, 280, 'Input C');

      const and1 = engine.addComponent('AND', 260, 80, 'AB');
      const and2 = engine.addComponent('AND', 260, 180, 'BC');
      const and3 = engine.addComponent('AND', 260, 280, 'AC');

      const or1 = engine.addComponent('OR', 400, 120, 'OR1');
      const or2 = engine.addComponent('OR', 520, 170, 'Final OR');

      const ledOut = engine.addComponent('LED', 650, 175, 'Majority Output');

      // AB
      engine.addWire(inA.id, inA.outputs[0].id, and1.id, and1.inputs[0].id);
      engine.addWire(inB.id, inB.outputs[0].id, and1.id, and1.inputs[1].id);

      // BC
      engine.addWire(inB.id, inB.outputs[0].id, and2.id, and2.inputs[0].id);
      engine.addWire(inC.id, inC.outputs[0].id, and2.id, and2.inputs[1].id);

      // AC
      engine.addWire(inA.id, inA.outputs[0].id, and3.id, and3.inputs[0].id);
      engine.addWire(inC.id, inC.outputs[0].id, and3.id, and3.inputs[1].id);

      // Combine
      engine.addWire(and1.id, and1.outputs[0].id, or1.id, or1.inputs[0].id);
      engine.addWire(and2.id, and2.outputs[0].id, or1.id, or1.inputs[1].id);

      engine.addWire(or1.id, or1.outputs[0].id, or2.id, or2.inputs[0].id);
      engine.addWire(and3.id, and3.outputs[0].id, or2.id, or2.inputs[1].id);

      engine.addWire(or2.id, or2.outputs[0].id, ledOut.id, ledOut.inputs[0].id);
    }
  }
];
