// Collects multi-line input from a stream until a line equals the sentinel (default "DONE").
// Pure and testable: it prints nothing itself.
import readline from 'node:readline';

export function readMultilineInput({
  input = process.stdin,
  sentinel = 'DONE',
} = {}) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input, terminal: false });
    const lines = [];
    let stopped = false;

    rl.on('line', (line) => {
      if (stopped) return;
      if (line.trim() === sentinel) {
        stopped = true;
        rl.close();
        return;
      }
      lines.push(line);
    });

    rl.on('close', () => resolve(lines.join('\n')));
    rl.on('error', reject);
  });
}
