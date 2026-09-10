import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchRpcSnapshot,
  jsonRpcRequest,
  resolveNetworkSnapshots,
} from "../src/rpc.js";

function rpcFetch(results) {
  return async (_url, options) => {
    const request = JSON.parse(options.body);
    const value = results[request.method];
    return {
      ok: true,
      status: 200,
      json: async () =>
        value instanceof Error
          ? { jsonrpc: "2.0", id: 1, error: { message: value.message } }
          : { jsonrpc: "2.0", id: 1, result: value },
    };
  };
}

const network = {
  name: "Base Sepolia",
  chainId: 84532,
  currencySymbol: "ETH",
  source: "rpc",
  rpcEnv: "BASE_SEPOLIA_RPC_URL",
  staleAfterSeconds: 300,
  nativeTokenPriceUsd: 2400,
};

test("rpc: sends a read-only JSON-RPC request", async () => {
  let captured;
  const result = await jsonRpcRequest({
    url: "https://rpc.example",
    method: "eth_chainId",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ result: "0x14a34" }) };
    },
  });
  assert.equal(result, "0x14a34");
  assert.equal(captured.options.method, "POST");
  assert.match(captured.options.body, /eth_chainId/);
});

test("rpc: reports HTTP and RPC errors", async () => {
  await assert.rejects(
    jsonRpcRequest({
      url: "https://rpc.example",
      method: "eth_chainId",
      fetchImpl: async () => ({ ok: false, status: 429 }),
    }),
    /HTTP 429/
  );
  await assert.rejects(
    jsonRpcRequest({
      url: "https://rpc.example",
      method: "eth_chainId",
      fetchImpl: rpcFetch({ eth_chainId: new Error("rate limited") }),
    }),
    /rate limited/
  );
});

test("rpc: builds an EIP-1559 snapshot", async () => {
  const snapshot = await fetchRpcSnapshot({
    network,
    rpcUrl: "https://rpc.example",
    now: new Date("2026-09-10T06:00:00Z"),
    fetchImpl: rpcFetch({
      eth_chainId: "0x14a34",
      eth_getBlockByNumber: { baseFeePerGas: "0xb71b00" },
      eth_gasPrice: "0xc65d40",
      eth_maxPriorityFeePerGas: "0xf4240",
    }),
  });
  assert.equal(snapshot.feeModel, "eip1559");
  assert.equal(snapshot.baseFeePerGasWei, "12000000");
  assert.equal(snapshot.priorityFeePerGasWei, "1000000");
  assert.equal(snapshot.observedAt, "2026-09-10T06:00:00.000Z");
});

test("rpc: derives a priority fee when the method is unsupported", async () => {
  const snapshot = await fetchRpcSnapshot({
    network,
    rpcUrl: "https://rpc.example",
    fetchImpl: rpcFetch({
      eth_chainId: "0x14a34",
      eth_getBlockByNumber: { baseFeePerGas: "0xb71b00" },
      eth_gasPrice: "0xc65d40",
      eth_maxPriorityFeePerGas: new Error("unsupported"),
    }),
  });
  assert.equal(snapshot.priorityFeePerGasWei, "1000000");
});

test("rpc: supports legacy networks without a base fee", async () => {
  const snapshot = await fetchRpcSnapshot({
    network,
    rpcUrl: "https://rpc.example",
    fetchImpl: rpcFetch({
      eth_chainId: "0x14a34",
      eth_getBlockByNumber: {},
      eth_gasPrice: "0x6fc23ac00",
      eth_maxPriorityFeePerGas: new Error("unsupported"),
    }),
  });
  assert.equal(snapshot.feeModel, "legacy");
  assert.equal(snapshot.gasPriceWei, "30000000000");
});

test("rpc: rejects an endpoint for the wrong chain", async () => {
  await assert.rejects(
    fetchRpcSnapshot({
      network,
      rpcUrl: "https://rpc.example",
      fetchImpl: rpcFetch({
        eth_chainId: "0x1",
        eth_getBlockByNumber: {},
        eth_gasPrice: "0x1",
      }),
    }),
    /expected 84532/
  );
});

test("rpc resolution: preserves offline snapshots", async () => {
  const snapshot = { ...network, source: "snapshot", observedAt: "2026-09-10T06:00:00Z" };
  const result = await resolveNetworkSnapshots({ networks: [snapshot], live: false });
  assert.equal(result[0], snapshot);
});

test("rpc resolution: requires live mode and a configured URL", async () => {
  await assert.rejects(
    resolveNetworkSnapshots({ networks: [network], live: false }),
    /requires --live/
  );
  await assert.rejects(
    resolveNetworkSnapshots({ networks: [network], live: true, env: {} }),
    /missing or still a placeholder/
  );
});
