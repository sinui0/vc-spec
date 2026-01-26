# Verifiable Compute Specification (vc-spec)

A specification for verifiable computation with input privacy, layered on top of WebAssembly.

**[Read the Specification](https://sinui0.github.io/vc-spec/docs/spec)**

## Overview

This project defines semantics for executing WebAssembly programs with cryptographic guarantees. It enables:

- **Verifiable Computation**: Prove computation correctness with sublinear verification
- **Zero-Knowledge**: Optionally hide private inputs from verifiers
- **Two-Party Computation**: Jointly compute over private inputs from two mutually distrusting parties

The specification is designed as a **layered extension** to WebAssembly, similar to the Component Model - it does not modify the core VM specification but adds verifiable compute semantics.

## Status

**Draft 0.1** - This is an early draft for design exploration. Not suitable for production use.

## Key Concepts

- **Concrete/Symbolic Values**: Values are either concrete (observable) or symbolic (not directly observable)
- **Private/Blind Inputs**: At the input boundary, symbolic values are private (local party's) or blind (remote party's)
- **Two-Party Model**: Computation involves a local party and a remote party
- **Symmetric Execution**: Both parties instantiate the exact same Wasm module
- **Backend Agnostic**: Abstract interface that can target proof systems, garbled circuits, secret sharing, etc.
- **Source Compatible**: Programs compile with standard Wasm toolchains

## Design Principles

1. **No VM modifications** - Core Wasm semantics unchanged
2. **Symmetric guest modules** - Same module for all parties, no party-specific logic
3. **Layered host functions** - Standard interfaces defined separately from core spec
4. **Semantic preservation** - Backends may transform code but must preserve Wasm semantics
5. **Implementation flexibility** - Control flow and memory restrictions are implementation-defined

## Development

This website is built using [Docusaurus](https://docusaurus.io/).

### Prerequisites

- Node.js 20+

### Local Development

```bash
npm install
npm start
```

This starts a local development server at `http://localhost:3000`. Changes are reflected live.

### Build

```bash
npm run build
```

This generates static content into the `build` directory.

### Versioning

To create a new version of the spec:

```bash
npm run docusaurus docs:version X.Y
```

## License

TBD
