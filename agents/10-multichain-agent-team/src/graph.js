export function topologicalOrder(operations) {
  const byId = new Map(operations.map((operation) => [operation.id, operation]));
  const visiting = new Set();
  const visited = new Set();
  const result = [];

  function visit(id) {
    if (visiting.has(id)) throw new Error(`Dependency cycle detected at ${id}.`);
    if (visited.has(id)) return;
    const operation = byId.get(id);
    if (!operation) throw new Error(`Unknown dependency: ${id}.`);
    visiting.add(id);
    for (const dependency of operation.dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    result.push(id);
  }

  for (const operation of operations) visit(operation.id);
  return result;
}
