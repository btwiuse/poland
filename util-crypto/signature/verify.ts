// Copyright 2017-2022 @polkadot/util-crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from 'https://deno.land/x/polkadot@0.2.12/util/types.ts';
import type { KeypairType, VerifyResult } from '../types.ts';

import { u8aIsWrapped, u8aToU8a, u8aUnwrapBytes, u8aWrapBytes } from 'https://deno.land/x/polkadot@0.2.12/util/mod.ts';

import { decodeAddress } from '../address/decode.ts';
import { ed25519Verify } from '../ed25519/verify.ts';
import { secp256k1Verify } from '../secp256k1/verify.ts';
import { sr25519Verify } from '../sr25519/verify.ts';

interface VerifyInput {
  message: Uint8Array;
  publicKey: Uint8Array;
  signature: Uint8Array;
}

type Verifier = [KeypairType, (message: Uint8Array | string, signature: Uint8Array, publicKey: Uint8Array) => boolean];

type VerifyFn = (result: VerifyResult, input: VerifyInput) => VerifyResult;

const secp256k1VerifyHasher = (hashType: 'blake2' | 'keccak') =>
  (message: Uint8Array | string, signature: Uint8Array, publicKey: Uint8Array) =>
    secp256k1Verify(message, signature, publicKey, hashType);

const VERIFIERS_ECDSA: Verifier[] = [
  ['ecdsa', secp256k1VerifyHasher('blake2')],
  ['ethereum', secp256k1VerifyHasher('keccak')]
];

const VERIFIERS: Verifier[] = [
  ['ed25519', ed25519Verify],
  ['sr25519', sr25519Verify],
  ...VERIFIERS_ECDSA
];

const CRYPTO_TYPES: ('ed25519' | 'sr25519' | 'ecdsa')[] = ['ed25519', 'sr25519', 'ecdsa'];

function verifyDetect (result: VerifyResult, { message, publicKey, signature }: VerifyInput, verifiers = VERIFIERS): VerifyResult {
  result.isValid = verifiers.some(([crypto, verify]): boolean => {
    try {
      if (verify(message, signature, publicKey)) {
        result.crypto = crypto;

        return true;
      }
    } catch (error) {
      // do nothing, result.isValid still set to false
    }

    return false;
  });

  return result;
}

function verifyMultisig (result: VerifyResult, { message, publicKey, signature }: VerifyInput): VerifyResult {
  if (![0, 1, 2].includes(signature[0])) {
    throw new Error(`Unknown crypto type, expected signature prefix [0..2], found ${signature[0]}`);
  }

  const type = CRYPTO_TYPES[signature[0]] || 'none';

  result.crypto = type;

  try {
    result.isValid = {
      ecdsa: () => verifyDetect(result, { message, publicKey, signature: signature.subarray(1) }, VERIFIERS_ECDSA).isValid,
      ed25519: () => ed25519Verify(message, signature.subarray(1), publicKey),
      none: () => {
        throw Error('no verify for `none` crypto type');
      },
      sr25519: () => sr25519Verify(message, signature.subarray(1), publicKey)
    }[type]();
  } catch (error) {
    // ignore, result.isValid still set to false
  }

  return result;
}

function getVerifyFn (signature: Uint8Array): VerifyFn {
  return [0, 1, 2].includes(signature[0]) && [65, 66].includes(signature.length)
    ? verifyMultisig
    : verifyDetect;
}

export function signatureVerify (message: HexString | Uint8Array | string, signature: HexString | Uint8Array | string, addressOrPublicKey: HexString | Uint8Array | string): VerifyResult {
  const signatureU8a = u8aToU8a(signature);

  if (![64, 65, 66].includes(signatureU8a.length)) {
    throw new Error(`Invalid signature length, expected [64..66] bytes, found ${signatureU8a.length}`);
  }

  const publicKey = decodeAddress(addressOrPublicKey);
  const input = { message: u8aToU8a(message), publicKey, signature: signatureU8a };
  const result: VerifyResult = { crypto: 'none', isValid: false, isWrapped: u8aIsWrapped(input.message, true), publicKey };
  const isWrappedBytes = u8aIsWrapped(input.message, false);
  const verifyFn = getVerifyFn(signatureU8a);

  verifyFn(result, input);

  if (result.crypto !== 'none' || (result.isWrapped && !isWrappedBytes)) {
    return result;
  }

  input.message = isWrappedBytes
    ? u8aUnwrapBytes(input.message)
    : u8aWrapBytes(input.message);

  return verifyFn(result, input);
}
