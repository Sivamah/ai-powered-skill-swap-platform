import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MCQVerificationModal = ({ isOpen, onClose, skill, onVerified }) => {
    const [step, setStep] = useState(0); // 0: Intro, 1: Quiz, 2: Result
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/verify/mcq-questions`, {
                skill: skill,
                num_questions: 10
            });
            setQuestions(res.data);
            setAnswers(new Array(res.data.length).fill(null));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && skill) {
            fetchQuestions();
            setTimeLeft(600);
            setStep(0);
            setResult(null);
            setAnswers([]);
            setCurrentQuestionIndex(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, skill]);

    const submitQuiz = async (isTimeout = false) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/verify/mcq-submit`, {
                skill: skill,
                answers: answers,
                questions: questions
            });
            setResult(res.data);
            setStep(2);
            if (res.data.verified) {
                setTimeout(() => {
                    onVerified(skill); // Notify parent that skill was verified
                }, 3000); // Wait a bit to show success message
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || step !== 1) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    submitQuiz(true); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, step]);


    const handleAnswerSelect = (option) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = option;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitQuiz();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };


    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in text-white overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-4xl bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden min-h-[600px]">

                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f172a]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            {skill.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Skill Verification: <span className="text-purple-400">{skill}</span></h2>
                    </div>

                    {step === 1 && (
                        <div className="flex items-center gap-4 bg-black/30 px-4 py-1.5 rounded-full border border-white/5">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className={timeLeft < 60 ? "text-red-400 font-mono" : "text-emerald-400 font-mono"}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    )}

                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative p-8 flex flex-col justify-center">
                    <AnimatePresence mode="wait">

                        {/* STEP 0: INTRO */}
                        {step === 0 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
                            >
                                <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <h1 className="text-3xl font-bold mb-4">Knowledge Assessment</h1>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    You are about to start a 10-question multiple choice quiz for <span className="text-white font-semibold">{skill}</span>.
                                    You need to answer at least <span className="text-white font-semibold">7 questions correctly</span> to pass.
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left">
                                        <div className="text-purple-400 font-bold mb-1">Time Limit</div>
                                        <div className="text-sm text-slate-500">10 Minutes</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left">
                                        <div className="text-purple-400 font-bold mb-1">Passing Score</div>
                                        <div className="text-sm text-slate-500">70% (7/10)</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                    className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                                >
                                    {loading ? "Loading..." : "Start Quiz"}
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 1: QUIZ */}
                        {step === 1 && questions.length > 0 && (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-3xl mx-auto"
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-6 text-white leading-relaxed">
                                        {currentQuestionIndex + 1}. {questions[currentQuestionIndex].q}
                                    </h3>
                                    <div className="space-y-3">
                                        {questions[currentQuestionIndex].options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerSelect(option)}
                                                className={`w-full p-4 rounded-xl text-left transition-all border ${answers[currentQuestionIndex] === option
                                                    ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/50'
                                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${answers[currentQuestionIndex] === option
                                                        ? 'bg-purple-500 border-purple-500 text-white'
                                                        : 'border-slate-600 text-slate-600'
                                                        }`}>
                                                        {['A', 'B', 'C', 'D'][idx]}
                                                    </div>
                                                    {option}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
                                    <button
                                        onClick={handlePrev}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-6 py-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        disabled={!answers[currentQuestionIndex]}
                                        className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {currentQuestionIndex === questions.length - 1 ? (loading ? "Submitting..." : "Finish Quiz") : "Next Question"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: RESULT */}
                        {step === 2 && result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center"
                            >
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 relative ${result.verified ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    <div className={`absolute inset-0 border-2 rounded-full animate-ping-slow ${result.verified ? 'border-emerald-500/30' : 'border-red-500/30'}`}></div>
                                    {result.verified ? (
                                        <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                </div>

                                <h2 className="text-4xl font-bold mb-2 text-white">{result.verified ? "Passed!" : "Failed"}</h2>
                                <p className="text-slate-400 text-lg mb-8">
                                    {result.message}
                                </p>

                                <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <div className="text-2xl font-bold text-white mb-1">{result.score}/{result.total}</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <div className={`text-2xl font-bold mb-1 ${result.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.round(result.percentage)}%</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Percentage</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <div className="text-2xl font-bold text-purple-400 mb-1">{result.badge || "-"}</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Badge</div>
                                    </div>
                                </div>

                                {!result.verified ? (
                                    <button onClick={() => { setStep(0); fetchQuestions(); }} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                                        Try Again
                                    </button>
                                ) : (
                                    <button onClick={onClose} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-colors">
                                        Continue to Dashboard
                                    </button>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MCQVerificationModal;
