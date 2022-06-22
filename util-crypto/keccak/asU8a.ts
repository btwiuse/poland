// Copyright 2017-2022 @polkadot/util-crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { keccak_256 as keccak256Js, keccak_512 as keccak512Js } from 'https://esm.sh/@noble/hashes@1.1.2/sha3.js';

import { keccak256, keccak512 } from 'https://deno.land/x/polkadot@0.0.0-5/wasm-crypto/mod.ts';

import { createAsHex, createBitHasher, createDualHasher } from '../helpers.ts';

/**
 * @name keccakAsU8a
 * @summary Creates a keccak Uint8Array from the input.
 * @description
 * From either a `string` or a `Buffer` input, create the keccak and return the result as a `Uint8Array`.
 * @example
 * <BR>
 *
 * ```javascript
 * import { keccakAsU8a } from 'https://deno.land/x/polkadot@0.0.0-5/util-crypto/mod.ts';
 *
 * keccakAsU8a('123'); // => Uint8Array
 * ```
 */

export const keccakAsU8a = createDualHasher(
  { 256: keccak256, 512: keccak512 },
  { 256: keccak256Js, 512: keccak512Js }
);

/**
 * @name keccak256AsU8a
 * @description Creates a keccak256 Uint8Array from the input.
 */
export const keccak256AsU8a = createBitHasher(256, keccakAsU8a);

/**
 * @name keccak512AsU8a
 * @description Creates a keccak512 Uint8Array from the input.
 */
export const keccak512AsU8a = createBitHasher(512, keccakAsU8a);

/**
 * @name keccakAsHex
 * @description Creates a keccak hex string from the input.
 */
export const keccakAsHex = createAsHex(keccakAsU8a);
