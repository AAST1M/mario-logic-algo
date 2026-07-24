# ⚡ Mario Logic & Algo Pro

> **Interactive Digital Logic Circuit Simulator, Truth Table Matrix Evaluator & Karnaugh Map (K-Map) Solver**

![License](https://img.shields.io/badge/license-MIT-red.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-17%2F17%20passing-10b981.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)

---

## 🌟 Overview

**Mario Logic & Algo Pro** is a high-performance, web-based digital logic design suite built for students, hardware engineers, and computer science educators. It provides interactive 2D canvas circuit editing, real-time signal propagation, automated truth table matrix generation, Karnaugh Map Quine-McCluskey minimization, and multi-format exports (PDF, PNG, CSV, JSON).

---

## ✨ Features

* 🔌 **Interactive Circuit Engine**:
  * Drag-and-drop components (`SWITCH`, `BUTTON`, `CLOCK`, `AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`, `BUFFER`, `LED`, `PROBE`).
  * High-DPI HTML5 Canvas rendering with dynamic grid snapping, smooth Bezier wire curves, and responsive workspace auto-scaling.
* 📊 **Analytical Engineering Tools**:
  * **Truth Table Generator**: Evaluates complete truth tables for all active inputs and outputs.
  * **Karnaugh Map (K-Map) Solver**: 2, 3, and 4-variable K-Map minimization with live Sum-of-Products (SOP) expression generation and automated circuit synthesis on canvas.
  * **Boolean Algebra Parser**: Tokenizes and parses boolean expressions (e.g. `(A AND B) OR (NOT C)`) directly into visual logic gate circuits.
  * **Timing Diagram Waveforms**: Live digital wave recording and visualization.
* 📄 **Multi-Format Export Suite**:
  * **Printable PDF Specification Sheet**: Generates high-res printable PDF reports with circuit diagrams and truth tables.
  * **PNG Screenshot**: Captures high-definition PNG images with solid background formatting.
  * **CSV Data Export**: Export truth table matrices for Excel / MATLAB analysis.
  * **JSON Circuit State**: Full circuit save & import compatibility.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Installation & Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/AAST1M/mario-logic-algo.git
cd mario-logic-algo

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000/` or `http://localhost:3001/`.

---

## 🧪 Automated Testing

The project includes an automated test suite under `tests/`:

```bash
# Run unit & integration test suite
npm test
```

**Test Coverage**:
* `circuit_engine.test.js`: Gate logic, signal propagation, state undo/redo, JSON serialization.
* `truth_table.test.js`: Matrix generation and empty circuit guards.
* `kmap_solver.test.js`: 2, 3, 4-variable Quine-McCluskey minimization.
* `boolean_parser.test.js`: Lexing, AST parsing, AST evaluation, circuit generation.
* `presets.test.js`: Pre-built circuit loader verification.

---

## 🏗️ Production Build

```bash
npm run build
```

Production bundle is output to `dist/`.

---

## 📄 License
Distributed under the MIT License.
