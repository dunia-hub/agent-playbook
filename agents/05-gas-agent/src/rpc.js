function parseHexQuantity(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error(`${label} returned an invalid hex quantity.`);
  }
  return BigInt(value);
}

export async function jsonRpcRequest({ url, method, params = [], fetchImpl = fetch }) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}.`);
  }
  const body = await response.json();
  if (body.error) {
    throw new Error(`${method} failed: ${body.error.message || "RPC error"}`);
  }
  if (body.result === undefined || body.result === null) {
    throw new Error(`${method} returned no result.`);
  }
  return body.result;
}

export async function fetchRpcSnapshot({
  network,
  rpcUrl,
  fetchImpl = fetch,
  now = new Date(),
}) {
  const [chainIdHex, block, gasPriceHex] = await Promise.all([
    jsonRpcRequest({ url: rpcUrl, method: "eth_chainId", fetchImpl }),
    jsonRpcRequest({
      url: rpcUrl,
      method: "eth_getBlockByNumber",
      params: ["latest", false],
      fetchImpl,
    }),
    jsonRpcRequest({ url: rpcUrl, method: "eth_gasPrice", fetchImpl }),
  ]);

  const returnedChainId = Number(parseHexQuantity(chainIdHex, "eth_chainId"));
  if (returnedChainId !== network.chainId) {
    throw new Error(
      `${network.name} RPC returned chain ${returnedChainId}, expected ${network.chainId}.`
    );
  }

  const gasPrice = parseHexQuantity(gasPriceHex, "eth_gasPrice");
  let priorityFee;
  try {
    const priorityHex = await jsonRpcRequest({
      url: rpcUrl,
      method: "eth_maxPriorityFeePerGas",
      fetchImpl,
    });
    priorityFee = parseHexQuantity(priorityHex, "eth_maxPriorityFeePerGas");
  } catch {
    priorityFee = null;
  }

  if (block && block.baseFeePerGas !== undefined && block.baseFeePerGas !== null) {
    const baseFee = parseHexQuantity(block.baseFeePerGas, "baseFeePerGas");
    const derivedPriority = gasPrice > baseFee ? gasPrice - baseFee : 0n;
    return {
      ...network,
      source: "rpc",
      feeModel: "eip1559",
      observedAt: now.toISOString(),
      baseFeePerGasWei: baseFee.toString(),
      priorityFeePerGasWei: (priorityFee ?? derivedPriority).toString(),
      gasPriceWei: gasPrice.toString(),
    };
  }

  return {
    ...network,
    source: "rpc",
    feeModel: "legacy",
    observedAt: now.toISOString(),
    gasPriceWei: gasPrice.toString(),
  };
}

export async function resolveNetworkSnapshots({
  networks,
  live,
  env = process.env,
  fetchImpl = fetch,
  now = new Date(),
}) {
  const snapshots = [];
  for (const network of networks) {
    if (network.source === "snapshot") {
      snapshots.push(network);
      continue;
    }
    if (!live) {
      throw new Error(`${network.name} requires --live to read its RPC endpoint.`);
    }
    const rpcUrl = env[network.rpcEnv];
    if (!rpcUrl || /your-.+-rpc\.example/.test(rpcUrl)) {
      throw new Error(`${network.rpcEnv} is missing or still a placeholder.`);
    }
    snapshots.push(
      await fetchRpcSnapshot({ network, rpcUrl, fetchImpl, now })
    );
  }
  return snapshots;
}
