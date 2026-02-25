import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Login({ setToken }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)

        try {
            const res = await axios.post('/api/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            const token = res.data.access_token
            setToken(token)
            localStorage.setItem('token', token)
            navigate('/')
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#030014]">

            {/* =========================================
               FULL SCREEN ANIMATED BACKGROUND
               ========================================= */}

            {/* Mesh Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#8B5CF6] to-[#030014] animate-mesh-gradient opacity-60"></div>

            {/* Secondary Deep Layer */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(3,0,20,0.8)_100%)]"></div>

            {/* Floating Orbs / Particles */}
            <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-purple-500/30 rounded-full blur-[100px] animate-orb-float pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-orb-float-delayed pointer-events-none"></div>

            {/* Light Streaks (using simple gradients) */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50"></div>

            {/* =========================================
               GLASS LOGIN PANEL
               ========================================= */}
            <div className="relative z-10 w-full max-w-md p-1">

                {/* Panel Container */}
                <div className="glass-card-strong p-8 md:p-10 animate-panel-hover flex flex-col gap-6">

                    {/* Header */}
                    <div className="text-center mb-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-400">Enter your credentials to access your workspace.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-fade-in backdrop-blur-sm">
                            <div className="p-1 bg-red-500/20 rounded-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Email Input */}
                        <div className="relative group">
                            <input
                                type="email"
                                id="username"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                                placeholder="Email Address"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <label
                                htmlFor="username"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-violet-400 font-medium pointer-events-none"
                            >
                                Email Address
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-violet-500 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <input
                                type="password"
                                id="password"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-pink-500/50 focus:shadow-[0_0_20px_rgba(236,72,153,0.2)]"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-pink-400 font-medium pointer-events-none"
                            >
                                Password
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-pink-500 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>

                            <div className="absolute right-0 -bottom-6">
                                <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">Forgot Password?</a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative overflow-hidden mt-2 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg shadow-violet-500/30 tracking-wide bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out skew-y-12"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authorizing...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-2 text-center">
                        <p className="text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-violet-400 hover:text-white font-bold transition-colors hover:underline decoration-2 underline-offset-4">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="text-center mt-6 text-white/20 text-xs tracking-widest uppercase">
                    &copy; 2026 Skill Swap AI Platform
                </div>
            </div>
        </div>
    )
}
