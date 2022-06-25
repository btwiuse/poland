// Copyright 2017-2022 @polkadot/api-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiBase } from 'https://deno.land/x/polkadot@0.0.0-10/api/base/index.ts';
import { TypeRegistry } from 'https://deno.land/x/polkadot@0.0.0-10/types/mod.ts';

const registry = new TypeRegistry();

export const mockApi = {
  isConnected: true,
  registry,
  tx: {
    contracts: {
      instantiateWithCode: (): never => {
        throw new Error('mock');
      }
    }
  }
} as unknown as ApiBase<'promise'>;
