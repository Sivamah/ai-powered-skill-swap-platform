import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
    const [formData, setFormData] = useState({
        password: '',
        email: '',
        fullName: '',
        skills: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s)

            await axios.post('/api/register', {
                password: formData.password,
                email: formData.email,
                name: formData.fullName,
                skills_offered: JSON.stringify(skillsArray)
            })

            navigate('/login')
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#0f172a]">

            {/* =========================================
               FULL SCREEN ANIMATED BACKGROUND (Dark Blue / Aurora)
               ========================================= */}

            {/* Aurora Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f172a] via-[#312e81] to-[#0f172a] animate-aurora-gradient opacity-80"></div>

            {/* Secondary Aurora Overlay */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-transparent via-[#4c1d95]/30 to-transparent mix-blend-screen animate-slow-pan"></div>

            {/* Glowing Particles (Cyan & Purple) */}
            <div className="absolute top-[10%] left-[30%] w-64 h-64 bg-cyan-500/20 rounded-full blur-[90px] animate-orb-float pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[30%] w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-orb-float-delayed pointer-events-none"></div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Light Beams */}
            <div className="absolute -top-20 left-1/4 w-[1px] h-[120vh] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent rotate-[15deg] blur-sm"></div>
            <div className="absolute -top-20 right-1/4 w-[1px] h-[120vh] bg-gradient-to-b from-transparent via-purple-400/30 to-transparent -rotate-[15deg] blur-sm"></div>


            {/* =========================================
               GLASS REGISTER PANEL
               ========================================= */}
            <div className="relative z-10 w-full max-w-lg p-4">

                {/* Panel Container */}
                <div className="glass-card-strong p-8 md:p-10 animate-panel-hover flex flex-col gap-6 border-cyan-500/10 shadow-cyan-900/20">

                    {/* Header */}
                    <div className="text-center mb-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 ring-1 ring-white/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Join the Network</h1>
                        <p className="text-slate-400">Create your profile to start swapping skills.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm flex items-center gap-3 animate-fade-in backdrop-blur-sm">
                            <div className="p-1 bg-orange-500/20 rounded-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name Input */}
                        <div className="relative group">
                            <input
                                type="text"
                                name="fullName"
                                id="fullName"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                            <label
                                htmlFor="fullName"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-cyan-400 font-medium pointer-events-none"
                            >
                                Full Name
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>
                        </div>

                        {/* Email Input */}
                        <div className="relative group">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-cyan-400 font-medium pointer-events-none"
                            >
                                Email Address
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <input
                                type="password"
                                name="password"
                                id="password"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-blue-400/50 focus:shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-400 font-medium pointer-events-none"
                            >
                                Password
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-400 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>
                        </div>

                        {/* Skills Input */}
                        <div className="relative group">
                            <input
                                type="text"
                                name="skills"
                                id="skills"
                                className="peer w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-white/[0.08] focus:border-purple-400/50 focus:shadow-[0_0_20px_rgba(192,132,252,0.2)]"
                                placeholder="Skills (comma separated)"
                                value={formData.skills}
                                onChange={handleChange}
                            />
                            <label
                                htmlFor="skills"
                                className="absolute left-4 top-4 text-slate-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-purple-400 font-medium pointer-events-none"
                            >
                                Skills (comma separated)
                            </label>
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-purple-400 transition-all duration-300 group-focus-within:w-full rounded-b-xl"></div>
                        </div>


                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative overflow-hidden mt-4 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg shadow-cyan-500/30 tracking-wide bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out skew-y-12"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-2 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-cyan-400 hover:text-white font-bold transition-colors hover:underline decoration-2 underline-offset-4">
                                Sign In
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
