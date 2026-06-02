/**
 * In-browser Python execution + auto-grading harness (Pyodide).
 *
 * The exercise test files are real pytest modules (class-based tests,
 * `pytest.approx`, etc.). Rather than install pytest over the network, we
 * inject a tiny `pytest` shim covering the surface the exercises use, plus a
 * lightweight collector/runner. This keeps grading fully self-contained: the
 * only network dependency is the Pyodide runtime itself.
 *
 * The pure parsing logic (`parseGradeOutput`) is unit-tested; the Pyodide glue
 * lives in `usePyodide` / `PythonExercise`.
 */

export type TestStatus = 'passed' | 'failed' | 'error'

export interface TestCase {
  name: string
  status: TestStatus
  message: string | null
}

export interface GradeResult {
  results: TestCase[]
  passed: number
  total: number
  allPassed: boolean
  /** Set when the learner's code couldn't even be imported (syntax error, etc). */
  compileError: string | null
}

/**
 * Python source loaded once into the Pyodide interpreter. Defines:
 *   - a minimal `pytest` shim (approx / raises / mark / fixture)
 *   - `_vd_run(user_code)` -> stdout/err for the "Run" button
 *   - `_vd_grade(module_name, user_code, test_code)` -> JSON string of results
 */
export const PYTHON_HARNESS = `
import sys, json, types, io, contextlib, traceback

def _vd_close(a, b, rel, abs_):
    try:
        return abs(a - b) <= max(rel * max(abs(a), abs(b)), abs_)
    except TypeError:
        return a == b

class _VDApprox:
    def __init__(self, expected, rel=1e-6, abs=1e-12):
        self.expected = expected
        self.rel = rel
        self.abs = abs
    def __eq__(self, other):
        exp = self.expected
        if isinstance(exp, (list, tuple)):
            try:
                if len(other) != len(exp):
                    return False
                return all(_vd_close(o, e, self.rel, self.abs) for o, e in zip(other, exp))
            except TypeError:
                return NotImplemented
        return _vd_close(other, exp, self.rel, self.abs)
    def __repr__(self):
        return "approx(" + repr(self.expected) + ")"
    __hash__ = None

class _VDRaises:
    def __init__(self, expected_exception):
        self.expected_exception = expected_exception
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            raise AssertionError("DID NOT RAISE " + getattr(self.expected_exception, "__name__", str(self.expected_exception)))
        return issubclass(exc_type, self.expected_exception)

class _VDMark:
    def __getattr__(self, name):
        def decorator(*args, **kwargs):
            if len(args) == 1 and callable(args[0]) and not kwargs:
                return args[0]
            def wrap(func):
                return func
            return wrap
        return decorator

def _vd_fixture(*args, **kwargs):
    if len(args) == 1 and callable(args[0]) and not kwargs:
        return args[0]
    def wrap(func):
        return func
    return wrap

def _vd_make_pytest():
    mod = types.ModuleType("pytest")
    mod.approx = _VDApprox
    mod.raises = _VDRaises
    mod.mark = _VDMark()
    mod.fixture = _vd_fixture
    mod.skip = lambda *a, **k: (_ for _ in ()).throw(AssertionError("skipped"))
    return mod

def _vd_run(user_code):
    out = io.StringIO()
    result = {"stdout": "", "error": None}
    try:
        ns = {"__name__": "__main__"}
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(compile(user_code, "solution.py", "exec"), ns)
    except Exception:
        result["error"] = traceback.format_exc(limit=3)
    result["stdout"] = out.getvalue()
    return json.dumps(result)

def _vd_collect(test_ns):
    cases = []
    for name, obj in list(test_ns.items()):
        if name.startswith("test_") and callable(obj):
            cases.append((name, obj))
        elif name.startswith("Test") and isinstance(obj, type):
            try:
                instance = obj()
            except Exception:
                continue
            for attr in dir(obj):
                if attr.startswith("test_") and callable(getattr(obj, attr)):
                    cases.append((obj.__name__ + "." + attr, getattr(instance, attr)))
    return cases

def _vd_grade(module_name, user_code, test_code):
    sys.modules["pytest"] = _vd_make_pytest()
    # Build the learner's module from their code.
    try:
        user_mod = types.ModuleType(module_name)
        user_mod.__dict__["__name__"] = module_name
        exec(compile(user_code, module_name + ".py", "exec"), user_mod.__dict__)
        sys.modules[module_name] = user_mod
    except Exception:
        return json.dumps({
            "results": [],
            "compileError": traceback.format_exc(limit=3),
        })

    # Execute the test module so its imports resolve against the learner module.
    try:
        test_ns = {"__name__": "test_" + module_name}
        exec(compile(test_code, "test_" + module_name + ".py", "exec"), test_ns)
    except Exception:
        return json.dumps({
            "results": [],
            "compileError": "Could not load tests: " + traceback.format_exc(limit=2),
        })

    results = []
    for case_name, fn in _vd_collect(test_ns):
        try:
            fn()
            results.append({"name": case_name, "status": "passed", "message": None})
        except AssertionError as exc:
            results.append({"name": case_name, "status": "failed", "message": str(exc) or "assertion failed"})
        except Exception as exc:
            results.append({"name": case_name, "status": "error", "message": type(exc).__name__ + ": " + str(exc)})
    return json.dumps({"results": results, "compileError": None})
`

/**
 * Parse the JSON emitted by `_vd_grade` into a typed, summarized result.
 */
export function parseGradeOutput(json: string): GradeResult {
  let parsed: { results?: TestCase[]; compileError?: string | null }
  try {
    parsed = JSON.parse(json)
  } catch {
    return {
      results: [],
      passed: 0,
      total: 0,
      allPassed: false,
      compileError: 'Could not parse grading output',
    }
  }

  const results = Array.isArray(parsed.results) ? parsed.results : []
  const passed = results.filter((r) => r.status === 'passed').length
  const total = results.length
  const compileError = parsed.compileError ?? null

  return {
    results,
    passed,
    total,
    allPassed: total > 0 && passed === total && !compileError,
    compileError,
  }
}

export interface RunOutput {
  stdout: string
  error: string | null
}

export function parseRunOutput(json: string): RunOutput {
  try {
    const parsed = JSON.parse(json)
    return { stdout: parsed.stdout ?? '', error: parsed.error ?? null }
  } catch {
    return { stdout: '', error: 'Could not parse run output' }
  }
}
