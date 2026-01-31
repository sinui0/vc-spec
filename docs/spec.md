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
- Visibility propagation through linear memory and globals
- The embedding interface: how functions are invoked with visibility-tagged arguments, how memory is read and written, and how results are returned
- The requirements for a conforming *guest* module

This specification does not cover:

- N-party protocols (n > 2)
- Specific implementation strategies — this specification defines the *embedder* interface, not how it is realized
- Standard host function interfaces — these are defined at a separate layer

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

A *guest* is the WebAssembly module being executed. A conforming guest is a standard WebAssembly module. No special annotations or modifications are required.

**Embedder**

An *embedder* is the [host environment](https://webassembly.github.io/spec/core/intro/overview.html#embedder) that loads, validates, and instantiates the guest with verifiable compute semantics. Each party runs an embedder instance, and the two instances cooperate to jointly execute the guest.

**Conforming Embedder**

A *conforming embedder* is an embedder that implements the semantics defined by this specification for all WebAssembly core instructions it supports.

**Parties**

A verifiable computation involves exactly two parties: the *local party* and the *remote party*. Each party runs an instance of the embedder. The two instances jointly execute the guest. The parties are distinguished by which inputs they provide and their perspective on visibility.

**Visibility**

Each value has a *visibility* that determines which parties can observe it. There are three visibilities: *public*, *private*, and *blind*. A public value is known to both parties. A private value is known only to the local party. A blind value is known only to the remote party. This distinction is symmetric: what is private to one party is blind to the other.

**Symbolic**

A *symbolic* value is a value that is not *public*. During execution, the embedder does not distinguish between *private* and *blind*. The private/blind distinction exists only at the invocation boundary, where it indicates which party provided the value.

**Store**

The verifiable compute *store* extends the WebAssembly [store](https://webassembly.github.io/spec/core/exec/runtime.html#store) with a *visibility map*: a mapping from each value-carrying location to a visibility (*public* or *symbolic*). The locations subject to visibility tracking are [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) bytes and [global](https://webassembly.github.io/spec/core/syntax/modules.html#globals) values. The visibility map is not observable by the guest.

## Two-Party Model

Both parties MUST use the same *guest* module. Module identity is determined by the module's binary representation.

Both parties MUST agree on every state update during execution. Visibility determines which values each party can observe, not which operations they participate in.

Both parties MUST agree on the *call configuration* (see [Invocation](#invocation)). The mechanism for reaching this agreement is outside the scope of this specification.

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

During execution, *private* and *blind* values are both *symbolic*.

| Value Provider | Local Party's View | Remote Party's View |
|----------------|---------------------|----------------------|
| Local Party | private | blind |
| Remote Party | blind | private |
| Both (agreed) | public | public |

## Memory

Each byte in the guest's [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) is either *public* or *symbolic*.

### Initial Memory

All bytes in linear memory are initially *public*, including bytes initialized by [data segments](https://webassembly.github.io/spec/core/syntax/modules.html#data-segments).

### Store Propagation

When a value is stored to linear memory, the written bytes inherit the visibility of the stored value.

### Load Inheritance

When bytes are loaded from linear memory, the resulting value inherits the visibility of the bytes read. If any byte in the range is *symbolic*, the result is *symbolic*.

### Memory Growth

When linear memory is grown via [`memory.grow`](https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions), the newly allocated pages are *public*.

## Globals

Each [global variable](https://webassembly.github.io/spec/core/syntax/modules.html#globals) in the store has a visibility in the *visibility map*.

### Initial Value

All globals are initially *public*.

### Set Propagation

When a value is written to a mutable global via [`global.set`](https://webassembly.github.io/spec/core/exec/instructions.html#exec-global-set), the global's visibility is set to the visibility of the written value.

### Get Inheritance

When a value is read from a global via [`global.get`](https://webassembly.github.io/spec/core/exec/instructions.html#exec-global-get), the resulting value inherits the visibility of the global.

## Tables

[Table](https://webassembly.github.io/spec/core/syntax/modules.html#tables) elements are references ([`funcref`](https://webassembly.github.io/spec/core/syntax/types.html#reference-types), [`externref`](https://webassembly.github.io/spec/core/syntax/types.html#reference-types)). Table elements are not subject to visibility tracking.

## Invocation

### Call Configuration

A function invocation consists of:

1. The name of an [exported function](https://webassembly.github.io/spec/core/syntax/modules.html#exports)
2. A list of *tagged arguments*, one per parameter in the function's type signature

Each tagged argument is one of:

- **Public** — the value is known to both parties. The caller provides the value.
- **Private** — the value is known only to the local party. The caller provides the value.
- **Blind** — the value is provided by the remote party. The caller does not know it and supplies only the type.

The guest module does not observe the visibility of its inputs.

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

Each tagged argument corresponds to a parameter in the function's WebAssembly [type signature](https://webassembly.github.io/spec/core/syntax/types.html#function-types). The value is passed as a normal parameter. The visibility tag is consumed by the *embedder* and is not observable by the guest.

### Return Values

The return values of a function are *public*. Both parties observe the same return values, regardless of the visibility those values had during execution.

### Traps

A WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap) is a valid execution outcome. Traps are *public*. A trap is distinguishable from normal completion.

Sources of traps include those defined by WebAssembly:
- [`unreachable`](https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-control) instruction
- Integer [division by zero](https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-u)
- Out-of-bounds [memory access](https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions)
- Out-of-bounds [table access](https://webassembly.github.io/spec/core/exec/instructions.html#table-instructions)
- [Stack overflow](https://webassembly.github.io/spec/core/appendix/implementation.html#stack-overflow)

An *abort* is distinct from a trap and is **implementation-defined** (see [Aborts](#aborts)).

## Guest Module

A conforming *guest* module is a standard WebAssembly module. No special annotations or modifications are required.

### Exports

The guest module exports standard WebAssembly functions. These functions are invoked as described in [Invocation](#invocation).

Supported parameter and return types:
- [`i32`, `i64`](https://webassembly.github.io/spec/core/syntax/types.html#value-types) — Wasm core integer types
- [`f32`, `f64`](https://webassembly.github.io/spec/core/syntax/types.html#value-types) — optional; see [Floating-Point](#floating-point)

Complex data structures MUST be passed via [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) with appropriate serialization.

### Imports

The guest module MAY [import](https://webassembly.github.io/spec/core/syntax/modules.html#imports) [host functions](https://webassembly.github.io/spec/core/exec/runtime.html#host-functions). The set of host functions available to a module is **implementation-defined**.

Embedders MAY provide additional host functions for accelerated operations (e.g., hash functions, signature verification).

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

Floating-point support is optional. Embedders that support floating-point MUST produce deterministic results by canonicalizing all NaN outputs to the [canonical NaN](https://webassembly.github.io/spec/core/syntax/values.html#floating-point) defined by the WebAssembly specification. This eliminates the only source of [nondeterminism](https://webassembly.github.io/spec/core/intro/overview.html#nondeterminism) in the WebAssembly core instruction set.

### Resource Limits

Embedders MAY impose limits on resources such as stack depth and linear memory size. These limits are a source of cross-embedder divergence.

Embedders SHOULD declare their resource limits. For cross-embedder compatibility, embedders SHOULD use consistent resource limits.

## Embedding

A verifiable compute embedder interacts with the WebAssembly semantics through the operations defined in this section. These operations replace their [WebAssembly embedding](https://webassembly.github.io/spec/core/appendix/embedding.html) counterparts where this specification defines different semantics. For all other operations — including [`module_decode`](https://webassembly.github.io/spec/core/appendix/embedding.html#embed-module-decode), [`module_validate`](https://webassembly.github.io/spec/core/appendix/embedding.html#embed-module-validate), [`module_instantiate`](https://webassembly.github.io/spec/core/appendix/embedding.html#embed-module-instantiate), and [`module_exports`](https://webassembly.github.io/spec/core/appendix/embedding.html#embed-module-exports) — the corresponding WebAssembly embedding operations apply without modification.

### Errors and Outcomes

Failure of an interface operation is indicated by one of:

- **error** — the operation failed (e.g., out-of-bounds access, invalid arguments).
- **trap** — the guest execution [trapped](https://webassembly.github.io/spec/core/intro/overview.html#trap).
- **abort** — the joint execution could not complete, for reasons outside the caller's control and outside the WebAssembly semantics (see [Aborts](#aborts)).

### Visibility

A *visibility* classifies a value at the embedding boundary:

- **public** — known to both parties.
- **private** — known only to the local party.
- **blind** — known only to the remote party.

### Tagged Argument

A *tagged argument* pairs a visibility with either a value or a type:

- public(*val*) — a public value.
- private(*val*) — a private value provided by the local party.
- blind(*valtype*) — a value of the given type, provided by the remote party.

### Invocation

#### `invoke`(*store*, *funcaddr*, *tagged_arg*\*) : (*store*, *val*\* | *trap* | *abort* | *error*)

1. Pre-condition: the [function address](https://webassembly.github.io/spec/core/exec/runtime.html#syntax-funcaddr) *funcaddr* is valid in *store*.
2. Pre-condition: the number and types of *tagged_arg*\* match the function's [type signature](https://webassembly.github.io/spec/core/syntax/types.html#function-types).
3. Execute the function with the given tagged arguments. Each argument's visibility is consumed by the embedder. The guest receives the values as normal parameters.
4. If execution completes normally, let *result* be the return values. Return values are *public*.
5. If execution traps, let *result* be *trap*.
6. If the joint execution cannot complete, let *result* be *abort*.
7. Return the new store paired with *result*.

### Memory

#### `mem_write`(*store*, *memaddr*, *i*: u32, *byte*, *visibility*) : (*store* | *abort* | *error*)

1. Pre-condition: the [memory address](https://webassembly.github.io/spec/core/exec/runtime.html#syntax-memaddr) *memaddr* is valid in *store*.
2. If *i* is out of bounds, return *error*.
3. Write *byte* at index *i*. The byte's visibility is set to *visibility*.
4. Return the updated store.

#### `mem_read`(*store*, *memaddr*, *i*: u32) : (*byte* | *abort* | *error*)

1. Pre-condition: the [memory address](https://webassembly.github.io/spec/core/exec/runtime.html#syntax-memaddr) *memaddr* is valid in *store*.
2. If *i* is out of bounds, return *error*.
3. If the byte at index *i* is *symbolic*, return *error*.
4. Return the byte at index *i*.

#### `mem_reveal`(*store*, *memaddr*, *i*: u32, *n*: u32) : (*store* | *abort* | *error*)

1. Pre-condition: the [memory address](https://webassembly.github.io/spec/core/exec/runtime.html#syntax-memaddr) *memaddr* is valid in *store*.
2. Pre-condition: both parties agree to reveal the specified region.
3. If *i* + *n* is out of bounds, return *error*.
4. Set the visibility of bytes *i* through *i* + *n* − 1 to *public*.
5. Return the updated store.

> **Note**
>
> `mem_reveal` requires agreement from both parties. The mechanism for reaching this agreement is outside the scope of this specification. After a successful `mem_reveal`, the revealed bytes can be read via `mem_read`.

## Implementation-Defined Behaviors

Implementation-defined behaviors MUST NOT alter WebAssembly execution semantics. When an embedder encounters an operation it does not support, it MUST NOT produce a WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap). Instead, the embedder MUST report an *abort*, which is distinguishable from both normal completion and a trap (see [Aborts](#aborts)).

> **Note**
>
> The following is a non-exhaustive list of areas where embedders commonly differ. It is advisory, not normative. Embedders SHOULD document their choices in these and any other areas where their behavior is implementation-defined.

### Control Flow on Symbolic Values

Whether control flow can depend on *symbolic* inputs.

> **Note**
>
> ```wat
> ;; May or may not be supported depending on the embedder
> (if (local.get $private_condition)
>   (then ...)
>   (else ...))
> ```
>
> Some embedders require all branch conditions to be public. Others support branching on symbolic values.

### Memory Access Patterns

Whether memory addresses can depend on *symbolic* inputs.

> **Note**
>
> ```wat
> ;; May or may not be supported
> (i32.load (local.get $private_address))
> ```
>
> Some embedders require public addresses. Others support address patterns that depend on symbolic values.

### Memory Input Allocation

The mechanism by which the embedder allocates space within the guest's [linear memory](https://webassembly.github.io/spec/core/syntax/modules.html#memories) for memory writes (see [Embedding — Memory](#memory-1)).

### Aborts

How *aborts* are reported. An abort is distinct from both normal completion and a WebAssembly [trap](https://webassembly.github.io/spec/core/intro/overview.html#trap) (see [Traps](#traps)). Sources include unsupported operations and failures in the cooperation between parties.

### Available Host Functions

The set of [host functions](https://webassembly.github.io/spec/core/exec/runtime.html#host-functions) available to the guest module (see [Imports](#imports)).

### Resource Limits {#impl-resource-limits}

Limits on resources such as stack depth and linear memory size (see [Resource Limits](#resource-limits)).

*End of Specification*
