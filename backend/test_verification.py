from coding_engine import CodingProblemGenerator, CodeExecutor

# Test 1: Problem Generation
print("=" * 60)
print("TEST 1: Problem Generation")
print("=" * 60)

gen = CodingProblemGenerator()
problems = gen.generate_problems('python')

print(f"\nGenerated {len(problems)} problems for Python:\n")

for i, problem in enumerate(problems):
    visible_count = len([tc for tc in problem["test_cases"] if not tc.get("is_hidden")])
    hidden_count = len([tc for tc in problem["test_cases"] if tc.get("is_hidden")])
    total_count = len(problem["test_cases"])
    
    print(f"Problem {i+1}: {problem['title']} ({problem['difficulty']})")
    print(f"  Visible tests: {visible_count}")
    print(f"  Hidden tests: {hidden_count}")
    print(f"  Total tests: {total_count}")
    print()

# Test 2: Code Execution with Correct Solution
print("=" * 60)
print("TEST 2: Code Execution (Correct Solution)")
print("=" * 60)

executor = CodeExecutor()

correct_code = """def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
"""

test_cases = [
    {"input": "([2,7,11,15], 9)", "expected_output": "[0, 1]", "is_hidden": False},
    {"input": "([3,3], 6)", "expected_output": "[0, 1]", "is_hidden": True},
]

result = executor.execute_code('python', correct_code, 'python_easy_1', test_cases)

print(f"\nExecution passed: {result['passed']}")
print(f"Results:")
for r in result['results']:
    status = "PASS" if r["passed"] else "FAIL"
    hidden = "HIDDEN" if r["is_hidden"] else "VISIBLE"
    error_type = r.get("error_type", "None")
    print(f"  Test {r['test_case']}: {status} ({hidden}, error_type={error_type})")

# Test 3: Code Execution with Wrong Solution
print("\n" + "=" * 60)
print("TEST 3: Code Execution (Wrong Solution)")
print("=" * 60)

wrong_code = """def two_sum(nums, target):
    return [0, 1]  # Hardcoded - will fail hidden tests
"""

result2 = executor.execute_code('python', wrong_code, 'python_easy_1', test_cases)

print(f"\nExecution passed: {result2['passed']}")
print(f"Results:")
for r in result2['results']:
    status = "PASS" if r["passed"] else "FAIL"
    hidden = "HIDDEN" if r["is_hidden"] else "VISIBLE"
    error_type = r.get("error_type", "None")
    print(f"  Test {r['test_case']}: {status} ({hidden}, error_type={error_type})")

# Test 4: Compiled Language Support Check
print("\n" + "=" * 60)
print("TEST 4: Compiled Language Support Check")
print("=" * 60)

result3 = executor.execute_code('java', 'dummy code', 'test', [])
print(f"\nJava support check:")
print(f"  Error: {result3.get('error', 'No error')}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETED")
print("=" * 60)
