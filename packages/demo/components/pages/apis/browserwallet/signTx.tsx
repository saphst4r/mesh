import Link from 'next/link';
import Codeblock from '../../../ui/codeblock';
import SectionTwoCol from '../../../common/sectionTwoCol';
import Card from '../../../ui/card';

export default function SignTx() {
  return (
    <SectionTwoCol
      sidebarTo="signTx"
      header="Sign Transaction"
      leftFn={Left()}
      rightFn={Right()}
    />
  );
}

function Left() {
  return (
    <>
      <p>
        Requests user to sign the provided transaction (<code>tx</code>). The
        wallet should ask the user for permission, and if given, try to sign the
        supplied body and return a signed transaction. <code>partialSign</code>{' '}
        should be <code>true</code> if the transaction provided requires
        multiple signatures.
      </p>
    </>
  );
}

function Right() {
  return (
    <Card>
      <div className="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Sign Transaction
        <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          Use connected wallet to sign a transaction
        </p>
      </div>
      <Codeblock
        data={`const signedTx = await wallet.signTx(tx, partialSign?);`}
        isJson={false}
      />
      <p>
        Check out <Link href="/apis/transaction">Transaction</Link> to learn
        more on how to use this API.
      </p>
    </Card>
  );
}
