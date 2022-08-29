// Copyright 2017-2022 @polkadot/api-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic } from 'https://deno.land/x/polkadot@0.2.3/api/submittable/types.ts';
import type { ApiTypes, DecorateMethod } from 'https://deno.land/x/polkadot@0.2.3/api/types/index.ts';
import type { Bytes } from 'https://deno.land/x/polkadot@0.2.3/types/mod.ts';
import type { AccountId, ContractExecResult, EventRecord, Weight } from 'https://deno.land/x/polkadot@0.2.3/types/interfaces/index.ts';
import type { ISubmittableResult } from 'https://deno.land/x/polkadot@0.2.3/types/types/index.ts';
import type { AbiMessage, ContractCallOutcome, ContractOptions, DecodedEvent } from '../types.ts';
import type { ContractCallResult, ContractCallSend, ContractQuery, ContractTx, MapMessageQuery, MapMessageTx } from './types.ts';

import { map } from 'https://esm.sh/rxjs@7.5.6';

import { SubmittableResult } from 'https://deno.land/x/polkadot@0.2.3/api/mod.ts';
import { ApiBase } from 'https://deno.land/x/polkadot@0.2.3/api/base/index.ts';
import { BN, BN_HUNDRED, BN_ONE, BN_ZERO, bnToBn, isUndefined, logger } from 'https://deno.land/x/polkadot@0.2.3/util/mod.ts';

import { Abi } from '../Abi/index.ts';
import { applyOnEvent } from '../util.ts';
import { Base } from './Base.ts';
import { withMeta } from './util.ts';

export interface ContractConstructor<ApiType extends ApiTypes> {
  new(api: ApiBase<ApiType>, abi: string | Record<string, unknown> | Abi, address: string | AccountId): Contract<ApiType>;
}

// As per Rust, 5 * GAS_PER_SEC
const MAX_CALL_GAS = new BN(5_000_000_000_000).isub(BN_ONE);

const l = logger('Contract');

function createQuery <ApiType extends ApiTypes> (meta: AbiMessage, fn: (origin: string | AccountId | Uint8Array, options: ContractOptions, params: unknown[]) => ContractCallResult<ApiType, ContractCallOutcome>): ContractQuery<ApiType> {
  return withMeta(meta, (origin: string | AccountId | Uint8Array, options: ContractOptions, ...params: unknown[]): ContractCallResult<ApiType, ContractCallOutcome> =>
    fn(origin, options, params)
  );
}

function createTx <ApiType extends ApiTypes> (meta: AbiMessage, fn: (options: ContractOptions, params: unknown[]) => SubmittableExtrinsic<ApiType>): ContractTx<ApiType> {
  return withMeta(meta, (options: ContractOptions, ...params: unknown[]): SubmittableExtrinsic<ApiType> =>
    fn(options, params)
  );
}

export class ContractSubmittableResult extends SubmittableResult {
  public readonly contractEvents?: DecodedEvent[];

  constructor (result: ISubmittableResult, contractEvents?: DecodedEvent[]) {
    super(result);

    this.contractEvents = contractEvents;
  }
}

export class Contract<ApiType extends ApiTypes> extends Base<ApiType> {
  /**
   * @description The on-chain address for this contract
   */
  public readonly address: AccountId;

  readonly #query: MapMessageQuery<ApiType> = {};

  readonly #tx: MapMessageTx<ApiType> = {};

  constructor (api: ApiBase<ApiType>, abi: string | Record<string, unknown> | Abi, address: string | AccountId, decorateMethod: DecorateMethod<ApiType>) {
    super(api, abi, decorateMethod);

    this.address = this.registry.createType('AccountId', address);

    this.abi.messages.forEach((m): void => {
      if (isUndefined(this.#tx[m.method])) {
        this.#tx[m.method] = createTx(m, (o, p) => this.#exec(m, o, p));
      }

      if (isUndefined(this.#query[m.method])) {
        this.#query[m.method] = createQuery(m, (f, o, p) => this.#read(m, o, p).send(f));
      }
    });
  }

  public get query (): MapMessageQuery<ApiType> {
    return this.#query;
  }

  public get tx (): MapMessageTx<ApiType> {
    return this.#tx;
  }

  #getGas = (_gasLimit: bigint | BN | string | number, isCall = false): BN => {
    const gasLimit = bnToBn(_gasLimit);

    return gasLimit.lte(BN_ZERO)
      ? isCall
        ? MAX_CALL_GAS
        : (this.api.consts.system.blockWeights
          ? (this.api.consts.system.blockWeights as unknown as { maxBlock: Weight }).maxBlock
          : this.api.consts.system.maximumBlockWeight as Weight
        ).muln(64).div(BN_HUNDRED)
      : gasLimit;
  };

  #exec = (messageOrId: AbiMessage | string | number, { gasLimit = BN_ZERO, storageDepositLimit = null, value = BN_ZERO }: ContractOptions, params: unknown[]): SubmittableExtrinsic<ApiType> => {
    const gas = this.#getGas(gasLimit);
    const encParams = this.abi.findMessage(messageOrId).toU8a(params);

    return this.api.tx.contracts
      .call(this.address, value, gas, storageDepositLimit, encParams)
      .withResultTransform((result: ISubmittableResult) =>
        // ContractEmitted is the current generation, ContractExecution is the previous generation
        new ContractSubmittableResult(result, applyOnEvent(result, ['ContractEmitted', 'ContractExecution'], (records: EventRecord[]) =>
          records
            .map(({ event: { data: [, data] } }): DecodedEvent | null => {
              try {
                return this.abi.decodeEvent(data as Bytes);
              } catch (error) {
                l.error(`Unable to decode contract event: ${(error as Error).message}`);

                return null;
              }
            })
            .filter((decoded): decoded is DecodedEvent => !!decoded)
        ))
      );
  };

  #read = (messageOrId: AbiMessage | string | number, { gasLimit = BN_ZERO, storageDepositLimit = null, value = BN_ZERO }: ContractOptions, params: unknown[]): ContractCallSend<ApiType> => {
    const message = this.abi.findMessage(messageOrId);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      send: this._decorateMethod((origin: string | AccountId | Uint8Array) =>
        this.api.rx.call.contractsApi
          .call<ContractExecResult>(origin, this.address, value, this.#getGas(gasLimit, true), storageDepositLimit, message.toU8a(params))
          .pipe(
            map(({ debugMessage, gasConsumed, gasRequired, result, storageDeposit }): ContractCallOutcome => ({
              debugMessage,
              gasConsumed,
              gasRequired: gasRequired && !gasRequired.isZero()
                ? gasRequired
                : gasConsumed,
              output: result.isOk && message.returnType
                ? this.abi.registry.createTypeUnsafe(message.returnType.lookupName || message.returnType.type, [result.asOk.data.toU8a(true)], { isPedantic: true })
                : null,
              result,
              storageDeposit
            }))
          )
      )
    };
  };
}

export function extendContract <ApiType extends ApiTypes> (type: ApiType, decorateMethod: DecorateMethod<ApiType>): ContractConstructor<ApiType> {
  return class extends Contract<ApiType> {
    static __ContractType = type;

    constructor (api: ApiBase<ApiType>, abi: string | Record<string, unknown> | Abi, address: string | AccountId) {
      super(api, abi, address, decorateMethod);
    }
  };
}
