import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../services/api';

// Lazy-load Monaco Editor — it's ~2MB and only needed when this modal is open
const Editor = lazy(() => import('@monaco-editor/react'));

// Fallback shown while Monaco loads
const EditorFallback = () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
        <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono">Loading editor...</span>
        </div>
    </div>
);

const CodingVerificationModal = ({ isOpen, onClose, skill, onVerified, token }) => {
    const [step, setStep] = useState(0); // 0: Intro, 1: Problem 1, 2: Problem 2, 3: Success
    const [problems, setProblems] = useState([]);
    const [currentCode, setCurrentCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [executionError, setExecutionError] = useState(null);
    const [problemResults, setProblemResults] = useState([]);
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
    const [fontSize, setFontSize] = useState(14);
    const [consoleCollapsed, setConsoleCollapsed] = useState(false);

    const fetchProblems = async () => {
        if (!skill) return; // Guard: don't fetch if skill is null/undefined
        setLoading(true);
        setFetchError(null);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            const res = await axios.get(`${API_URL}/verify/coding-problems?language=${skill.toLowerCase()}`, { headers });
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setProblems(res.data);
            } else {
                setFetchError(`No problems available for ${skill}. Please try a different language.`);
            }
        } catch (err) {
            setFetchError(err.response?.data?.detail || `Failed to load problems for ${skill}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && skill) {
            fetchProblems();
            setTimeLeft(1200);
            setStep(0);
            setProblemResults([]);
            setTestResults(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, skill]);

    useEffect(() => {
        if (!isOpen || step === 0 || step === 3) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    onClose(); // Time's up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, step, onClose]);


    const handleStart = () => {
        setStep(1);
        if (problems.length > 0) {
            setCurrentCode(problems[0].starter_code);
        }
    };

    const handleRunCode = async () => {
        // Validate code is not empty
        if (!currentCode || !currentCode.trim()) {
            setExecutionError("Please write some code before running tests.");
            return;
        }

        setLoading(true);
        setTestResults(null);
        setExecutionError(null);

        const currentProblem = problems[step - 1];

        // Ensure problem exists
        if (!currentProblem) {
            setExecutionError("Problem not loaded. Please try again.");
            setLoading(false);
            return;
        }

        // Check if test cases are available
        if (!currentProblem.test_cases || !Array.isArray(currentProblem.test_cases) || currentProblem.test_cases.length === 0) {
            setExecutionError("Test cases are not available for this problem. Please refresh and try again.");
            setLoading(false);
            return;
        }

        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(`${API_URL}/verify/execute-code`, {
                language: skill,
                code: currentCode,
                problem_id: currentProblem.id,
                run_mode: "test"
            }, { timeout: 60000, headers });

            if (res.data.error) {
                setExecutionError(res.data.error);
            } else if (res.data.results && Array.isArray(res.data.results)) {
                setTestResults(res.data.results);
            } else {
                setExecutionError("Invalid response from server. Please try again.");
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setExecutionError("⏱️ Execution timed out. Java via Piston can take up to 30s on first run. Please try again.");
            } else {
                setExecutionError(err.response?.data?.detail || "Network error or server unreachable. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProblem = async () => {
        // Validate code is not empty
        if (!currentCode || !currentCode.trim()) {
            setExecutionError("Please write some code before submitting.");
            return;
        }

        setLoading(true);
        setExecutionError(null);
        const currentProblem = problems[step - 1];

        // Ensure problem exists
        if (!currentProblem) {
            setExecutionError("Problem not loaded. Please try again.");
            setLoading(false);
            return;
        }

        try {
            // Run against ALL test cases
            const res = await axios.post(`${API_URL}/verify/execute-code`, {
                language: skill,
                code: currentCode,
                problem_id: currentProblem.id,
                run_mode: "submit"
            }, { timeout: 60000, headers: token ? { Authorization: `Bearer ${token}` } : {} }); // 60s timeout

            // Check if response has error
            if (res.data.error) {
                setExecutionError(res.data.error);
                setLoading(false);
                return;
            }

            // Validate response structure
            if (!res.data.results || !Array.isArray(res.data.results)) {
                setExecutionError("Invalid response from server. Please try again.");
                setLoading(false);
                return;
            }

            if (res.data.passed) {
                // Problem Passed
                const newResults = [...problemResults, { problem_id: currentProblem.id, passed: true }];
                setProblemResults(newResults);

                if (step === 1) {
                    // Move to next problem
                    setStep(2);
                    setCurrentCode(problems[1].starter_code);
                    setTestResults(null);
                    setExecutionError(null);
                } else {
                    // Final submission
                    submitFinalVerification(newResults);
                }
            } else {
                // Show which test cases failed
                const failedCount = res.data.results.filter(r => !r.passed).length;
                const totalCount = res.data.results.length;
                setExecutionError(
                    `Solution failed ${failedCount} out of ${totalCount} test cases. ` +
                    `Please ensure your code handles all edge cases including empty inputs, negative numbers, and boundary conditions.`
                );
                setTestResults(res.data.results);
            }
        } catch (err) {
            setExecutionError(err.response?.data?.detail || "Submission failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const submitFinalVerification = async (results) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(`${API_URL}/verify/coding-submit`, {
                skill: skill,
                language: skill,
                problem_results: results
            }, { headers });

            if (res.data.verified) {
                setStep(3);
                setTimeout(() => {
                    onVerified(skill);
                }, 3000);
            } else {
                setExecutionError(res.data.message);
            }
        } catch {
            setExecutionError("Final verification failed.");
        }
    };

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 md:p-4 animate-fade-in text-white overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-7xl h-[95vh] bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f172a]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold">
                            {skill === 'cpp' ? 'C++' : skill === 'csharp' ? 'C#' : skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Skill Verification</h2>
                    </div>

                    {step > 0 && step < 3 && (
                        <div className="flex items-center gap-4 bg-black/30 px-4 py-1.5 rounded-full border border-white/5">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span>Problem {step} of 2</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className={timeLeft < 300 ? "text-red-400 font-mono" : "text-blue-400 font-mono"}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Font size selector */}
                    {(step === 1 || step === 2) && (
                        <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                            <span className="text-slate-500 text-xs mr-1">Font</span>
                            {[12, 14, 16].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${fontSize === size
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">

                        {/* STEP 0: INTRO */}
                        {step === 0 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto"
                            >
                                <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-cyan-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                    <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                </div>
                                <h1 className="text-3xl font-bold mb-4">Coding Challenge</h1>
                                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                                    You are about to verify your <span className="text-white font-semibold">{skill}</span> skill.
                                    You will be given <span className="text-white font-semibold">2 problems</span> (Easy & Medium) to solve within 20 minutes.
                                    You must pass all test cases to earn the Verified Badge.
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left">
                                        <div className="text-cyan-400 font-bold mb-1">Environment</div>
                                        <div className="text-sm text-slate-500">Standard libraries supported. No external packages.</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left">
                                        <div className="text-cyan-400 font-bold mb-1">Evaluation</div>
                                        <div className="text-sm text-slate-500">Code is tested against both visible and hidden test cases.</div>
                                    </div>
                                </div>

                                {/* Java online execution notice */}
                                {skill && skill.toLowerCase() === 'java' && (
                                    <div className="mb-4 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm text-left w-full">
                                        <span className="font-bold">☁️ Online Execution:</span> Java code runs securely via the Piston API — no local Java installation required.
                                    </div>
                                )}

                                {/* Fetch error display */}
                                {fetchError && (
                                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left w-full">
                                        ⚠️ {fetchError}
                                    </div>
                                )}

                                <button
                                    onClick={handleStart}
                                    disabled={loading || problems.length === 0 || !!fetchError}
                                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                                >
                                    {loading ? "Loading Environment..." : fetchError ? "Cannot Start (Load Error)" : "Start Challenge"}
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 1 & 2: PROBLEM SOLVING */}
                        {(step === 1 || step === 2) && problems.length > 0 && (
                            <motion.div
                                key="problem"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full grid grid-cols-12 divide-x divide-white/5"
                            >
                                {/* Left: Problem Description */}
                                <div className="col-span-4 flex flex-col h-full bg-[#111827] overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider ${problems[step - 1].difficulty === 'Easy' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {problems[step - 1].difficulty}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-4">{problems[step - 1].title}</h3>
                                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                            <p className="whitespace-pre-wrap">{problems[step - 1].description}</p>

                                            <h4 className="text-slate-200 mt-6 mb-2">Input Format</h4>
                                            <code className="bg-black/30 px-2 py-1 rounded text-cyan-300 block mb-4">{problems[step - 1].input_format}</code>

                                            <h4 className="text-slate-200 mb-2">Output Format</h4>
                                            <code className="bg-black/30 px-2 py-1 rounded text-cyan-300 block mb-6">{problems[step - 1].output_format}</code>

                                            <h4 className="text-slate-200 mb-2">Examples</h4>
                                            <div className="space-y-4">
                                                {problems[step - 1].examples.map((ex, i) => (
                                                    <div key={i} className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                        <div className="mb-1"><span className="text-slate-500 text-xs uppercase font-bold">Input:</span> <span className="font-mono text-xs">{ex.input}</span></div>
                                                        <div className="mb-1"><span className="text-slate-500 text-xs uppercase font-bold">Output:</span> <span className="font-mono text-xs text-blue-400">{ex.output}</span></div>
                                                        {ex.explanation && <div className="text-xs text-slate-400 italic mt-1">{ex.explanation}</div>}
                                                    </div>
                                                ))}
                                            </div>

                                            <h4 className="text-slate-200 mt-6 mb-2">Constraints</h4>
                                            <ul className="list-disc pl-4 space-y-1 text-slate-400">
                                                {problems[step - 1].constraints.map((c, i) => <li key={i}>{c}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Code Editor & Console */}
                                <div className="col-span-8 flex flex-col h-full bg-[#0f172a]">
                                    <div className="flex-1 relative overflow-hidden">
                                        <Suspense fallback={<EditorFallback />}>
                                            <Editor
                                                height="100%"
                                                defaultLanguage={skill === 'cpp' ? 'cpp' : skill === 'js' ? 'javascript' : skill}
                                                language={skill === 'cpp' ? 'cpp' : skill === 'js' ? 'javascript' : skill}
                                                value={currentCode}
                                                onChange={(val) => setCurrentCode(val)}
                                                theme="vs-dark"
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: fontSize,
                                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                                    fontLigatures: true,
                                                    scrollBeyondLastLine: false,
                                                    padding: { top: 16, bottom: 16 },
                                                    lineNumbersMinChars: 3,
                                                    renderLineHighlight: 'all',
                                                    cursorBlinking: 'smooth',
                                                    wordWrap: 'on',
                                                }}
                                            />
                                        </Suspense>
                                    </div>

                                    {/* Console / Output Area */}
                                    <div className={`${consoleCollapsed ? 'h-10' : 'h-52'
                                        } bg-[#111827] border-t border-white/5 flex flex-col transition-all duration-200`}>
                                        {/* Console Header */}
                                        <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-black/20">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console</span>
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={() => setConsoleCollapsed(prev => !prev)}
                                                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                                                    title={consoleCollapsed ? 'Expand console' : 'Collapse console'}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        {consoleCollapsed
                                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        }
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={handleRunCode}
                                                    disabled={loading}
                                                    className="px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/10"
                                                >
                                                    Run Code
                                                </button>
                                                <button
                                                    onClick={handleSubmitProblem}
                                                    disabled={loading}
                                                    className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-lg shadow-cyan-500/20"
                                                >
                                                    {loading ? "Evaluating..." : step === 2 ? "Final Submit" : "Submit & Next"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Console Body */}
                                        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar">
                                            {loading ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                        Executing code...
                                                    </div>
                                                    {skill && skill.toLowerCase() === 'java' && (
                                                        <div className="text-xs text-blue-400/70 ml-6">
                                                            ☁️ Java runs via Piston API. First run may take ~20s...
                                                        </div>
                                                    )}
                                                </div>
                                            ) : executionError ? (
                                                <div className="text-red-400 bg-red-900/10 p-3 rounded-lg border border-red-500/20 whitespace-pre-wrap">
                                                    {executionError}
                                                </div>
                                            ) : testResults ? (
                                                <div className="space-y-4">
                                                    {/* Test Summary */}
                                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-400">Test Results</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-blue-400">
                                                                    ✓ {testResults.filter(r => r.passed).length} Passed
                                                                </span>
                                                                <span className="text-red-400">
                                                                    ✗ {testResults.filter(r => !r.passed).length} Failed
                                                                </span>
                                                                <span className="text-slate-500">
                                                                    ({testResults.filter(r => !r.is_hidden).length} visible, {testResults.filter(r => r.is_hidden).length} hidden)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Individual Test Results */}
                                                    {testResults.map((res, i) => (
                                                        <div key={i} className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                {res.passed ? (
                                                                    <span className="text-blue-400 flex items-center gap-1 font-bold">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                        Test Case {res.test_case}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-400 flex items-center gap-1 font-bold">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        Test Case {res.test_case}
                                                                    </span>
                                                                )}
                                                                <span className="text-slate-500 text-xs ml-auto flex items-center gap-2">
                                                                    {res.is_hidden && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold">HIDDEN</span>}
                                                                    {res.error_type && !res.passed && (
                                                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-[10px] font-bold uppercase">
                                                                            {res.error_type === 'timeout' ? 'TLE' : res.error_type === 'runtime_error' ? 'RE' : res.error_type === 'wrong_answer' ? 'WA' : 'ERR'}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {/* Details only for visible test cases */}
                                                            {!res.is_hidden && (
                                                                <div className="bg-black/30 p-3 rounded-lg text-xs ml-6 grid gap-2 text-slate-300">
                                                                    <div className="grid grid-cols-[80px_1fr]">
                                                                        <span className="text-slate-500">Expected:</span>
                                                                        <span className="font-mono">{res.expected}</span>
                                                                    </div>
                                                                    {res.actual !== null && (
                                                                        <div className="grid grid-cols-[80px_1fr]">
                                                                            <span className="text-slate-500">Actual:</span>
                                                                            <span className={`font-mono ${res.passed ? 'text-blue-400' : 'text-red-400'}`}>{res.actual}</span>
                                                                        </div>
                                                                    )}
                                                                    {res.error && (
                                                                        <div className="grid grid-cols-[80px_1fr]">
                                                                            <span className="text-slate-500">Error:</span>
                                                                            <span className="text-red-400 whitespace-pre-wrap">{res.error}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Masked message for hidden test failures */}
                                                            {res.is_hidden && !res.passed && (
                                                                <div className="bg-red-900/10 p-3 rounded-lg text-xs ml-6 border border-red-500/20">
                                                                    <p className="text-red-400">
                                                                        {res.error_type === 'timeout'
                                                                            ? '⏱️ Your solution exceeded the time limit for this test case.'
                                                                            : res.error_type === 'runtime_error'
                                                                                ? '❌ Your solution encountered a runtime error. Check for edge cases like empty inputs, null values, or array bounds.'
                                                                                : '⚠️ Your solution produced incorrect output. Consider edge cases and boundary conditions.'}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-slate-600 italic">Run your code to see results.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: SUCCESS */}
                        {step === 3 && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping-slow"></div>
                                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h2 className="text-4xl font-bold mb-4 text-white">Expert Verified!</h2>
                                <p className="text-slate-400 text-lg max-w-lg mb-8">
                                    Incredible job. You've successfully solved both challenges and demonstrated mastery in <span className="text-blue-400 font-bold">{skill}</span>.
                                </p>
                                <button onClick={() => onClose()} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                                    View Dashboard
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CodingVerificationModal;
