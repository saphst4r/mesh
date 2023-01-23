import axios, { AxiosInstance } from 'axios';
import { SUPPORTED_HANDLES } from '@mesh/common/constants';
import { IFetcher, ISubmitter } from '@mesh/common/contracts';
import {
  deserializeNativeScript, fromNativeScript,
  fromUTF8, parseAssetUnit, parseHttpError,
  resolveRewardAddress, toScriptRef, toUTF8,
} from '@mesh/common/utils';
import type {
  AccountInfo, Asset, AssetMetadata,
  PlutusScript, Protocol, UTxO,
} from '@mesh/common/types';

export class TangoProvider implements IFetcher, ISubmitter {
  private readonly _axiosInstance: AxiosInstance;

  constructor(
    network: 'mainnet' | 'testnet',
    appId: string, appKey: string,
    version = 1,
  ) {
    this._axiosInstance = axios.create({
      baseURL: `https://cardano-${network}.tangocrypto.com/${appId}/v${version}`,
      headers: { 'x-api-key': appKey },
    });
  }

  async fetchAccountInfo(address: string): Promise<AccountInfo> {
    try {
      const rewardAddress = address.startsWith('addr')
        ? resolveRewardAddress(address)
        : address;

      const { data, status } = await this._axiosInstance.get(
        `wallets/${rewardAddress}`
      );

      if (status === 200) 
        return <AccountInfo>{
          poolId: data.pool_id,
          active: data.active,
          balance: data.controlled_total_stake,
          rewards: data.rewards_sum,
          withdrawals: data.withdrawals_sum,
        };

      throw parseHttpError(data);
    } catch (error) {
      throw parseHttpError(error);
    }
  }

  async fetchAddressUTxOs(address: string, asset?: string): Promise<UTxO[]> {
    const filter = asset !== undefined ? `/assets/${asset}` : '';
    const url = `addresses/${address}${filter}/utxos?size=50`;

    const paginateUTxOs = async (cursor = '', utxos: UTxO[] = []): Promise<UTxO[]> => {
      const { data, status } = await this._axiosInstance.get(
        `${url}&cursor=${cursor}`,
      );

      if (status === 200)
        return data.cursor !== null && data.cursor?.length > 0
          ? paginateUTxOs(data.cursor, [...utxos, ...data.data.map(toUTxO)])
          : data.data.map(toUTxO);

      throw parseHttpError(data);
    };

    const toAssets = (value: number, multiAsset): Asset[] => {
      const assets: Asset[] = [{
        unit: 'lovelace',
        quantity: value.toString(),
      }];

      multiAsset.forEach(asset => {
        const assetName = fromUTF8(asset.asset_name);

        assets.push({
          unit: `${asset.policy_id}${assetName}`,
          quantity: asset.quantity.toString(),
        });
      });

      return assets;
    };

    const resolveScriptRef = (tScriptRef): string | undefined => {
      if (tScriptRef) {
        const script = tScriptRef.type.startsWith('plutus')
          ? <PlutusScript>{
              code: tScriptRef.code,
              version: tScriptRef.type.replace('plutus', ''),
            }
          : fromNativeScript(deserializeNativeScript(tScriptRef.json));

        return toScriptRef(script).to_hex();
      }

      return undefined;
    };

    const toUTxO = (tUTxO): UTxO => ({
      input: {
        outputIndex: tUTxO.index,
        txHash: tUTxO.hash,
      },
      output: {
        address: address,
        amount: toAssets(tUTxO.value, tUTxO.assets),
        dataHash: undefined,
        plutusData: tUTxO.inline_datum?.value_raw ?? undefined,
        scriptRef: resolveScriptRef(tUTxO.reference_script),
      },
    });

    try {
      return await paginateUTxOs();
    } catch (error) {
      return [];
    }
  }
  
  async fetchAssetAddresses(asset: string): Promise<{ address: string; quantity: string }[]> {
    const toAddress = (item) => ({
      address: item.address,
      quantity: item.quantity.toString(),
    });

    const paginateAddresses = async <T>(cursor = '', addresses: T[] = []): Promise<T[]> => {
      const { policyId, assetName } = parseAssetUnit(asset);
      const { data, status } = await this._axiosInstance.get(
        `assets/${policyId}${assetName}/addresses?size=100&cursor=${cursor}`,
      );

      if (status === 200)
        return data.cursor !== null && data.cursor?.length > 0
          ? paginateAddresses(data.cursor, [...addresses, ...data.data.map(toAddress)])
          : data.data.map(toAddress);

      throw parseHttpError(data);
    };

    try {
      return await paginateAddresses<{ address: string; quantity: string }>();
    } catch (error) {
      return [];
    }
  }

  async fetchAssetMetadata(asset: string): Promise<AssetMetadata> {
    try {
      const { policyId, assetName } = parseAssetUnit(asset);
      const { data, status } = await this._axiosInstance.get(
        `assets/${policyId}${assetName}`,
      );

      if (status === 200)
        return <AssetMetadata>{
          ...data.metadata[0]?.json[policyId][toUTF8(assetName)],
        };

      throw parseHttpError(data);
    } catch (error) {
      throw parseHttpError(error);
    }
  }

  async fetchHandleAddress(handle: string): Promise<string> {
    try {
      const assetName = fromUTF8(handle.replace('$', ''));
      const { data, status } = await this._axiosInstance.get(
        `assets/${SUPPORTED_HANDLES[1]}${assetName}/addresses`,
      );

      if (status === 200)
        return data.data[0].address;

      throw parseHttpError(data);
    } catch (error) {
      throw parseHttpError(error);
    }
  }

  async fetchProtocolParameters(epoch: number): Promise<Protocol> {
    try {
      const { data, status } = await this._axiosInstance.get(
        `epochs/${epoch}/parameters`
      );

      if (status === 200)
        return <Protocol>{
          coinsPerUTxOSize: data.coins_per_utxo_size.toString(),
          collateralPercent: data.collateral_percent,
          decentralisation: data.decentralisation,
          epoch: data.epoch_no,
          keyDeposit: data.key_deposit.toString(),
          maxBlockExMem: data.max_block_ex_mem.toString(),
          maxBlockExSteps: data.max_block_ex_steps.toString(),
          maxBlockHeaderSize: data.max_block_header_size,
          maxBlockSize: data.max_block_size,
          maxCollateralInputs: data.max_collateral_inputs,
          maxTxExMem: data.max_tx_ex_mem.toString(),
          maxTxExSteps: data.max_tx_ex_steps.toString(),
          maxTxSize: data.max_tx_size,
          maxValSize: data.max_val_size.toString(),
          minFeeA: data.min_fee_a,
          minFeeB: data.min_fee_b,
          minPoolCost: data.min_pool_cost.toString(),
          poolDeposit: data.pool_deposit.toString(),
          priceMem: data.price_mem,
          priceStep: data.price_step,
        };

      throw parseHttpError(data);
    } catch (error) {
      throw parseHttpError(error);
    }
  }

  async submitTx(tx: string): Promise<string> {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const { data, status } = await this._axiosInstance.post(
        'transactions/submit', { tx }, { headers },
      );

      if (status === 200) return data.tx_id;

      throw parseHttpError(data);
    } catch (error) {
      throw parseHttpError(error);
    }
  }
}
