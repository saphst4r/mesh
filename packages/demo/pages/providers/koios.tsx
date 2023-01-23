import { useState, useEffect } from 'react';
import CommonLayout from '../../components/common/layout';
import Metatags from '../../components/site/metatags';
import Codeblock from '../../components/ui/codeblock';
import {
  BadgeFetcher,
  BadgeSubmitter,
} from '../../components/pages/providers/badges';
import Fetcher from '../../components/pages/providers/fetcher';
import { KoiosProvider } from '@meshsdk/core';
import Submitter from '../../components/pages/providers/submitter';
import ButtonGroup from '../../components/ui/buttongroup';

export default function ProvidersKoios() {
  const sidebarItems = [
    { label: 'Fetch Account Info', to: 'fetchAccountInfo' },
    { label: 'Fetch Asset Addresses', to: 'fetchAssetAddresses' },
    { label: 'Fetch Asset Metadata', to: 'fetchAssetMetadata' },
    { label: 'Fetch Address Utxos', to: 'fetchAddressUtxos' },
    { label: 'Fetch Handle Address', to: 'fetchHandleAddress' },
    { label: 'Fetch Protocol Parameters', to: 'fetchProtocolParameters' },
    { label: 'Submit Tx', to: 'submitTx' },
  ];

  const [network, setNetwork] = useState<string>('preprod');

  return (
    <>
      <Metatags
        title="Koios Provider"
        description="Accessing and processing information stored on the blockchain"
      />
      <CommonLayout sidebarItems={sidebarItems}>
        <Hero network={network} setNetwork={setNetwork} />
        <Main network={network} />
      </CommonLayout>
    </>
  );
}

function Hero({ network, setNetwork }) {
  let code1 = `import { KoiosProvider } from '@meshsdk/core';\n\nconst koiosProvider = new KoiosProvider('<api,testnet,guild>');\n`;

  return (
    <header className="mb-4 lg:mb-6">
      <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
        Koios
        <span className="ml-2">
          <BadgeFetcher />
          <BadgeSubmitter />
        </span>
      </h2>
      <p className="mb-8 font-light text-gray-500 sm:text-xl dark:text-gray-400">
        Accessing and processing information stored on the blockchain
      </p>

      <div className="grid grid-cols-1 px-4 lg:grid-cols-2 lg:gap-16 pb-16">
        <div className="col-span-1 xl:col-auto">
          <p>
            <a href="https://www.koios.rest/" target="_blank" rel="noreferrer">
              Koios
            </a>{' '}
            provides a query layer which allows your app to access information
            stored on the blockchain.
          </p>
          <iframe
            className="mx-auto w-full max-w-xl h-64 rounded-lg sm:h-96"
            src="https://www.youtube.com/embed/lOoPNYiVxkg"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <p>Get started:</p>
          <Codeblock data={code1} isJson={false} />
          <p>Choose network for this demo:</p>
          <ButtonGroup
            items={[
              {
                key: 'mainnet',
                label: 'Mainnet',
                onClick: () => setNetwork('api'),
              },
              {
                key: 'preprod',
                label: 'Preprod',
                onClick: () => setNetwork('preprod'),
              },
            ]}
            currentSelected={network}
          />
        </div>
        <div className="col-span-1"></div>
      </div>
    </header>
  );
}

function Main({ network }) {
  const [koiosProvider, setKoiosProvider] =
    useState<KoiosProvider | null>(null);

  useEffect(() => {
    async function load() {
      const _koiosProvider = new KoiosProvider(network);
      setKoiosProvider(_koiosProvider);
    }
    load();
  }, [network]);

  return (
    <>
      <Fetcher fetcher={koiosProvider} fetcherName="koiosProvider" />
      <Submitter submitter={koiosProvider} submitterName="koiosProvider" />
    </>
  );
}
