import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const { user, setUser } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [project, setProject] = useState([])
    const [collaborators, setCollaborators] = useState([])
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const [welcomeIndex, setWelcomeIndex] = useState(0)

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
                setProject(prev => [...prev, res.data])
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
        <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,_#f8fbff,_#eef6ff)] text-slate-800'>
            <div className='mx-0 flex min-h-screen w-full flex-col px-4 py-4 sm:px-6 lg:px-8'>
                <div className='grid flex-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]'>
                    <aside className='rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-[0_20px_50px_rgba(14,116,144,0.08)] backdrop-blur'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-600'>Projects</p>
                                <h2 className='mt-2 text-xl font-semibold text-slate-900'>Your workspace</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className='rounded-full bg-sky-600 p-2 text-white transition hover:bg-sky-500'
                                title='Create project'
                            >
                                <i className='ri-add-line text-lg'></i>
                            </button>
                        </div>

                        <div className='mt-5 space-y-3'>
                            {project.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => navigate('/project', { state: { project: item } })}
                                    className='w-full rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-left transition hover:border-sky-300 hover:bg-sky-100/70'
                                >
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='font-semibold text-slate-900'>{item.name}</p>
                                            <p className='mt-1 text-sm text-slate-500'>{item.users?.length || 0} collaborators</p>
                                        </div>
                                        <div className='rounded-2xl bg-sky-100 p-2 text-sky-600'>
                                            <i className='ri-folder-open-line'></i>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className='rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_50px_rgba(14,116,144,0.08)] backdrop-blur'>
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600'>Welcome</p>
                                <h1 className='mt-2 text-3xl font-semibold text-slate-900'>Hello, {user?.username || 'there'}!</h1>
                                <div className='mt-3 h-8 text-xl font-medium text-sky-600 transition-all duration-500'>
                                    {welcomePhrases[welcomeIndex]}
                                </div>
                            </div>
                            <div className='rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700'>
                                AI collaboration is ready
                            </div>
                        </div>

                        <div className='mt-8 grid gap-4 lg:grid-cols-2'>
                            <div className='rounded-2xl border border-sky-100 bg-sky-50/70 p-5'>
                                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-violet-600'>How to use this website</p>
                                <div className='mt-4 space-y-3 text-sm text-slate-700'>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>
                                        Click the <span className='font-semibold text-sky-600'>+</span> icon next to <span className='font-semibold'>Projects</span>, enter your <span className='font-semibold'>project name</span>, and select your <span className='font-semibold'>collaborators</span>.
                                    </div>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>
                                        Open the project folder. You can now chat and collaborate directly with your teammates inside the project.
                                    </div>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>
                                        To get help from AI, type <span className='rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sky-700'>@ai</span>, press <span className='font-semibold'>Space</span>, and enter your prompt. For example:
                                        <pre className='mt-2 rounded-lg bg-slate-900 p-3 text-sky-200'>@ai make a food recipe website</pre>
                                    </div>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>
                                        Wait a few minutes while the AI generates the project files. Once the generation is complete, click the <span className='font-semibold'>Run</span> button to launch and test your project.
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-2xl border border-sky-100 bg-sky-50/70 p-5'>
                                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-600'>Try these prompts</p>
                                <div className='mt-4 space-y-3 text-sm text-slate-700'>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>“Type AI to start chatting with the AI.”</div>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>“Create a new project to begin collaborating.”</div>
                                    <div className='rounded-xl border border-sky-100 bg-white/80 p-3'>“Open an existing project to continue your build.”</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className='space-y-6 rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-[0_20px_50px_rgba(14,116,144,0.08)] backdrop-blur'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <button
                                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                                    className='flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-lg font-semibold text-white'
                                >
                                    {(user?.username || 'U').charAt(0).toUpperCase()}
                                </button>
                                <div>
                                    <p className='text-sm font-semibold text-slate-900'>{user?.username || 'Your profile'}</p>
                                    <p className='text-sm text-slate-500'>Manage account</p>
                                </div>
                            </div>
                        </div>

                        {profileMenuOpen && (
                            <div className='rounded-2xl border border-sky-100 bg-sky-50/70 p-2 shadow-sm'>
                                <button onClick={() => navigate('/profile')} className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-white'>
                                    <i className='ri-user-line'></i>
                                    View Profile
                                </button>
                                <button onClick={logout} className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-white'>
                                    <i className='ri-logout-box-line'></i>
                                    Logout
                                </button>
                            </div>
                        )}

                        <div>
                            <div className='flex items-center justify-between'>
                                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-violet-600'>Collaborators</p>
                                <span className='text-sm text-slate-500'>{collaborators.length}</span>
                            </div>
                            <div className='mt-4 space-y-3'>
                                {collaborators.length === 0 ? (
                                    <div className='rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-500'>
                                        Collaborators from your shared projects will appear here.
                                    </div>
                                ) : collaborators.map((member) => (
                                    <div key={member._id} className='flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-3'>
                                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white'>
                                            {(member.username || member.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className='font-medium text-slate-900'>{member.username || member.email}</p>
                                            <p className='text-sm text-slate-500'>{member.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>

                {isModalOpen && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
                        <div className='w-full max-w-md rounded-3xl border border-sky-100 bg-white p-8 shadow-2xl'>
                            <h2 className='text-2xl font-bold text-slate-900'>Create New Project</h2>
                            <form onSubmit={createProject} className='mt-6'>
                                <div className='mb-6'>
                                    <label className='mb-2 block text-sm font-medium text-slate-600'>Project Name</label>
                                    <input
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName}
                                        type='text'
                                        className='w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-500'
                                        placeholder='e.g. My Awesome App'
                                        required
                                    />
                                </div>
                                <div className='flex justify-end gap-3'>
                                    <button type='button' className='rounded-xl px-4 py-2.5 text-slate-600 transition hover:bg-sky-50' onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type='submit' className='rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-500'>
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