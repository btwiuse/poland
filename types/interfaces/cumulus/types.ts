// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Struct, U8aFixed, u32, u64 } from 'https://deno.land/x/polkadot@0.0.3/types-codec/mod.ts';
import type { Weight } from 'https://deno.land/x/polkadot@0.0.3/types/interfaces/runtime/index.ts';

/** @name ConfigData */
export interface ConfigData extends Struct {
  readonly maxIndividual: Weight;
}

/** @name MessageId */
export interface MessageId extends U8aFixed {}

/** @name OverweightIndex */
export interface OverweightIndex extends u64 {}

/** @name PageCounter */
export interface PageCounter extends u32 {}

/** @name PageIndexData */
export interface PageIndexData extends Struct {
  readonly beginUsed: PageCounter;
  readonly endUsed: PageCounter;
  readonly overweightCount: OverweightIndex;
}

export type PHANTOM_CUMULUS = 'cumulus';
