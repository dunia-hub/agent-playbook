# x402 Pay Per Call Agent

The x402 Pay Per Call Agent is Agent 08 in the Dunia Hub Agent Playbook series.

It discovers an x402-protected resource, reads its payment requirements, applies strict safety rules, asks for approval, signs a testnet payment authorization, retries the request, and records the settlement result.

## Supported Networks

| Network | CAIP-2 identifier | Payment asset |
|---|---|---|
| Base Sepolia | `eip155:84532` | Test USDC |
| Avalanche Fuji | `eip155:43113` | Test USDC |

Both networks use x402 protocol v2 with the EVM `exact` payment scheme.

## What It Does

The agent:

1. Requests an online resource normally
2. Detects an HTTP 402 Payment Required response
3. Decodes the x402 v2 `PAYMENT-REQUIRED` header
4. Reads the amount, asset, network, recipient, and scheme
5. Rejects payment options outside the configured rules
6. Displays the exact payment in human-readable form
7. Requires the user to type `PAY`
8. Creates an EIP-712 payment authorization
9. Retries the request with the payment signature
10. Reads the settlement response
11. Records the result in a local JSONL log
12. Blocks repeated payments after settled or pending status

## Architecture

The workshop example contains three processes:

1. The payment agent signs approved payment authorizations.
2. The paid resource server protects the example API endpoints.
3. The local facilitator verifies authorizations and submits settlement transactions.

The payer signs an EIP-3009 USDC authorization and does not submit the settlement transaction directly. The facilitator submits that transaction and pays the network gas.

## Safety Rules

The agent defaults to:

* Testnets only
* Maximum payment of `$0.10`
* USDC only
* Explicitly registered networks
* Manual approval
* No unrestricted wallet control
* No committed private keys
* Recipient allowlisting for automatic approval
* Duplicate protection after settled or pending payments
* Local payment records excluded from Git

Use disposable test wallets only. Never use a wallet containing real funds.

## Wallet Funding Roles

| Wallet | Base Sepolia | Avalanche Fuji |
|---|---|---|
| Payer | Test USDC | Test USDC |
| Facilitator | Test ETH for gas | Test AVAX for gas |
| Receiver | No funding required | No funding required |

The payer does not need native gas for the included x402 exact USDC flow.

