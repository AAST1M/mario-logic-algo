/**
 * EZ Logic Pro - Karnaugh Map (K-Map) Solver & Minimizer Engine
 */

export class KMapSolver {
  constructor(numVars = 4) {
    this.numVars = numVars; // 2, 3, or 4
    this.varNames = ['A', 'B', 'C', 'D'].slice(0, numVars);
    this.minterms = new Array(Math.pow(2, numVars)).fill(0); // 0, 1, or 'X'
  }

  setNumVars(num) {
    this.numVars = num;
    this.varNames = ['A', 'B', 'C', 'D'].slice(0, num);
    this.minterms = new Array(Math.pow(2, num)).fill(0);
  }

  setMinterm(index, value) {
    this.minterms[index] = value;
  }

  toggleMinterm(index) {
    const curr = this.minterms[index];
    if (curr === 0) this.minterms[index] = 1;
    else if (curr === 1) this.minterms[index] = 'X';
    else this.minterms[index] = 0;
  }

  getGridMapping() {
    if (this.numVars === 2) {
      // 2x2 grid: A (row 0,1), B (col 0,1)
      return {
        rowVars: ['A'],
        colVars: ['B'],
        rowLabels: ['0', '1'],
        colLabels: ['0', '1'],
        map: [
          [0, 1], // A=0: B=0(m0), B=1(m1)
          [2, 3]  // A=1: B=0(m2), B=1(m3)
        ]
      };
    } else if (this.numVars === 3) {
      // 2x4 grid: A (row 0,1), BC (col 00, 01, 11, 10)
      return {
        rowVars: ['A'],
        colVars: ['B', 'C'],
        rowLabels: ['0', '1'],
        colLabels: ['00', '01', '11', '10'],
        map: [
          [0, 1, 3, 2], // A=0
          [4, 5, 7, 6]  // A=1
        ]
      };
    } else {
      // 4x4 grid: AB (row 00, 01, 11, 10), CD (col 00, 01, 11, 10)
      return {
        rowVars: ['A', 'B'],
        colVars: ['C', 'D'],
        rowLabels: ['00', '01', '11', '10'],
        colLabels: ['00', '01', '11', '10'],
        map: [
          [0,  1,  3,  2],
          [4,  5,  7,  6],
          [12, 13, 15, 14],
          [8,  9,  11, 10]
        ]
      };
    }
  }

  solveSOP() {
    const ones = [];
    const dontCares = [];

    this.minterms.forEach((val, idx) => {
      if (val === 1) ones.push(idx);
      else if (val === 'X') dontCares.push(idx);
    });

    if (ones.length === 0) return { sop: '0', groups: [] };
    if (ones.length + dontCares.length === Math.pow(2, this.numVars)) return { sop: '1', groups: [] };

    // Find prime implicants
    const primeImplicants = this.findPrimeImplicants(ones.concat(dontCares));
    const essential = this.findEssentialPrimeImplicants(primeImplicants, ones);

    // Build SOP string
    const terms = essential.map(pi => this.implicantToString(pi));
    return {
      sop: terms.join(' + ') || '0',
      groups: essential
    };
  }

  findPrimeImplicants(mintermIndices) {
    const numBits = this.numVars;
    let groups = {};

    // Group by number of 1s
    mintermIndices.forEach(idx => {
      const bin = idx.toString(2).padStart(numBits, '0');
      const onesCount = (bin.match(/1/g) || []).length;
      if (!groups[onesCount]) groups[onesCount] = [];
      groups[onesCount].push({ binary: bin, minterms: [idx], used: false });
    });

    const primeImplicants = [];

    while (Object.keys(groups).length > 0) {
      const nextGroups = {};
      const sortedKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
      let combinedAny = false;

      for (let i = 0; i < sortedKeys.length - 1; i++) {
        const key1 = sortedKeys[i];
        const key2 = sortedKeys[i + 1];
        if (key2 !== key1 + 1) continue;

        const list1 = groups[key1];
        const list2 = groups[key2];

        for (const item1 of list1) {
          for (const item2 of list2) {
            const diffIndex = this.getSingleBitDiff(item1.binary, item2.binary);
            if (diffIndex !== -1) {
              item1.used = true;
              item2.used = true;
              combinedAny = true;

              const combinedBin = item1.binary.substring(0, diffIndex) + '-' + item1.binary.substring(diffIndex + 1);
              const combinedMinterms = Array.from(new Set([...item1.minterms, ...item2.minterms])).sort((a, b) => a - b);

              const countOnes = (combinedBin.match(/1/g) || []).length;
              if (!nextGroups[countOnes]) nextGroups[countOnes] = [];

              // Avoid duplicate combined terms
              if (!nextGroups[countOnes].some(x => x.binary === combinedBin)) {
                nextGroups[countOnes].push({ binary: combinedBin, minterms: combinedMinterms, used: false });
              }
            }
          }
        }
      }

      // Collect unused items as prime implicants
      for (const key in groups) {
        for (const item of groups[key]) {
          if (!item.used && !primeImplicants.some(pi => pi.binary === item.binary)) {
            primeImplicants.push(item);
          }
        }
      }

      if (!combinedAny) break;
      groups = nextGroups;
    }

    return primeImplicants;
  }

