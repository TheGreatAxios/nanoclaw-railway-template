#!/usr/bin/env node
/**
 * NanoClaw Railway Patch — Applies NO_CONTAINER mode modifications
 * Run this after cloning NanoClaw but before building
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src';
const AGENT_RUNNER_DIR = path.join('container', 'agent-runner', 'src');

// ---------------------------------------------------------------------------
// Patch 1: container-runtime.ts — skip Docker checks in NO_CONTAINER mode
// ---------------------------------------------------------------------------
function patchContainerRuntime() {
  const filePath = path.join(SRC_DIR, 'container-runtime.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  content = content.replace(
    "import { logger } from './logger.js';",
    `import { logger } from './logger.js';

const NO_CONTAINER = process.env.NO_CONTAINER === 'true';`,
  );

  content = content.replace(
    'export function ensureContainerRuntimeRunning(): void {',
    `export function ensureContainerRuntimeRunning(): void {
  if (NO_CONTAINER) {
    logger.info('Running in NO_CONTAINER mode — skipping Docker check');
    return;
  }
`,
  );

  content = content.replace(
    'export function cleanupOrphans(): void {',
    `export function cleanupOrphans(): void {
  if (NO_CONTAINER) {
    logger.debug('NO_CONTAINER mode — skipping orphan cleanup');
    return;
  }
`,
  );

  fs.writeFileSync(filePath, content);
  console.log('✓ Patched src/container-runtime.ts');
}

// ---------------------------------------------------------------------------
// Patch 2: container-runner.ts — add NO_CONTAINER fork-based agent runner
//   Strategy: surgical insertions + append.  Nothing is removed so exports
//   like writeTasksSnapshot / writeGroupsSnapshot / AvailableGroup survive.
// ---------------------------------------------------------------------------
function patchContainerRunner() {
  const filePath = path.join(SRC_DIR, 'container-runner.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // 2a. Add `fork` to the child_process import
  content = content.replace(
    "import { ChildProcess, exec, spawn } from 'child_process';",
    "import { ChildProcess, exec, fork, spawn } from 'child_process';",
  );

  // 2b. Add NO_CONTAINER constant after the output-end marker
  content = content.replace(
    "const OUTPUT_END_MARKER = '---NANOCLAW_OUTPUT_END---';",
    `const OUTPUT_END_MARKER = '---NANOCLAW_OUTPUT_END---';

/** Whether to run without containers (Railway / PaaS mode). */
const NO_CONTAINER = process.env.NO_CONTAINER === 'true';`,
  );

  // 2c. Make readSecrets() fall back to process.env when .env is absent
  //     (Railway injects secrets via environment variables, not a .env file)
  content = content.replace(
    `function readSecrets(): Record<string, string> {
  return readEnvFile([
    'CLAUDE_CODE_OAUTH_TOKEN',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
  ]);
}`,
    `function readSecrets(): Record<string, string> {
  const SECRET_KEYS = [
    'CLAUDE_CODE_OAUTH_TOKEN',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
  ];
  const fromFile = readEnvFile(SECRET_KEYS);
  if (Object.keys(fromFile).length > 0) return fromFile;
  // Fallback: read from process.env (Railway / PaaS)
  const result: Record<string, string> = {};
  for (const key of SECRET_KEYS) {
    if (process.env[key]) result[key] = process.env[key]!;
  }
  return result;
}`,
  );

  // 2d. Insert NO_CONTAINER early-return inside runContainerAgent
  //     We target the first two statements after the function signature.
  content = content.replace(
    `  const groupDir = resolveGroupFolderPath(group.folder);
  fs.mkdirSync(groupDir, { recursive: true });

  const mounts = buildVolumeMounts(group, input.isMain);`,
    `  const groupDir = resolveGroupFolderPath(group.folder);
  fs.mkdirSync(groupDir, { recursive: true });

  // NO_CONTAINER mode: run agent-runner directly via fork()
  if (NO_CONTAINER) {
    return runNoContainerAgent(group, input, onProcess, onOutput, startTime, groupDir);
  }

  const mounts = buildVolumeMounts(group, input.isMain);`,
  );

  // 2e. Append runNoContainerAgent function at the end of the file
  content += `

