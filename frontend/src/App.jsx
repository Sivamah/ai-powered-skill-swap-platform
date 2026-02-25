import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './pages/Dashboard'
import FindTutor from './pages/FindTutor'
import MySessions from './pages/MySessions'
import SessionRoom from './pages/SessionRoom'
import Settings from './pages/Settings'

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const path = location.pathname
        if (token) {
            if (path === '/login' || path === '/register') {
                navigate('/')
            }
        } else {
            if (path !== '/register') {
                navigate('/login')
            }
        }
    }, [token, location.pathname, navigate])

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        navigate('/login')
    }

    return (
        <div className="min-h-screen font-sans pb-20">
            {token && (
                <div className="fixed top-0 left-0 w-full z-50 px-4 py-4 pointer-events-none">
                    <nav className="glass-nav max-w-6xl mx-auto rounded-2xl shadow-2xl px-8 py-4 flex justify-between items-center pointer-events-auto border border-white/5">
                        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Skill Swap AI
                        </div>
                        <div className="flex gap-8 items-center">
                            <Link to="/" className="text-sm font-semibold text-slate-300 hover:text-white transition-all hover:scale-105">Dashboard</Link>
                            <Link to="/find-tutor" className="text-sm font-semibold text-slate-300 hover:text-white transition-all hover:scale-105">Find Tutor</Link>
                            <Link to="/my-sessions" className="text-sm font-semibold text-slate-300 hover:text-white transition-all hover:scale-105">My Sessions</Link>
                            <Link to="/settings" className="text-sm font-semibold text-slate-300 hover:text-white transition-all hover:scale-105">Settings</Link>
                            <button
                                onClick={logout}
                                className="bg-white/5 hover:bg-red-500/20 text-slate-200 hover:text-red-400 px-5 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 hover:border-red-500/30 backdrop-blur-md"
                            >
                                Logout
                            </button>
                        </div>
                    </nav>
                </div>
            )}

            <div className={`container mx-auto px-4 ${token ? 'pt-36' : 'pt-0'} max-w-6xl`}>
                <Routes>
                    <Route path="/login" element={<Login setToken={setToken} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Dashboard token={token} />} />
                    <Route path="/find-tutor" element={<FindTutor token={token} />} />
                    <Route path="/my-sessions" element={<MySessions token={token} />} />
                    <Route path="/settings" element={token ? <Settings token={token} /> : <Navigate to="/login" />} />
                    <Route path="/session/:id" element={token ? <SessionRoom token={token} /> : <Navigate to="/login" />} />
                </Routes>
            </div>
        </div>
    )
}

export default App
