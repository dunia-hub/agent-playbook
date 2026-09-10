# Resources

## Ethereum fees and JSON-RPC

- [Ethereum gas and fees](https://ethereum.org/en/developers/docs/gas/)
- [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)
- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/apis/json-rpc/)
- [`eth_getBlockByNumber`](https://ethereum.org/en/developers/apis/json-rpc/#eth_getblockbynumber)
- [`eth_gasPrice`](https://ethereum.org/en/developers/apis/json-rpc/#eth_gasprice)

## Groq

- [Groq Console](https://console.groq.com/keys)
- [Groq documentation](https://console.groq.com/docs)
- [Groq JavaScript SDK](https://www.npmjs.com/package/groq-sdk)

## Node.js

- [ECMAScript modules](https://nodejs.org/api/esm.html)
- [Built-in fetch](https://nodejs.org/api/globals.html#fetch)
- [Built-in test runner](https://nodejs.org/api/test.html)
- [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

## Safety concepts

- **Read only:** live mode calls fee-related JSON-RPC methods and never submits a
  transaction.
- **Integer calculations:** wei values remain `BigInt` until display conversion.
- **User limits:** a network can be blocked by a gwei ceiling or USD budget.
- **Freshness:** old snapshots are marked for review rather than treated as current.
- **Comparable ranking:** different native tokens are ranked only when manual USD
  prices are supplied.

## Dunia Hub

- [Dunia Hub](https://duniahub.xyz)
- The Agent Playbook is a practical workshop series for building understandable,
  testable agents with free or local tooling.
