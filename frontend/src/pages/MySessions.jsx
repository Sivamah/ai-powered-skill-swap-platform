import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";

export default function MySessions({ token }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState({ open: false, sessionId: null });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

    const fetchSessions = useCallback(() => {
        axios.get(`${API_URL}/my_sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setSessions(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token, API_URL])

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleAccept = (sessionId) => {
        axios.post(`${API_URL}/confirm_session/${sessionId}`, null, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                alert(res.data.message || "Session confirmed!");
                if (res.data.link) {
                    // Optional: Open link or just let the user see it in the UI
                }
                fetchSessions();
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.detail || "Failed to accept");
            });
    }

    const handleReviewSuccess = () => {
        setReviewModal({ open: false, sessionId: null });
        fetchSessions();
    }

    const handleComplete = (sessionId) => {
        if (!confirm("Are you sure you want to mark this session as completed? Credits will be transferred to the tutor.")) return;

        axios.post(`${API_URL}/complete_session/${sessionId}`, null, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                fetchSessions();
            })
            .catch(err => alert(err.response?.data?.detail || "Failed to complete session"));
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    const upcoming = sessions.filter(s => s.status === 'scheduled');
    const pending = sessions.filter(s => s.status === 'pending');
    const history = sessions.filter(s => s.status === 'completed');

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

            {/* My Sessions Background - Amber + Slate + Emerald */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Roadmap / Path-Inspired Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/30 via-transparent to-emerald-900/20"></div>

                {/* Progress Path Visualization */}
                <div className="absolute left-[10%] top-[20%] w-1 h-[60%] bg-gradient-to-b from-amber-500/30 via-slate-500/20 to-emerald-500/30 blur-sm"></div>
                <div className="absolute top-[20%] left-[10%] w-16 h-16 bg-amber-500/10 rounded-full blur-2xl animate-progress-slide"></div>
                <div className="absolute top-[50%] left-[10%] w-20 h-20 bg-slate-400/10 rounded-full blur-2xl animate-progress-slide" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute bottom-[20%] left-[10%] w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl animate-progress-slide" style={{ animationDelay: '0.6s' }}></div>

                {/* Ambient Circles */}
                <div className="absolute top-[30%] right-[20%] w-96 h-96 bg-amber-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[25%] right-[15%] w-80 h-80 bg-emerald-600/8 rounded-full blur-[100px]"></div>
            </div>

            <header className="animate-slide-up">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-gradient-sessions">My Sessions</h1>
                <p className="text-slate-400 font-light">Manage your learning journey and upcoming collaborations.</p>
            </header>

            <div className="space-y-16">

                {/* UPCOMING & PENDING */}
                <div className="grid lg:grid-cols-2 gap-8 animate-slide-up delay-100">

                    {/* Scheduled Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">Scheduled</h2>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{upcoming.length}</span>
                        </div>

                        {upcoming.length > 0 ? (
                            <div className="space-y-4">
                                {upcoming.map((s) => (
                                    <div key={s.id} className="sessions-card p-6 border-l-4 border-l-emerald-500 hover:bg-white/[0.04]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{s.skill_name}</h3>
                                                <p className="text-sm text-slate-400">with {s.other_user_name}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                                {s.session_type}
                                            </span>
                                        </div>

                                        <div className="flex gap-3">
                                            <a href={s.meet_link || "#"} target="_blank" rel="noreferrer" className="flex-1 btn-sessions py-2 text-sm flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                Launch
                                            </a>
                                            <Link to={`/session/${s.id}`} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
                                                Details
                                            </Link>
                                            {!s.is_tutor && (
                                                <button
                                                    onClick={() => handleComplete(s.id)}
                                                    className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors"
                                                    title="Mark session as finished to release credits"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl border-2 border-dashed border-white/5 text-center">
                                <p className="text-slate-500 text-sm">No upcoming sessions.</p>
                            </div>
                        )}
                    </div>

                    {/* Pending Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">Pending Requests</h2>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{pending.length}</span>
                        </div>

                        {pending.length > 0 ? (
                            <div className="space-y-4">
                                {pending.map((s) => (
                                    <div key={s.id} className="sessions-card p-6 relative overflow-hidden border-l-4 border-l-amber-500">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>

                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{s.skill_name}</h3>
                                                <p className="text-xs text-slate-400">Request from {s.other_user_name}</p>
                                            </div>
                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                        </div>

                                        {s.is_tutor ? (
                                            <div className="flex gap-3 relative z-10">
                                                <button onClick={() => handleAccept(s.id)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-lg text-sm transition-colors">
                                                    Accept Request
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-500/80 italic relative z-10">Waiting for tutor approval...</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl border-2 border-dashed border-white/5 text-center">
                                <p className="text-slate-500 text-sm">No pending requests.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* HISTORY */}
                <div className="animate-slide-up delay-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-slate-700 rounded-full"></div>
                        <h2 className="text-xl font-bold text-white">History</h2>
                    </div>

                    <div className="sessions-card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Session</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Partner</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-300">{s.skill_name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{s.session_type}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">{s.other_user_name}</td>
                                        <td className="p-4 text-sm text-slate-500 font-mono">{s.end_time ? new Date(s.end_time).toLocaleDateString() : 'N/A'}</td>
                                        <td className="p-4 text-right">
                                            {!s.is_tutor && !s.review_status ? (
                                                <button
                                                    onClick={() => setReviewModal({ open: true, sessionId: s.id })}
                                                    className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wide"
                                                >
                                                    Write Review
                                                </button>
                                            ) : (
                                                <span className="text-slate-600 text-xs">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-500 text-sm italic">No completed sessions yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ReviewModal
                isOpen={reviewModal.open}
                sessionId={reviewModal.sessionId}
                token={token}
                onClose={() => setReviewModal({ open: false, sessionId: null })}
                onSuccess={handleReviewSuccess}
            />
        </div>
    );
}
