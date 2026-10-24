const vm = require('vm');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRATCH_DIR = path.join(os.tmpdir(), 'algorevis_sandbox');
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

/**
 * Executes JavaScript code in an isolated V8 VM Context
 */
const executeJavaScript = async (code, input = '', timeoutMs = 2000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let logs = [];

    const sandbox = {
      console: {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      },
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      parseInt,
      parseFloat,
      isNaN
    };

    try {
      const context = vm.createContext(sandbox);

      // Wrapper to handle either function solution(...) or stdin/stdout scripts with ListNode and TreeNode support
      const wrappedScript = `
        function ListNode(val, next) {
          this.val = (val === undefined ? 0 : val);
          this.next = (next === undefined ? null : next);
        }

        function TreeNode(val, left, right) {
          this.val = (val === undefined ? 0 : val);
          this.left = (left === undefined ? null : left);
          this.right = (right === undefined ? null : right);
        }

        function __arrayToList(arr) {
          if (!Array.isArray(arr) || arr.length === 0) return null;
          const dummy = new ListNode(0);
          let cur = dummy;
          for (let i = 0; i < arr.length; i++) {
            cur.next = new ListNode(arr[i]);
            cur = cur.next;
          }
          return dummy.next;
        }

        function __listToArray(head) {
          const res = [];
          const visited = new Set();
          let cur = head;
          while (cur && !visited.has(cur)) {
            visited.add(cur);
            res.push(cur.val !== undefined ? cur.val : cur);
            cur = cur.next;
          }
          return res;
        }

        function __arrayToTree(arr) {
          if (!Array.isArray(arr) || arr.length === 0 || arr[0] === null) return null;
          const root = new TreeNode(arr[0]);
          const queue = [root];
          let i = 1;
          while (queue.length > 0 && i < arr.length) {
            const node = queue.shift();
            if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
              node.left = new TreeNode(arr[i]);
              queue.push(node.left);
            }
            i++;
            if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
              node.right = new TreeNode(arr[i]);
              queue.push(node.right);
            }
            i++;
          }
          return root;
        }

        function __treeToArray(root) {
          if (!root) return [];
          const res = [];
          const queue = [root];
          while (queue.length > 0) {
            const node = queue.shift();
            if (node) {
              res.push(node.val);
              queue.push(node.left);
              queue.push(node.right);
            } else {
              res.push(null);
            }
          }
          while (res.length > 0 && res[res.length - 1] === null) {
            res.pop();
          }
          return res;
        }

        ${code}

        (function() {
          if (typeof solution === 'function') {
            let parsedArgs;
            try {
              const p = JSON.parse(${JSON.stringify(input)});
              if (!Array.isArray(p)) {
                parsedArgs = [p];
              } else if (solution.length === 1 && p.length === 1 && Array.isArray(p[0])) {
                parsedArgs = p;
              } else if (solution.length === 1 && p.length > 1) {
                parsedArgs = [p];
              } else {
                parsedArgs = p;
              }
            } catch {
              parsedArgs = [${JSON.stringify(input)}];
            }

            // Check if solution operates on ListNode or TreeNode
            const codeStr = solution.toString();
            const isListProb = codeStr.includes('.next') || codeStr.includes('ListNode');
            const isTreeProb = (codeStr.includes('.left') || codeStr.includes('.right') || codeStr.includes('TreeNode')) && !isListProb;

            let finalArgs = parsedArgs.map((arg, idx) => {
              if (idx === 0 && isListProb && Array.isArray(arg)) {
                return __arrayToList(arg);
              }
              if (idx === 0 && isTreeProb && Array.isArray(arg)) {
                return __arrayToTree(arg);
              }
              return arg;
            });

            let res;
            try {
              res = solution.apply(null, finalArgs);
            } catch (err) {
              // Fallback to original parsedArgs if custom conversion threw
              res = solution.apply(null, parsedArgs);
            }

            if (res !== undefined) {
              if (res && typeof res === 'object' && ('next' in res || ('val' in res && !('left' in res)))) {
                res = __listToArray(res);
              } else if (res && typeof res === 'object' && ('left' in res || 'right' in res)) {
                res = __treeToArray(res);
              }
              console.log(typeof res === 'object' ? JSON.stringify(res) : String(res));
            }
          }
        })();
      `;

      const script = new vm.Script(wrappedScript);
      script.runInContext(context, { timeout: timeoutMs });

      const stdout = logs.join('\n').trim();
      resolve({
        stdout,
        stderr: '',
        executionTimeMs: Date.now() - startTime,
        error: null
      });
    } catch (err) {
      resolve({
        stdout: logs.join('\n').trim(),
        stderr: err.message,
        executionTimeMs: Date.now() - startTime,
        error: err.name === 'TimeoutError' ? 'Time Limit Exceeded (2s)' : err.message
      });
    }
  });
};

/**
 * Executes Python code via isolated child process
 */
