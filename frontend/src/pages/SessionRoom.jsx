import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function SessionRoom({ token }) {
    const { id } = useParams();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Coding State
    const [code, setCode] = useState("// Write your code here\nconsole.log('Hello, Skill Swap!');");
    const [output, setOutput] = useState("");
    const videoRef = useRef(null);

    useEffect(() => {
        // Fetch session details
        axios.get(`${API_URL}/my_sessions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const s = res.data.find(s => s.id === parseInt(id));
                setSession(s);
                setLoading(false);
            })
            .catch(err => setLoading(false));

        // Attempt to start camera
        startCamera();

        return () => {
            stopCamera();
        }
    }, [id, token]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            setCameraError(null);

            // Monitor stream (simple check if active)
            stream.getVideoTracks()[0].onended = () => {
                setCameraActive(false);
                setCameraError("Camera disconnected.");
            };
        } catch (err) {
            setCameraActive(false);
            setCameraError("Camera access required for this session.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const runCode = () => {
        try {
            // SAFE FOR DEMO: Capture console.log
            let logs = [];
            const originalLog = console.log;
            console.log = (...args) => logs.push(args.join(' '));

            // Eval is dangerous in prod, but for this demo requirement "Simple inline coding support", client-side eval is acceptable constraint
            // eslint-disable-next-line no-eval
            eval(code);

            console.log = originalLog;
            setOutput(logs.join('\n') || "Code executed successfully (no output)");
        } catch (err) {
            setOutput(`Error: ${err.message}`);
        }
    };

    if (loading) return <div className="text-center text-white p-20">Loading Session...</div>;
    if (!session) return <div className="text-center text-white p-20">Session not found or access denied.</div>;

    const isCodingSession = session.session_type === 'coding';

    return (
        <div className="min-h-screen bg-transparent text-white p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Session Info & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {cameraActive ? 'Camera Active' : 'Camera Required'}
                            </span>
                        </div>

                        <h1 className="text-2xl font-black">{session.skill_name}</h1>
                        <p className="text-sm text-slate-400">Session ID: {session.id}</p>

                        <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                            {!cameraActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 text-center p-4">
                                    <div>
                                        <p className="text-red-400 font-bold mb-2">{cameraError || "Camera Off"}</p>
                                        <button onClick={startCamera} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">
                                            Enable Camera
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {session.meet_link && (
                            <a
                                href={session.meet_link}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full text-center py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                Open Google Meet
                            </a>
                        )}
                        <p className="text-xs text-center text-slate-500">
                            Google Meet will open in a new tab. Keep this tab open for tools.
                        </p>
                    </div>

                    {/* Session Details */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-slate-300 mb-2">Session Type</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isCodingSession ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {session.session_type || 'Standard'}
                        </span>
                    </div>
                </div>

                {/* RIGHT: Tools Area */}
                <div className="lg:col-span-2">
                    {isCodingSession ? (
                        <div className="glass-card p-1 h-full flex flex-col min-h-[500px] relative overflow-hidden">
                            {!cameraActive && (
                                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Camera Required for Coding</h2>
                                    <p className="text-slate-400 mb-6">To ensure academic integrity, please enable your camera to access the coding environment.</p>
                                    <button onClick={startCamera} className="btn-primary">Enable Camera to Resume</button>
                                </div>
                            )}

                            <div className="bg-[#1e1e1e] flex items-center justify-between px-4 py-2 rounded-t-lg">
                                <span className="text-xs font-bold text-slate-400">JAVASCRIPT COMPILER</span>
                                <button onClick={runCode} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Run Code
                                </button>
                            </div>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="flex-1 bg-[#1e1e1e] text-slate-300 font-mono text-sm p-4 outline-none resize-none border-b border-white/5"
                                spellCheck="false"
                            />
                            <div className="h-40 bg-[#1e1e1e] p-4 border-t border-white/5 font-mono text-sm">
                                <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Output Terminal</div>
                                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card flex flex-col items-center justify-center h-full min-h-[400px] text-center p-10 space-y-6">
                            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 mb-4">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Standard Discussion Session</h2>
                            <p className="text-slate-400 max-w-md">This is a standard verbal session. Use the Google Meet link on the left to join the call. No additional tools are required for this session.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