Test USDC is available from the [Circle testnet faucet](https://faucet.circle.com/).

Test AVAX is available from the [Avalanche Builder Hub faucet](https://build.avax.network/console/primary-network/faucet).

Base Sepolia test ETH must be obtained from a compatible Base Sepolia faucet.

## Requirements

* Node.js 20 or newer
* npm
* Disposable payer and facilitator wallets
* Test USDC for the payer on the selected network
* Native test tokens for the facilitator on the selected network

## Install

```bash
npm install
````

## Configure

Copy the example configuration:

```bash
cp .env.example .env
```

At minimum, configure:

```env
EVM_PRIVATE_KEY=0x_disposable_payer_private_key

X402_ALLOWED_NETWORKS=eip155:84532,eip155:43113
X402_ALLOWED_ASSETS=USDC
X402_MAX_PAYMENT_USD=0.10
X402_AUTO_APPROVE=false

X402_FACILITATOR_PRIVATE_KEY=0x_disposable_facilitator_private_key
X402_SERVER_PAY_TO=0x_receiver_address
```

One facilitator wallet can be used on both networks, or separate network-specific keys can be configured:

```env
X402_BASE_FACILITATOR_PRIVATE_KEY=
X402_FUJI_FACILITATOR_PRIVATE_KEY=
```

Never commit or share `.env`.

## Generate Disposable Workshop Wallets

If `.env` does not already exist:

```bash
npm run create-wallets
```

The command generates disposable test wallets, writes their private keys only to `.env`, and prints only their public addresses.

## Check Funding Readiness

```bash
npm run balance
```

The command displays payer and facilitator balances on both networks without creating or settling a payment.

## Run the End-to-End Example

Use three terminals.

### Terminal 1: Local Facilitator

```bash
npm run facilitator
```

The facilitator listens at:

```text
http://127.0.0.1:4022
```

Its `/supported` response advertises both Base Sepolia and Avalanche Fuji.

### Terminal 2: Paid Resource Server

```bash
npm run resource-server
```

The server exposes:

```text
http://localhost:4021/weather/base
http://localhost:4021/weather/avalanche
http://localhost:4021/health
```

Each paid weather request costs `0.01 USDC`.

### Terminal 3: Payment Agent

Base Sepolia:

```bash
npm start -- http://localhost:4021/weather/base
```

Avalanche Fuji:

```bash
npm start -- http://localhost:4021/weather/avalanche
```

Before signing, confirm:

* Amount
* Asset
* Network
* Recipient
* Scheme
* Policy result
* Payer address

Type exactly `PAY` only when every field is correct.

## Verify Without Settling

The diagnostic command creates a fresh signed authorization and submits it only to the facilitator’s `/verify` endpoint.

Base Sepolia:

```bash
npm run verify -- http://localhost:4021/weather/base
```

Avalanche Fuji:

```bash
npm run verify -- http://localhost:4021/weather/avalanche
```

Verification does not submit a settlement transaction or transfer USDC.

The facilitator may simulate the token transfer during verification. The payer therefore needs enough test USDC for verification to succeed.

## Mock Server

A non-settling simulator is also included:

```bash
npm run mock-server
```

It advertises payment requirements but cannot verify or settle payments.

## Run Tests

```bash
npm test
```

The test suite uses mocks and temporary files. It does not make live payments.

Current coverage includes:

* Safe configuration defaults
* URL validation
* x402 v2 discovery
* Payment policy enforcement
* Base Sepolia USDC
* Avalanche Fuji USDC
* Dual-network payment-client registration
* Approval formatting
* Payment record persistence
* Settled and pending duplicate protection

## Payment Records

Local records are written to:

```text
data/payments.jsonl
```

Each resource and exact set of payment terms receives a deterministic payment ID.

A settled or pending payment blocks another authorization for the same resource and terms.

The log is excluded from Git because it may contain wallet addresses, transaction hashes, and resource history.

## Network Configuration

### Base Sepolia

```text
CAIP-2: eip155:84532
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Avalanche Fuji

```text
CAIP-2: eip155:43113
Chain ID: 43113
RPC: https://api.avax-test.network/ext/bc/C/rpc
USDC: 0x5425890298aed601595a70AB815c96711a31Bc65
```

The USDC addresses are published in the [Circle contract-address documentation](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## Project Structure

```text
examples/
  local-facilitator.js
  mock-paid-server.js
  paid-resource-server.js
scripts/
  checkBalance.js
  checkFacilitator.js
  createTestWallets.js
src/
  assets.js
  config.js
  discover.js
  index.js
  paymentClient.js
  paymentLog.js
  policy.js
tests/
```

## Verification Status

The local facilitator has successfully verified:

* A Base Sepolia x402 authorization
* An Avalanche Fuji x402 authorization through signature and contract validation

The Avalanche verification reached the USDC balance simulation and correctly returned `invalid_exact_evm_insufficient_balance` for an unfunded payer. This confirms that the signature, network, asset contract, amount, recipient, and EIP-712 domain were accepted before the balance check.

A complete onchain settlement still requires:

* Base Sepolia test ETH in the Base facilitator wallet
* Avalanche Fuji test USDC in the Fuji payer wallet
* Avalanche Fuji test AVAX in the Fuji facilitator wallet

## Public Facilitator Compatibility

The included examples use the local facilitator by default for reproducible workshop testing.

During testing, the public `x402.org` facilitator rejected an otherwise locally valid Base Sepolia authorization with `invalid_exact_evm_signature`. No USDC moved.

The public facilitator can be tested by changing:

```env
X402_FACILITATOR_URL=https://x402.org/facilitator
```

External facilitator availability and behavior are outside this project’s control.

## Limitations

* Only EVM exact payments are implemented
* The local facilitator must hold native test gas
* The payer must hold the requested test USDC
* The JSONL log is not designed for concurrent processes
* A resource may change its terms between discovery and payment
* Testnet faucets, RPC endpoints, and public facilitators are external services

## Multichain Extension Path

Future adapters can add:

* Solana
* Stellar
* Aptos
* Hedera
* XRPL
* Additional EVM networks

Every adapter must preserve:

* Explicit network registration
* Asset allowlisting
* Recipient verification
* Per-payment limits
* Approval before signing
* Duplicate protection
* Settlement logging

## Contributing

Suggestions, security improvements, additional network adapters, and mocked failure cases are welcome.
