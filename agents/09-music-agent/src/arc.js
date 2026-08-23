function validateEnergy(value) {
  if (!Number.isFinite(value) || value < 1 || value > 10) {
    throw new Error("Energy values must be numbers between 1 and 10.");
  }
}

function validatePhase(phase) {
  if (!phase || typeof phase !== "object") {
    throw new Error("Each playlist phase must be an object.");
  }

  if (typeof phase.name !== "string" || phase.name.trim() === "") {
    throw new Error("Each playlist phase must have a name.");
  }

  if (!Number.isInteger(phase.tracks) || phase.tracks <= 0) {
    throw new Error("Phase tracks must be a positive integer.");
  }

  validateEnergy(phase.from);
  validateEnergy(phase.to);
}

function interpolateEnergy(from, to, position, totalPositions) {
  if (totalPositions === 1) {
    return Math.round(to);
  }

  const progress = position / (totalPositions - 1);
  return Math.round(from + (to - from) * progress);
}

export function buildEnergyArc(phases) {
  if (!Array.isArray(phases) || phases.length === 0) {
    throw new Error("At least one playlist phase is required.");
  }

  return phases.flatMap((phase) => {
    validatePhase(phase);

    return Array.from({ length: phase.tracks }, (_, index) => ({
      position: index + 1,
      phase: phase.name.trim(),
      targetEnergy: interpolateEnergy(
        phase.from,
        phase.to,
        index,
        phase.tracks,
      ),
    }));
  }).map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}
