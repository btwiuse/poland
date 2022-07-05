// Copyright 2017-2022 @polkadot/util-crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Keypair } from '../../types.ts';

import { getPublicKey } from 'https://esm.sh/@noble/secp256k1@1.6.0';

import { hasBigInt, u8aEmpty } from 'https://deno.land/x/polkadot@0.0.4/util/mod.ts';
import { isReady, secp256k1FromSeed } from 'https://deno.land/x/polkadot@0.0.4/wasm-crypto/mod.ts';

/**
 * @name secp256k1PairFromSeed
 * @description Returns a object containing a `publicKey` & `secretKey` generated from the supplied seed.
 */
export function secp256k1PairFromSeed (seed: Uint8Array, onlyJs?: boolean): Keypair {
  if (seed.length !== 32) {
    throw new Error('Expected valid 32-byte private key as a seed');
  }

  if (!hasBigInt || (!onlyJs && isReady())) {
    const full = secp256k1FromSeed(seed);
    const publicKey = full.slice(32);

    // There is an issue with the secp256k1 when running in an ASM.js environment where
    // it seems that the lazy static section yields invalid results on the _first_ run.
    // If this happens, fail outright, we cannot allow invalid return values
    // https://github.com/polkadot-js/wasm/issues/307
    if (u8aEmpty(publicKey)) {
      throw new Error('Invalid publicKey generated from WASM interface');
    }

    return {
      publicKey,
      secretKey: full.slice(0, 32)
    };
  }

  return {
    publicKey: getPublicKey(seed, true),
    secretKey: seed
  };
}
