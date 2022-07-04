import 'https://deno.land/x/polkadot@0.0.4/api-augment/mod.ts';

import { ApiPromise, WsProvider } from 'https://deno.land/x/polkadot@0.0.4/api/mod.ts';
import { BN_ONE, stringToU8a } from 'https://deno.land/x/polkadot@0.0.4/util/mod.ts';
import { blake2AsHex } from 'https://deno.land/x/polkadot@0.0.4/util-crypto/mod.ts';

async function main () {
	console.log('*** util');
	console.log(stringToU8a('hello world'), BN_ONE.toString());

	console.log('util-crypto');
	console.log(blake2AsHex('hello world'));

	const api = await ApiPromise.create({ provider: new WsProvider() });

	api.rpc.chain.subscribeNewHeads(({ hash }) => console.log(hash.toHex()));

	const acc = await api.query.system.account('');

	console.log(acc.consumers.toNumber());
}

main().catch(console.error);