  getSingleBitDiff(bin1, bin2) {
    let diffIndex = -1;
    for (let i = 0; i < bin1.length; i++) {
      if (bin1[i] !== bin2[i]) {
        if (diffIndex !== -1) return -1;
        diffIndex = i;
      }
    }
    return diffIndex;
  }

  findEssentialPrimeImplicants(primeImplicants, ones) {
    // Greedy set cover for simplicity and fast performance
    const uncoveredOnes = new Set(ones);
    const essential = [];

    while (uncoveredOnes.size > 0 && primeImplicants.length > 0) {
      // Find PI covering most uncovered ones
      let bestPI = null;
      let maxCovered = -1;

      for (const pi of primeImplicants) {
        const covered = pi.minterms.filter(m => uncoveredOnes.has(m)).length;
        if (covered > maxCovered) {
          maxCovered = covered;
          bestPI = pi;
        }
      }

      if (!bestPI || maxCovered === 0) break;

      essential.push(bestPI);
      bestPI.minterms.forEach(m => uncoveredOnes.delete(m));
      primeImplicants = primeImplicants.filter(pi => pi !== bestPI);
    }

    return essential;
  }

  implicantToString(implicant) {
    const bin = implicant.binary;
    let str = '';
    for (let i = 0; i < bin.length; i++) {
      const char = bin[i];
      const varName = this.varNames[i];
      if (char === '1') str += varName;
      else if (char === '0') str += varName + "'";
    }
    return str || '1';
  }

  generateCircuitOnCanvas(engine) {
    const { sop, groups } = this.solveSOP();
    if (sop === '0' || sop === '1') return;

    engine.clear();

    const vars = this.varNames;
    const startX = 100;
    const startY = 100;

    // 1. Create input switches for variables A, B, C, D
    const inputComps = vars.map((v, idx) => {
      return engine.addComponent('SWITCH', startX, startY + idx * 80, v);
    });

    // 2. Create NOT gates for inverted inputs if needed
    const notComps = {};
    vars.forEach((v, idx) => {
      const notGate = engine.addComponent('NOT', startX + 120, startY + idx * 80, `NOT_${v}`);
      engine.addWire(inputComps[idx].id, inputComps[idx].outputs[0].id, notGate.id, notGate.inputs[0].id);
      notComps[v] = notGate;
    });

    // 3. Create AND gates for minterms
    const andGateComps = [];
    groups.forEach((group, idx) => {
      const bin = group.binary;
      const andGate = engine.addComponent('AND', startX + 300, startY + idx * 90, `Minterm_${idx}`);
      andGateComps.push(andGate);

      let pinIdx = 0;
      for (let i = 0; i < bin.length; i++) {
        const bit = bin[i];
        const varName = vars[i];

        if (bit === '1') {
          engine.addWire(inputComps[i].id, inputComps[i].outputs[0].id, andGate.id, andGate.inputs[pinIdx].id);
          pinIdx++;
        } else if (bit === '0') {
          engine.addWire(notComps[varName].id, notComps[varName].outputs[0].id, andGate.id, andGate.inputs[pinIdx].id);
          pinIdx++;
        }
      }
    });

    // 4. Create final OR gate & LED output
    if (andGateComps.length > 0) {
      const finalOr = engine.addComponent('OR', startX + 480, startY + 120, 'SOP_Sum');
      const ledOutput = engine.addComponent('LED', startX + 620, startY + 125, 'Output_Y');

      andGateComps.forEach((andGate, idx) => {
        const inputPin = finalOr.inputs[idx % 2];
        if (inputPin) {
          engine.addWire(andGate.id, andGate.outputs[0].id, finalOr.id, inputPin.id);
        }
      });

      engine.addWire(finalOr.id, finalOr.outputs[0].id, ledOutput.id, ledOutput.inputs[0].id);
    }
  }
}
