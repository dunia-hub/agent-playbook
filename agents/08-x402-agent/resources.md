# x402 Pay Per Call Agent Resources

## x402 Documentation

* [x402 Documentation](https://docs.x402.org/)
* [Quickstart for Buyers](https://docs.x402.org/getting-started/quickstart-for-buyers)
* [Quickstart for Sellers](https://docs.x402.org/getting-started/quickstart-for-sellers)
* [HTTP 402 Payment Required](https://docs.x402.org/core-concepts/http-402)
* [Client and Server Flow](https://docs.x402.org/core-concepts/client-server)
* [Facilitators](https://docs.x402.org/core-concepts/facilitator)
* [Networks and Token Support](https://docs.x402.org/core-concepts/network-and-token-support)
* [Exact Payment Scheme](https://docs.x402.org/schemes/exact)
* [x402 GitHub Repository](https://github.com/x402-foundation/x402)

## Packages Used

* [@x402/core](https://www.npmjs.com/package/@x402/core)
* [@x402/fetch](https://www.npmjs.com/package/@x402/fetch)
* [@x402/evm](https://www.npmjs.com/package/@x402/evm)
* [@x402/express](https://www.npmjs.com/package/@x402/express)
* [Viem](https://viem.sh/)

## Base Sepolia

* [Base Network Information](https://docs.base.org/base-chain/network-information)
* [Base Network Faucets](https://docs.base.org/base-chain/network-information/network-faucets)
* [Base Sepolia Explorer](https://sepolia.basescan.org/)

```text
Network: eip155:84532
Chain ID: 84532
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Symbol: USDC
Decimals: 6
EIP-712 name: USDC
EIP-712 version: 2
```

## Avalanche Fuji

* [Avalanche Fuji Network Setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/02-network-setup)
* [Avalanche Testnet Faucet](https://build.avax.network/console/primary-network/faucet)
* [Avalanche Fuji Explorer](https://testnet.snowtrace.io/)

```text
Network: eip155:43113
Chain ID: 43113
RPC: https://api.avax-test.network/ext/bc/C/rpc
USDC: 0x5425890298aed601595a70AB815c96711a31Bc65
Symbol: USDC
Decimals: 6
EIP-712 name: USD Coin
EIP-712 version: 2
```

## Test USDC

* [Circle Testnet Faucet](https://faucet.circle.com/)
* [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

Circle’s public faucet supports both Base Sepolia and Avalanche Fuji test USDC.

Always confirm token addresses using official documentation before signing.

## Local Facilitator

The workshop uses the included local facilitator by default:

```text
http://127.0.0.1:4022
```

Start it with:

```bash
npm run facilitator
```

Check its registered networks with:

```bash
curl -sS http://127.0.0.1:4022/supported \
  | python3 -m json.tool
```

The facilitator wallet pays settlement gas. It needs Base Sepolia ETH for Base settlements and Fuji AVAX for Avalanche settlements.

## Public Facilitator

The public test facilitator can be inspected with:

```bash
curl -sS https://x402.org/facilitator/supported \
  | python3 -m json.tool
```

Public facilitator availability and behavior are external dependencies and may change.

## Security References

* [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
* [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Safety Notes

* Use disposable test wallets only.
* Never expose private keys or seed phrases.
* Never commit `.env`.
* Verify the amount, asset, network, and recipient.
* Keep automatic approval disabled unless the recipient is allowlisted.
* Treat pending settlement as unresolved.
* Do not automatically retry uncertain payments.
* Check transaction hashes on the relevant explorer.
* Do not treat an HTTP response alone as proof of settlement.
* Confirm `settleResponse.success` and its transaction details.

## Compatibility Observation

During Base Sepolia testing on August 19, 2026, the public `x402.org` facilitator rejected a locally valid EIP-712 authorization with:

```text
invalid_exact_evm_signature
```

No USDC moved.

The included local facilitator subsequently verified the Base authorization successfully.

The local facilitator also accepted the Avalanche Fuji signature, network, asset, amount, recipient, and EIP-712 domain. Verification then stopped at the expected balance simulation because the payer had no Fuji USDC.

This observation may become outdated if the public facilitator deployment changes.
