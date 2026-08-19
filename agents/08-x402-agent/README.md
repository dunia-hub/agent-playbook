# x402 Pay Per Call Agent

The x402 Pay Per Call Agent is Agent 08 in the Dunia Hub Agent Playbook series.

It discovers an x402 protected resource, reads the payment requirements, applies strict safety rules, asks for explicit approval, signs a testnet payment authorization, retries the request, and records the result.

## What It Does

The agent:

1. Sends a normal request to an online resource
2. Detects an HTTP 402 Payment Required response
3. Decodes the x402 v2 `PAYMENT-REQUIRED` header
4. Reads the amount, asset, network, recipient, and payment scheme
5. Blocks payment options outside the configured rules
6. Displays the exact payment in human readable form
7. Requires the user to type `PAY` before signing
8. Retries the request with an x402 payment signature
9. Reads the settlement response
10. Stores a local JSONL payment record
11. Prevents repeat payments after successful or pending settlement

## Current Implementation

The payment client currently supports:

* x402 protocol v2
* Exact payments
* Base Sepolia
* Test USDC
* EVM test wallets
* Manual approval by default
* Optional automatic approval with a required recipient allowlist

The discovery and policy layers are structured so additional network adapters can be added without changing the core decision flow.

## Safety Rules

The agent defaults to:

* Testnet only
* Maximum payment of `$0.10`
* USDC only
* Base Sepolia only
* Manual approval
* No unrestricted wallet access
* No committed private keys
* No repeat payment after settled or pending status
* Local payment records excluded from Git

Automatic approval cannot be enabled unless at least one recipient address is explicitly allowed.

Use disposable test wallets only. Never place a wallet containing real funds in this project.

## Requirements

* Node.js 20 or newer
* npm
* A disposable Base Sepolia payer wallet
* Base Sepolia test USDC
* An x402 protected resource

## Install

```bash
npm install
```

## Configure

Copy the example environment file:

```bash
cp .env.example .env
```

Set:

```env
EVM_PRIVATE_KEY=0x_your_disposable_test_wallet_private_key
X402_RESOURCE_URL=http://localhost:4021/weather
X402_MAX_PAYMENT_USD=0.10
X402_ALLOWED_NETWORKS=eip155:84532
X402_ALLOWED_ASSETS=USDC
X402_ALLOWED_RECIPIENTS=0x_expected_receiver
X402_AUTO_APPROVE=false
X402_LOG_PATH=./data/payments.jsonl
X402_SERVER_PAY_TO=0x_receiver_address
X402_SERVER_PORT=4021
```

Never commit or share `.env`.

## Generate Disposable Workshop Wallets

If `.env` does not already exist:

```bash
npm run create-wallets
```

The command generates separate payer and receiver wallets, writes their private keys only to `.env`, and prints only their public addresses.

Get Base Sepolia test USDC for the payer from the Circle testnet faucet:

https://faucet.circle.com/

## Check the Payer Balance

```bash
npm run balance
```

## Run the Local Paid Resource

Start the genuine x402 protected example:

```bash
npm run resource-server
```

The server exposes:

```text
http://localhost:4021/weather
```

It uses the public x402.org test facilitator for verification and settlement.

A non-settling simulator is also available:

```bash
npm run mock-server
```

The simulator advertises valid payment requirements but never accepts or settles funds.

## Run the Agent

In another terminal:

```bash
npm start -- http://localhost:4021/weather
```

Before signing, the agent displays:

* Amount
* Asset
* Network
* Recipient
* Scheme
* Policy result
* Payer address

Type exactly `PAY` only after confirming every field.

## Verify Without Settling

The verification diagnostic creates a fresh signed authorization and submits it only to the facilitator’s `/verify` endpoint:

```bash
npm run verify
```

It cannot settle or transfer USDC.

## Run Tests

```bash
npm test
```

The test suite uses mocks and temporary files. It does not make live payments.

## Payment Records

Local records are written to:

```text
data/payments.jsonl
```

Each exact resource and payment combination receives a deterministic payment ID. A settled or pending payment blocks another authorization for the same terms.

The log is excluded from Git because it can contain wallet addresses, transaction hashes, and resource history.

## Project Structure

```text
examples/
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

## Facilitator Compatibility Note

During the live Base Sepolia test on August 19, 2026:

* The payer held 20 test USDC
* The server returned correct x402 v2 payment requirements
* The agent created a standard 65 byte EIP-712 signature
* The signature verified successfully with viem locally
* x402 SDK versions 2.22.0 and 2.23.0 were tested
* The public x402.org facilitator returned `invalid_exact_evm_signature`
* No USDC moved

This points to a current public facilitator verification issue rather than an invalid local signature. The agent preserves the failure reason and stops safely.

## Limitations

* The included signer adapter currently pays on Base Sepolia only
* Other x402 networks require their corresponding signer packages and wallets
* The local JSONL log is not designed for concurrent processes
* A resource may disappear or change its terms between discovery and payment
* Public facilitator availability and behavior are external dependencies

## Multichain Extension Path

Additional adapters can be added for:

* Solana
* Stellar
* Aptos
* Hedera
* XRPL
* Other compatible EVM networks

Each adapter must preserve the same controls:

* Explicit network registration
* Asset allowlisting
* Recipient verification
* Per payment limits
* Approval before signing
* Duplicate protection
* Settlement logging

## Contributing

Suggestions, safety improvements, new testnet adapters, and additional mocked failure cases are welcome.
