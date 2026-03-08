import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../services/api'

/* ═══════════════════════════════════════════════════════════
   RIPPLE HOOK
   ═══════════════════════════════════════════════════════════ */
function useRipple(ref) {
    useEffect(() => {
        const btn = ref.current
        if (!btn) return
        const handler = (e) => {
            const rect = btn.getBoundingClientRect()
            const span = document.createElement('span')
            Object.assign(span.style, {
                position: 'absolute', borderRadius: '50%',
                background: 'rgba(255,255,255,0.30)',
                transform: 'scale(0)', animation: 'lp-ripple 0.65s linear',
                left: `${e.clientX - rect.left}px`,
                top: `${e.clientY - rect.top}px`,
                width: '10px', height: '10px',
                marginLeft: '-5px', marginTop: '-5px',
                pointerEvents: 'none',
            })
            btn.appendChild(span)
            span.addEventListener('animationend', () => span.remove())
        }
        btn.addEventListener('click', handler)
        return () => btn.removeEventListener('click', handler)
    }, [ref])
}

/* ═══════════════════════════════════════════════════════════
   FLOATING INPUT COMPONENT
   ═══════════════════════════════════════════════════════════ */
function FloatingInput({ id, type, label, value, onChange, icon, required, accent = '#22d3ee' }) {
    const [focused, setFocused] = useState(false)
    const lifted = focused || value.length > 0

    return (
        <div className="lp-field" style={{ '--acc': accent }}>
            <span className="lp-field-icon">{icon}</span>
            <input
                id={id} type={type}
                className="lp-input"
                placeholder=" "
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required={required}
                autoComplete={type === 'email' ? 'email' : 'current-password'}
            />
            <label
                htmlFor={id}
                className={`lp-label${lifted ? ' lp-lifted' : ''}${focused ? ' lp-label-acc' : ''}`}
            >
                {label}
            </label>
            <span className={`lp-focus-bar${focused ? ' lp-bar-on' : ''}`} />
            {focused && <span className="lp-field-glow" />}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Login({ setToken }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const navigate = useNavigate()
    const btnRef = useRef(null)
    useRipple(btnRef)

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80)
        return () => clearTimeout(t)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)
        try {
            const res = await axios.post(`${API_URL}/token`, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            const token = res.data.access_token
            setToken(token)
            localStorage.setItem('token', token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                /* ════════════════════════════════════════
                   LOGIN PAGE — transparent over global bg
                   ════════════════════════════════════════ */
                .lp-root {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    background: transparent;
                    position: relative;
                }

                /* ── Card outer (entrance animation) ── */
                .lp-card-outer {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 455px;
                    opacity: 0;
                    transform: translateY(52px) scale(0.94);
                    transition:
                        opacity  0.80s cubic-bezier(.22,1,.36,1),
                        transform 0.80s cubic-bezier(.22,1,.36,1);
                }
                .lp-card-outer.lp-show {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                /* ── Spinning conic-gradient border ── */
                .lp-border {
                    position: absolute; inset: -1.5px; border-radius: 26px;
                    background: conic-gradient(
                        from var(--lp-angle, 0deg),
                        transparent 0deg,
                        rgba(34,211,238,0.70) 50deg,
                        rgba(99,102,241,0.55) 110deg,
                        transparent 170deg,
                        transparent 360deg
                    );
                    animation: lpBorderSpin 7s linear infinite;
                    z-index: -1; filter: blur(1px);
                }
                @property --lp-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
                @keyframes lpBorderSpin { to { --lp-angle: 360deg; } }
                @supports not (background: conic-gradient(from 0deg, red, blue)) {
                    .lp-border { background: linear-gradient(135deg, rgba(34,211,238,0.5), rgba(99,102,241,0.4)); }
                }

                /* ── Glass card ── */
                .lp-card {
                    background: rgba(2,8,23,0.82);
                    backdrop-filter: blur(30px) saturate(1.5);
                    -webkit-backdrop-filter: blur(30px) saturate(1.5);
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.07);
                    padding: 2.8rem 2.6rem 2.4rem;
                    display: flex; flex-direction: column; gap: 1.5rem;
                    position: relative; overflow: hidden;
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.03) inset,
                        0 40px 90px rgba(0,0,0,0.65);
                }
                .lp-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg,
                        transparent,
                        rgba(34,211,238,0.45) 35%,
                        rgba(99,102,241,0.35) 65%,
                        transparent);
                }

                /* ── Header ── */
                .lp-head { text-align: center; }
                .lp-logo {
                    width: 66px; height: 66px; margin: 0 auto 1.1rem; border-radius: 18px;
                    background: linear-gradient(135deg, #0ea5e9, #6366f1 55%, #22d3ee);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.12),
                                0 0 30px rgba(14,165,233,0.50),
                                0 0 70px rgba(14,165,233,0.22);
                    animation: lpLogoPulse 3.5s ease-in-out infinite;
                }
                @keyframes lpLogoPulse {
                    0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(14,165,233,0.50), 0 0 70px rgba(14,165,233,0.22); }
                    50%     { box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 0 44px rgba(14,165,233,0.70), 0 0 100px rgba(14,165,233,0.32); }
                }
                .lp-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: rgba(34,211,238,0.09); border: 1px solid rgba(34,211,238,0.25);
                    border-radius: 100px; padding: 3px 13px; margin-bottom: 0.7rem;
                    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.13em;
                    text-transform: uppercase; color: #22d3ee;
                }
                .lp-dot {
                    width: 6px; height: 6px; background: #22d3ee; border-radius: 50%;
                    box-shadow: 0 0 6px #22d3ee;
                    animation: lpDotBlink 1.7s ease-in-out infinite;
                }
                @keyframes lpDotBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
                .lp-title {
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    font-size: 2.05rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.12;
                    margin: 0 0 0.45rem;
                    background: linear-gradient(135deg, #f0f9ff 20%, #7dd3fc 52%, #a5b4fc);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .lp-sub { font-size: 0.875rem; color: rgba(148,163,184,0.75); line-height: 1.55; }

                /* ── Pills ── */
                .lp-pills { display: flex; gap: 0.45rem; justify-content: center; flex-wrap: wrap; }
                .lp-pill {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 3px 10px; border-radius: 100px;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    font-size: 0.685rem; color: rgba(148,163,184,0.65); font-weight: 500;
                }

                /* ── Error ── */
                .lp-error {
                    display: flex; align-items: center; gap: 0.7rem;
                    padding: 0.875rem 1rem;
                    background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22);
                    border-radius: 12px; color: #fca5a5; font-size: 0.84rem;
                    animation: lpErrIn 0.35s cubic-bezier(.22,1,.36,1);
                }
                @keyframes lpErrIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

                /* ════════════════════════════════════════
                   FLOATING INPUT
                   ════════════════════════════════════════ */
                .lp-field {
                    position: relative;
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 13px; overflow: hidden;
                    transition: border-color 0.28s, background 0.28s, box-shadow 0.28s;
                }
                .lp-field:focus-within {
                    background: rgba(34,211,238,0.04);
                    border-color: var(--acc, #22d3ee);
                    box-shadow: 0 0 0 3px rgba(34,211,238,0.13), 0 0 24px rgba(34,211,238,0.08);
                }
                .lp-field-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
                    display: flex; align-items: center;
                    color: rgba(148,163,184,0.45); pointer-events: none; z-index: 2;
                    transition: color 0.28s;
                }
                .lp-field:focus-within .lp-field-icon { color: var(--acc, #22d3ee); }
                .lp-input {
                    width: 100%; background: transparent; border: none; outline: none;
                    color: #f0f9ff; font-size: 0.94rem; font-family: 'Inter', sans-serif;
                    padding: 1.35rem 1rem 0.45rem 2.75rem;
                    caret-color: #22d3ee;
                }
                .lp-input:-webkit-autofill,
                .lp-input:-webkit-autofill:hover,
                .lp-input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #f0f9ff;
                    -webkit-box-shadow: 0 0 0px 1000px rgba(2,8,23,0.01) inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
                .lp-label {
                    position: absolute; left: 2.75rem; top: 50%; transform: translateY(-50%);
                    font-size: 0.88rem; color: rgba(148,163,184,0.52); pointer-events: none;
                    transition: top 0.24s, font-size 0.24s, color 0.24s, transform 0.24s;
                    font-family: 'Inter', sans-serif; font-weight: 500;
                }
                .lp-label.lp-lifted {
                    top: 0.5rem; transform: translateY(0);
                    font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase;
                }
                .lp-label.lp-label-acc { color: var(--acc, #22d3ee); }
                .lp-focus-bar {
                    position: absolute; bottom: 0; left: 0; height: 2px; width: 0%;
                    background: linear-gradient(90deg, var(--acc,#22d3ee), rgba(99,102,241,0.5));
                    border-radius: 0 0 13px 13px;
                    transition: width 0.35s cubic-bezier(.22,1,.36,1);
                }
                .lp-focus-bar.lp-bar-on { width: 100%; }
                .lp-field-glow {
                    position: absolute; inset: -1px; border-radius: 13px;
                    border: 1px solid var(--acc, #22d3ee); opacity: 0.25; pointer-events: none;
                    animation: lpFieldGlow 1.8s ease-in-out infinite alternate;
                }
                @keyframes lpFieldGlow { from{opacity:0.15} to{opacity:0.35} }

                /* ── Password row ── */
                .lp-pw-row { display: flex; flex-direction: column; gap: 0.45rem; }
                .lp-forgot {
                    text-align: right; font-size: 0.775rem;
                    color: rgba(148,163,184,0.5); cursor: pointer; transition: color 0.2s;
                }
                .lp-forgot:hover { color: #22d3ee; }

                /* ════════════════════════════════════════
                   BUTTON
                   ════════════════════════════════════════ */
                .lp-btn {
                    position: relative; overflow: hidden;
                    width: 100%; padding: 1rem 1.5rem; border: none; border-radius: 13px;
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    font-size: 1rem; font-weight: 700; letter-spacing: 0.025em;
                    color: #fff; cursor: pointer;
                    background: linear-gradient(135deg, #0ea5e9, #6366f1 55%, #22d3ee);
                    background-size: 200% 200%;
                    animation: lpBtnPan 7s ease-in-out infinite;
                    box-shadow: 0 4px 28px rgba(14,165,233,0.42), 0 1px 0 rgba(255,255,255,0.12) inset;
                    transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.28s, filter 0.28s;
                    margin-top: 0.2rem;
                }
                @keyframes lpBtnPan { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                .lp-btn:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.015);
                    box-shadow: 0 10px 44px rgba(14,165,233,0.58), 0 1px 0 rgba(255,255,255,0.18) inset;
                    filter: brightness(1.07);
                }
                .lp-btn:active:not(:disabled) { transform: translateY(1px) scale(0.985); }
                .lp-btn:disabled { opacity: 0.62; cursor: not-allowed; }
                .lp-btn-row {
                    position: relative; z-index: 1;
                    display: flex; align-items: center; justify-content: center; gap: 0.55rem;
                }
                .lp-arrow { transition: transform 0.25s; width: 18px; height: 18px; }
                .lp-btn:hover .lp-arrow { transform: translateX(4px); }
                @keyframes lp-ripple { to { transform: scale(40); opacity: 0; } }

                /* ── Spinner ── */
                .lp-spin {
                    width: 20px; height: 20px;
                    border: 2.5px solid rgba(255,255,255,0.25);
                    border-top-color: #fff; border-radius: 50%;
                    animation: lpSpinAnim 0.7s linear infinite;
                }
                @keyframes lpSpinAnim { to { transform: rotate(360deg); } }

                /* ── Divider ── */
                .lp-divider {
                    display: flex; align-items: center; gap: 0.75rem;
                    color: rgba(148,163,184,0.3); font-size: 0.72rem;
                }
                .lp-divider::before,.lp-divider::after {
                    content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07);
                }

                /* ── Footer ── */
                .lp-foot { text-align: center; font-size: 0.84rem; color: rgba(148,163,184,0.62); }
                .lp-lnk {
                    color: #22d3ee; text-decoration: none; font-weight: 700;
                    position: relative; transition: color 0.2s;
                }
                .lp-lnk::after {
                    content: ''; position: absolute; bottom: -1px; left: 0;
                    width: 0; height: 2px; background: #22d3ee; border-radius: 2px;
                    transition: width 0.25s;
                }
                .lp-lnk:hover { color: #67e8f9; }
                .lp-lnk:hover::after { width: 100%; }

                /* ── Copyright ── */
                .lp-copy {
                    margin-top: 1.5rem; font-size: 0.68rem; letter-spacing: 0.13em;
                    text-transform: uppercase; color: rgba(255,255,255,0.1);
                    text-align: center;
                }

                @media (max-width: 480px) {
                    .lp-card { padding: 2rem 1.4rem 1.8rem; }
                    .lp-title { font-size: 1.75rem; }
                }
            `}</style>

            {/* ── Global background is in SpaceBackground (App.jsx) — none here ── */}
            <div className="lp-root">

                {/* ── Card ── */}
                <div className={`lp-card-outer${mounted ? ' lp-show' : ''}`}>
                    <div className="lp-border" />

                    <div className="lp-card">
                        {/* Header */}
                        <div className="lp-head">
                            <div className="lp-logo">
                                <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="lp-badge">
                                <span className="lp-dot" />
                                Skill Swap AI Platform
                            </div>
                            <h1 className="lp-title">Welcome Back</h1>
                            <p className="lp-sub">Sign in to continue your learning journey</p>
                        </div>

                        {/* Pills */}
                        <div className="lp-pills">
                            <span className="lp-pill">🛸 AI-Powered</span>
                            <span className="lp-pill">🔐 Secure</span>
                            <span className="lp-pill">🌌 Real-time</span>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="lp-error" role="alert">
                                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <FloatingInput
                                id="lp-email" type="email" label="Email Address"
                                value={username} onChange={e => setUsername(e.target.value)}
                                accent="#22d3ee" required
                                icon={
                                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                }
                            />

                            <div className="lp-pw-row">
                                <FloatingInput
                                    id="lp-password" type="password" label="Password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    accent="#818cf8" required
                                    icon={
                                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    }
                                />
                                <span className="lp-forgot">Forgot password?</span>
                            </div>

                            <button ref={btnRef} type="submit" disabled={loading} className="lp-btn">
                                <span className="lp-btn-row">
                                    {loading ? (
                                        <><span className="lp-spin" /> Signing in…</>
                                    ) : (
                                        <>
                                            Launch Session
                                            <svg className="lp-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        <div className="lp-divider">or</div>

                        <div className="lp-foot">
                            No account yet?{' '}
                            <Link to="/register" className="lp-lnk">Join the Mission</Link>
                        </div>
                    </div>
                </div>

                <p className="lp-copy">© 2026 Skill Swap AI Platform · All rights reserved</p>
            </div>
        </>
    )
}
