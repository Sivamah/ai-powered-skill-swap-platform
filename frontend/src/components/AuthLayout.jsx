import { useEffect, useState } from 'react'

export default function AuthLayout({ children, title, subtitle, theme = 'login' }) {
    const isLogin = theme === 'login';
    const isRegister = theme === 'register';

    return (
        <div className="flex min-h-screen relative overflow-hidden font-['Inter'] items-center justify-center">

            {/* =========================================
               LOGIN THEME - Cartoon Room Experience
               ========================================= */}
            {isLogin && (
                <>
                    {/* Warm Cartoon Room Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 via-orange-50 to-orange-100"></div>

                    {/* Floating Soft Shapes (Clouds/Blobs) */}
                    <div className="absolute top-10 left-10 w-32 h-32 bg-sky-200/40 rounded-full blur-2xl animate-cartoon-float" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute top-20 right-20 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl animate-cartoon-float" style={{ animationDelay: '1.5s' }}></div>
                    <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl animate-cartoon-float" style={{ animationDelay: '3s' }}></div>

                    {/* Floor Perspective (Subtle) */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-orange-200/20 to-transparent"></div>

                    {/* Animated Cartoon Door Scene - Left Side */}
                    <div className="absolute left-[5%] bottom-[15%] w-[180px] h-[300px] hidden md:block perspective-1000">
                        {/* Door Frame */}
                        <div className="absolute inset-0 border-8 border-orange-900/80 rounded-t-full bg-orange-900/10 shadow-xl"></div>

                        {/* Dark Void Behind Door */}
                        <div className="absolute inset-2 top-2 rounded-t-[90px] bg-sky-950 overflow-hidden">
                            {/* Peeking Silhouette */}
                            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-center animate-peek">
                                <div className="w-20 h-20 bg-black rounded-full mb-32 -ml-8"></div> {/* Head */}
                                <div className="w-24 h-32 bg-black rounded-t-3xl absolute bottom-0 -ml-10"></div> {/* Body */}
                                {/* Eyes (Optional for cute effect) */}
                                <div className="absolute bottom-40 left-8 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <div className="absolute bottom-40 left-14 w-2 h-2 bg-white rounded-full animate-pulse delay-100"></div>
                            </div>
                        </div>

                        {/* The Wood Door Itself */}
                        <div className="absolute inset-2 top-2 rounded-t-[90px] bg-orange-700 origin-left shadow-2xl animate-door-cycle border border-orange-600">
                            {/* Door Details */}
                            <div className="absolute top-1/2 right-4 w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div> {/* Knob */}
                            <div className="absolute inset-4 border-2 border-dashed border-orange-800/30 rounded-t-[80px]"></div> {/* Detail */}
                        </div>

                        {/* Floor Shadow */}
                        <div className="absolute -bottom-4 left-0 w-full h-4 bg-black/20 rounded-[100%] blur-sm"></div>
                    </div>
                </>
            )}

            {/* =========================================
               REGISTER THEME - Warm & Growth (Existing)
               ========================================= */}
            {isRegister && (
                <>
                    {/* Organic Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-green-400 to-orange-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/60 via-transparent to-green-900/40"></div>

                    {/* Organic Pattern Shapes */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-teal-300 rounded-full blur-3xl animate-grow-pulse"></div>
                        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-green-300 rounded-full blur-3xl animate-grow-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute top-[40%] right-[20%] w-48 h-48 bg-orange-300 rounded-full blur-2xl animate-grow-pulse" style={{ animationDelay: '1.5s' }}></div>
                    </div>

                    {/* Subtle Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}></div>
                </>
            )}

            {/* =========================================
               MAIN CONTENT CONTAINER
               ========================================= */}
            <div className={`w-full max-w-md p-1 relative z-10 mx-4 ${isLogin ? 'animate-bounce-in' : ''}`}>

                {/* Decorative border gradient */}
                <div className={`absolute inset-0 rounded-[2.5rem] -m-[2px] pointer-events-none ${isLogin ? 'bg-gradient-to-tr from-yellow-300 via-pink-300 to-sky-300' :
                    'bg-gradient-to-b from-teal-300/30 via-green-300/20 to-orange-300/30'
                    }`}></div>

                <div className={`
                    relative 
                    ${isLogin ? 'bg-white/60 backdrop-blur-xl border-white/40 shadow-xl shadow-orange-500/10' : 'bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/50'}
                    rounded-[2.5rem] 
                    border 
                    overflow-hidden
                `}>
                    {/* Header Section */}
                    <div className="px-8 pt-10 pb-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/50 ${isLogin ? 'bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-orange-200 text-white' :
                                'bg-gradient-to-br from-teal-600 to-green-600 shadow-teal-500/25 ring-white/20'
                                }`}>
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isLogin ? "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M13 10V3L4 14h7v7l9-11h-7z"} />
                                </svg>
                            </div>
                        </div>

                        <h2 className={`text-3xl font-extrabold mb-2 font-['Outfit'] tracking-tight ${isLogin ? 'text-slate-800' : 'text-white'}`}>{title}</h2>
                        <p className={`font-medium ${isLogin ? 'text-slate-500' : 'text-slate-200 font-light'}`}>{subtitle}</p>
                    </div>

                    {/* Content Section */}
                    <div className="px-8 pb-10">
                        {children}
                    </div>

                    {/* Footer Links (Only show for register or if needed) */}
                    {!isLogin && (
                        <div className="px-8 py-4 bg-black/20 border-t border-white/5 flex justify-center gap-6 text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                            <a href="#" className="transition-colors hover:text-teal-400">Privacy Policy</a>
                            <span className="text-white/10">•</span>
                            <a href="#" className="transition-colors hover:text-teal-400">Terms of Service</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
