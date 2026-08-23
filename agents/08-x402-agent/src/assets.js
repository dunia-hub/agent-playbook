const assets = {
  "eip155:84532": [
    {
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      symbol: "USDC",
      decimals: 6,
      name: "USDC",
      version: "2",
    },
  ],
  "eip155:43113": [
    {
      asset: "0x5425890298aed601595a70AB815c96711a31Bc65",
      symbol: "USDC",
      decimals: 6,
      name: "USD Coin",
      version: "2",
    },
  ],
};

export function getDefaultAsset(network, symbol = "USDC") {
  const asset = assets[network]?.find(
    (candidate) =>
      candidate.symbol.toLowerCase() === symbol.toLowerCase(),
  );

  if (!asset) {
    throw new Error(
      `No configured ${symbol} asset for network ${network}.`,
    );
  }

  return asset;
}

export function findDefaultAsset(asset, network) {
  return assets[network]?.find(
    (candidate) =>
      candidate.asset.toLowerCase() === asset.toLowerCase(),
  );
}
