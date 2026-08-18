import {
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";

const DEVNET_RPC = "https://api.devnet.solana.com";

const connection = new Connection(
  DEVNET_RPC,
  "confirmed"
);

const details = document.querySelector("#details");
const connectButton = document.querySelector("#connect-button");
const submitButton = document.querySelector("#submit-button");
const walletStatus = document.querySelector("#wallet-status");
const transactionStatus = document.querySelector(
  "#transaction-status"
);

let preparedSwap = null;
let phantom = null;
let connectedWallet = null;

async function loadPreparedSwap() {
  const response = await fetch(
    `/prepared-swap.json?time=${Date.now()}`
  );

  if (!response.ok) {
    throw new Error(
      "No prepared swap was found. Run npm start first."
    );
  }

  preparedSwap = await response.json();

  details.innerHTML = `
    <p><strong>Network:</strong> ${preparedSwap.network}</p>
    <p><strong>Wallet:</strong> ${preparedSwap.wallet}</p>

    <p>
      <strong>Input:</strong>
      ${preparedSwap.input.amount}
      ${preparedSwap.input.asset}
    </p>

    <p>
      <strong>Expected output:</strong>
      ${preparedSwap.expectedOutput.amount}
      ${preparedSwap.expectedOutput.asset}
    </p>

    <p>
      <strong>Slippage:</strong>
      ${preparedSwap.slippagePercent}%
    </p>

    <p>
      <strong>Price impact:</strong>
      ${preparedSwap.priceImpactPercent}%
    </p>

    <p>
      <strong>Estimated network fee:</strong>
      ${preparedSwap.estimatedFeeSol} SOL
    </p>

    <p>
      <strong>Transactions:</strong>
      ${preparedSwap.transactions.length}
    </p>
  `;
}

function decodeTransaction(base64) {
  const binary = atob(base64);

  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  );

  return VersionedTransaction.deserialize(bytes);
}

function readableError(error) {
  console.error(error);

  if (error?.logs?.length) {
    return `${error.message}\n\n${error.logs.join("\n")}`;
  }

  return error?.message || String(error);
}

connectButton.addEventListener("click", async () => {
  try {
    walletStatus.textContent = "Connecting to Phantom...";

    phantom = window.phantom?.solana;

    if (!phantom?.isPhantom) {
      throw new Error(
        "Phantom browser extension was not detected."
      );
    }

    const response = await phantom.connect();

    connectedWallet = response.publicKey.toString();

    if (connectedWallet !== preparedSwap.wallet) {
      submitButton.disabled = true;

      throw new Error(
        `Wrong wallet connected. Expected ${preparedSwap.wallet}, but Phantom connected ${connectedWallet}.`
      );
    }

    walletStatus.textContent =
      `Connected: ${connectedWallet} · Solana Devnet`;

    connectButton.disabled = true;
    submitButton.disabled = false;
  } catch (error) {
    walletStatus.textContent =
      `Connection error: ${readableError(error)}`;
  }
});

submitButton.addEventListener("click", async () => {
  try {
    submitButton.disabled = true;

    const signatures = [];

    for (
      const encodedTransaction
      of preparedSwap.transactions
    ) {
      const transaction =
        decodeTransaction(encodedTransaction);

      /*
       * Raydium assembled the instructions for us,
       * but we refresh the recent blockhash immediately
       * before signing.
       *
       * The transaction is still unsigned here.
       */
      transactionStatus.textContent =
        "Refreshing transaction blockhash...";

      const latestBlockhash =
        await connection.getLatestBlockhash(
          "confirmed"
        );

      transaction.message.recentBlockhash =
        latestBlockhash.blockhash;

      transactionStatus.textContent =
        "Simulating transaction on Solana Devnet...";

      const simulation =
        await connection.simulateTransaction(
          transaction,
          {
            sigVerify: false,
            commitment: "confirmed",
          }
        );

      if (simulation.value.err) {
        const logs =
          simulation.value.logs?.join("\n") ||
          "No program logs returned.";

        throw new Error(
          `Devnet simulation failed: ${JSON.stringify(
            simulation.value.err
          )}\n\n${logs}`
        );
      }

      transactionStatus.textContent =
        "Simulation passed. Waiting for your approval in Phantom...";

      const signedTransaction =
        await phantom.signTransaction(transaction);

      transactionStatus.textContent =
        "Signature received. Submitting to Solana Devnet...";

      const signature =
        await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
            maxRetries: 5,
          }
        );

      transactionStatus.textContent =
        "Transaction submitted. Waiting for confirmation...";

      const confirmation =
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight:
              latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed on-chain: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }

      signatures.push(signature);
    }

    transactionStatus.innerHTML = `
      <strong>Swap confirmed on Solana Devnet.</strong>
      <br /><br />
      Transaction signature:
      <code>${signatures.join(", ")}</code>
    `;
  } catch (error) {
    transactionStatus.textContent =
      `Swap not completed: ${readableError(error)}`;

    submitButton.disabled = false;
  }
});

loadPreparedSwap().catch((error) => {
  details.textContent = readableError(error);
  connectButton.disabled = true;
});
