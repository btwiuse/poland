// Copyright 2017-2022 @polkadot/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observable } from 'https://esm.sh/rxjs@7.5.7';
import type { SignedBlockExtended } from '../type/types.ts';
import type { DeriveApi } from '../types.ts';

import { switchMap } from 'https://esm.sh/rxjs@7.5.7';

import { memo } from '../util/index.ts';

/**
 * @name subscribeFinalizedBlocks
 * @returns The finalized block & events for that block
 */
export function subscribeFinalizedBlocks (instanceId: string, api: DeriveApi): () => Observable<SignedBlockExtended> {
  return memo(instanceId, (): Observable<SignedBlockExtended> =>
    api.derive.chain.subscribeFinalizedHeads().pipe(
      switchMap((header) =>
        api.derive.chain.getBlock(header.createdAtHash || header.hash)
      )
    )
  );
}
