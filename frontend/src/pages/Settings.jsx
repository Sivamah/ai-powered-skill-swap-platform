import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import CodingVerificationModal from '../components/CodingVerificationModal'
import MCQVerificationModal from '../components/MCQVerificationModal'

function Settings({ token }) {
    const navigate = useNavigate()
    const [user, setUser] = useState({
        name: '',
        bio: '',
        profile_photo_url: '',
        github_url: '',
        linkedin_url: '',
        education: ''
    })
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Skill Management State
    const [profile, setProfile] = useState({
        skills_offered: [],
        skills_wanted: []
    });
    const [newSkill, setNewSkill] = useState("");

    // Verification Modal State
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [showMCQModal, setShowMCQModal] = useState(false);
    const [verifyingSkill, setVerifyingSkill] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

    const fetchUserData = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setUser({
                    name: data.name || '',
                    bio: data.bio || '',
                    profile_photo_url: data.profile_photo_url || '',
                    github_url: data.github_url || '',
                    linkedin_url: data.linkedin_url || '',
                    education: data.education || ''
                })

                let skillsOffered = [];
                try {
                    skillsOffered = data.skills_offered ? JSON.parse(data.skills_offered) : [];
                    if (!Array.isArray(skillsOffered)) skillsOffered = [];
                } catch (e) { console.error(e); skillsOffered = []; }

                let skillsWanted = [];
                try {
                    skillsWanted = data.skills_wanted ? JSON.parse(data.skills_wanted) : [];
                    if (!Array.isArray(skillsWanted)) skillsWanted = [];
                } catch (e) { console.error(e); skillsWanted = []; }

                setProfile({
                    skills_offered: skillsOffered,
                    skills_wanted: skillsWanted
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load profile data.' })
        } finally {
            setLoading(false)
        }
    }, [token, API_URL])

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }
        fetchUserData()
    }, [token, navigate, fetchUserData])

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value })
    }

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (newSkill.trim()) {
            setVerifyingSkill(true);
            const skillToAdd = newSkill.trim();

            try {
                // Classify Skill
                const res = await axios.get(`${API_URL}/api/verify/classify-skill?skill=${skillToAdd}`);
                const { type } = res.data;

                setSelectedSkill(skillToAdd);

                // Open Appropriate Modal
                if (type === 'programming_language') {
                    setShowCodingModal(true);
                } else {
                    setShowMCQModal(true);
                }
            } catch (err) {
                console.error("Classification failed", err);
                // Default to MCQ
                setSelectedSkill(skillToAdd);
                setShowMCQModal(true);
            } finally {
                setVerifyingSkill(false);
            }
        }
    };

    const handleDeleteSkill = (skillToDelete) => {
        setProfile({
            ...profile,
            skills_offered: profile.skills_offered.filter(skill => skill !== skillToDelete)
        })
    }

    const handleVerificationSuccess = (skill) => {
        setShowCodingModal(false);
        setShowMCQModal(false);

        // Add skill to profile if not already there
        if (!profile.skills_offered.includes(skill)) {
            setProfile(prev => ({
                ...prev,
                skills_offered: [...prev.skills_offered, skill]
            }));
            setMessage({ type: 'success', text: `${skill} verified and added to your profile!` });
        }
        setNewSkill("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        const payload = {
            ...user,
            skills_offered: JSON.stringify(profile.skills_offered),
            skills_wanted: JSON.stringify(profile.skills_wanted)
        }

        try {
            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const updatedData = await response.json()

                // Update local state with the response from server
                setUser({
                    name: updatedData.name || '',
                    bio: updatedData.bio || '',
                    profile_photo_url: updatedData.profile_photo_url || '',
                    github_url: updatedData.github_url || '',
                    linkedin_url: updatedData.linkedin_url || '',
                    education: updatedData.education || ''
                })

                // Parse and update skills
                let skillsOffered = []
                try {
                    skillsOffered = updatedData.skills_offered ? JSON.parse(updatedData.skills_offered) : []
                    if (!Array.isArray(skillsOffered)) skillsOffered = []
                } catch (e) { console.error(e); skillsOffered = [] }

                let skillsWanted = []
                try {
                    skillsWanted = updatedData.skills_wanted ? JSON.parse(updatedData.skills_wanted) : []
                    if (!Array.isArray(skillsWanted)) skillsWanted = []
                } catch (e) { console.error(e); skillsWanted = [] }

                setProfile({
                    skills_offered: skillsOffered,
                    skills_wanted: skillsWanted
                })

                setMessage({ type: 'success', text: 'Settings saved successfully' })

                // Auto-hide success message after 3 seconds
                setTimeout(() => {
                    setMessage({ type: '', text: '' })
                }, 3000)
            } else {
                const errorData = await response.json().catch(() => ({}))
                setMessage({ type: 'error', text: errorData.detail || 'Failed to update profile' })
            }
        } catch (error) {
            console.error('Save error:', error)
            setMessage({ type: 'error', text: 'An error occurred while saving' })
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
            {/* Background Decor - Warm Gray + Beige + Soft Gold Theme */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Neutral Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-neutral-900 to-stone-900"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-stone-800/40 via-transparent to-neutral-800/30"></div>

                {/* Soft Gold Accents */}
                <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute bottom-[20%] left-[15%] w-[400px] h-[400px] bg-stone-500/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="flex items-center justify-between mb-8">
                <header className="mb-8 animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-gradient-settings">Settings & Profile</h1>
                    <p className="text-stone-400 font-light">Manage your professional profile and preferences.</p>
                </header>
                {message.text && (
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold animate-slide-in-right ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-8">

                {/* Left Column: Avatar & Bio */}
                <div className="md:col-span-4 space-y-6">
                    <div className="glass-card p-6 text-center border-stone-500/10">
                        <div className="relative w-32 h-32 mx-auto mb-4 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-stone-500/20 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative w-full h-full rounded-full border-4 border-black/50 overflow-hidden bg-stone-800">
                                {user.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-stone-600">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-stone-200 mb-1">{user.name || 'User'}</h3>
                        <p className="text-sm text-stone-500 mb-4">{user.education || 'Lifelong Learner'}</p>
                    </div>

                    <div className="glass-card p-6 space-y-4 border-stone-500/10">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Public Bio</label>
                        <textarea
                            name="bio"
                            value={user.bio}
                            onChange={handleChange}
                            rows="6"
                            placeholder="Share your expertise, interests, and what you're looking to learn..."
                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 resize-none focus:border-amber-500/30 focus:bg-black/30"
                        />
                    </div>
                </div>

                {/* Right Column: Details Form */}
                <div className="md:col-span-8 space-y-6">
                    <div className="glass-card p-8 space-y-8 border-stone-500/10">
                        <div>
                            <h3 className="text-xl font-bold text-stone-200 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                                Personal Information
                            </h3>

                            <div className="settings-card p-8 grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-stone-400 font-medium ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={user.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-black/30"
                                        placeholder="e.g. Alex Chen"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-stone-400 font-medium ml-1">Education / Degree</label>
                                    <input
                                        type="text"
                                        name="education"
                                        value={user.education}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-black/30"
                                        placeholder="e.g. MS in Computer Science"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5"></div>

                        <div>
                            <h3 className="text-lg font-bold text-stone-200 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-amber-600/50 rounded-full"></span>
                                Professional Presence
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-stone-400 font-medium ml-1">Profile Photo URL</label>
                                    <input
                                        type="text"
                                        name="profile_photo_url"
                                        value={user.profile_photo_url}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-black/30"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-stone-400 font-medium ml-1">GitHub URL</label>
                                        <input
                                            type="text"
                                            name="github_url"
                                            value={user.github_url}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-black/30"
                                            placeholder="github.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-stone-400 font-medium ml-1">LinkedIn URL</label>
                                        <input
                                            type="text"
                                            name="linkedin_url"
                                            value={user.linkedin_url}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-300 placeholder-stone-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-black/30"
                                            placeholder="linkedin.com/in/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5"></div>

                        <div>
                            <h3 className="text-xl font-bold text-stone-200 mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-emerald-500/50 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]"></span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400">
                                    Skills & Verification
                                </span>
                            </h3>

                            <div className="p-8 space-y-8 border border-white/5 rounded-2xl bg-black/20">
                                {/* Header / Instruction */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-400 hidden sm:block">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-semibold text-stone-200">Manage Your Expertise</h4>
                                        <p className="text-sm text-stone-400 leading-relaxed">
                                            Add skills to your profile.
                                            <span className="text-amber-200/80 font-medium ml-1">All skills</span> will be
                                            <span className="text-stone-300 font-bold mx-1">Verified</span>
                                            via coding challenges or quizzes to earn the <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 text-[10px] font-bold tracking-wide border border-emerald-500/20 align-middle">VERIFIED</span> badge.
                                        </p>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Add New Skill</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-grow">
                                            <input
                                                type="text"
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-stone-200 placeholder-stone-600 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all outline-none"
                                                placeholder="e.g. React, Python, Digital Marketing..."
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddSkill}
                                            disabled={verifyingSkill}
                                            className="px-8 py-3.5 bg-gradient-to-r from-stone-700 to-stone-600 hover:from-stone-600 hover:to-stone-500 text-white rounded-xl font-bold shadow-lg shadow-black/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {verifyingSkill ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <span>Add</span>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Skills List */}
                                {profile.skills_offered.length > 0 ? (
                                    <div className="space-y-3 pt-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Your Skills</label>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.skills_offered.map((skill, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 hover:bg-white/[0.08] transition-all"
                                                >
                                                    <span className="text-sm font-medium text-stone-300 group-hover:text-amber-100 transition-colors">{skill}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSkill(skill)}
                                                        className="w-5 h-5 rounded-full flex items-center justify-center bg-transparent hover:bg-red-500/10 text-stone-600 hover:text-red-400 transition-all font-bold text-xs"
                                                        title="Remove skill"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                                        <p className="text-stone-500 text-sm">No skills added yet. Start by adding one above.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Verification Modals */}
                        <CodingVerificationModal
                            isOpen={showCodingModal}
                            skill={selectedSkill}
                            onClose={() => setShowCodingModal(false)}
                            onVerified={handleVerificationSuccess}
                        />

                        <MCQVerificationModal
                            isOpen={showMCQModal}
                            skill={selectedSkill}
                            onClose={() => setShowMCQModal(false)}
                            onVerified={handleVerificationSuccess}
                        />

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-6 py-3 rounded-xl text-stone-400 font-medium hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-settings px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold shadow-lg shadow-amber-900/20 transform hover:-translate-y-0.5 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    )
}

export default Settings;
