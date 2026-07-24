/**
 * EZ Logic Pro - Component Definitions & Metadata
 */

export const COMPONENT_CATEGORIES = [
  {
    id: 'inputs',
    name: 'Inputs',
    icon: 'toggle-right',
    items: ['SWITCH', 'BUTTON', 'CLOCK', 'CONST_HIGH', 'CONST_LOW']
  },
  {
    id: 'gates',
    name: 'Logic Gates',
    icon: 'cpu',
    items: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER']
  },
  {
    id: 'outputs',
    name: 'Outputs & Displays',
    icon: 'lightbulb',
    items: ['LED', 'PROBE', 'HEX_DISPLAY', 'SEGMENT7']
  },
  {
    id: 'combinational',
    name: 'Combinational',
    icon: 'layers',
    items: ['MUX21', 'DEMUX12', 'ADDER_HALF', 'ADDER_FULL', 'DECODER24']
  },
  {
    id: 'sequential',
    name: 'Sequential / Latches',
    icon: 'clock',
    items: ['SR_LATCH', 'D_FLIPFLOP', 'JK_FLIPFLOP', 'T_FLIPFLOP']
  }
];

export const COMPONENT_SPECS = {
  // --- INPUTS ---
  SWITCH: {
    name: 'Switch',
    category: 'inputs',
    width: 60,
    height: 50,
    inputs: [],
    outputs: [{ id: 'out', name: 'Y', relX: 60, relY: 25 }],
    defaultState: { value: 0 },
    evaluate: (comp) => {
      comp.outputs[0].value = comp.state.value ? 1 : 0;
    }
  },
  BUTTON: {
    name: 'Push Button',
    category: 'inputs',
    width: 60,
    height: 50,
    inputs: [],
    outputs: [{ id: 'out', name: 'Y', relX: 60, relY: 25 }],
    defaultState: { value: 0 },
    evaluate: (comp) => {
      comp.outputs[0].value = comp.state.value ? 1 : 0;
    }
  },
  CLOCK: {
    name: 'Clock Signal',
    category: 'inputs',
    width: 70,
    height: 50,
    inputs: [],
    outputs: [{ id: 'out', name: 'CLK', relX: 70, relY: 25 }],
    defaultState: { value: 0, freqHz: 1, lastToggle: 0 },
    evaluate: (comp) => {
      comp.outputs[0].value = comp.state.value ? 1 : 0;
    }
  },
  CONST_HIGH: {
    name: 'Constant 1',
    category: 'inputs',
    width: 50,
    height: 40,
    inputs: [],
    outputs: [{ id: 'out', name: '1', relX: 50, relY: 20 }],
    defaultState: {},
    evaluate: (comp) => {
      comp.outputs[0].value = 1;
    }
  },
  CONST_LOW: {
    name: 'Constant 0',
    category: 'inputs',
    width: 50,
    height: 40,
    inputs: [],
    outputs: [{ id: 'out', name: '0', relX: 50, relY: 20 }],
    defaultState: {},
    evaluate: (comp) => {
      comp.outputs[0].value = 0;
    }
  },

  // --- LOGIC GATES ---
  AND: {
    name: 'AND Gate',
    category: 'gates',
    width: 80,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 80, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = (a && b) ? 1 : 0;
    }
  },
  OR: {
    name: 'OR Gate',
    category: 'gates',
    width: 80,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 80, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = (a || b) ? 1 : 0;
    }
  },
  NOT: {
    name: 'NOT Gate',
    category: 'gates',
    width: 70,
    height: 50,
    inputs: [{ id: 'in0', name: 'A', relX: 0, relY: 25 }],
    outputs: [{ id: 'out', name: 'Y', relX: 70, relY: 25 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      comp.outputs[0].value = a ? 0 : 1;
    }
  },
  NAND: {
    name: 'NAND Gate',
    category: 'gates',
    width: 85,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 85, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = !(a && b) ? 1 : 0;
    }
  },
  NOR: {
    name: 'NOR Gate',
    category: 'gates',
    width: 85,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 85, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = !(a || b) ? 1 : 0;
    }
  },
  XOR: {
    name: 'XOR Gate',
    category: 'gates',
    width: 85,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 85, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = (a ^ b) ? 1 : 0;
    }
  },
  XNOR: {
    name: 'XNOR Gate',
    category: 'gates',
    width: 90,
    height: 60,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 42 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 90, relY: 30 }],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = !(a ^ b) ? 1 : 0;
    }
  },
  BUFFER: {
    name: 'Buffer',
    category: 'gates',
    width: 60,
    height: 50,
    inputs: [{ id: 'in0', name: 'A', relX: 0, relY: 25 }],
    outputs: [{ id: 'out', name: 'Y', relX: 60, relY: 25 }],
    evaluate: (comp) => {
      comp.outputs[0].value = comp.inputs[0].value || 0;
    }
  },

  // --- OUTPUTS ---
  LED: {
    name: 'LED Output',
    category: 'outputs',
    width: 50,
    height: 50,
    inputs: [{ id: 'in0', name: 'IN', relX: 0, relY: 25 }],
    outputs: [],
    defaultState: { color: '#10b981' },
    evaluate: () => {}
  },
  PROBE: {
    name: 'Logic Probe',
    category: 'outputs',
    width: 50,
    height: 40,
    inputs: [{ id: 'in0', name: 'IN', relX: 0, relY: 20 }],
    outputs: [],
    evaluate: () => {}
  },
  HEX_DISPLAY: {
    name: '4-Bit Hex Display',
    category: 'outputs',
    width: 70,
    height: 85,
    inputs: [
      { id: 'in0', name: 'D0', relX: 0, relY: 15 },
      { id: 'in1', name: 'D1', relX: 0, relY: 33 },
      { id: 'in2', name: 'D2', relX: 0, relY: 51 },
      { id: 'in3', name: 'D3', relX: 0, relY: 69 }
    ],
    outputs: [],
    evaluate: () => {}
  },
  SEGMENT7: {
    name: '7-Segment Display',
    category: 'outputs',
    width: 80,
    height: 100,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 15 },
      { id: 'in1', name: 'B', relX: 0, relY: 30 },
      { id: 'in2', name: 'C', relX: 0, relY: 45 },
      { id: 'in3', name: 'D', relX: 0, relY: 60 }
    ],
    outputs: [],
    evaluate: () => {}
  },

  // --- COMBINATIONAL ---
  MUX21: {
    name: '2:1 MUX',
    category: 'combinational',
    width: 80,
    height: 70,
    inputs: [
      { id: 'in0', name: 'I0', relX: 0, relY: 18 },
      { id: 'in1', name: 'I1', relX: 0, relY: 38 },
      { id: 'sel', name: 'S', relX: 40, relY: 70 }
    ],
    outputs: [{ id: 'out', name: 'Y', relX: 80, relY: 28 }],
    evaluate: (comp) => {
      const i0 = comp.inputs[0].value || 0;
      const i1 = comp.inputs[1].value || 0;
      const s = comp.inputs[2].value || 0;
      comp.outputs[0].value = s ? i1 : i0;
    }
  },
  DEMUX12: {
    name: '1:2 DEMUX',
    category: 'combinational',
    width: 80,
    height: 70,
    inputs: [
      { id: 'in0', name: 'IN', relX: 0, relY: 28 },
      { id: 'sel', name: 'S', relX: 40, relY: 70 }
    ],
    outputs: [
      { id: 'out0', name: 'Y0', relX: 80, relY: 18 },
      { id: 'out1', name: 'Y1', relX: 80, relY: 38 }
    ],
    evaluate: (comp) => {
      const val = comp.inputs[0].value || 0;
      const s = comp.inputs[1].value || 0;
      comp.outputs[0].value = !s ? val : 0;
      comp.outputs[1].value = s ? val : 0;
    }
  },
  ADDER_HALF: {
    name: 'Half Adder',
    category: 'combinational',
    width: 90,
    height: 65,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 20 },
      { id: 'in1', name: 'B', relX: 0, relY: 45 }
    ],
    outputs: [
      { id: 'out0', name: 'Σ', relX: 90, relY: 20 },
      { id: 'out1', name: 'C', relX: 90, relY: 45 }
    ],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      comp.outputs[0].value = (a ^ b) ? 1 : 0;
      comp.outputs[1].value = (a && b) ? 1 : 0;
    }
  },
  ADDER_FULL: {
    name: 'Full Adder',
    category: 'combinational',
    width: 100,
    height: 75,
    inputs: [
      { id: 'in0', name: 'A', relX: 0, relY: 18 },
      { id: 'in1', name: 'B', relX: 0, relY: 38 },
      { id: 'in2', name: 'Cin', relX: 0, relY: 58 }
    ],
    outputs: [
      { id: 'out0', name: 'Σ', relX: 100, relY: 25 },
      { id: 'out1', name: 'Cout', relX: 100, relY: 50 }
    ],
    evaluate: (comp) => {
      const a = comp.inputs[0].value || 0;
      const b = comp.inputs[1].value || 0;
      const cin = comp.inputs[2].value || 0;
      comp.outputs[0].value = (a ^ b ^ cin) ? 1 : 0;
      comp.outputs[1].value = ((a && b) || (cin && (a ^ b))) ? 1 : 0;
    }
  },
  DECODER24: {
    name: '2:4 Decoder',
    category: 'combinational',
    width: 95,
    height: 90,
    inputs: [
      { id: 'in0', name: 'A0', relX: 0, relY: 25 },
      { id: 'in1', name: 'A1', relX: 0, relY: 65 }
    ],
    outputs: [
      { id: 'out0', name: 'Y0', relX: 95, relY: 15 },
      { id: 'out1', name: 'Y1', relX: 95, relY: 35 },
      { id: 'out2', name: 'Y2', relX: 95, relY: 55 },
      { id: 'out3', name: 'Y3', relX: 95, relY: 75 }
    ],
    evaluate: (comp) => {
      const a0 = comp.inputs[0].value || 0;
      const a1 = comp.inputs[1].value || 0;
      const sel = (a1 << 1) | a0;
      comp.outputs[0].value = sel === 0 ? 1 : 0;
      comp.outputs[1].value = sel === 1 ? 1 : 0;
      comp.outputs[2].value = sel === 2 ? 1 : 0;
      comp.outputs[3].value = sel === 3 ? 1 : 0;
    }
  },

  // --- SEQUENTIAL ---
  SR_LATCH: {
    name: 'SR Latch',
    category: 'sequential',
    width: 90,
    height: 70,
    inputs: [
      { id: 'in0', name: 'S', relX: 0, relY: 20 },
      { id: 'in1', name: 'R', relX: 0, relY: 50 }
    ],
    outputs: [
      { id: 'out0', name: 'Q', relX: 90, relY: 20 },
      { id: 'out1', name: 'Q̅', relX: 90, relY: 50 }
    ],
    defaultState: { q: 0 },
    evaluate: (comp) => {
      const s = comp.inputs[0].value || 0;
      const r = comp.inputs[1].value || 0;
      if (s && !r) {
        comp.state.q = 1;
      } else if (!s && r) {
        comp.state.q = 0;
      }
      // If S=1 and R=1 -> invalid, both 0
      if (s && r) {
        comp.outputs[0].value = 0;
        comp.outputs[1].value = 0;
      } else {
        comp.outputs[0].value = comp.state.q;
        comp.outputs[1].value = comp.state.q ? 0 : 1;
      }
    }
  },
  D_FLIPFLOP: {
    name: 'D Flip-Flop',
    category: 'sequential',
    width: 95,
    height: 75,
    inputs: [
      { id: 'in0', name: 'D', relX: 0, relY: 22 },
      { id: 'clk', name: 'CLK', relX: 0, relY: 52 }
    ],
    outputs: [
      { id: 'out0', name: 'Q', relX: 95, relY: 22 },
      { id: 'out1', name: 'Q̅', relX: 95, relY: 52 }
    ],
    defaultState: { q: 0, prevClk: 0 },
    evaluate: (comp) => {
      const d = comp.inputs[0].value || 0;
      const clk = comp.inputs[1].value || 0;
      // Rising edge trigger
      if (clk && !comp.state.prevClk) {
        comp.state.q = d ? 1 : 0;
      }
      comp.state.prevClk = clk;
      comp.outputs[0].value = comp.state.q;
      comp.outputs[1].value = comp.state.q ? 0 : 1;
    }
  },
  JK_FLIPFLOP: {
    name: 'JK Flip-Flop',
    category: 'sequential',
    width: 95,
    height: 80,
    inputs: [
      { id: 'in0', name: 'J', relX: 0, relY: 18 },
      { id: 'clk', name: 'CLK', relX: 0, relY: 40 },
      { id: 'in1', name: 'K', relX: 0, relY: 62 }
    ],
    outputs: [
      { id: 'out0', name: 'Q', relX: 95, relY: 22 },
      { id: 'out1', name: 'Q̅', relX: 95, relY: 58 }
    ],
    defaultState: { q: 0, prevClk: 0 },
    evaluate: (comp) => {
      const j = comp.inputs[0].value || 0;
      const clk = comp.inputs[1].value || 0;
      const k = comp.inputs[2].value || 0;
      if (clk && !comp.state.prevClk) {
        if (j && !k) comp.state.q = 1;
        else if (!j && k) comp.state.q = 0;
        else if (j && k) comp.state.q = comp.state.q ? 0 : 1; // Toggle
      }
      comp.state.prevClk = clk;
      comp.outputs[0].value = comp.state.q;
      comp.outputs[1].value = comp.state.q ? 0 : 1;
    }
  },
  T_FLIPFLOP: {
    name: 'T Flip-Flop',
    category: 'sequential',
    width: 95,
    height: 75,
    inputs: [
      { id: 'in0', name: 'T', relX: 0, relY: 22 },
      { id: 'clk', name: 'CLK', relX: 0, relY: 52 }
    ],
    outputs: [
      { id: 'out0', name: 'Q', relX: 95, relY: 22 },
      { id: 'out1', name: 'Q̅', relX: 95, relY: 52 }
    ],
    defaultState: { q: 0, prevClk: 0 },
    evaluate: (comp) => {
      const t = comp.inputs[0].value || 0;
      const clk = comp.inputs[1].value || 0;
      if (clk && !comp.state.prevClk) {
        if (t) comp.state.q = comp.state.q ? 0 : 1;
      }
      comp.state.prevClk = clk;
      comp.outputs[0].value = comp.state.q;
      comp.outputs[1].value = comp.state.q ? 0 : 1;
    }
  }
};

let nextComponentId = 1;

export function createComponentInstance(type, x, y, label = '') {
  const spec = COMPONENT_SPECS[type];
  if (!spec) throw new Error(`Unknown component type: ${type}`);

  const id = `${type.toLowerCase()}_${nextComponentId++}`;
  
  const inputs = spec.inputs.map((pinSpec, idx) => ({
    id: `${id}_in_${idx}`,
    name: pinSpec.name,
    relX: pinSpec.relX,
    relY: pinSpec.relY,
    value: 0
  }));

  const outputs = spec.outputs.map((pinSpec, idx) => ({
    id: `${id}_out_${idx}`,
    name: pinSpec.name,
    relX: pinSpec.relX,
    relY: pinSpec.relY,
    value: 0
  }));

  return {
    id,
    type,
    label: label || spec.name,
    x,
    y,
    width: spec.width,
    height: spec.height,
    inputs,
    outputs,
    state: JSON.parse(JSON.stringify(spec.defaultState || {}))
  };
}
