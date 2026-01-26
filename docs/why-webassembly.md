---
title: Why WebAssembly?
sidebar_label: Why WebAssembly?
slug: /why-webassembly
---

# Why WebAssembly?

WebAssembly is a virtual instruction set architecture (virtual ISA) with properties that make it well-suited as a foundation for verifiable computation:

- **Formally specified** - Typing, validation, and execution semantics are precisely defined.
- **Structured control flow** - No arbitrary jumps. The control flow structure is explicitly encoded in the bytecode.
- **Language independent** - A well-supported LLVM backend target, enabling programs to be written in languages such as Rust and C.
- **Portable** - Programs are compiled to a compact, self-contained binary that encodes its own structure, types, and interfaces. It can be distributed to any conforming embedder without external metadata.
- **Safe** - Code executes in a memory-safe, isolated environment with well-defined behavior for all execution outcomes, including traps.
- **Extensible** - Host functions and custom sections provide extension points without altering the core ISA.

## Formally Specified

The WebAssembly specification precisely defines typing, validation, and execution in a way that is easy to reason about both informally and formally. The semantics are precise enough to be mechanized in proof assistants, enabling rigorous verification of compilers and transformations.

Embedders can compile WebAssembly programs to different representations -- circuits, constraint systems, or other ISAs. The formal semantics provide a precise definition of what correctness means for such a transformation: does the compiled form preserve the semantics of the source program?

## Structured Control Flow

Some instruction set architectures allow arbitrary jumps. WebAssembly does not. Control flow is structured: loops, blocks, and branches are explicitly scoped, and even indirect branches (`br_table`) select among a fixed set of statically-known targets. The complete set of control flow successors is statically known for every instruction, and the control flow graph is directly evident from the bytecode without requiring dataflow analysis.

This is a significant difference from arbitrary-jump ISAs, where determining all possible targets of an indirect jump is undecidable in general. For verifiable computation embedders, which typically want to compile WebAssembly to an embedder-specific representation just-in-time (JIT), this property is valuable. For example, it makes exhaustive path enumeration tractable for circuit-based embedders, and simplifies transformations such as if-conversion (replacing conditional branches with straight-line code that evaluates both paths and selects the correct result).

## Language Independent

WebAssembly is a well-supported LLVM backend target. Programs can be written in general-purpose languages -- Rust, C, C++ -- and compiled to WebAssembly using standard toolchains, without requiring knowledge of cryptographic internals.

The ecosystem of libraries, testing tools, and developer expertise around general-purpose languages far exceeds that of any domain-specific language designed specifically for verifiable computation. By targeting WebAssembly, this ecosystem becomes available for writing verifiable programs.

## Portable

The WebAssembly binary format directly encodes the module structure: types, functions, imports, exports, and memory definitions are each organized into distinct, tagged sections. Every function signature and every import/export declaration is explicitly present in the binary with its full type information. An embedder can parse, validate, and transform a module using only the binary itself -- no external symbol tables, debug information, or ABI conventions are required.

The format was designed for efficient distribution: it uses variable-length integer encoding (LEB128) and a structured layout optimized for compact representation and fast validation. Unlike traditional executable formats, every function signature and interface boundary is typed, enabling an embedder to fully understand the module's structure without external tooling or metadata.

WebAssembly does not need to be used as an ISA by embedders directly. It serves as a portable intermediate representation which embedders can translate to their native format. Programs are written in a general-purpose language, compiled to WebAssembly, and distributed as a single artifact. An embedder can compile this further to whatever representation it requires. Programs can also be compiled, tested, and debugged using standard WebAssembly tools before being executed in a verifiable computation context.

## Safe

WebAssembly code executes in a memory-safe, isolated environment with no ambient authority. All access to external resources is mediated through explicitly provided host functions.

The specification also defines behavior for all execution outcomes. Conditions such as stack overflow, integer division by zero, and out-of-bounds memory access produce a *trap* -- a well-defined, terminal execution outcome distinct from normal completion. For verifiable computation, this means both parties can agree on the outcome even when execution fails.

This is a meaningful difference from traditional ISAs. RISC-V, for instance, has no concept of a hardware-enforced stack limit. The stack is a software convention managed by a general-purpose register, and overflow results in undefined or OS-dependent behavior. A verifiable computation embedder using such an ISA must define and enforce these semantics itself, outside the guarantees of the ISA specification. WebAssembly provides them out of the box.

## Extensible

WebAssembly provides two extension mechanisms which are useful for verifiable computation:

**Host functions** allow the embedder to expose operations to the guest program through WebAssembly's typed import/export mechanism. Because the calling convention is defined by the specification, host function interfaces are straightforward to standardize. This provides a natural mechanism for accelerated primitives -- hash functions, signature verification, and other operations which benefit from embedder-specific optimization. These are analogous to "precompiles" in other virtual machine contexts.

**Custom sections** allow arbitrary metadata to be embedded within a WebAssembly binary without affecting execution semantics. This provides the ability to embed advisory information -- such as range hints or loop bounds -- which an embedder-specific compiler can use to guide optimization.

```rust
// Hypothetical syntax — not currently implemented.
// In practice, hints would be emitted as Wasm custom sections
// by a build tool or procedural macro.
#[hint(range(exp, 0..8))]
fn power(base: u64, exp: u64) -> u64 {
    let mut out = 1;
    for _ in 0..exp {
        out *= base;
    }
    out
}
```
