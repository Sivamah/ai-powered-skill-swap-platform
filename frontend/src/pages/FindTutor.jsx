import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function FindTutor({ token }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Session Request State
    const [requestModal, setRequestModal] = useState({ open: false, teacherId: null, skillName: null, teacherName: null });

    // Mentor Detail Modal State
    const [detailModal, setDetailModal] = useState({ open: false, mentor: null });

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setSearching(true);
        axios.get(`${API_URL}/find_tutor?query=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setResults(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }

    const initiateRequest = (teacherId, skillName, teacherName) => {
        setRequestModal({ open: true, teacherId, skillName, teacherName });
    }

    const confirmRequest = (type) => {
        const { teacherId, skillName } = requestModal;

        axios.post(`${API_URL}/request_session`, null, {
            params: { teacher_id: teacherId, skill_name: skillName, session_type: type },
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.data.auto_accepted) {
                    alert(`✅ Session auto-confirmed (Demo Mode)!\n\nMeet Link: ${res.data.meet_link}\n\nCheck 'My Sessions' for details.`);
                } else {
                    alert("Session requested! Check 'My Sessions' for status.");
                }
                setRequestModal({ open: false, teacherId: null, skillName: null, teacherName: null });
                navigate('/my-sessions');
            })
            .catch(err => {
                alert(err.response?.data?.detail || "Request failed");
                setRequestModal({ open: false, teacherId: null, skillName: null, teacherName: null });
            });
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 w-full">

            {/* Deep Ocean Collaboration Background Theme */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Deep Ocean Gradient Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1929] via-[#0d2847] to-[#001e3c]"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/40 via-transparent to-cyan-900/30"></div>

                {/* Subtle Wave Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-96 opacity-10">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="url(#wave-gradient)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
                            <animate attributeName="d" dur="10s" repeatCount="indefinite" values="
                                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                                M0,160L48,144C96,128,192,96,288,90.7C384,85,480,107,576,128C672,149,768,171,864,165.3C960,160,1056,128,1152,117.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                        </path>
                        <defs>
                            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0d9488" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#0891b2" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Floating Abstract Shapes */}
                <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-float-slow"></div>
                <div className="absolute top-[40%] right-[8%] w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] animate-float-slower" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-[15%] left-[15%] w-72 h-72 bg-blue-500/6 rounded-full blur-[90px] animate-float-slow" style={{ animationDelay: '4s' }}></div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}></div>
            </div>


            <div className="text-center space-y-6 max-w-4xl mx-auto py-8 animate-slide-up">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
                    Find Your <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">Mentor</span>
                </h1>
                <p className="text-slate-300/80 text-xl font-light leading-relaxed max-w-2xl mx-auto">
                    Access a global network of experts. Our neural matching engine finds the perfect tutor for your specific technical needs.
                </p>
            </div>

            {/* Ocean-Themed Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group z-20 animate-slide-up delay-100">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 via-cyan-500/30 to-teal-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                <div className="relative flex items-center bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 rounded-xl p-2 shadow-2xl shadow-teal-500/10">
                    <svg className="w-6 h-6 text-teal-300 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="e.g. 'Advanced Python with focus on API dev'"
                        className="w-full bg-transparent text-white px-5 py-4 focus:outline-none placeholder-cyan-300/40 text-lg font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/50">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Scan Network'}
                    </button>
                </div>
            </form>

            {/* Results Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {Array.isArray(results) && results.map((r, idx) => (
                    <div
                        key={r.user_id}
                        className="bg-slate-900/70 backdrop-blur-sm border border-teal-500/20 rounded-2xl shadow-xl shadow-teal-500/5 hover:shadow-teal-500/20 hover:border-teal-500/40 transition-all duration-500 flex flex-col group relative overflow-hidden cursor-pointer"
                        style={{ animationDelay: `${idx * 100}ms` }}
                        onClick={() => setDetailModal({ open: true, mentor: r })}
                    >
                        {/* Soft Teal Glow on Hover */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-teal-500/20 group-hover:via-cyan-500/20 group-hover:to-teal-500/20 rounded-2xl blur transition duration-500"></div>
                        <div className="relative p-8 flex flex-col h-full gap-6">
                            {/* Header: Identity & Match */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-5 items-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur opacity-20"></div>
                                        <div className="relative w-16 h-16 rounded-2xl bg-slate-800/80 border border-teal-500/30 flex items-center justify-center text-teal-300 text-2xl font-black shadow-lg">
                                            {r.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">{r.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(r.reputation || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-800'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.603.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                ))}
                                            </div>
                                            <span className="text-slate-500 text-xs font-mono">{Number(r.reputation || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="px-3 py-1 bg-teal-500/15 border border-teal-500/30 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
                                        <span className="text-teal-300 font-bold text-[10px] uppercase tracking-widest">{((r.match_score || 0) * 100).toFixed(0)}% MATCH</span>
                                    </div>
                                </div>
                            </div>

                            {/* AI Intelligence Summary */}
                            {r.feedback_summary && (
                                <div className="relative p-5 bg-black/20 rounded-xl border border-cyan-500/10">
                                    <div className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[9px] font-bold text-cyan-400 uppercase tracking-widest border border-cyan-500/20 rounded">
                                        AI Analysis
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed font-light line-clamp-2">
                                        {`"${r.feedback_summary}"`}
                                    </p>
                                </div>
                            )}

                            {/* Skills Matrix */}
                            <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                {(r.skills || []).slice(0, 4).map((skill, i) => {
                                    const badge = r.badges && r.badges[skill];
                                    return (
                                        <div key={i} className="flex items-center gap-2 group/skill">
                                            <div className="bg-white/5 hover:bg-white/10 border border-cyan-500/20 pl-3 pr-2 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                                                <span className="text-cyan-200 text-xs font-bold uppercase tracking-wider">{skill}</span>

                                                {badge && (
                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded
                                                        ${badge === 'Expert' ? 'bg-purple-500/30 text-purple-300' :
                                                            badge === 'Intermediate' ? 'bg-indigo-500/30 text-indigo-300' :
                                                                'bg-emerald-500/30 text-emerald-300'}`}>
                                                        {badge.substring(0, 1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {(r.skills || []).length > 4 && (
                                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                                        <span className="text-slate-400 text-xs font-semibold">+{(r.skills || []).length - 4} more</span>
                                    </div>
                                )}
                            </div>

                            {/* Connect Button with Teal Glow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (r.skills && r.skills.length > 0) {
                                        initiateRequest(r.user_id, r.skills[0], r.name);
                                    }
                                }}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold w-full py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="font-bold">Connect Now</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {searching && results.length === 0 && !loading && (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in opacity-50">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <p className="text-slate-500 font-medium">No experts found matching your criteria.</p>
                </div>
            )}

            {/* Mentor Detail Modal */}
            {detailModal.open && detailModal.mentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4" onClick={() => setDetailModal({ open: false, mentor: null })}>
                    <div className="mentor-card max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
                        <div className="relative p-8 space-y-6 bg-gradient-to-br from-slate-900 to-slate-800">
                            {/* Close Button */}
                            <button
                                onClick={() => setDetailModal({ open: false, mentor: null })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors z-10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Profile Header */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                {/* Large Avatar */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-lime-400 to-pink-400 rounded-full blur-2xl opacity-50"></div>
                                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-lime-500 flex items-center justify-center text-white text-6xl font-black border-4 border-white/20 shadow-2xl">
                                        {detailModal.mentor.name.charAt(0).toUpperCase()}
                                    </div>
                                    {detailModal.mentor.verified && (
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg shadow-emerald-500/50">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Name & ID */}
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tight">{detailModal.mentor.name}</h2>
                                    <div className="flex items-center justify-center gap-3 mt-2">
                                        <span className="text-sm text-slate-500 font-mono">ID: #{detailModal.mentor.user_id}</span>
                                        {detailModal.mentor.verified && (
                                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                Verified Mentor
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Reputation & Stats */}
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < Math.round(detailModal.mentor.reputation || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-white text-lg font-bold">{Number(detailModal.mentor.reputation || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-700"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-cyan-400">{detailModal.mentor.session_count || 0}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Sessions</div>
                                    </div>
                                    {detailModal.mentor.match_score && (
                                        <>
                                            <div className="h-8 w-px bg-slate-700"></div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-lime-400">{((detailModal.mentor.match_score || 0) * 100).toFixed(0)}%</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider">Match</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Experience Level */}
                            {detailModal.mentor.experience_level && (
                                <div className="flex justify-center">
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider
                                        ${detailModal.mentor.experience_level === 'Expert' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                            detailModal.mentor.experience_level === 'Intermediate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                        {detailModal.mentor.experience_level === 'Expert' && (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        )}
                                        {detailModal.mentor.experience_level} Level
                                    </span>
                                </div>
                            )}

                            {/* Bio */}
                            {detailModal.mentor.bio && (
                                <div className="p-6 bg-black/30 rounded-xl border border-white/10">
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">About</h3>
                                    <p className="text-slate-300 leading-relaxed">{detailModal.mentor.bio}</p>
                                </div>
                            )}

                            {/* AI Analysis */}
                            {detailModal.mentor.feedback_summary && (
                                <div className="p-6 bg-black/30 rounded-xl border border-cyan-500/20">
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                        </svg>
                                        AI Analysis
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed italic">"{detailModal.mentor.feedback_summary}"</p>
                                </div>
                            )}

                            {/* Skills */}
                            {detailModal.mentor.skills && detailModal.mentor.skills.length > 0 && (
                                <div className="p-6 bg-black/30 rounded-xl border border-white/10">
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Skills & Expertise</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {detailModal.mentor.skills.map((skill, i) => {
                                            const badge = detailModal.mentor.badges && detailModal.mentor.badges[skill];
                                            return (
                                                <div key={i} className="flex items-center gap-2 bg-white/5 border border-cyan-500/20 pl-4 pr-3 py-2 rounded-lg">
                                                    <span className="text-cyan-200 text-sm font-bold">{skill}</span>
                                                    {badge && (
                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded
                                                            ${badge === 'Expert' ? 'bg-purple-500/30 text-purple-300' :
                                                                badge === 'Intermediate' ? 'bg-indigo-500/30 text-indigo-300' :
                                                                    'bg-emerald-500/30 text-emerald-300'}`}>
                                                            {badge}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Connect Button */}
                            <button
                                onClick={() => {
                                    setDetailModal({ open: false, mentor: null });
                                    if (detailModal.mentor.skills && detailModal.mentor.skills.length > 0) {
                                        initiateRequest(detailModal.mentor.user_id, detailModal.mentor.skills[0], detailModal.mentor.name);
                                    }
                                }}
                                className="btn-mentor w-full py-4 rounded-xl shadow-2xl flex items-center justify-center gap-3 text-lg group/btn"
                            >
                                <svg className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="font-black">Request Session with {detailModal.mentor.name}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Modal */}
            {requestModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
                    <div className="glass-card max-w-sm w-full p-6 space-y-6 relative border-indigo-500/20 shadow-2xl shadow-indigo-500/20">
                        <button
                            onClick={() => setRequestModal({ open: false, teacherId: null, skillName: null, teacherName: null })}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-white font-sans">Session Type</h3>
                            <p className="text-sm text-slate-400">Requesting <span className="text-indigo-400 font-semibold">{requestModal.skillName}</span> with {requestModal.teacherName}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => confirmRequest('standard')}
                                className="col-span-2 group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all text-center space-y-3"
                            >
                                <div className="w-10 h-10 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">Connect & Request Session</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Wait for Mentor Approval</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
