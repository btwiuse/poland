// Copyright 2017-2022 @polkadot/hw-ledger authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type Transport from 'https://cdn.skypack.dev/@ledgerhq/hw-transport@6.27.1';
import type { TransportDef } from './types.ts';

import LedgerWebHid from 'https://cdn.skypack.dev/@ledgerhq/hw-transport-webhid@6.27.1';
import LedgerWebUsb from 'https://cdn.skypack.dev/@ledgerhq/hw-transport-webusb@6.27.1';

export { packageInfo } from './packageInfo.ts';

export const transports: TransportDef[] = [
  {
    create: (): Promise<Transport> =>
      LedgerWebUsb.create(),
    type: 'webusb'
  },
  {
    create: (): Promise<Transport> =>
      LedgerWebHid.create(),
    type: 'hid'
  }
];
