---
title: Specification
sidebar_label: Specification
slug: /spec
---

# Verifiable Compute Specification

**Draft 0.1** | January 2026

## Introduction

This specification defines **Verifiable Compute**, a layered extension to [WebAssembly](https://webassembly.github.io/spec/core/) for two-party verifiable computation. It specifies how a WebAssembly module is invoked, receives inputs, and produces outputs in a setting where two parties jointly evaluate a program with assurances about the result.

### Scope

This specification covers:

- A two-party computation model
- Value visibility at the input and output boundaries
- The invocation interface: how functions are called with visibility-tagged arguments, and how results are returned
- The requirements for a conforming *guest* module

This specification does not cover:

- N-party protocols (n > 2)
- Specific implementation strategies — this specification defines the *embedder* interface, not how it is realized
- Standard host function interfaces — defined separately in [VCI](vci.md)

### Relationship to WebAssembly

This specification is designed as a layered extension to WebAssembly:

```
┌────────────────────┐
│ Verifiable Compute │ ← This specification
├────────────────────┤
│ WebAssembly Core   │ ← W3C WebAssembly Spec
└────────────────────┘
```

For rationale on why WebAssembly is a suitable foundation, see [this explainer](./why-webassembly).

### Conventions

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## Concepts

The verifiable compute model is structured around the following concepts.

**Guest**

A *guest* is the WebAssembly module being executed. A conforming guest is a standard WebAssembly module — no special annotations or modifications are required. The guest does not observe the visibility of its inputs.

**Embedder**

An *embedder* is the [host environment](https://webassembly.github.io/spec/core/intro/overview.html#embedder) that loads, validates, and instantiates the guest with verifiable compute semantics. Each party runs an embedder instance, and the two instances cooperate to jointly execute the guest. The embedder is responsible for enforcing visibility rules. How the embedder realizes these semantics internally is outside the scope of this specification.

**Conforming Embedder**

A *conforming embedder* is an embedder that implements the semantics defined by this specification for all WebAssembly core instructions it supports.

**Parties**

A verifiable computation involves exactly two parties: the *local party* and the *remote party*. Each party runs an instance of the embedder. The two instances jointly execute the guest — both parties participate in every operation and MUST agree on every state update. The parties are distinguished only by which inputs they provide and their perspective on visibility.

**Visibility**

Each value at the invocation boundary has a *visibility* that determines which parties can observe it. There are three visibilities: *public*, *private*, and *blind*. A public value is known to both parties. A private value is known only to the local party. A blind value is known only to the remote party. Visibility determines which values each party can observe, not which operations they participate in. This distinction is symmetric: what is private to one party is blind to the other.

## Two-Party Model

Both parties MUST use the same *guest* module — module identity is determined by the module's binary representation. Visibility semantics are applied by the *embedder*, not embedded in the guest.

Both parties MUST agree on the *call configuration* (see [Invocation](#invocation)) — the function to invoke, the number and types of arguments, and which party provides each argument. The mechanism for reaching this agreement is outside the scope of this specification.

> **Note**
>
> Two common instantiations of this model are:
> - One party provides private inputs. The other party can verify the result without learning those inputs.
> - Both parties contribute private inputs and both learn the output, without either party learning the other's private inputs.

## Values

At the invocation boundary, each input value has one of three visibilities:

- **Public** — known to both parties.
- **Private** — known only to the *local party*. The embedder MUST NOT reveal the value to the remote party.
- **Blind** — known only to the *remote party*. The embedder MUST NOT reveal the value to the local party.

As described in [Concepts](#concepts), both parties jointly execute every operation. Visibility determines only which values each party can observe, not which operations they participate in.

| Value Provider | Local Party's View | Remote Party's View |
|----------------|---------------------|----------------------|
| Local Party | private | blind |
| Remote Party | blind | private |
| Both (agreed) | public | public |

## Invocation

This section defines how a function in the *guest* module is called and how data crosses the boundary between the caller and the guest.

### Call Configuration

A function invocation consists of:

1. The name of an [exported function](https://webassembly.github.io/spec/core/syntax/modules.html#exports)
2. A list of *tagged arguments*, one per parameter in the function's type signature

Each tagged argument is one of:

- **Public** — the value is known to both parties. The caller provides the value.
- **Private** — the value is known only to the local party. The caller provides the value.
- **Blind** — the value is provided by the remote party. The caller does not know it and supplies only the type.

The call configuration fully determines the inputs to the computation. The guest module does not know or specify the visibility of its inputs — this is determined entirely by the caller.

> **Note**
>
> For example, a call configuration for a two-party multiplication might look like:
>
> ```rust
> // Illustrative, not normative.
> enum Arg {
>     Public(Value),
>     Private(Value),
>     Blind(ValType),
> }
>
> CallConfiguration {
>     function: "multiply",
>     args: [
>         Arg::Private(Value::I32(7)),
>         Arg::Blind(ValType::I32),
>     ],
> }
> ```
>
> Here, the local party provides `7` as a private input. The second parameter is blind — the local party knows only that it is an `i32`, with the actual value provided by the remote party. The guest function receives both as ordinary `i32` parameters.

### Parameters

Each tagged argument in the call configuration corresponds to a parameter in the function's WebAssembly [type signature](https://webassembly.github.io/spec/core/syntax/types.html#function-types). The value is passed to the function as a normal parameter. The visibility tag is consumed by the *embedder* and is not observable by the guest.

### Memory Inputs

For data that does not fit in function parameters (e.g., byte buffers, variable-length structures), the embedder MAY write data into the guest's [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) before or during the call. The mechanism for allocating space within the guest's linear memory is **implementation-defined**. The visibility of written data is determined by the caller.

### Return Values

The return values of a function MUST be *public*. Both parties observe the same return values.

### Memory Outputs

Linear memory contents after execution are not automatically public. The mechanism for reading data from the guest's linear memory after a function call is **implementation-defined**.

### Traps

A WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap) is a valid execution outcome. Traps MUST be *public* — both parties observe that a trap occurred. A trap MUST be distinguishable from normal completion.

Sources of traps include those defined by WebAssembly:
- [`unreachable`](https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-control) instruction
- Integer [division by zero](https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-u)
- Out-of-bounds [memory access](https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions)
- Out-of-bounds [table access](https://webassembly.github.io/spec/core/exec/instructions.html#table-instructions)
- [Stack overflow](https://webassembly.github.io/spec/core/appendix/implementation.html#stack-overflow)

Protocol-level failures are distinct from traps and are **implementation-defined** (see [Protocol-Level Failures](#protocol-level-failures)).

## Guest Module

A conforming *guest* module is a standard WebAssembly module. No special annotations or modifications are required.

### Exports

The guest module exports standard WebAssembly functions. These functions are invoked as described in [Invocation](#invocation).

Supported parameter and return types:
- [`i32`, `i64`](https://webassembly.github.io/spec/core/syntax/types.html#value-types) — Wasm core integer types
- [`f32`, `f64`](https://webassembly.github.io/spec/core/syntax/types.html#value-types) — optional; see [Floating-Point](#floating-point)

Complex data structures MUST be passed via [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) with appropriate serialization.

### Imports

The guest module MAY import host functions provided by the embedder. The set of available host functions is **implementation-defined**.

Standard host function interfaces are defined separately in [VCI](vci.md). Implementations MAY provide additional host functions for accelerated operations (e.g., hash functions, signature verification).

### Custom Sections

Implementations MAY interpret WebAssembly [custom sections](https://webassembly.github.io/spec/core/appendix/custom.html) to guide optimization or transformation (e.g., range hints, loop bounds). Custom sections MUST NOT alter execution semantics — they are advisory only.

## Determinism

Two *conforming embedders* MUST produce the same output — either the same return values, or a trap under the same condition — given:

1. The same guest module
2. The same call configuration
3. The same set of enabled [WebAssembly features](https://webassembly.github.io/spec/core/appendix/changes.html)

This guarantee holds for all programs that stay within the resource limits of both embedders.

For cross-embedder compatibility, embedders MUST support the same set of WebAssembly features. The enabled feature set is part of the execution configuration — enabling or disabling a feature can change which modules are valid and how they execute.

Embedders that support WebAssembly proposals beyond the core specification MUST preserve determinism for all features they enable.

### Floating-Point

Floating-point support is optional. Embedders that support floating-point MUST produce deterministic results by canonicalizing all NaN outputs to the [canonical NaN](https://webassembly.github.io/spec/core/syntax/values.html#floating-point) defined by the WebAssembly specification. This eliminates the only source of [nondeterminism](https://webassembly.github.io/spec/core/intro/overview.html#nondeterminism) in the WebAssembly core instruction set. Additional proposals MAY introduce further sources of nondeterminism; embedders MUST resolve these deterministically.

### Resource Limits

Embedders MAY impose limits on resources such as stack depth and linear memory size. These limits are a source of cross-embedder divergence: the same program may complete on one embedder and trap on another due to differing limits.

Embedders SHOULD declare their resource limits. For cross-embedder compatibility, embedders SHOULD use consistent resource limits.

## Implementation-Defined Behaviors

Implementation-defined behaviors MUST NOT alter WebAssembly execution semantics. When an embedder encounters an operation it does not support (e.g., a branch condition that depends on a *private* value), it MUST NOT produce a WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap). Instead, the embedder MUST report a *protocol-level failure*, which is distinguishable from both normal completion and a trap (see [Protocol-Level Failures](#protocol-level-failures)).

> **Note**
>
> The following is a non-exhaustive list of areas where embedders commonly differ. It is advisory, not normative. Embedders SHOULD document their choices in these and any other areas where their behavior is implementation-defined.

### Control Flow on Private/Blind Values

Whether control flow can depend on *private* or *blind* inputs.

> **Note**
>
> ```wat
> ;; May or may not be supported depending on the embedder
> (if (local.get $private_condition)
>   (then ...)
>   (else ...))
> ```
>
> Some embedders require all branch conditions to be public. Others support branching on private or blind values.

### Memory Access Patterns

Whether memory addresses can depend on *private* or *blind* inputs.

> **Note**
>
> ```wat
> ;; May or may not be supported
> (i32.load (local.get $private_address))
> ```
>
> Some embedders require public addresses. Others support address patterns that depend on private or blind values.

### Memory Input Allocation

The mechanism by which the embedder allocates space within the guest's [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) for memory inputs (see [Memory Inputs](#memory-inputs)).

### Memory Outputs

The mechanism for reading data from the guest's linear memory after a function call (see [Memory Outputs](#memory-outputs-1)). Linear memory contents after execution are not automatically public.

### Protocol-Level Failures

How protocol-level failures are reported. A protocol-level failure is distinct from both normal completion and a WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap) (see [Traps](#traps)). Sources of protocol-level failures include unsupported operations (e.g., branching on a *private* value when the embedder does not support it), communication errors, and aborted sessions.

### Available Host Functions

The set of host functions available for import by the guest module (see [Imports](#imports)). Standard host function interfaces are defined separately in [VCI](vci.md).

### Resource Limits {#impl-resource-limits}

Limits on resources such as stack depth and linear memory size (see [Resource Limits](#resource-limits)).

*End of Specification*
