import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";
import { API_URL } from "../services/api";

// Certificate generator: creates a printable PDF-style certificate
function generateCertificatePDF(cert) {
    const completionDate = cert.completion_date
        ? new Date(cert.completion_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate of Completion - ${cert.course_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0f1e; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .cert { width: 900px; min-height: 620px; background: linear-gradient(135deg, #0d1b2a 0%, #0f2a4a 50%, #0d1b2a 100%); border: 3px solid #1e3a5f; border-radius: 16px; padding: 60px; position: relative; overflow: hidden; box-shadow: 0 0 80px rgba(34,211,238,0.2); }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid rgba(34,211,238,0.25); border-radius: 12px; pointer-events: none; }
  .cert::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #22d3ee, #3b82f6, #22d3ee); }
  .corner { position: absolute; width: 60px; height: 60px; border-color: rgba(34,211,238,0.5); border-style: solid; }
  .corner.tl { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
  .corner.tr { top: 20px; right: 20px; border-width: 2px 2px 0 0; }
  .corner.bl { bottom: 20px; left: 20px; border-width: 0 0 2px 2px; }
  .corner.br { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }
  .platform-badge { text-align: center; margin-bottom: 20px; }
  .platform-name { font-size: 13px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #22d3ee; }
  .divider { width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #22d3ee, transparent); margin: 12px auto; }
  .cert-title { text-align: center; font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: #f0f9ff; margin-bottom: 6px; letter-spacing: -0.5px; }
  .cert-subtitle { text-align: center; font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(148,163,184,0.7); margin-bottom: 40px; }
  .presented { text-align: center; font-size: 14px; color: rgba(148,163,184,0.6); margin-bottom: 12px; }
  .recipient { text-align: center; font-family: 'Playfair Display', serif; font-size: 36px; color: #7dd3fc; margin-bottom: 8px; border-bottom: 1px solid rgba(34,211,238,0.3); padding-bottom: 12px; display: inline-block; min-width: 300px; }
  .recipient-wrap { text-align: center; margin-bottom: 30px; }
  .completion-text { text-align: center; font-size: 15px; color: rgba(203,213,225,0.8); margin-bottom: 8px; line-height: 1.7; }
  .course-name { font-size: 22px; font-weight: 700; color: #e2e8f0; }
  .meta { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 25px; border-top: 1px solid rgba(34,211,238,0.15); }
  .meta-item { text-align: center; }
  .meta-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(148,163,184,0.5); margin-bottom: 6px; }
  .meta-value { font-size: 14px; font-weight: 600; color: #94a3b8; }
  .meta-line { width: 120px; height: 1px; background: rgba(148,163,184,0.2); margin: 8px auto 0; }
  .watermark { position: absolute; bottom: 30px; right: 40px; font-size: 80px; opacity: 0.04; color: #22d3ee; font-weight: 900; }
</style>
</head>
<body>
<div class="cert">
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="platform-badge">
    <div class="platform-name">✦ Skill Swap AI Platform ✦</div>
    <div class="divider"></div>
  </div>

  <div class="cert-title">Certificate of Completion</div>
  <div class="cert-subtitle">This certifies that</div>

  <div class="recipient-wrap">
    <div class="recipient">${cert.user_name || 'Learner'}</div>
  </div>

  <p class="completion-text">has successfully completed the course</p>
  <p class="completion-text"><span class="course-name">${cert.course_name}</span></p>
  <p class="completion-text">under the guidance of <strong style="color:#7dd3fc">${cert.mentor_name || 'Mentor'}</strong></p>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Issued By</div>
      <div class="meta-value">Skill Swap AI</div>
      <div class="meta-line"></div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Date of Completion</div>
      <div class="meta-value">${completionDate}</div>
      <div class="meta-line"></div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Certificate ID</div>
      <div class="meta-value">SSAI-${(cert.id || 0).toString().padStart(6, '0')}</div>
      <div class="meta-line"></div>
    </div>
  </div>

  <div class="watermark">✓</div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
        win.onload = () => setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
}

export default function MySessions({ token }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState({ open: false, sessionId: null });
    const [certificates, setCertificates] = useState([]);
    const [certLoading, setCertLoading] = useState({});
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

    const fetchSessions = useCallback(() => {
        axios.get(`${API_URL}/my_sessions`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setSessions(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [token])

    const fetchCertificates = useCallback(() => {
        if (!token) return;
        axios.get(`${API_URL}/certificates`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setCertificates(res.data))
            .catch(() => { });
    }, [token]);

    useEffect(() => {
        fetchSessions();
        fetchCertificates();
    }, [fetchSessions, fetchCertificates]);

    const handleAccept = (sessionId) => {
        axios.post(`${API_URL}/confirm_session/${sessionId}`, null, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                setActionMessage({ type: 'success', text: 'Session confirmed!' });
                fetchSessions();
            })
            .catch(err => {
                setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to accept session' });
            });
    }

    const handleReviewSuccess = () => {
        setReviewModal({ open: false, sessionId: null });
        fetchSessions();
    }

    const handleComplete = (sessionId) => {
        if (!window.confirm('Are you sure you want to mark this session as completed? Credits will be transferred to the tutor.')) return;

        axios.post(`${API_URL}/complete_session/${sessionId}`, null, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                setActionMessage({ type: 'success', text: '✅ Session completed! Certificate issued. Check the History section.' });
                fetchSessions();
                fetchCertificates();
            })
            .catch(err => setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to complete session' }));
    }

    const handleDownloadCertificate = async (sessionId) => {
        setCertLoading(prev => ({ ...prev, [sessionId]: true }));
        try {
            const cert = certificates.find(c => c.session_id === sessionId);
            if (cert) {
                generateCertificatePDF(cert);
            } else {
                const res = await axios.get(`${API_URL}/certificates`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const freshCert = res.data.find(c => c.session_id === sessionId);
                if (freshCert) {
                    setCertificates(res.data);
                    generateCertificatePDF(freshCert);
                } else {
                    setActionMessage({ type: 'error', text: 'Certificate not found. Ensure the session was completed.' });
                }
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Failed to generate certificate. Please try again.' });
        } finally {
            setCertLoading(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    const upcoming = sessions.filter(s => s.status === 'scheduled');
    const pending = sessions.filter(s => s.status === 'pending');
    const history = sessions.filter(s => s.status === 'completed');

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

            {/* Toast Notification */}
            {actionMessage.text && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border text-sm font-medium animate-slide-up ${actionMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {actionMessage.type === 'success' ? '✅' : '❌'} {actionMessage.text}
                    <button onClick={() => setActionMessage({ type: '', text: '' })} className="ml-2 opacity-60 hover:opacity-100">×</button>
                </div>
            )}

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
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">Scheduled</h2>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{upcoming.length}</span>
                        </div>

                        {upcoming.length > 0 ? (
                            <div className="space-y-4">
                                {upcoming.map((s) => (
                                    <div key={s.id} className="sessions-card p-6 border-l-4 border-l-cyan-500 hover:bg-white/[0.04]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{s.skill_name}</h3>
                                                <p className="text-sm text-slate-400">with {s.other_user_name}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                                {s.session_type}
                                            </span>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* ── Google Meet Launch Button ── */}
                                            {s.meet_link && !s.meet_link.includes('/sim-') ? (
                                                <a
                                                    href={s.meet_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 btn-sessions py-2 text-sm flex items-center justify-center gap-2"
                                                    title="Join Google Meet session"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                    Join Meet
                                                </a>
                                            ) : s.meet_link && s.meet_link.includes('/sim-') ? (
                                                <a
                                                    href={s.meet_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 py-2 text-sm flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                                    title="Demo Meet link — replace with real Google Meet in production"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                    Join (Demo)
                                                </a>
                                            ) : (
                                                <span
                                                    className="flex-1 py-2 text-sm flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-600 cursor-not-allowed select-none"
                                                    title="Meet link will appear once the teacher confirms the session"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Awaiting Link
                                                </span>
                                            )}
                                            <Link to={`/session/${s.id}`} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
                                                Details
                                            </Link>
                                            {!s.is_tutor && (
                                                <button
                                                    onClick={() => handleComplete(s.id)}
                                                    className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-medium transition-colors"
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
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">Pending Requests</h2>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{pending.length}</span>
                        </div>

                        {pending.length > 0 ? (
                            <div className="space-y-4">
                                {pending.map((s) => (
                                    <div key={s.id} className="sessions-card p-6 relative overflow-hidden border-l-4 border-l-cyan-500">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>

                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{s.skill_name}</h3>
                                                <p className="text-xs text-slate-400">Request from {s.other_user_name}</p>
                                            </div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>

                                        {s.is_tutor ? (
                                            <div className="flex gap-3 relative z-10">
                                                <button onClick={() => handleAccept(s.id)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-black font-bold py-2 rounded-lg text-sm transition-colors">
                                                    Accept Request
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-blue-500/80 italic relative z-10">Waiting for tutor approval...</div>
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
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.map((s) => {
                                    const hasCert = certificates.some(c => c.session_id === s.id);
                                    return (
                                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-300">{s.skill_name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">{s.session_type}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">{s.other_user_name}</td>
                                            <td className="p-4 text-sm text-slate-500 font-mono">{s.end_time ? new Date(s.end_time).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {/* Certificate download button */}
                                                    {!s.is_tutor && hasCert && (
                                                        <button
                                                            onClick={() => handleDownloadCertificate(s.id, s.skill_name)}
                                                            disabled={certLoading[s.id]}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-colors disabled:opacity-50"
                                                            title="Download Certificate"
                                                        >
                                                            {certLoading[s.id] ? (
                                                                <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            )}
                                                            Certificate
                                                        </button>
                                                    )}
                                                    {!s.is_tutor && !s.review_status ? (
                                                        <button
                                                            onClick={() => setReviewModal({ open: true, sessionId: s.id })}
                                                            className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wide"
                                                        >
                                                            Write Review
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs">Completed</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-500 text-sm italic">No completed sessions yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CERTIFICATES SECTION */}
                {certificates.length > 0 && (
                    <div className="animate-slide-up delay-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-8 bg-cyan-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">My Certificates</h2>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-xs text-cyan-400 border border-cyan-500/20">{certificates.length}</span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {certificates.map((cert) => (
                                <div key={cert.id} className="sessions-card p-5 border border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-sm truncate">{cert.course_name}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Mentor: {cert.mentor_name}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">
                                        {cert.completion_date ? new Date(cert.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                    <button
                                        onClick={() => generateCertificatePDF(cert)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Certificate
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
