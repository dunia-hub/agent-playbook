# x402 Pay Per Call Agent Resources

## x402 Documentation

- [x402 Documentation](https://docs.x402.org/)
- [Quickstart for Buyers](https://docs.x402.org/getting-started/quickstart-for-buyers)
- [Quickstart for Sellers](https://docs.x402.org/getting-started/quickstart-for-sellers)
- [HTTP 402 Payment Required](https://docs.x402.org/core-concepts/http-402)
- [Client and Server Flow](https://docs.x402.org/core-concepts/client-server)
- [Facilitators](https://docs.x402.org/core-concepts/facilitator)
- [Networks and Token Support](https://docs.x402.org/core-concepts/network-and-token-support)
- [Exact Payment Scheme](https://docs.x402.org/schemes/exact)
- [Migration Guide: x402 v1 to v2](https://docs.x402.org/guides/migration-v1-to-v2)
- [x402 GitHub Repository](https://github.com/x402-foundation/x402)

## x402 Packages Used

- [@x402/core](https://www.npmjs.com/package/@x402/core)
- [@x402/fetch](https://www.npmjs.com/package/@x402/fetch)
- [@x402/evm](https://www.npmjs.com/package/@x402/evm)
- [@x402/express](https://www.npmjs.com/package/@x402/express)

## EVM Tools

- [Viem Documentation](https://viem.sh/)
- [Viem Accounts](https://viem.sh/docs/accounts/local/privateKeyToAccount)
- [Base Sepolia Documentation](https://docs.base.org/base-chain/network-information)
- [Base Network Faucets](https://docs.base.org/base-chain/network-information/network-faucets)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

## Test USDC

- [Circle Testnet Faucet](https://faucet.circle.com/)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

Base Sepolia USDC:

```text
Network: eip155:84532
Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Symbol: USDC
Decimals: 6
EIP-712 name: USDC
EIP-712 version: 2
````

Always confirm token addresses using official documentation before signing.

## Default Test Facilitator

```text
https://x402.org/facilitator
```

The default facilitator is intended for development and testnet workflows. It should not be assumed to support production or mainnet payments.

Supported network information can be checked with:

```bash
curl -sS https://x402.org/facilitator/supported \
  | python3 -m json.tool
```

## Security References

* [OWASP Server Side Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
* [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Important Safety Notes

* Use disposable test wallets only.
* Never paste private keys into documentation, issues, commits, screenshots, or chat.
* Never commit `.env`.
* Verify the amount, asset, network, and recipient before approval.
* Keep automatic approval disabled unless the recipient is allowlisted.
* Treat pending settlement as unresolved and do not retry automatically.
* Check the transaction on the relevant block explorer before resolving uncertain settlement.
* Do not treat a facilitator response as proof of settlement without checking its success status and transaction details.

## Live Compatibility Observation

During testing on August 19, 2026, a standard Base Sepolia EIP-712 authorization verified successfully with viem locally but was rejected by the public x402.org facilitator with:

```text
invalid_exact_evm_signature
```

The same result occurred with x402 SDK versions 2.22.0 and 2.23.0. No USDC moved.

This observation may become outdated if the facilitator deployment changes. Re-run:

```bash
npm run verify
```

to check the current behavior without settling a payment.
