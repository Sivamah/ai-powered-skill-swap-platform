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
                transform: 'scale(0)', animation: 'rg-ripple 0.65s linear',
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
function FloatingInput({ id, name, type = 'text', label, value, onChange, icon, required, accent = '#22d3ee' }) {
    const [focused, setFocused] = useState(false)
    const lifted = focused || (value && value.length > 0)

    return (
        <div className="rg-field" style={{ '--acc': accent }}>
            <span className="rg-field-icon">{icon}</span>
            <input
                id={id} name={name || id} type={type}
                className="rg-input" placeholder=" "
                value={value} onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required={required}
            />
            <label
                htmlFor={id}
                className={`rg-label${lifted ? ' rg-lifted' : ''}${focused ? ' rg-label-acc' : ''}`}
            >
                {label}
            </label>
            <span className={`rg-focus-bar${focused ? ' rg-bar-on' : ''}`} />
            {focused && <span className="rg-field-glow" />}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Register() {
    const [formData, setFormData] = useState({ password: '', email: '', fullName: '', skills: '' })
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

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean)
            await axios.post(`${API_URL}/register`, {
                password: formData.password,
                email: formData.email,
                name: formData.fullName,
                skills_offered: JSON.stringify(skillsArray),
            })
            navigate('/login')
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                /* ════════════════════════════════════════
                   REGISTER PAGE — transparent over global bg
                   ════════════════════════════════════════ */
                .rg-root {
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

                /* ── Card outer (entrance) ── */
                .rg-card-outer {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 470px;
                    opacity: 0;
                    transform: translateY(52px) scale(0.94);
                    transition:
                        opacity  0.80s cubic-bezier(.22,1,.36,1),
                        transform 0.80s cubic-bezier(.22,1,.36,1);
                }
                .rg-card-outer.rg-show { opacity: 1; transform: translateY(0) scale(1); }

                /* ── Spinning cyan conic border ── */
                .rg-border {
                    position: absolute; inset: -1.5px; border-radius: 26px;
                    background: conic-gradient(
                        from var(--rg-angle, 0deg),
                        transparent 0deg,
                        rgba(34,211,238,0.72) 50deg,
                        rgba(59,130,246,0.55) 110deg,
                        transparent 170deg,
                        transparent 360deg
                    );
                    animation: rgBorderSpin 7s linear infinite;
                    z-index: -1; filter: blur(1px);
                }
                @property --rg-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
                @keyframes rgBorderSpin { to { --rg-angle: 360deg; } }
                @supports not (background: conic-gradient(from 0deg, red, blue)) {
                    .rg-border { background: linear-gradient(135deg, rgba(34,211,238,0.5), rgba(59,130,246,0.4)); }
                }

                /* ── Glass card ── */
                .rg-card {
                    background: rgba(2,8,15,0.84);
                    backdrop-filter: blur(30px) saturate(1.5);
                    -webkit-backdrop-filter: blur(30px) saturate(1.5);
                    border-radius: 24px; border: 1px solid rgba(255,255,255,0.07);
                    padding: 2.6rem 2.5rem 2.2rem;
                    display: flex; flex-direction: column; gap: 1.25rem;
                    position: relative; overflow: hidden;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 40px 90px rgba(0,0,0,0.65);
                }
                .rg-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg,
                        transparent, rgba(34,211,238,0.42) 35%,
                        rgba(59,130,246,0.32) 65%, transparent);
                }

                /* ── Header ── */
                .rg-head { text-align: center; }
                .rg-logo {
                    width: 64px; height: 64px; margin: 0 auto 1rem; border-radius: 18px;
                    background: linear-gradient(135deg, #0ea5e9, #3b82f6 55%, #22d3ee);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.12),
                                0 0 30px rgba(14,165,233,0.50),
                                0 0 70px rgba(14,165,233,0.22);
                    animation: rgLogoPulse 3.5s ease-in-out infinite;
                }
                @keyframes rgLogoPulse {
                    0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(14,165,233,0.50), 0 0 70px rgba(14,165,233,0.22); }
                    50%     { box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 0 44px rgba(14,165,233,0.70), 0 0 100px rgba(14,165,233,0.32); }
                }
                .rg-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: rgba(34,211,238,0.09); border: 1px solid rgba(34,211,238,0.25);
                    border-radius: 100px; padding: 3px 13px; margin-bottom: 0.65rem;
                    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.13em;
                    text-transform: uppercase; color: #22d3ee;
                }
                .rg-dot {
                    width: 6px; height: 6px; background: #22d3ee; border-radius: 50%;
                    box-shadow: 0 0 6px #22d3ee;
                    animation: rgDotBlink 1.7s ease-in-out infinite;
                }
                @keyframes rgDotBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
                .rg-title {
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.12;
                    margin: 0 0 0.4rem;
                    background: linear-gradient(135deg, #f0f9ff 20%, #7dd3fc 52%, #a5b4fc);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .rg-sub { font-size: 0.875rem; color: rgba(148,163,184,0.75); line-height: 1.55; }

                /* ── Step indicator ── */
                .rg-steps { display: flex; align-items: center; justify-content: center; gap: 0.45rem; }
                .rg-step {
                    display: flex; align-items: center; gap: 0.35rem;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.685rem; color: rgba(148,163,184,0.5); font-weight: 500;
                }
                .rg-step-num {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.25);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.64rem; font-weight: 700; color: #22d3ee;
                }
                .rg-step-line { width: 24px; height: 1px; background: rgba(255,255,255,0.07); }

                /* ── Error ── */
                .rg-error {
                    display: flex; align-items: center; gap: 0.7rem;
                    padding: 0.875rem 1rem;
                    background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22);
                    border-radius: 12px; color: #fca5a5; font-size: 0.84rem;
                    animation: rgErrIn 0.35s cubic-bezier(.22,1,.36,1);
                }
                @keyframes rgErrIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

                /* ════════════════════════════════════════
                   FLOATING INPUT
                   ════════════════════════════════════════ */
                .rg-field {
                    position: relative;
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 13px; overflow: hidden;
                    transition: border-color 0.28s, background 0.28s, box-shadow 0.28s;
                }
                .rg-field:focus-within {
                    background: rgba(34,211,238,0.04);
                    border-color: var(--acc, #22d3ee);
                    box-shadow: 0 0 0 3px rgba(34,211,238,0.12), 0 0 24px rgba(34,211,238,0.07);
                }
                .rg-field-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
                    display: flex; align-items: center;
                    color: rgba(148,163,184,0.45); pointer-events: none; z-index: 2;
                    transition: color 0.28s;
                }
                .rg-field:focus-within .rg-field-icon { color: var(--acc, #22d3ee); }
                .rg-input {
                    width: 100%; background: transparent; border: none; outline: none;
                    color: #f0f9ff; font-size: 0.94rem; font-family: 'Inter', sans-serif;
                    padding: 1.35rem 1rem 0.45rem 2.75rem;
                    caret-color: #22d3ee;
                }
                .rg-input:-webkit-autofill,
                .rg-input:-webkit-autofill:hover,
                .rg-input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #f0f9ff;
                    -webkit-box-shadow: 0 0 0px 1000px rgba(2,8,15,0.01) inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
                .rg-label {
                    position: absolute; left: 2.75rem; top: 50%; transform: translateY(-50%);
                    font-size: 0.88rem; color: rgba(148,163,184,0.52); pointer-events: none;
                    transition: top 0.24s, font-size 0.24s, color 0.24s, transform 0.24s;
                    font-family: 'Inter', sans-serif; font-weight: 500;
                }
                .rg-label.rg-lifted {
                    top: 0.5rem; transform: translateY(0);
                    font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase;
                }
                .rg-label.rg-label-acc { color: var(--acc, #22d3ee); }
                .rg-focus-bar {
                    position: absolute; bottom: 0; left: 0; height: 2px; width: 0%;
                    background: linear-gradient(90deg, var(--acc,#22d3ee), rgba(59,130,246,0.5));
                    border-radius: 0 0 13px 13px;
                    transition: width 0.35s cubic-bezier(.22,1,.36,1);
                }
                .rg-focus-bar.rg-bar-on { width: 100%; }
                .rg-field-glow {
                    position: absolute; inset: -1px; border-radius: 13px;
                    border: 1px solid var(--acc, #22d3ee); opacity: 0.22; pointer-events: none;
                    animation: rgFieldGlow 1.8s ease-in-out infinite alternate;
                }
                @keyframes rgFieldGlow { from{opacity:0.14} to{opacity:0.32} }

                /* ── Skills hint ── */
                .rg-hint { font-size: 0.67rem; color: rgba(148,163,184,0.4); padding-left: 0.2rem; }

                /* ════════════════════════════════════════
                   BUTTON
                   ════════════════════════════════════════ */
                .rg-btn {
                    position: relative; overflow: hidden;
                    width: 100%; padding: 1rem 1.5rem; border: none; border-radius: 13px;
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    font-size: 1rem; font-weight: 700; letter-spacing: 0.025em;
                    color: #fff; cursor: pointer;
                    background: linear-gradient(135deg, #0ea5e9, #3b82f6 55%, #22d3ee);
                    background-size: 200% 200%;
                    animation: rgBtnPan 7s ease-in-out infinite;
                    box-shadow: 0 4px 28px rgba(14,165,233,0.42), 0 1px 0 rgba(255,255,255,0.12) inset;
                    transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.28s, filter 0.28s;
                    margin-top: 0.2rem;
                }
                @keyframes rgBtnPan { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                .rg-btn:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.015);
                    box-shadow: 0 10px 44px rgba(14,165,233,0.58), 0 1px 0 rgba(255,255,255,0.18) inset;
                    filter: brightness(1.07);
                }
                .rg-btn:active:not(:disabled) { transform: translateY(1px) scale(0.985); }
                .rg-btn:disabled { opacity: 0.62; cursor: not-allowed; }
                .rg-btn-row {
                    position: relative; z-index: 1;
                    display: flex; align-items: center; justify-content: center; gap: 0.55rem;
                }
                .rg-arrow { transition: transform 0.25s; width: 18px; height: 18px; }
                .rg-btn:hover .rg-arrow { transform: translateX(4px); }
                @keyframes rg-ripple { to { transform: scale(40); opacity: 0; } }

                /* ── Spinner ── */
                .rg-spin {
                    width: 20px; height: 20px;
                    border: 2.5px solid rgba(255,255,255,0.25);
                    border-top-color: #fff; border-radius: 50%;
                    animation: rgSpinAnim 0.7s linear infinite;
                }
                @keyframes rgSpinAnim { to { transform: rotate(360deg); } }

                /* ── Divider ── */
                .rg-divider {
                    display: flex; align-items: center; gap: 0.75rem;
                    color: rgba(148,163,184,0.3); font-size: 0.72rem;
                }
                .rg-divider::before,.rg-divider::after {
                    content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07);
                }

                /* ── Footer ── */
                .rg-foot { text-align: center; font-size: 0.84rem; color: rgba(148,163,184,0.62); }
                .rg-lnk {
                    color: #22d3ee; text-decoration: none; font-weight: 700;
                    position: relative; transition: color 0.2s;
                }
                .rg-lnk::after {
                    content: ''; position: absolute; bottom: -1px; left: 0;
                    width: 0; height: 2px; background: #22d3ee; border-radius: 2px;
                    transition: width 0.25s;
                }
                .rg-lnk:hover { color: #7dd3fc; }
                .rg-lnk:hover::after { width: 100%; }

                /* ── Copyright ── */
                .rg-copy {
                    margin-top: 1.5rem; font-size: 0.68rem; letter-spacing: 0.13em;
                    text-transform: uppercase; color: rgba(255,255,255,0.1);
                    text-align: center;
                }

                @media (max-width: 480px) {
                    .rg-card { padding: 1.9rem 1.4rem 1.75rem; }
                    .rg-title { font-size: 1.75rem; }
                }
            `}</style>

            {/* ── Global background is in SpaceBackground (App.jsx) — none here ── */}
            <div className="rg-root">

                {/* ── Card ── */}
                <div className={`rg-card-outer${mounted ? ' rg-show' : ''}`}>
                    <div className="rg-border" />

                    <div className="rg-card">
                        {/* Header */}
                        <div className="rg-head">
                            <div className="rg-logo">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div className="rg-badge">
                                <span className="rg-dot" />
                                Join the Mission
                            </div>
                            <h1 className="rg-title">Create Account</h1>
                            <p className="rg-sub">Join thousands learning together on our platform</p>
                        </div>

                        {/* Step indicator */}
                        <div className="rg-steps">
                            <div className="rg-step">
                                <span className="rg-step-num">1</span>
                                <span>Profile</span>
                            </div>
                            <div className="rg-step-line" />
                            <div className="rg-step">
                                <span className="rg-step-num">2</span>
                                <span>Skills</span>
                            </div>
                            <div className="rg-step-line" />
                            <div className="rg-step">
                                <span className="rg-step-num">3</span>
                                <span>Launch</span>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rg-error" role="alert">
                                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <FloatingInput
                                id="rg-name" name="fullName" type="text"
                                label="Full Name" value={formData.fullName}
                                onChange={handleChange} accent="#22d3ee" required
                                icon={
                                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                }
                            />

                            <FloatingInput
                                id="rg-email" name="email" type="email"
                                label="Email Address" value={formData.email}
                                onChange={handleChange} accent="#a5b4fc" required
                                icon={
                                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                }
                            />

                            <FloatingInput
                                id="rg-password" name="password" type="password"
                                label="Password" value={formData.password}
                                onChange={handleChange} accent="#0ea5e9" required
                                icon={
                                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                }
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <FloatingInput
                                    id="rg-skills" name="skills" type="text"
                                    label="Your Skills" value={formData.skills}
                                    onChange={handleChange} accent="#22d3ee"
                                    icon={
                                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                        </svg>
                                    }
                                />
                                <p className="rg-hint">e.g. React, Python, Machine Learning (comma-separated)</p>
                            </div>

                            <button ref={btnRef} type="submit" disabled={loading} className="rg-btn">
                                <span className="rg-btn-row">
                                    {loading ? (
                                        <><span className="rg-spin" /> Launching…</>
                                    ) : (
                                        <>
                                            Begin Mission
                                            <svg className="rg-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        <div className="rg-divider">or</div>

                        <div className="rg-foot">
                            Already have an account?{' '}
                            <Link to="/login" className="rg-lnk">Sign In</Link>
                        </div>
                    </div>
                </div>

                <p className="rg-copy">© 2026 Skill Swap AI Platform · All rights reserved</p>
            </div>
        </>
    )
}
