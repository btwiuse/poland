// Copyright 2017-2022 @polkadot/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @name isBoolean
 * @summary Tests for a boolean value.
 * @description
 * Checks to see if the input value is a JavaScript boolean.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isBoolean } from 'https://deno.land/x/polkadot@0.0.0-11/util/mod.ts';
 *
 * isBoolean(false); // => true
 * ```
 */
export function isBoolean (value: unknown): value is boolean {
  return typeof value === 'boolean';
}