const executePython = async (code, input = '', timeoutMs = 3000) => {
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const filePath = path.join(SCRATCH_DIR, `runner_${fileId}.py`);

  // Wrap python code to invoke solution() function if defined
  const wrappedCode = `
import sys, json, inspect

${code}

if __name__ == '__main__':
    raw_input_data = """${input.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""
    if 'solution' in globals() and callable(globals()['solution']):
        try:
            parsed = json.loads(raw_input_data) if raw_input_data.strip() else []
            sig = inspect.signature(solution)
            if len(sig.parameters) == 1:
                res = solution(parsed)
            elif isinstance(parsed, list):
                res = solution(*parsed)
            else:
                res = solution(parsed)
            if res is not None:
                if isinstance(res, (dict, list)):
                    print(json.dumps(res))
                else:
                    print(res)
        except Exception as e:
            sys.stderr.write(str(e))
`;

  await fs.promises.writeFile(filePath, wrappedCode, 'utf8');

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn('python', [filePath], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', async (code) => {
      clearTimeout(timer);
      try { await fs.promises.unlink(filePath); } catch {}

      if (timedOut) {
        return resolve({
          stdout: stdout.trim(),
          stderr: 'Time Limit Exceeded (3s)',
          executionTimeMs: Date.now() - startTime,
          error: 'Time Limit Exceeded'
        });
      }

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs: Date.now() - startTime,
        error: code !== 0 ? (stderr.trim() || `Process exited with code ${code}`) : null
      });
    });

    child.on('error', async (err) => {
      clearTimeout(timer);
      try { await fs.promises.unlink(filePath); } catch {}
      resolve({
        stdout: '',
        stderr: err.message,
        executionTimeMs: Date.now() - startTime,
        error: `Python runner error: ${err.message}`
      });
    });
  });
};

/**
 * Executes C++ code via compilation with g++ and execution
 */
const executeCpp = async (code, input = '', timeoutMs = 4000) => {
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const srcPath = path.join(SCRATCH_DIR, `code_${fileId}.cpp`);
  const binPath = path.join(SCRATCH_DIR, `bin_${fileId}.exe`);

  await fs.promises.writeFile(srcPath, code, 'utf8');

  return new Promise((resolve) => {
    const startTime = Date.now();

    // 1. Compile
    const compile = spawn('g++', ['-O2', srcPath, '-o', binPath], { windowsHide: true });
    let compileErr = '';
    compile.stderr.on('data', (d) => { compileErr += d.toString(); });

    compile.on('close', (compileCode) => {
      try { fs.unlinkSync(srcPath); } catch {}

      if (compileCode !== 0) {
        return resolve({
          stdout: '',
          stderr: compileErr.trim(),
          executionTimeMs: Date.now() - startTime,
          error: 'Compilation Error: ' + compileErr.slice(0, 300)
        });
      }

      // 2. Run binary
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const runProc = spawn(binPath, [], { windowsHide: true });
      const timer = setTimeout(() => {
        timedOut = true;
        runProc.kill('SIGKILL');
      }, timeoutMs);

      if (input) {
        runProc.stdin.write(input);
      }
      runProc.stdin.end();

      runProc.stdout.on('data', (d) => { stdout += d.toString(); });
      runProc.stderr.on('data', (d) => { stderr += d.toString(); });

      runProc.on('close', (exitCode) => {
        clearTimeout(timer);
        try { fs.unlinkSync(binPath); } catch {}

        if (timedOut) {
          return resolve({
            stdout: stdout.trim(),
            stderr: 'Time Limit Exceeded (4s)',
            executionTimeMs: Date.now() - startTime,
            error: 'Time Limit Exceeded'
          });
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTimeMs: Date.now() - startTime,
          error: exitCode !== 0 ? (stderr.trim() || `Exit code ${exitCode}`) : null
        });
      });

      runProc.on('error', (err) => {
        clearTimeout(timer);
        try { fs.unlinkSync(binPath); } catch {}
        resolve({
          stdout: '',
          stderr: err.message,
          executionTimeMs: Date.now() - startTime,
          error: 'Execution Error: ' + err.message
        });
      });
    });

    compile.on('error', (err) => {
      try { fs.unlinkSync(srcPath); } catch {}
      resolve({
        stdout: '',
        stderr: err.message,
        executionTimeMs: Date.now() - startTime,
        error: 'Compiler error: ' + err.message
      });
    });
  });
};

/**
 * Universal code runner supporting JavaScript, Python, C++
 */
const runCode = async ({ code, language = 'javascript', input = '' }) => {
  const lang = (language || 'javascript').toLowerCase();

  switch (lang) {
    case 'python':
    case 'py':
      return executePython(code, input);
    case 'cpp':
    case 'c++':
    case 'c':
      return executeCpp(code, input);
    case 'javascript':
    case 'js':
    default:
      return executeJavaScript(code, input);
  }
};

/**
 * Evaluates code against a suite of test cases
 */
const evaluateTestCases = async ({ code, language = 'javascript', testCases = [] }) => {
  const results = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = await runCode({
      code,
      language,
      input: tc.input
    });

    const outputTrim = (execRes.stdout || '').trim();
    const expectedTrim = (tc.expectedOutput || '').trim();

    // Normalizing JSON comparisons where applicable
    let passed = outputTrim === expectedTrim;
    if (!passed) {
      try {
        const j1 = JSON.stringify(JSON.parse(outputTrim));
        const j2 = JSON.stringify(JSON.parse(expectedTrim));
        if (j1 === j2) passed = true;
      } catch {}
    }

    if (!passed) allPassed = false;

    results.push({
      testCaseIndex: i + 1,
      input: tc.input,
      output: outputTrim,
      expected: expectedTrim,
      passed,
      error: execRes.error || null,
      executionTimeMs: execRes.executionTimeMs
    });
  }

  return {
    allPassed,
    passedCount: results.filter(r => r.passed).length,
    totalCount: testCases.length,
    results
  };
};

module.exports = {
  runCode,
  evaluateTestCases
};
