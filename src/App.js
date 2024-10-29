import { useEffect, useState } from 'react';
import './App.css';
import * as fcl from '@onflow/fcl';
import HelloWorldScript from './cadence/scripts/HelloWorldGreeting.cdc';

fcl.config({
  'flow.network': 'testnet',
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
});

function App() {
  const [greeting, setGreeting] = useState('');
  const [user, setUser] = useState({ loggedIn: false });
  const [newGreeting, setNewGreeting] = useState('');
  const [coaAddress, setCoaAddress] = useState('');

  const queryGreeting = async () => {
    const res = await fcl.query({
      cadence: HelloWorldScript,
    });
    setGreeting(res);
  };

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
    queryGreeting();
  }, []);

  // const queryCoaAddress = async () => {
  //   const res = await fcl.query({
  //     cadence: `
  //       import "EVM"

  //       /// Retrieves the EVM address from the provided Flow account address's COA stored in the standard path
  //       ///
  //       /// @param address: The Flow account address
  //       ///
  //       /// @return The EVM address as a string or nil if the COA is not found
  //       ///
  //       access(all)
  //       fun main(address: Address): String? {
  //           if let coa = getAuthAccount<auth(BorrowValue) &Account>(address).storage.borrow<&EVM.CadenceOwnedAccount>(
  //               from: /storage/evm
  //           ) {
  //               return coa.address().toString()
  //           }
  //           return nil
  //       }
  //     `,
  //     args: (arg, t) => [arg(user.addr, t.Address)]
  //   });
  //   setCoaAddress(res);
  // }

  // useEffect(() => {
  //   if (user.loggedIn) {
  //     queryCoaAddress(user.addr);
  //   }
  // }, [user]);

  const logIn = () => {
    fcl.authenticate();
  };

  const logOut = () => {
    fcl.unauthenticate();
  };

  const sendTransaction = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import HelloWorld from 0xa1296b1e2e90ca5b

          transaction(greeting: String) {
            prepare(acct: &Account) {
              log(acct.address)
            }
          
            execute {
              HelloWorld.changeGreeting(newGreeting: greeting)
            }
          }
        `,
        args: (arg, t) => [arg(newGreeting, t.String)],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser.authorization],
        limit: 50,
      });

      console.log('Transaction Id', transactionId);

      await fcl.tx(transactionId).onceSealed();
      console.log('Transaction Sealed');

      queryGreeting();
      setNewGreeting('');
    } catch (error) {
      console.error('Transaction Failed', error);
    }
  };

  return (
    <div className="App">
      <div>FCL App Quickstart</div>
      <div>Greeting: {greeting}</div>
      {user.loggedIn ? (
        <div>
          <p>Address: {user.addr}</p>
          <p>COA Address: {coaAddress}</p>
          <button onClick={logOut}>Log Out</button>
          <div>
            <input
              type="text"
              placeholder="Enter new greeting"
              value={newGreeting}
              onChange={(e) => setNewGreeting(e.target.value)}
            />
            <button onClick={sendTransaction}>Change Greeting</button>
          </div>
        </div>
      ) : (
        <button onClick={logIn}>Log In</button>
      )}
    </div>
  );
}

export default App;