import random
import subprocess
import json
import tempfile
import os
import ast
import re
import logging
from typing import Dict, List, Tuple, Optional
import time

try:
    import requests as _requests
    _REQUESTS_AVAILABLE = True
except ImportError:
    _REQUESTS_AVAILABLE = False

logger = logging.getLogger(__name__)


class PistonExecutor:
    """
    Executes compiled languages (Java, C++, C) via two strategies:

    1. LOCAL (primary): Uses locally installed javac + java if available.
       No network required, fastest.

    2. PISTON API (fallback): Uses the EMKC Piston API (emkc.org).
       This API is FREE and requires NO API key.
       It is used automatically when local Java is not installed.

    The caller never needs to know which path was used.
    """

    PISTON_URL = "https://emkc.org/api/v2/piston/execute"
    LANGUAGE_MAP = {
        "java": {"language": "java", "version": "*", "filename": "Main.java"},
        "cpp":  {"language": "c++",  "version": "*", "filename": "solution.cpp"},
        "c":    {"language": "c",    "version": "*", "filename": "solution.c"},
    }
    HTTP_TIMEOUT = 30   # seconds for Piston HTTP request (Java cold-start can take 25s)
    COMPILE_TIMEOUT = 15  # seconds for local javac
    RUN_TIMEOUT = 5       # seconds for local java

    def is_available(self) -> bool:
        """
        Returns True if at least one execution strategy is usable.
        Piston API (emkc.org) is FREE and does NOT require an API key,
        so this always returns True.
        """
        return True  # Piston API is always available (free, no key required)

    # ------------------------------------------------------------------ #
    #  Strategy detectors                                                  #
    # ------------------------------------------------------------------ #

    def _has_local_java(self) -> bool:
        """Check whether javac and java executables are on PATH."""
        try:
            subprocess.run(
                ["javac", "-version"],
                capture_output=True, timeout=5
            )
            return True
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            return False

    def _has_piston_key(self) -> bool:
        """Check if an optional Piston API key is configured (not required)."""
        return bool(os.environ.get("PISTON_API_KEY", "").strip())

    # ------------------------------------------------------------------ #
    #  Public run method -- auto-selects strategy                          #
    # ------------------------------------------------------------------ #

    def run(self, language: str, source_code: str) -> Dict:
        """
        Execute source_code and return a normalised result dict:
            {
                "stdout": str,
                "stderr": str,
                "compile_error": str | None,
                "exit_code": int,
                "timed_out": bool,
                "api_error": str | None,
            }

        Strategy:
          1. Local JDK (javac + java) — fastest, no network
          2. Piston API — free, no API key required, works from any machine
        """
        if language.lower() == "java":
            if self._has_local_java():
                logger.info("Java execution: using local JDK")
                return self._run_local_java(source_code)
            else:
                logger.info("Java execution: using Piston API (free, no key required)")
                return self._run_via_piston(language, source_code)
        # Other compiled languages via Piston
        return self._run_via_piston(language, source_code)

    # ------------------------------------------------------------------ #
    #  Strategy 1: Local javac + java (preferred)                          #
    # ------------------------------------------------------------------ #

    def _run_local_java(self, source_code: str) -> Dict:
        """
        Compile Main.java with javac, then run with java.
        Both steps use a temporary directory that is cleaned up afterwards.
        """
        import shutil
        tmpdir = tempfile.mkdtemp(prefix="java_exec_")
        src_file = os.path.join(tmpdir, "Main.java")

        try:
            # Write source
            with open(src_file, "w", encoding="utf-8") as f:
                f.write(source_code)

            # --- Compile ---
            try:
                compile_proc = subprocess.run(
                    ["javac", src_file],
                    capture_output=True,
                    text=True,
                    timeout=self.COMPILE_TIMEOUT,
                    cwd=tmpdir,
                )
            except subprocess.TimeoutExpired:
                return self._error("Compilation timed out (>15s).")

            if compile_proc.returncode != 0:
                return {
                    "stdout":        "",
                    "stderr":        compile_proc.stderr.strip(),
                    "compile_error": compile_proc.stderr.strip(),
                    "exit_code":     compile_proc.returncode,
                    "timed_out":     False,
                    "api_error":     None,
                }

            # --- Run ---
            try:
                run_proc = subprocess.run(
                    ["java", "-cp", tmpdir, "Main"],
                    capture_output=True,
                    text=True,
                    timeout=self.RUN_TIMEOUT,
                    cwd=tmpdir,
                )
            except subprocess.TimeoutExpired:
                return {
                    "stdout":        "",
                    "stderr":        "",
                    "compile_error": None,
                    "exit_code":     124,
                    "timed_out":     True,
                    "api_error":     None,
                }

            return {
                "stdout":        run_proc.stdout.strip(),
                "stderr":        run_proc.stderr.strip(),
                "compile_error": None,
                "exit_code":     run_proc.returncode,
                "timed_out":     False,
                "api_error":     None,
            }

        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    # ------------------------------------------------------------------ #
    #  Strategy 2: Piston API (fallback when JDK not installed)            #
    # ------------------------------------------------------------------ #

    def _run_via_piston(self, language: str, source_code: str) -> Dict:
        if not _REQUESTS_AVAILABLE:
            return self._error("'requests' library is not installed. Run: pip install requests")

        lang_cfg = self.LANGUAGE_MAP.get(language.lower())
        if not lang_cfg:
            return self._error(f"Language '{language}' is not supported by PistonExecutor.")

        # Piston API is free — no API key required.
        # If user has configured one (optional), attach it.
        api_key = os.environ.get("PISTON_API_KEY", "").strip()
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = api_key

        payload = {
            "language": lang_cfg["language"],
            "version": lang_cfg["version"],
            "files": [{"name": lang_cfg["filename"], "content": source_code}],
            "stdin": "",
            "compile_timeout": 10000,
            "run_timeout": 5000,
        }

        try:
            resp = _requests.post(
                self.PISTON_URL,
                json=payload,
                timeout=self.HTTP_TIMEOUT,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
        except _requests.Timeout:
            return self._error("Piston API request timed out. Please try again.")
        except _requests.ConnectionError:
            return self._error("Could not reach Piston API. Check your internet connection.")
        except _requests.HTTPError as e:
            return self._error(
                f"Piston API error ({e.response.status_code}). "
                "Please check your internet connection and try again."
            )
        except Exception as e:
            return self._error(f"Piston API unexpected error: {e}")

        compile_stage = data.get("compile", {})
        run_stage     = data.get("run", {})

        compile_stderr = (compile_stage.get("stderr") or "").strip()
        compile_code   = compile_stage.get("code", 0)

        if compile_code != 0 and compile_stderr:
            return {
                "stdout":        "",
                "stderr":        compile_stderr,
                "compile_error": compile_stderr,
                "exit_code":     compile_code,
                "timed_out":     False,
                "api_error":     None,
            }

        run_stdout = (run_stage.get("stdout") or "").strip()
        run_stderr = (run_stage.get("stderr") or "").strip()
        run_code   = run_stage.get("code", 0)
        run_signal = run_stage.get("signal") or ""
        timed_out  = "SIGKILL" in run_signal or run_code == 124

        return {
            "stdout":        run_stdout,
            "stderr":        run_stderr,
            "compile_error": None,
            "exit_code":     run_code,
            "timed_out":     timed_out,
            "api_error":     None,
        }

    @staticmethod
    def _error(msg: str) -> Dict:
        return {
            "stdout":        "",
            "stderr":        "",
            "compile_error": None,
            "exit_code":     -1,
            "timed_out":     False,
            "api_error":     msg,
        }


class JavaCodeBuilder:
    """
    Builds a complete, executable Main.java from:
      - The user's raw solution code  (method body, no class wrapper required)
      - A test-input string in Python-tuple format  e.g. "([1,2,3,1])"
      - The expected return type  (inferred from the function signature)

    Strategy
    --------
    We parse the Python-format test_input with ast.literal_eval, then
    serialise each argument to a valid Java literal / initialiser.
    The wrapper embeds those literals directly in the generated main().
    """

    # ------------------------------------------------------------------ #
    #  Public entry point                                                  #
    # ------------------------------------------------------------------ #

    def build(self, user_code: str, test_input_str: str, function_signature: str) -> str:
        """
        Returns a complete Main.java source string ready to be sent to Piston.
        Raises ValueError on parsing failures.
        """
        func_name, param_types, return_type = self._parse_signature(function_signature)
        py_args = self._parse_test_input(test_input_str)
        java_call, extra_setup = self._build_call(
            func_name, param_types, return_type, py_args
        )
        return self._wrap(user_code, java_call, extra_setup, return_type)

    # ------------------------------------------------------------------ #
    #  Signature parsing                                                   #
    # ------------------------------------------------------------------ #

    def _parse_signature(self, sig: str) -> Tuple[str, List[str], str]:
        """
        Parse a Java method signature like:
            public boolean containsDuplicate(int[] nums) {
            public boolean isValid(String s) {
        Returns: (function_name, [param_types], return_type)
        """
        # Strip trailing " {" or "{"
        sig = sig.strip().rstrip("{}").strip()
        # Match:  [modifiers] returnType functionName(params)
        pattern = re.compile(
            r'(?:public\s+|private\s+|protected\s+|static\s+)*'
            r'([\w<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)'
        )
        m = pattern.search(sig)
        if not m:
            raise ValueError(f"Cannot parse Java signature: {sig!r}")

        return_type = m.group(1).strip()
        func_name   = m.group(2).strip()
        params_raw  = m.group(3).strip()

        param_types: List[str] = []
        if params_raw:
            for param in params_raw.split(","):
                parts = param.strip().split()
                if parts:
                    param_types.append(parts[0])  # type token only

        return func_name, param_types, return_type

    # ------------------------------------------------------------------ #
    #  Test-input parsing                                                  #
    # ------------------------------------------------------------------ #

    def _parse_test_input(self, test_input_str: str) -> List:
        """
        Convert a Python-tuple-formatted test input string into a Python list.
        Examples:
            "([1,2,3,1])"     → [[1,2,3,1]]
            '("()"))'         → ["()"]
            '("()", "AB")'    → ["()", "AB"]
        """
        try:
            parsed = ast.literal_eval(test_input_str)
        except Exception:
            # Try wrapping in parens if bare value
            try:
                parsed = ast.literal_eval(f"({test_input_str},)")
            except Exception as e:
                raise ValueError(f"Cannot parse test input {test_input_str!r}: {e}")

        if isinstance(parsed, tuple):
            return list(parsed)
        return [parsed]

    # ------------------------------------------------------------------ #
    #  Java literal / call generation                                      #
    # ------------------------------------------------------------------ #

    def _py_to_java_literal(self, value, declared_type: str = "") -> Tuple[str, str]:
        """
        Convert a Python value to a Java literal or initialiser expression.
        Returns (java_expr, setup_lines) where setup_lines may be empty.
        """
        dtype = declared_type.replace("[]", "").strip().lower()

        # --- int[] / int ---
        if isinstance(value, list) and (dtype in ("int", "long", "") or "int" in declared_type):
            elements = ", ".join(str(int(v)) for v in value)
            return f"new int[]{{ {elements} }}", ""

        # --- String ---
        if isinstance(value, str) or dtype == "string":
            escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
            return f'"{escaped}"', ""

        # --- boolean / Boolean ---
        if isinstance(value, bool) or dtype == "boolean":
            return str(value).lower(), ""

        # --- int / long scalar ---
        if isinstance(value, int):
            return str(value), ""

        # --- float / double ---
        if isinstance(value, float):
            return f"{value}d", ""

        # Fallback — stringify
        return repr(value), ""

    def _build_call(
        self,
        func_name:   str,
        param_types: List[str],
        return_type: str,
        py_args:     List,
    ) -> Tuple[str, str]:
        """
        Build the Java call expression and any necessary setup lines.
        Returns (call_expression, setup_code).
        """
        java_args = []
        setup_lines = []

        for i, (val, ptype) in enumerate(zip(py_args, param_types)):
            literal, setup = self._py_to_java_literal(val, ptype)
            if setup:
                setup_lines.append(setup)
            java_args.append(literal)

        # If arg count > param count, repeat last param type
        while len(java_args) < len(py_args):
            val = py_args[len(java_args)]
            last_type = param_types[-1] if param_types else ""
            literal, setup = self._py_to_java_literal(val, last_type)
            if setup:
                setup_lines.append(setup)
            java_args.append(literal)

        call = f"sol.{func_name}(" + ", ".join(java_args) + ")"
        return call, "\n        ".join(setup_lines)

    # ------------------------------------------------------------------ #
    #  Output printer — aware of return type                              #
    # ------------------------------------------------------------------ #

    def _print_statement(self, call_expr: str, return_type: str) -> str:
        """
        Generate a System.out.println that prints the result in a JSON-compatible way.
        """
        rt = return_type.lower()
        if "[]" in return_type:
            # Array → use Arrays.toString then convert to JSON brackets
            return (
                f"int[] _r = {call_expr};\n"
                f"        StringBuilder _sb = new StringBuilder(\"[\");\n"
                f"        for (int _i = 0; _i < _r.length; _i++) {{\n"
                f"            if (_i > 0) _sb.append(\", \");\n"
                f"            _sb.append(_r[_i]);\n"
                f"        }}\n"
                f"        _sb.append(\"]\");\n"
                f"        System.out.println(_sb.toString());"
            )
        elif rt == "boolean":
            return f"System.out.println({call_expr});"
        elif rt in ("int", "long", "float", "double"):
            return f"System.out.println({call_expr});"
        elif rt == "string":
            # Wrap in JSON quotes
            return f'System.out.println("\\"" + {call_expr} + "\\"" );'
        else:
            return f"System.out.println({call_expr});"

    # ------------------------------------------------------------------ #
    #  Final Main.java assembler                                          #
    # ------------------------------------------------------------------ #

    def _wrap(self, user_code: str, java_call: str, extra_setup: str, return_type: str) -> str:
        """
        Wrap the user's method(s) in a Main class with a main() that:
          1. Instantiates the solution
          2. Calls the target method with the test arguments
          3. Prints the result in a JSON-friendly format
        """
        print_stmt = self._print_statement(java_call, return_type)
        setup_block = f"{extra_setup}\n        " if extra_setup.strip() else ""

        return f"""import java.util.*;

public class Main {{

    // ---- User solution ----
    {self._indent(user_code, 4)}
    // -----------------------

    public static void main(String[] args) {{
        Main sol = new Main();
        {setup_block}{print_stmt}
    }}
}}
"""

    @staticmethod
    def _indent(code: str, spaces: int) -> str:
        """Indent every line of code by `spaces` spaces."""
        pad = " " * spaces
        return ("\n" + pad).join(code.splitlines())

class CodingProblemGenerator:
    """Generates LeetCode-style coding problems for skill verification"""
    
    def __init__(self):
        self.problem_banks = {
            "python": {
                "easy": [
                    {
                        "id": "python_easy_1",
                        "title": "Two Sum",
                        "difficulty": "Easy",
                        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
                        "input_format": "nums: List[int], target: int",
                        "output_format": "List[int] - indices of the two numbers",
                        "constraints": [
                            "2 <= nums.length <= 10^4",
                            "-10^9 <= nums[i] <= 10^9",
                            "-10^9 <= target <= 10^9",
                            "Only one valid answer exists"
                        ],
                        "examples": [
                            {
                                "input": "nums = [2,7,11,15], target = 9",
                                "output": "[0,1]",
                                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                            },
                            {
                                "input": "nums = [3,2,4], target = 6",
                                "output": "[1,2]",
                                "explanation": "nums[1] + nums[2] == 6"
                            }
                        ],
                        "test_cases": [
                            {"input": "([2,7,11,15], 9)", "expected_output": "[0, 1]", "is_hidden": False},
                            {"input": "([3,2,4], 6)", "expected_output": "[1, 2]", "is_hidden": False},
                            {"input": "([3,3], 6)", "expected_output": "[0, 1]", "is_hidden": True},
                            {"input": "([-1,-2,-3,-4,-5], -8)", "expected_output": "[2, 4]", "is_hidden": True},
                            {"input": "([1000000000,999999999,1], 1999999999)", "expected_output": "[0, 1]", "is_hidden": True},
                            {"input": "([0,4,3,0], 0)", "expected_output": "[0, 3]", "is_hidden": True},
                            {"input": "([-3,4,3,90], 0)", "expected_output": "[0, 2]", "is_hidden": True}
                        ],
                        "function_signature": "def two_sum(nums, target):",
                        "starter_code": "def two_sum(nums, target):\n    # Write your code here\n    pass"
                    },
                    {
                        "id": "python_easy_2",
                        "title": "Valid Palindrome",
                        "difficulty": "Easy",
                        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `True` if it is a palindrome, or `False` otherwise.",
                        "input_format": "s: str",
                        "output_format": "bool",
                        "constraints": [
                            "1 <= s.length <= 2 * 10^5",
                            "s consists only of printable ASCII characters"
                        ],
                        "examples": [
                            {
                                "input": 's = "A man, a plan, a canal: Panama"',
                                "output": "True",
                                "explanation": '"amanaplanacanalpanama" is a palindrome.'
                            },
                            {
                                "input": 's = "race a car"',
                                "output": "False",
                                "explanation": '"raceacar" is not a palindrome.'
                            }
                        ],
                        "test_cases": [
                            {"input": '("A man, a plan, a canal: Panama",)', "expected_output": "True", "is_hidden": False},
                            {"input": '("race a car",)', "expected_output": "False", "is_hidden": False},
                            {"input": '(" ",)', "expected_output": "True", "is_hidden": True},
                            {"input": '("0P",)', "expected_output": "False", "is_hidden": True},
                            {"input": '("a",)', "expected_output": "True", "is_hidden": True},
                            {"input": '(".,",)', "expected_output": "True", "is_hidden": True},
                            {"input": '("A man, a plan, a canal -- Panama!",)', "expected_output": "True", "is_hidden": True}
                        ],
                        "function_signature": "def is_palindrome(s):",
                        "starter_code": "def is_palindrome(s):\n    # Write your code here\n    pass"
                    }
                ],
                "medium": [
                    {
                        "id": "python_medium_1",
                        "title": "Longest Substring Without Repeating Characters",
                        "difficulty": "Medium",
                        "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
                        "input_format": "s: str",
                        "output_format": "int - length of longest substring",
                        "constraints": [
                            "0 <= s.length <= 5 * 10^4",
                            "s consists of English letters, digits, symbols and spaces"
                        ],
                        "examples": [
                            {
                                "input": 's = "abcabcbb"',
                                "output": "3",
                                "explanation": 'The answer is "abc", with the length of 3.'
                            },
                            {
                                "input": 's = "bbbbb"',
                                "output": "1",
                                "explanation": 'The answer is "b", with the length of 1.'
                            }
                        ],
                        "test_cases": [
                            {"input": '("abcabcbb",)', "expected_output": "3", "is_hidden": False},
                            {"input": '("bbbbb",)', "expected_output": "1", "is_hidden": False},
                            {"input": '("pwwkew",)', "expected_output": "3", "is_hidden": True},
                            {"input": '("",)', "expected_output": "0", "is_hidden": True},
                            {"input": '("dvdf",)', "expected_output": "3", "is_hidden": True},
                            {"input": '("abcdefghijklmnopqrstuvwxyz",)', "expected_output": "26", "is_hidden": True},
                            {"input": '("aab",)', "expected_output": "2", "is_hidden": True}
                        ],
                        "function_signature": "def length_of_longest_substring(s):",
                        "starter_code": "def length_of_longest_substring(s):\n    # Write your code here\n    pass"
                    }
                ]
            },
            "javascript": {
                "easy": [
                    {
                        "id": "js_easy_1",
                        "title": "Reverse String",
                        "difficulty": "Easy",
                        "description": "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
                        "input_format": "s: string[]",
                        "output_format": "void (modify s in-place)",
                        "constraints": [
                            "1 <= s.length <= 10^5",
                            "s[i] is a printable ascii character"
                        ],
                        "examples": [
                            {
                                "input": 's = ["h","e","l","l","o"]',
                                "output": '["o","l","l","e","h"]',
                                "explanation": "Reverse the string in-place"
                            }
                        ],
                        "test_cases": [
                            {"input": '(["h","e","l","l","o"])', "expected_output": '["o","l","l","e","h"]', "is_hidden": False},
                            {"input": '(["H","a","n","n","a","h"])', "expected_output": '["h","a","n","n","a","H"]', "is_hidden": False},
                            {"input": '(["a"])', "expected_output": '["a"]', "is_hidden": True},
                            {"input": '(["a","b"])', "expected_output": '["b","a"]', "is_hidden": True},
                            {"input": '(["1","2","3","4","5"])', "expected_output": '["5","4","3","2","1"]', "is_hidden": True},
                            {"input": '([" "," "," "])', "expected_output": '[" "," "," "]', "is_hidden": True},
                            {"input": '(["A","B","C"])', "expected_output": '["C","B","A"]', "is_hidden": True}
                        ],
                        "function_signature": "function reverseString(s) {",
                        "starter_code": "function reverseString(s) {\n    // Write your code here\n}"
                    }
                ],
                "medium": [
                    {
                        "id": "js_medium_1",
                        "title": "Group Anagrams",
                        "difficulty": "Medium",
                        "description": "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
                        "input_format": "strs: string[]",
                        "output_format": "string[][] - grouped anagrams",
                        "constraints": [
                            "1 <= strs.length <= 10^4",
                            "0 <= strs[i].length <= 100",
                            "strs[i] consists of lowercase English letters"
                        ],
                        "examples": [
                            {
                                "input": 'strs = ["eat","tea","tan","ate","nat","bat"]',
                                "output": '[["bat"],["nat","tan"],["ate","eat","tea"]]',
                                "explanation": "Group words that are anagrams"
                            }
                        ],
                        "test_cases": [
                            {"input": '(["eat","tea","tan","ate","nat","bat"])', "expected_output": '[["bat"],["nat","tan"],["ate","eat","tea"]]', "is_hidden": False},
                            {"input": '([""])', "expected_output": '[[""]]', "is_hidden": False},
                            {"input": '(["a"])', "expected_output": '[["a"]]', "is_hidden": True},
                            {"input": '(["cab","tin","pew","duh","may","ill","buy","bar","max","doc"])', "expected_output": '[["cab"],["tin"],["pew"],["duh"],["may"],["ill"],["buy"],["bar"],["max"],["doc"]]', "is_hidden": True},
                            {"input": '(["listen","silent","enlist"])', "expected_output": '[["listen","silent","enlist"]]', "is_hidden": True},
                            {"input": '(["abc","bca","cab","xyz","zyx","yxz"])', "expected_output": '[["abc","bca","cab"],["xyz","zyx","yxz"]]', "is_hidden": True},
                            {"input": '(["a","b","a"])', "expected_output": '[["a","a"],["b"]]', "is_hidden": True}
                        ],
                        "function_signature": "function groupAnagrams(strs) {",
                        "starter_code": "function groupAnagrams(strs) {\n    // Write your code here\n}"
                    }
                ]
            },
            "java": {
                "easy": [
                    {
                        "id": "java_easy_1",
                        "title": "Contains Duplicate",
                        "difficulty": "Easy",
                        "description": "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
                        "input_format": "nums: int[]",
                        "output_format": "boolean",
                        "constraints": [
                            "1 <= nums.length <= 10^5",
                            "-10^9 <= nums[i] <= 10^9"
                        ],
                        "examples": [
                            {
                                "input": "nums = [1,2,3,1]",
                                "output": "true",
                                "explanation": "Element 1 appears twice"
                            }
                        ],
                        "test_cases": [
                            {"input": "([1,2,3,1])", "expected_output": "true", "is_hidden": False},
                            {"input": "([1,2,3,4])", "expected_output": "false", "is_hidden": False},
                            {"input": "([1,1,1,3,3,4,3,2,4,2])", "expected_output": "true", "is_hidden": True},
                            {"input": "([1])", "expected_output": "false", "is_hidden": True},
                            {"input": "([-1,-1])", "expected_output": "true", "is_hidden": True},
                            {"input": "([1,2,3,4,5,6,7,8,9,10])", "expected_output": "false", "is_hidden": True},
                            {"input": "([0,0])", "expected_output": "true", "is_hidden": True}
                        ],
                        "function_signature": "public boolean containsDuplicate(int[] nums) {",
                        "starter_code": "public boolean containsDuplicate(int[] nums) {\n    // Write your code here\n}"
                    }
                ],
                "medium": [
                    {
                        "id": "java_medium_1",
                        "title": "Valid Parentheses",
                        "difficulty": "Medium",
                        "description": "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
                        "input_format": "s: String",
                        "output_format": "boolean",
                        "constraints": [
                            "1 <= s.length <= 10^4",
                            "s consists of parentheses only '()[]{}'."
                        ],
                        "examples": [
                            {
                                "input": 's = "()"',
                                "output": "true",
                                "explanation": "Valid parentheses"
                            },
                            {
                                "input": 's = "()[]{}"',
                                "output": "true",
                                "explanation": "All brackets are properly closed"
                            }
                        ],
                        "test_cases": [
                            {"input": '("()")', "expected_output": "true", "is_hidden": False},
                            {"input": '("()[]{}")', "expected_output": "true", "is_hidden": False},
                            {"input": '("(]")', "expected_output": "false", "is_hidden": True},
                            {"input": '("([)]")', "expected_output": "false", "is_hidden": True},
                            {"input": '("{[]}")', "expected_output": "true", "is_hidden": True},
                            {"input": '("(((((")', "expected_output": "false", "is_hidden": True},
                            {"input": '("(){}}{}")', "expected_output": "false", "is_hidden": True}
                        ],
                        "function_signature": "public boolean isValid(String s) {",
                        "starter_code": "public boolean isValid(String s) {\n    // Write your code here\n}"
                    }
                ]
            },
            "cpp": {
                "easy": [
                    {
                        "id": "cpp_easy_1",
                        "title": "Find Maximum Element",
                        "difficulty": "Easy",
                        "description": "Given an array of integers, find and return the maximum element.",
                        "input_format": "nums: vector<int>",
                        "output_format": "int - maximum element",
                        "constraints": [
                            "1 <= nums.size() <= 10^5",
                            "-10^9 <= nums[i] <= 10^9"
                        ],
                        "examples": [
                            {
                                "input": "nums = [1,5,3,9,2]",
                                "output": "9",
                                "explanation": "9 is the maximum element"
                            }
                        ],
                        "test_cases": [
                            {"input": "({1,5,3,9,2})", "expected_output": "9", "is_hidden": False},
                            {"input": "({-1,-5,-3,-9,-2})", "expected_output": "-1", "is_hidden": False},
                            {"input": "({42})", "expected_output": "42", "is_hidden": True},
                            {"input": "({0,0,0,0})", "expected_output": "0", "is_hidden": True},
                            {"input": "({-1000000000,1000000000})", "expected_output": "1000000000", "is_hidden": True},
                            {"input": "({100,200,300,400,500})", "expected_output": "500", "is_hidden": True},
                            {"input": "({-5,-4,-3,-2,-1})", "expected_output": "-1", "is_hidden": True}
                        ],
                        "function_signature": "int findMax(vector<int>& nums) {",
                        "starter_code": "#include <vector>\nusing namespace std;\n\nint findMax(vector<int>& nums) {\n    // Write your code here\n}"
                    }
                ],
                "medium": [
                    {
                        "id": "cpp_medium_1",
                        "title": "Binary Search",
                        "difficulty": "Medium",
                        "description": "Given a sorted array of integers `nums` and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
                        "input_format": "nums: vector<int>, target: int",
                        "output_format": "int - index of target or -1",
                        "constraints": [
                            "1 <= nums.size() <= 10^4",
                            "-10^4 < nums[i], target < 10^4",
                            "All integers in nums are unique",
                            "nums is sorted in ascending order"
                        ],
                        "examples": [
                            {
                                "input": "nums = [-1,0,3,5,9,12], target = 9",
                                "output": "4",
                                "explanation": "9 exists in nums and its index is 4"
                            }
                        ],
                        "test_cases": [
                            {"input": "({-1,0,3,5,9,12}, 9)", "expected_output": "4", "is_hidden": False},
                            {"input": "({-1,0,3,5,9,12}, 2)", "expected_output": "-1", "is_hidden": False},
                            {"input": "({5}, 5)", "expected_output": "0", "is_hidden": True},
                            {"input": "({1,2,3,4,5}, 1)", "expected_output": "0", "is_hidden": True},
                            {"input": "({1,2,3,4,5}, 5)", "expected_output": "4", "is_hidden": True},
                            {"input": "({-100,-50,0,50,100}, 0)", "expected_output": "2", "is_hidden": True},
                            {"input": "({1,3,5,7,9}, 8)", "expected_output": "-1", "is_hidden": True}
                        ],
                        "function_signature": "int binarySearch(vector<int>& nums, int target) {",
                        "starter_code": "#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& nums, int target) {\n    // Write your code here\n}"
                    }
                ]
            },
            "c": {
                "easy": [
                    {
                        "id": "c_easy_1",
                        "title": "Sum of Array",
                        "difficulty": "Easy",
                        "description": "Given an array of integers and its size, return the sum of all elements.",
                        "input_format": "arr: int*, size: int",
                        "output_format": "int - sum of elements",
                        "constraints": [
                            "1 <= size <= 10^5",
                            "-10^9 <= arr[i] <= 10^9"
                        ],
                        "examples": [
                            {
                                "input": "arr = [1,2,3,4,5], size = 5",
                                "output": "15",
                                "explanation": "1+2+3+4+5 = 15"
                            }
                        ],
                        "test_cases": [
                            {"input": "({1,2,3,4,5}, 5)", "expected_output": "15", "is_hidden": False},
                            {"input": "({-1,-2,-3}, 3)", "expected_output": "-6", "is_hidden": False},
                            {"input": "({100}, 1)", "expected_output": "100", "is_hidden": True},
                            {"input": "({0,0,0,0}, 4)", "expected_output": "0", "is_hidden": True},
                            {"input": "({-5,5,-10,10}, 4)", "expected_output": "0", "is_hidden": True},
                            {"input": "({1000000,2000000,3000000}, 3)", "expected_output": "6000000", "is_hidden": True},
                            {"input": "({-100,-200}, 2)", "expected_output": "-300", "is_hidden": True}
                        ],
                        "function_signature": "int sumArray(int arr[], int size) {",
                        "starter_code": "int sumArray(int arr[], int size) {\n    // Write your code here\n}"
                    }
                ],
                "medium": [
                    {
                        "id": "c_medium_1",
                        "title": "Reverse String In-Place",
                        "difficulty": "Medium",
                        "description": "Given a string, reverse it in-place without using extra space.",
                        "input_format": "str: char*",
                        "output_format": "void (modify str in-place)",
                        "constraints": [
                            "1 <= strlen(str) <= 10^5",
                            "str consists of printable ASCII characters"
                        ],
                        "examples": [
                            {
                                "input": 'str = "hello"',
                                "output": '"olleh"',
                                "explanation": "Reverse the string in-place"
                            }
                        ],
                        "test_cases": [
                            {"input": '("hello")', "expected_output": '"olleh"', "is_hidden": False},
                            {"input": '("a")', "expected_output": '"a"', "is_hidden": False},
                            {"input": '("ab")', "expected_output": '"ba"', "is_hidden": True},
                            {"input": '("racecar")', "expected_output": '"racecar"', "is_hidden": True},
                            {"input": '("12345")', "expected_output": '"54321"', "is_hidden": True},
                            {"input": '("A B C")', "expected_output": '"C B A"', "is_hidden": True},
                            {"input": '("!@#$%")', "expected_output": '"%$#@!"', "is_hidden": True}
                        ],
                        "function_signature": "void reverseString(char* str) {",
                        "starter_code": "#include <string.h>\n\nvoid reverseString(char* str) {\n    // Write your code here\n}"
                    }
                ]
            }
        }
    
    def generate_problems(self, language: str) -> List[Dict]:
        """Generate 2 problems (1 Easy, 1 Medium) for the given language"""
        language_key = language.lower()
        
        if language_key not in self.problem_banks:
            raise ValueError(f"Language {language} not supported")
        
        problems = []
        
        # Select 1 random easy problem
        easy_problems = self.problem_banks[language_key]["easy"]
        problems.append(random.choice(easy_problems))
        
        # Select 1 random medium problem
        medium_problems = self.problem_banks[language_key]["medium"]
        problems.append(random.choice(medium_problems))
        
        return problems


class CodeExecutor:
    """Safely executes code submissions and evaluates against test cases"""
    
    def __init__(self):
        self.timeout = 5  # 5 seconds timeout per execution
        self._piston   = PistonExecutor()
        self._java_builder = JavaCodeBuilder()
        self.language_configs = {
            "python": {
                "supported": True,
                "extension": ".py",
                "command": ["python", "-u"],
                "wrapper_template": "{code}\n\nif __name__ == '__main__':\n    import sys\n    import json\n    _test_args = {test_input}\n    if isinstance(_test_args, tuple):\n        _result = {function_name}(*_test_args)\n    else:\n        _result = {function_name}(_test_args)\n    print(json.dumps(_result))"
            },
            "javascript": {
                "supported": True,
                "extension": ".js",
                "command": ["node"],
                "wrapper_template": "{code}\n\nconst _testArgs = {test_input};\nconst _result = Array.isArray(_testArgs) ? {function_name}(..._testArgs) : {function_name}(_testArgs);\nconsole.log(JSON.stringify(_result));"
            },
            # Java: executed via Piston API (piston=True routes around the local subprocess path)
            "java": {
                "supported": True,
                "piston":    True,
                "extension": ".java",
            },
            # C++ / C: also via Piston, but problems not yet wired up — keep disabled for now
            "cpp": {
                "supported": False,
                "extension": ".cpp",
                "message": "C++ execution via Piston is not yet configured. Please use Python, JavaScript or Java."
            },
            "c": {
                "supported": False,
                "extension": ".c",
                "message": "C execution via Piston is not yet configured. Please use Python, JavaScript or Java."
            }
        }
    
    def execute_code(self, language: str, code: str, problem_id: str, test_cases: List[Dict]) -> Dict:
        """
        Execute code against test cases
        Returns: {
            "passed": bool,
            "results": [{"test_case": int, "passed": bool, "expected": str, "actual": str, "error": str}],
            "error": str
        }
        """
        language_key = language.lower()
        
        # Check if language exists in config
        if language_key not in self.language_configs:
            return {
                "passed": False,
                "results": [],
                "error": f"Language '{language}' is not supported. Please use Python, JavaScript, or Java."
            }
        
        config = self.language_configs[language_key]
        
        # Check if language is disabled
        if not config.get("supported", True):
            return {
                "passed": False,
                "results": [],
                "error": config.get("message", f"Language '{language}' execution is not currently supported.")
            }

        # ----------------------------------------------------------------
        # Route Piston-backed languages (Java) through the Piston executor
        # ----------------------------------------------------------------
        if config.get("piston", False):
            return self._execute_via_piston(language_key, code, test_cases)
        
        # Validate required configuration keys
        if "extension" not in config:
            return {
                "passed": False,
                "results": [],
                "error": "Unsupported language configuration: missing 'extension' key."
            }
        
        if "command" not in config:
            return {
                "passed": False,
                "results": [],
                "error": "Unsupported language configuration: missing 'command' key."
            }
        
        if "wrapper_template" not in config:
            return {
                "passed": False,
                "results": [],
                "error": "Unsupported language configuration: missing 'wrapper_template' key."
            }
        
        results = []
        all_passed = True
        
        for idx, test_case in enumerate(test_cases):
            try:
                # Create temporary file with code
                with tempfile.NamedTemporaryFile(
                    mode='w',
                    suffix=config["extension"],
                    delete=False,
                    encoding='utf-8'
                ) as f:
                    # Extract function name from code
                    function_name = self._extract_function_name(code, language_key)
                    
                    # Wrap code with test execution
                    wrapped_code = config["wrapper_template"].format(
                        code=code,
                        test_input=test_case["input"],
                        function_name=function_name
                    )
                    
                    f.write(wrapped_code)
                    temp_file = f.name
                
                # Execute code
                try:
                    process = subprocess.run(
                        config["command"] + [temp_file],
                        capture_output=True,
                        text=True,
                        timeout=self.timeout
                    )
                    
                    if process.returncode != 0:
                        # Categorize error type
                        error_message = self._categorize_error(process.stderr, language_key)
                        
                        results.append({
                            "test_case": idx + 1,
                            "passed": False,
                            "expected": test_case["expected_output"],
                            "actual": None,
                            "error": error_message,
                            "is_hidden": test_case.get("is_hidden", False),
                            "error_type": "runtime_error"
                        })
                        all_passed = False
                    else:
                        actual_output = process.stdout.strip()
                        expected_output = test_case["expected_output"]
                        
                        # Normalize outputs for comparison
                        passed = self._compare_outputs(actual_output, expected_output)
                        
                        results.append({
                            "test_case": idx + 1,
                            "passed": passed,
                            "expected": expected_output,
                            "actual": actual_output,
                            "error": None,
                            "is_hidden": test_case.get("is_hidden", False),
                            "error_type": None if passed else "wrong_answer"
                        })
                        
                        if not passed:
                            all_passed = False
                
                except subprocess.TimeoutExpired:
                    results.append({
                        "test_case": idx + 1,
                        "passed": False,
                        "expected": test_case["expected_output"],
                        "actual": None,
                        "error": f"Time Limit Exceeded (>{self.timeout}s)",
                        "is_hidden": test_case.get("is_hidden", False),
                        "error_type": "timeout"
                    })
                    all_passed = False
                
                finally:
                    # Clean up temp file
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
            
            except Exception as e:
                results.append({
                    "test_case": idx + 1,
                    "passed": False,
                    "expected": test_case["expected_output"],
                    "actual": None,
                    "error": f"Execution error: {str(e)}",
                    "is_hidden": test_case.get("is_hidden", False),
                    "error_type": "system_error"
                })
                all_passed = False
        
        return {
            "passed": all_passed,
            "results": results,
            "error": None
        }
    
    # ------------------------------------------------------------------
    # Java execution path (local JDK preferred, Piston API fallback)
    # ------------------------------------------------------------------

    def _execute_via_piston(
        self,
        language:   str,
        user_code:  str,
        test_cases: List[Dict],
    ) -> Dict:
        """
        Execute Java code against all test_cases.

        Execution order:
          1. Local javac + java  (if JDK is installed on PATH)
          2. Piston API          (if PISTON_API_KEY env var is set)
          3. Fail with helpful message if neither is available

        For each test case:
          a. Build complete Main.java using JavaCodeBuilder
          b. Compile + run via selected executor
          c. Parse stdout / stderr / compile errors
          d. Compare actual vs expected output
        """
        # Piston is always available (free API, no key needed)
        # No availability check needed — proceed directly

        # Detect the function signature from the user's code
        func_sig = self._extract_java_signature(user_code)

        results    = []
        all_passed = True

        for idx, test_case in enumerate(test_cases):
            test_input_str  = test_case["input"]
            expected_output = test_case["expected_output"]
            is_hidden       = test_case.get("is_hidden", False)

            # --- Build Main.java ---
            try:
                main_java = self._java_builder.build(
                    user_code, test_input_str, func_sig
                )
            except Exception as build_err:
                results.append({
                    "test_case":  idx + 1,
                    "passed":     False,
                    "expected":   expected_output,
                    "actual":     None,
                    "error":      f"Code generation error: {build_err}",
                    "is_hidden":  is_hidden,
                    "error_type": "system_error",
                })
                all_passed = False
                continue

            # --- Send to Piston ---
            piston_result = self._piston.run(language, main_java)

            if piston_result["api_error"]:
                results.append({
                    "test_case":  idx + 1,
                    "passed":     False,
                    "expected":   expected_output,
                    "actual":     None,
                    "error":      piston_result["api_error"],
                    "is_hidden":  is_hidden,
                    "error_type": "api_error",
                })
                all_passed = False
                continue

            if piston_result["compile_error"]:
                error_msg = self._categorize_java_error(
                    piston_result["compile_error"], compile=True
                )
                results.append({
                    "test_case":  idx + 1,
                    "passed":     False,
                    "expected":   expected_output,
                    "actual":     None,
                    "error":      error_msg,
                    "is_hidden":  is_hidden,
                    "error_type": "compile_error",
                })
                all_passed = False
                continue

            if piston_result["timed_out"]:
                results.append({
                    "test_case":  idx + 1,
                    "passed":     False,
                    "expected":   expected_output,
                    "actual":     None,
                    "error":      "Time Limit Exceeded (>5s)",
                    "is_hidden":  is_hidden,
                    "error_type": "timeout",
                })
                all_passed = False
                continue

            if piston_result["exit_code"] != 0 and piston_result["stderr"]:
                error_msg = self._categorize_java_error(
                    piston_result["stderr"], compile=False
                )
                results.append({
                    "test_case":  idx + 1,
                    "passed":     False,
                    "expected":   expected_output,
                    "actual":     None,
                    "error":      error_msg,
                    "is_hidden":  is_hidden,
                    "error_type": "runtime_error",
                })
                all_passed = False
                continue

            # --- Compare output ---
            actual_output = piston_result["stdout"].strip()
            passed = self._compare_outputs(actual_output, expected_output)

            results.append({
                "test_case":  idx + 1,
                "passed":     passed,
                "expected":   expected_output,
                "actual":     actual_output,
                "error":      None,
                "is_hidden":  is_hidden,
                "error_type": None if passed else "wrong_answer",
            })

            if not passed:
                all_passed = False

        return {
            "passed":  all_passed,
            "results": results,
            "error":   None,
        }

    def _extract_java_signature(self, code: str) -> str:
        """
        Try to extract the method signature from user-submitted Java code.
        Looks for lines like:  public boolean methodName(int[] nums) {
        Falls back to a generic signature if nothing is found.
        """
        # Pattern: optional modifiers, return type, method name, params
        pattern = re.compile(
            r'((?:public|private|protected)?\s*(?:static\s+)?'
            r'[\w<>\[\]]+\s+\w+\s*\([^)]*\))\s*\{'
        )
        m = pattern.search(code)
        if m:
            return m.group(1).strip()
        # Fallback
        return "public boolean solution()"

    def _categorize_java_error(self, stderr: str, compile: bool = False) -> str:
        """Produce a clean, user-friendly error message from Java stderr."""
        lines = []
        for line in stderr.splitlines():
            # Skip javac informational notes and unchecked warnings
            if line.strip().startswith("Note:") or "unchecked" in line:
                continue
            lines.append(line)
        raw = "\n".join(lines).strip()

        # Replace absolute temp paths (e.g. C:\Users\...\java_exec_xxx\Main.java)
        # with just "Main.java" so users see clean line references
        clean = re.sub(r'[A-Za-z]:\\[^\s]+[/\\]Main\.java', 'Main.java', raw)
        clean = re.sub(r'/tmp/[^\s]+/Main\.java', 'Main.java', clean)

        low = clean.lower()
        if compile:
            if "cannot find symbol" in low:
                return f"Compile Error: Undefined variable or method.\n{clean[:400]}"
            if "illegal start" in low:
                return f"Compile Error: Syntax error — unexpected token.\n{clean[:400]}"
            if "reached end" in low or "expected" in low:
                return f"Compile Error: Missing closing brace or statement.\n{clean[:400]}"
            if "incompatible types" in low:
                return f"Compile Error: Type mismatch.\n{clean[:400]}"
            return f"Compile Error:\n{clean[:400]}"
        else:
            if "nullpointerexception" in low:
                return f"Runtime Error: NullPointerException — check for null values.\n{clean[:300]}"
            if "arrayindexoutofboundsexception" in low:
                return f"Runtime Error: Array index out of bounds.\n{clean[:300]}"
            if "stackoverflowerror" in low:
                return f"Runtime Error: Stack overflow — check for infinite recursion.\n{clean[:300]}"
            if "classcastexception" in low:
                return f"Runtime Error: Invalid type cast.\n{clean[:300]}"
            if "arithmeticexception" in low or "/ by zero" in low:
                return f"Runtime Error: Division by zero.\n{clean[:300]}"
            return f"Runtime Error:\n{clean[:300]}"

    def _extract_function_name(self, code: str, language: str) -> str:
        """Extract function name from code"""
        if language == "python":
            # Look for "def function_name("
            import re
            match = re.search(r'def\s+(\w+)\s*\(', code)
            if match:
                return match.group(1)
        elif language == "javascript":
            # Look for "function function_name(" or "const function_name ="
            import re
            match = re.search(r'function\s+(\w+)\s*\(', code)
            if not match:
                match = re.search(r'const\s+(\w+)\s*=', code)
            if match:
                return match.group(1)
        
        return "solution"  # Default fallback
    
    def _categorize_error(self, stderr: str, language: str) -> str:
        """Categorize error messages for better user feedback"""
        stderr_lower = stderr.lower()
        
        # Common error patterns
        if "syntaxerror" in stderr_lower or "syntax error" in stderr_lower:
            return f"Syntax Error: Please check your code syntax.\n{stderr[:200]}"
        elif "indentationerror" in stderr_lower:
            return f"Indentation Error: Check your code indentation.\n{stderr[:200]}"
        elif "nameerror" in stderr_lower:
            return f"Name Error: Variable or function not defined.\n{stderr[:200]}"
        elif "typeerror" in stderr_lower:
            return f"Type Error: Check your data types and function arguments.\n{stderr[:200]}"
        elif "indexerror" in stderr_lower or "out of bounds" in stderr_lower:
            return f"Index Error: Array/list index out of range.\n{stderr[:200]}"
        elif "keyerror" in stderr_lower:
            return f"Key Error: Dictionary key not found.\n{stderr[:200]}"
        elif "zerodivisionerror" in stderr_lower or "division by zero" in stderr_lower:
            return f"Division by Zero Error.\n{stderr[:200]}"
        elif "referenceerror" in stderr_lower:
            return f"Reference Error: Variable not defined.\n{stderr[:200]}"
        else:
            return f"Runtime Error:\n{stderr[:300]}"
    
    def _compare_outputs(self, actual: str, expected: str) -> bool:
        """
        Compare actual and expected outputs.
        Order of comparison:
          1. JSON-aware (handles lists, booleans, numbers)
          2. Case-insensitive trimmed string comparison
          3. Exact trimmed string comparison
        """
        actual_s = actual.strip()
        expected_s = expected.strip()

        try:
            # Try JSON comparison first (handles [0,1] vs [0, 1], true/True, etc.)
            actual_json = json.loads(actual_s)
            expected_json = json.loads(expected_s)
            return actual_json == expected_json
        except Exception:
            pass

        # Case-insensitive comparison (handles "True" vs "true", etc.)
        if actual_s.lower() == expected_s.lower():
            return True

        # Exact string comparison
        return actual_s == expected_s
