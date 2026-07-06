import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user, setUser } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ project, setProject ] = useState([])
    const [ collaborators, setCollaborators ] = useState([])
    const [ profileMenuOpen, setProfileMenuOpen ] = useState(false)
    const [ welcomeIndex, setWelcomeIndex ] = useState(0)

    const navigate = useNavigate()
    const welcomePhrases = [
        'Build smarter together',
        'Create faster with AI',
        'Launch ideas in real time',
        'Stay connected with your team'
    ]

    function createProject(e) {
        e.preventDefault()

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                setIsModalOpen(false)
                setProject(prev => [ ...prev, res.data ])
                setProjectName('')
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setWelcomeIndex((prev) => (prev + 1) % welcomePhrases.length)
        }, 2400)

        return () => clearInterval(interval)
    }, [welcomePhrases.length])

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            const projects = res.data.projects || []
            setProject(projects)

            axios.get('/users/all').then((userRes) => {
                const allUsers = userRes.data.users || []
                const sharedUserIds = new Set(
                    projects.flatMap((item) => (item.users || []).map((member) => typeof member === 'string' ? member : member?._id).filter(Boolean))
                )

                const filteredCollaborators = allUsers.filter((member) => sharedUserIds.has(member._id))
                setCollaborators(filteredCollaborators)
            }).catch(err => {
                console.log(err)
            })
        }).catch(err => {
            console.log(err)
        })

    }, [])

    function logout() {
        localStorage.removeItem('token')
        setUser(null)
        navigate('/login')
    }

    return (
        <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_35%),linear-gradient(135deg,_#020617,_#111827)] text-white'>
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
                <div className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Projects</p>
                                <h2 className="mt-2 text-xl font-semibold text-white">Your workspace</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-500"
                                title="Create project"
                            >
                                <i className="ri-add-line text-lg"></i>
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {project.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => navigate('/project', { state: { project: item } })}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-blue-400/40 hover:bg-slate-800/80"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-white">{item.name}</p>
                                            <p className="mt-1 text-sm text-gray-400">{item.users?.length || 0} collaborators</p>
                                        </div>
                                        <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-300">
                                            <i className="ri-folder-open-line"></i>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Welcome</p>
                                <h1 className="mt-2 text-3xl font-semibold text-white">Hello, {user?.username || 'there'}!</h1>
                                <div className="mt-3 h-8 text-xl font-medium text-blue-300 transition-all duration-500">
                                    {welcomePhrases[welcomeIndex]}
                                </div>
                            </div>
                            <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
                                AI collaboration is ready
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">How to use this website</p>
                                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                                    <li className="flex gap-2"><span className="mt-1 text-blue-300">•</span> Create a project from the left panel to start your next idea.</li>
                                    <li className="flex gap-2"><span className="mt-1 text-blue-300">•</span> Open a project and use the built-in chat to work with AI or teammates.</li>
                                    <li className="flex gap-2"><span className="mt-1 text-blue-300">•</span> Add collaborators so everyone stays in sync.</li>
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Try these prompts</p>
                                <div className="mt-4 space-y-3 text-sm text-gray-300">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">“Type AI to start chatting with the AI.”</div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">“Create a new project to begin collaborating.”</div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">“Open an existing project to continue your build.”</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white"
                                >
                                    {(user?.username || 'U').charAt(0).toUpperCase()}
                                </button>
                                <div>
                                    <p className="text-sm font-semibold text-white">{user?.username || 'Your profile'}</p>
                                    <p className="text-sm text-gray-400">Manage account</p>
                                </div>
                            </div>
                        </div>

                        {profileMenuOpen && (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-xl">
                                <button onClick={() => navigate('/profile')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-200 hover:bg-white/10">
                                    <i className="ri-user-line"></i>
                                    View Profile
                                </button>
                                <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-200 hover:bg-white/10">
                                    <i className="ri-logout-box-line"></i>
                                    Logout
                                </button>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">Collaborators</p>
                                <span className="text-sm text-gray-400">{collaborators.length}</span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {collaborators.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-4 text-sm text-gray-400">
                                        Collaborators from your shared projects will appear here.
                                    </div>
                                ) : collaborators.map((member) => (
                                    <div key={member._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-semibold text-white">
                                            {(member.username || member.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{member.username || member.email}</p>
                                            <p className="text-sm text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white">Create New Project</h2>
                            <form onSubmit={createProject} className="mt-6">
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-gray-400">Project Name</label>
                                    <input
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName}
                                        type="text"
                                        className="w-full rounded-2xl border border-gray-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                                        placeholder="e.g. My Awesome App"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" className="rounded-xl px-4 py-2.5 text-gray-300 transition hover:bg-white/10" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-500">
                                        Create Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default Home