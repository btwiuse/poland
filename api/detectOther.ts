// Copyright 2017-2022 @polkadot/api authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { packageInfo as deriveInfo } from 'https://deno.land/x/polkadot@0.0.4-7/api-derive/packageInfo.ts';
import { packageInfo as coreInfo } from 'https://deno.land/x/polkadot@0.0.4-7/rpc-core/packageInfo.ts';
import { packageInfo as providerInfo } from 'https://deno.land/x/polkadot@0.0.4-7/rpc-provider/packageInfo.ts';
import { packageInfo as typesInfo } from 'https://deno.land/x/polkadot@0.0.4-7/types/packageInfo.ts';
import { packageInfo as knownInfo } from 'https://deno.land/x/polkadot@0.0.4-7/types-known/packageInfo.ts';

export default [deriveInfo, coreInfo, providerInfo, typesInfo, knownInfo];
