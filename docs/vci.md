---
title: Verifiable Compute Interface (VCI)
sidebar_label: VCI
slug: /vci
---

# Verifiable Compute Interface (VCI)

VCI is an optional set of standard interfaces for the Verifiable Compute specification. It standardizes common patterns on both sides of the guest/*embedder* boundary:

- **Host interfaces** — Standard [host functions](https://webassembly.github.io/spec/core/exec/runtime.html#host-functions) imported by the guest module from the `vc` namespace.
- **Guest interfaces** — Standard functions exported by the guest module for applications and the embedder to invoke.

## Host Interfaces

Host interfaces are standard [host functions](https://webassembly.github.io/spec/core/exec/runtime.html#host-functions) that guest modules may import from the `vc` namespace.

### Reveal

#### Overview

The `reveal` functions convert symbolic values to concrete values. This is the mechanism by which private or blind inputs can be disclosed to both parties.

The reveal operation is **asynchronous** with a handle-based interface, allowing:
- Batching multiple reveal requests
- Pipelining computation while reveals are in progress
- Embedder flexibility in when/how reveals occur

Revealing a value is a **semantic operation** that requires explicit consent. The embedder cannot infer when the guest intends to disclose information — this makes information flow explicit and auditable.

#### Function Signatures

All reveal functions are imported from the `vc` namespace.

```wat
;; Request a reveal, returns a handle immediately
(import "vc" "reveal_i32" (func $reveal_i32 (param i32) (result i32)))
(import "vc" "reveal_i64" (func $reveal_i64 (param i64) (result i32)))
(import "vc" "reveal_f32" (func $reveal_f32 (param f32) (result i32)))
(import "vc" "reveal_f64" (func $reveal_f64 (param f64) (result i32)))

;; Wait for a reveal to complete, returns the concrete value
(import "vc" "reveal_i32_wait" (func $reveal_i32_wait (param i32) (result i32)))
(import "vc" "reveal_i64_wait" (func $reveal_i64_wait (param i32) (result i64)))
(import "vc" "reveal_f32_wait" (func $reveal_f32_wait (param i32) (result f32)))
(import "vc" "reveal_f64_wait" (func $reveal_f64_wait (param i32) (result f64)))
```

**`reveal_<type>(value) -> handle`**

Initiates a reveal of `value`. Returns a handle (`i32`) immediately. If the input is already *concrete*, the operation is a no-op but still returns a valid handle.

**`reveal_<type>_wait(handle) -> value`**

Blocks until the reveal associated with `handle` completes. Returns the revealed value.

#### Taint

**`reveal_<type>`**: The `value` parameter may be *concrete* or *symbolic*. The returned handle is always *concrete*.

**`reveal_<type>_wait`**: The `handle` parameter MUST be *concrete*. The returned value is always *concrete*.

#### Errors

**`reveal_<type>_wait`**: Traps if `handle` is not valid and unconsumed (see [Handle Semantics](#handle-semantics)).

#### Handle Semantics

The embedder maintains a counter *N*, initially `0`, representing the number of handles allocated. Each call to `reveal_<type>` increments *N* by one and returns *N* as the handle. The value `0` is never a valid handle.

A handle *h* is **valid and unconsumed** if all of the following hold:
- *h* ≥ 1
- *h* ≤ *N*
- *h* has not been passed to a previous `_wait` call

Passing a handle that is not valid and unconsumed to a `_wait` function traps. A successful `_wait` call consumes the handle.

Handles are not required to be consumed in the order they were created.

#### Asynchronous Model

The two-phase design (request + wait) allows the guest to:

1. Issue multiple reveal requests
2. Perform other computation while reveals are in progress
3. Wait for results when needed

This enables embedders to optimize reveal operations (e.g., batching network round-trips in MPC protocols).

## Guest Interfaces

Guest interfaces are standard functions that guest modules may export. These define common entry points, memory conventions, and other exports that applications and the embedder use to interact with the program.

### Realloc

#### Overview

The `realloc` function is a general-purpose memory allocation primitive exported by the guest module. Applications and the embedder call it to allocate, grow, shrink, or free memory within the guest's linear memory. This follows the same convention established by the WebAssembly Component Model.

Any caller that needs to pass variable-length data into the guest (e.g., byte buffers, strings) calls `realloc` to obtain a valid destination pointer before writing.

#### Function Signature

```wat
(export "realloc" (func (param i32 i32 i32 i32) (result i32)))
```

**`realloc(original_ptr, original_size, alignment, new_size) -> ptr`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `original_ptr` | `i32` | Pointer to the existing allocation, or `0` for a new allocation |
| `original_size` | `i32` | Size in bytes of the existing allocation, or `0` for a new allocation |
| `alignment` | `i32` | Required alignment in bytes (must be a power of two) |
| `new_size` | `i32` | Requested size in bytes, or `0` to free |

Returns a pointer to the allocated region. The returned pointer must satisfy the requested alignment.

#### Semantics

The four operations are distinguished by argument values:

- **Allocate** — `original_ptr = 0`, `original_size = 0`, `new_size > 0`. Allocates a new region.
- **Reallocate** — `original_ptr != 0`, `original_size > 0`, `new_size > 0`. Grows or shrinks an existing allocation. The contents up to `min(original_size, new_size)` are preserved.
- **Free** — `original_ptr != 0`, `original_size > 0`, `new_size = 0`. Frees the allocation. The return value is unspecified.
- **No-op** — `original_ptr = 0`, `original_size = 0`, `new_size = 0`. Returns an unspecified value.

If the guest cannot satisfy the allocation, it must *trap*. `realloc` never returns a failure code — the caller can assume that a non-trapping return always provides a valid pointer (when `new_size > 0`).

#### Taint

All parameters to `realloc` MUST be *concrete*. The returned pointer is *concrete*.