// ---------------------------------------------------------------------------
// NO_CONTAINER mode: fork agent-runner as a Node.js child process
// ---------------------------------------------------------------------------
async function runNoContainerAgent(
  group: RegisteredGroup,
  input: ContainerInput,
  onProcess: (proc: ChildProcess, containerName: string) => void,
  onOutput: ((output: ContainerOutput) => Promise<void>) | undefined,
  startTime: number,
  groupDir: string,
): Promise<ContainerOutput> {
  // Re-use buildVolumeMounts for its side-effects (settings.json, skills
  // sync, IPC dirs, sessions dir) — we just ignore the returned mounts.
  buildVolumeMounts(group, input.isMain);

  const agentRunnerPath = path.join(
    process.cwd(), 'container', 'agent-runner', 'dist', 'index.js',
  );
  if (!fs.existsSync(agentRunnerPath)) {
    throw new Error(
      \`Agent runner not found at \${agentRunnerPath}. Run: cd container/agent-runner && npm run build\`,
    );
  }

  const groupIpcDir = resolveGroupIpcPath(group.folder);
  const groupHomeDir = path.join(DATA_DIR, 'sessions', group.folder);

  // Build a clean environment — secrets are passed via stdin, NOT env,
  // so they don't leak to Bash subprocesses the agent spawns.
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  // Remove secrets from env to match Docker-mode security model
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  delete env.CLAUDE_CODE_OAUTH_TOKEN;

  Object.assign(env, {
    TZ: TIMEZONE,
    NO_CONTAINER: 'true',
    HOME: groupHomeDir,
    WORKSPACE_GROUP: groupDir,
    WORKSPACE_IPC: groupIpcDir,
    WORKSPACE_PROJECT: process.cwd(),
  });

  // Global memory dir for non-main groups
  if (!input.isMain) {
    const globalDir = path.join(GROUPS_DIR, 'global');
    if (fs.existsSync(globalDir)) {
      env.WORKSPACE_GLOBAL = globalDir;
    }
  }

  logger.info({ group: group.name }, 'Spawning NO_CONTAINER agent');

  const logsDir = path.join(groupDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  return new Promise((resolve) => {
    const container = fork(agentRunnerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env,
      cwd: groupDir,
    });

    const processName = \`nocontainer-\${group.folder}\`;
    onProcess(container, processName);

    let stdout = '';
    let stderr = '';
    let stdoutTruncated = false;
    let newSessionId: string | undefined;
    let parseBuffer = '';
    let hadStreamingOutput = false;
    let outputChain = Promise.resolve();

    // Pass input (with secrets) via stdin, then remove secrets — same as
    // Docker mode so they never appear in logs.
    input.secrets = readSecrets();
    container.stdin?.write(JSON.stringify(input));
    container.stdin?.end();
    delete input.secrets;

    // Timeout handling
    let timedOut = false;
    const configTimeout = group.containerConfig?.timeout || CONTAINER_TIMEOUT;
    const timeoutMs = Math.max(configTimeout, IDLE_TIMEOUT + 30_000);

    const killOnTimeout = () => {
      timedOut = true;
      logger.error({ group: group.name }, 'NO_CONTAINER agent timeout');
      container.kill('SIGTERM');
      setTimeout(() => container.kill('SIGKILL'), 5000);
    };

    let timeout = setTimeout(killOnTimeout, timeoutMs);

    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(killOnTimeout, timeoutMs);
    };

    container.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();

      if (!stdoutTruncated) {
        const remaining = CONTAINER_MAX_OUTPUT_SIZE - stdout.length;
        if (chunk.length > remaining) {
          stdout += chunk.slice(0, remaining);
          stdoutTruncated = true;
        } else {
          stdout += chunk;
        }
      }

      if (onOutput) {
        parseBuffer += chunk;
        let startIdx: number;
        while ((startIdx = parseBuffer.indexOf(OUTPUT_START_MARKER)) !== -1) {
          const endIdx = parseBuffer.indexOf(OUTPUT_END_MARKER, startIdx);
          if (endIdx === -1) break;

          const jsonStr = parseBuffer
            .slice(startIdx + OUTPUT_START_MARKER.length, endIdx)
            .trim();
          parseBuffer = parseBuffer.slice(endIdx + OUTPUT_END_MARKER.length);

          try {
            const parsed: ContainerOutput = JSON.parse(jsonStr);
            if (parsed.newSessionId) newSessionId = parsed.newSessionId;
            hadStreamingOutput = true;
            resetTimeout();
            outputChain = outputChain.then(() => onOutput(parsed));
          } catch (err) {
            logger.warn({ group: group.name, error: err }, 'Failed to parse output');
          }
        }
      }
    });

    container.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    container.on('close', (code: number | null) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      // Write log file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(logsDir, \`agent-\${timestamp}.log\`);
      fs.writeFileSync(logFile, [
        '=== NO_CONTAINER Agent Log ===',
        \`Group: \${group.name}\`,
        \`Duration: \${duration}ms\`,
        \`Exit Code: \${code}\`,
        \`Had Streaming Output: \${hadStreamingOutput}\`,
        '',
        '=== Stderr ===',
        stderr.slice(-2000),
      ].join('\\n'));

      if (timedOut) {
        if (hadStreamingOutput) {
          outputChain.then(() => resolve({ status: 'success', result: null, newSessionId }));
        } else {
          resolve({ status: 'error', result: null, error: 'Agent timed out' });
        }
        return;
      }

      if (code !== 0) {
        resolve({
          status: 'error',
          result: null,
          error: \`Agent exited with code \${code}: \${stderr.slice(-200)}\`,
        });
        return;
      }

      // Streaming mode
      if (onOutput) {
        outputChain.then(() => resolve({ status: 'success', result: null, newSessionId }));
        return;
      }

      // Legacy: parse last output marker pair
      try {
        const si = stdout.indexOf(OUTPUT_START_MARKER);
        const ei = stdout.indexOf(OUTPUT_END_MARKER);
        if (si !== -1 && ei !== -1 && ei > si) {
          const jsonStr = stdout.slice(si + OUTPUT_START_MARKER.length, ei).trim();
          resolve(JSON.parse(jsonStr));
        } else {
          resolve({ status: 'success', result: null, newSessionId });
        }
      } catch (err) {
        resolve({ status: 'error', result: null, error: \`Parse error: \${err}\` });
      }
    });

    container.on('error', (err: Error) => {
      clearTimeout(timeout);
      resolve({ status: 'error', result: null, error: \`Agent spawn error: \${err.message}\` });
    });
  });
}
`;

  fs.writeFileSync(filePath, content);
  console.log('✓ Patched src/container-runner.ts');
}

// ---------------------------------------------------------------------------
// Patch 3: agent-runner/src/index.ts — use env-var workspace paths
// ---------------------------------------------------------------------------
function patchAgentRunnerIndex() {
  const filePath = path.join(AGENT_RUNNER_DIR, 'index.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // IPC input directory
  content = content.replace(
    "const IPC_INPUT_DIR = '/workspace/ipc/input';",
    "const IPC_INPUT_DIR = path.join(process.env.WORKSPACE_IPC || '/workspace/ipc', 'input');",
  );

  // Conversations archive directory
  content = content.replace(
    "const conversationsDir = '/workspace/group/conversations';",
    "const conversationsDir = path.join(process.env.WORKSPACE_GROUP || '/workspace/group', 'conversations');",
  );

  // Global CLAUDE.md path
  content = content.replace(
    "const globalClaudeMdPath = '/workspace/global/CLAUDE.md';",
    "const globalClaudeMdPath = path.join(process.env.WORKSPACE_GLOBAL || '/workspace/global', 'CLAUDE.md');",
  );

  // Extra dirs base
  content = content.replace(
    "const extraBase = '/workspace/extra';",
    "const extraBase = process.env.WORKSPACE_EXTRA || '/workspace/extra';",
  );

  // Query cwd
  content = content.replace(
    "cwd: '/workspace/group',",
    "cwd: process.env.WORKSPACE_GROUP || '/workspace/group',",
  );

  fs.writeFileSync(filePath, content);
  console.log('✓ Patched container/agent-runner/src/index.ts');
}

// ---------------------------------------------------------------------------
// Patch 4: agent-runner/src/ipc-mcp-stdio.ts — use env-var IPC path
// ---------------------------------------------------------------------------
function patchAgentRunnerMcp() {
  const filePath = path.join(AGENT_RUNNER_DIR, 'ipc-mcp-stdio.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  content = content.replace(
    "const IPC_DIR = '/workspace/ipc';",
    "const IPC_DIR = process.env.WORKSPACE_IPC || '/workspace/ipc';",
  );

  fs.writeFileSync(filePath, content);
  console.log('✓ Patched container/agent-runner/src/ipc-mcp-stdio.ts');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('Applying NanoClaw Railway patches…');
try {
  patchContainerRuntime();
  patchContainerRunner();
  patchAgentRunnerIndex();
  patchAgentRunnerMcp();
  console.log('\nAll patches applied successfully!');
} catch (err) {
  console.error('Failed to apply patches:', err);
  process.exit(1);
}
