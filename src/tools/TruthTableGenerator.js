/**
 * EZ Logic Pro - Automated Truth Table Analysis Engine
 */

export function generateTruthTable(engine) {
  // 1. Find all active input components (SWITCH, BUTTON, CONST_HIGH, CONST_LOW)
  const inputComps = engine.components.filter(c => ['SWITCH', 'BUTTON', 'CLOCK'].includes(c.type));
  // 2. Find all active output components (LED, PROBE)
  const outputComps = engine.components.filter(c => ['LED', 'PROBE'].includes(c.type));

  if (inputComps.length === 0) {
    return {
      headers: [],
      rows: [],
      message: 'Add at least one input component (Switch or Push Button) to generate truth table.'
    };
  }

  if (outputComps.length === 0) {
    return {
      headers: [],
      rows: [],
      message: 'Add at least one output component (LED or Probe) to evaluate truth table.'
    };
  }

  // Label names for inputs & outputs
  const inputLabels = inputComps.map((c, idx) => c.label || `In_${idx + 1}`);
  const outputLabels = outputComps.map((c, idx) => c.label || `Out_${idx + 1}`);

  // Save current state of inputs to restore afterwards
  const savedState = inputComps.map(c => ({ id: c.id, val: c.state.value }));

  const numInputs = inputComps.length;
  const numRows = Math.pow(2, numInputs);
  const rows = [];

  for (let i = 0; i < numRows; i++) {
    // Set input binary combination
    const inVals = [];
    for (let j = numInputs - 1; j >= 0; j--) {
      const bitVal = (i >> j) & 1;
      inVals.push(bitVal);
    }

    // Apply values to input components
    inputComps.forEach((c, idx) => {
      c.state.value = inVals[idx];
    });

    // Run simulation propagation
    engine.step();

    // Read output values
    const outVals = outputComps.map(c => c.inputs[0]?.value || 0);

    rows.push({
      inputs: inVals,
      outputs: outVals
    });
  }

  // Restore initial state
  inputComps.forEach((c, idx) => {
    c.state.value = savedState[idx].val;
  });
  engine.step();

  return {
    headers: { inputs: inputLabels, outputs: outputLabels },
    rows,
    inputComps,
    outputComps
  };
}
