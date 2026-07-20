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
    
    // Theme & Filtering States (Light Mode by default)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all') // 'all', 'recent', 'shared'
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [selectedTemplate, setSelectedTemplate] = useState('React + Vite')

    const navigate = useNavigate()

    const welcomePhrases = [
        'Build fullstack web apps with AI in real time',
        'Turn your ideas into clean, running code instantly',
        'Collaborate seamlessly with your team',
        'Powered by WebContainer & Gemini AI'
    ]

    const promptIdeas = [
        { title: 'React E-Commerce Store', prompt: 'Build a modern React e-commerce store with product grid and shopping cart', badge: 'Frontend', color: 'from-blue-500 to-cyan-500' },
        { title: 'RESTful API Backend', prompt: 'Create a Node.js Express API with user authentication and MongoDB', badge: 'Backend', color: 'from-emerald-500 to-teal-500' },
        { title: 'Real-time Chat Platform', prompt: 'Generate a real-time messaging app with WebSockets and Tailwind CSS', badge: 'Fullstack', color: 'from-purple-500 to-indigo-500' },
        { title: 'AI Recipe Generator', prompt: 'Make a food recipe explorer website with interactive search filters', badge: 'Web App', color: 'from-amber-500 to-orange-500' }
    ]

    const projectTemplates = ['React + Vite', 'Node / Express API', 'Vanilla HTML & CSS', 'Next.js App']

    useEffect(() => {
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    function createProject(e) {
        e?.preventDefault()
        if (!projectName.trim()) return

        axios.post('/projects/create', {
            name: projectName.trim(),
        })
            .then((res) => {
                setIsModalOpen(false)
                setProject(prev => [res.data, ...prev])
                setProjectName('')
            })
            .catch((error) => {
                console.error('Failed to create project:', error)
            })
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setWelcomeIndex((prev) => (prev + 1) % welcomePhrases.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [welcomePhrases.length])

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            const projectsList = res.data.projects || []
            setProject(projectsList)

            axios.get('/users/all').then((userRes) => {
                const allUsers = userRes.data.users || []
                const sharedUserIds = new Set(
                    projectsList.flatMap((item) => (item.users || []).map((member) => typeof member === 'string' ? member : member?._id).filter(Boolean))
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

    // Filter projects by search query and category
    const filteredProjects = project.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        if (!matchesSearch) return false

        const isCollaborative = (p.users || []).length > 1
        if (activeCategory === 'shared') return isCollaborative
        if (activeCategory === 'recent') return true
        return true
    })

    const handlePromptClick = (promptObj) => {
        setProjectName(promptObj.title)
        setIsModalOpen(true)
    }

    const isLight = theme === 'light'

    return (
        <main className={`min-h-screen transition-colors duration-300 font-sans ${
            isLight 
                ? 'bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 text-slate-800' 
                : 'bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#111827] text-slate-100'
        }`}>
            {/* Top Navigation Bar */}
            <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
                isLight ? 'bg-white/80 border-slate-200/80 shadow-xs' : 'bg-[#0B1120]/80 border-slate-800 shadow-md'
            }`}>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4'>
                    {/* Brand / Logo */}
                    <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate('/')}>
                        <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20'>
                            <i className="ri-sparkling-fill text-xl"></i>
                        </div>
                        <div>
                            <span className='font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>CodeSmith</span>
                            <span className={`text-xs ml-1.5 font-medium px-2 py-0.5 rounded-full ${
                                isLight ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                            }`}>Workspace</span>
                        </div>
                    </div>

                    {/* Global Quick Search */}
                    <div className='flex-1 max-w-md hidden md:block'>
                        <div className={`relative flex items-center rounded-xl border transition-all ${
                            isLight 
                                ? 'bg-slate-100/80 border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20' 
                                : 'bg-slate-800/60 border-slate-700/80 focus-within:border-blue-400 focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-400/20'
                        }`}>
                            <i className="ri-search-line text-lg ml-3 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Search workspace projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full bg-transparent px-3 py-2 text-sm outline-none placeholder-slate-400'
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className='mr-2 text-slate-400 hover:text-slate-600'>
                                    <i className="ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions & Profile */}
                    <div className='flex items-center gap-3'>
                        {/* Live AI Status Badge */}
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                        }`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            AI Engine Online
                        </div>

                        {/* Theme Switcher Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl border transition-all ${
                                isLight 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                            }`}
                            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
                        >
                            {isLight ? <i className="ri-moon-line text-lg block"></i> : <i className="ri-sun-line text-lg block"></i>}
                        </button>

                        {/* Primary New Project CTA */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className='px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]'
                        >
                            <i className="ri-add-line text-lg"></i>
                            <span className='hidden sm:inline'>New Project</span>
                        </button>

                        {/* User Profile Dropdown */}
                        <div className='relative'>
                            <button
                                onClick={() => setProfileMenuOpen(prev => !prev)}
                                className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center ring-2 ring-blue-500/30 hover:ring-blue-500 transition-all shadow-md'
                            >
                                {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                            </button>

                            {profileMenuOpen && (
                                <div className={`absolute right-0 mt-3 w-64 rounded-2xl border shadow-xl p-3 z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
                                }`}>
                                    <div className='px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-2'>
                                        <p className='font-semibold text-sm truncate'>{user?.username || 'User Account'}</p>
                                        <p className='text-xs text-slate-400 truncate'>{user?.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => { setProfileMenuOpen(false); navigate('/profile') }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                            isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                                        }`}
                                    >
                                        <i className="ri-user-settings-line text-lg text-blue-500"></i>
                                        Manage Account
                                    </button>
                                    <button 
                                        onClick={logout}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                            isLight ? 'hover:bg-rose-50 text-rose-600' : 'hover:bg-rose-950/40 text-rose-400'
                                        }`}
                                    >
                                        <i className="ri-logout-box-r-line text-lg"></i>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
                
                {/* Hero Banner Section */}
                <section className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl backdrop-blur-md transition-colors duration-300 ${
                    isLight 
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border-blue-400/30' 
                        : 'bg-gradient-to-r from-slate-900 via-blue-950/80 to-indigo-950 border-slate-800 text-white'
                }`}>
                    {/* Background Decorative Glow */}
                    <div className='absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none'></div>
                    <div className='absolute right-1/3 -top-20 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none'></div>

                    <div className='relative z-10 grid lg:grid-cols-3 gap-6 items-center'>
                        <div className='lg:col-span-2 space-y-4'>
                            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-blue-100'>
                                <i className="ri-magic-line text-amber-300"></i>
                                Gemini 1.5/3.5 Powered AI IDE
                            </div>
                            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight'>
                                Hello, <span className='text-amber-300'>{user?.username || 'Developer'}</span>! 👋
                            </h1>
                            <p className='text-lg sm:text-xl text-blue-100 font-medium h-7 transition-all duration-500'>
                                {welcomePhrases[welcomeIndex]}
                            </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                            <div className='p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white'>
                                <div className='flex items-center justify-between text-blue-200 text-xs font-semibold uppercase tracking-wider'>
                                    <span>Projects</span>
                                    <i className="ri-folder-code-line text-lg"></i>
                                </div>
                                <div className='text-3xl font-bold mt-1'>{project.length}</div>
                            </div>
                            <div className='p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white'>
                                <div className='flex items-center justify-between text-blue-200 text-xs font-semibold uppercase tracking-wider'>
                                    <span>Teammates</span>
                                    <i className="ri-group-line text-lg"></i>
                                </div>
                                <div className='text-3xl font-bold mt-1'>{collaborators.length}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Grid Layout: Main Workspace (Left 2 cols) & Sidebar (Right 1 col) */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    
                    {/* Projects Section (2 Columns) */}
                    <div className='lg:col-span-2 space-y-6'>
                        
                        {/* Projects Header & Controls */}
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-xl font-bold tracking-tight flex items-center gap-2'>
                                    <i className="ri-folder-3-line text-blue-500"></i>
                                    Workspace Projects
                                </h2>
                                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Manage and launch your AI-powered applications
                                </p>
                            </div>

                            <div className='flex items-center gap-2'>
                                {/* Category Filter Pills */}
                                <div className={`flex p-1 rounded-xl border text-xs font-medium ${
                                    isLight ? 'bg-slate-200/70 border-slate-300/80' : 'bg-slate-800/80 border-slate-700'
                                }`}>
                                    {['all', 'recent', 'shared'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                                                activeCategory === cat 
                                                    ? (isLight ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'bg-slate-700 text-white font-semibold')
                                                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* View Mode Switcher */}
                                <div className={`flex p-1 rounded-xl border text-xs ${
                                    isLight ? 'bg-slate-200/70 border-slate-300/80' : 'bg-slate-800/80 border-slate-700'
                                }`}>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? (isLight ? 'bg-white text-blue-600 shadow-xs' : 'bg-slate-700 text-white') : 'text-slate-400'}`}
                                        title="Grid View"
                                    >
                                        <i className="ri-layout-grid-line text-base block"></i>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? (isLight ? 'bg-white text-blue-600 shadow-xs' : 'bg-slate-700 text-white') : 'text-slate-400'}`}
                                        title="List View"
                                    >
                                        <i className="ri-list-check text-base block"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Projects Cards Container */}
                        {filteredProjects.length === 0 ? (
                            /* Empty State Card */
                            <div className={`rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
                                isLight ? 'border-slate-300 bg-white/60' : 'border-slate-800 bg-slate-900/40'
                            }`}>
                                <div className='w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-3xl mb-4'>
                                    <i className="ri-folder-add-line"></i>
                                </div>
                                <h3 className='text-lg font-bold'>No projects found</h3>
                                <p className={`text-sm mt-1 max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {searchQuery ? `No results match "${searchQuery}". Try a different keyword.` : 'Get started by creating your first AI web application workspace.'}
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className='mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all'
                                >
                                    <i className="ri-add-line text-lg"></i>
                                    Create First Project
                                </button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* Grid View */
                            <div className='grid sm:grid-cols-2 gap-4'>
                                {filteredProjects.map((item, idx) => {
                                    const colCount = item.users?.length || 1
                                    const gradientAccents = [
                                        'from-blue-500 to-indigo-600',
                                        'from-emerald-500 to-teal-600',
                                        'from-purple-500 to-violet-600',
                                        'from-amber-500 to-orange-600'
                                    ]
                                    const accent = gradientAccents[idx % gradientAccents.length]

                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => navigate('/project', { state: { project: item } })}
                                            className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                                isLight 
                                                    ? 'bg-white border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-blue-500/10' 
                                                    : 'bg-slate-900/80 border-slate-800 shadow-md hover:border-blue-500/50 hover:shadow-blue-500/10'
                                            }`}
                                        >
                                            <div className='flex items-start justify-between gap-3'>
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                                                    <i className="ri-code-s-slash-line"></i>
                                                </div>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                    isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                                                }`}>
                                                    {colCount > 1 ? `${colCount} Members` : 'Solo'}
                                                </span>
                                            </div>

                                            <div className='mt-4'>
                                                <h3 className='font-bold text-base group-hover:text-blue-500 transition-colors line-clamp-1'>
                                                    {item.name}
                                                </h3>
                                                <p className={`text-xs mt-1 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    AI Code Generation Workspace • WebContainer Live Preview
                                                </p>
                                            </div>

                                            <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs ${
                                                isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
                                            }`}>
                                                <span className='flex items-center gap-1.5'>
                                                    <i className="ri-time-line text-blue-500"></i>
                                                    Active Workspace
                                                </span>
                                                <span className='font-semibold text-blue-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform'>
                                                    Open <i className="ri-arrow-right-line"></i>
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            /* List View */
                            <div className='space-y-3'>
                                {filteredProjects.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => navigate('/project', { state: { project: item } })}
                                        className={`rounded-2xl border p-4 cursor-pointer flex items-center justify-between gap-4 transition-all hover:border-blue-400 ${
                                            isLight ? 'bg-white border-slate-200 hover:bg-sky-50/50' : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className='flex items-center gap-3.5 min-w-0'>
                                            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg flex-shrink-0'>
                                                <i className="ri-folder-open-line"></i>
                                            </div>
                                            <div className='min-w-0'>
                                                <h4 className='font-bold text-sm truncate'>{item.name}</h4>
                                                <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {item.users?.length || 1} Collaborators
                                                </p>
                                            </div>
                                        </div>

                                        <button className='px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 font-semibold text-xs flex items-center gap-1 hover:bg-blue-500 hover:text-white transition-all'>
                                            Launch <i className="ri-arrow-right-line"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 4-Step How To Use Guide */}
                        <div className={`rounded-3xl border p-6 transition-colors ${
                            isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/70 border-slate-800 shadow-md'
                        }`}>
                            <h3 className='font-bold text-base mb-4 flex items-center gap-2'>
                                <i className="ri-guide-line text-indigo-500"></i>
                                How to Build Apps with CodeSmith
                            </h3>
                            <div className='grid sm:grid-cols-4 gap-3'>
                                {[
                                    { step: '01', title: 'Create Workspace', desc: 'Click + New Project and enter app name.' },
                                    { step: '02', title: 'Open Project', desc: 'Navigate to the project code editor panel.' },
                                    { step: '03', title: 'Prompt @ai', desc: 'Type @ai build a recipe website in chat.' },
                                    { step: '04', title: 'Run & Preview', desc: 'Click Run button to test in WebContainer.' }
                                ].map((s, idx) => (
                                    <div key={idx} className={`p-3.5 rounded-2xl border ${
                                        isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-800/40 border-slate-800'
                                    }`}>
                                        <span className='text-xs font-extrabold text-blue-500 tracking-wider'>{s.step}</span>
                                        <h4 className='font-bold text-xs mt-1'>{s.title}</h4>
                                        <p className={`text-[11px] mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive AI Quick Prompts Gallery */}
                        <div className={`rounded-3xl border p-6 transition-colors ${
                            isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/70 border-slate-800 shadow-md'
                        }`}>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='font-bold text-base flex items-center gap-2'>
                                    <i className="ri-lightbulb-flash-line text-amber-500"></i>
                                    Quick Prompt Templates
                                </h3>
                                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Click to start project</span>
                            </div>

                            <div className='grid sm:grid-cols-2 gap-3'>
                                {promptIdeas.map((idea, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handlePromptClick(idea)}
                                        className={`group rounded-2xl border p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                                            isLight 
                                                ? 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-sky-50/70' 
                                                : 'bg-slate-800/40 border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800/80'
                                        }`}
                                    >
                                        <div className='flex items-center justify-between gap-2 mb-1.5'>
                                            <span className='font-semibold text-sm group-hover:text-blue-500 transition-colors'>{idea.title}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase text-white bg-gradient-to-r ${idea.color}`}>
                                                {idea.badge}
                                            </span>
                                        </div>
                                        <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                            "{idea.prompt}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar: Collaborators Hub */}
                    <div className='space-y-6'>
                        <div className={`rounded-3xl border p-6 transition-colors sticky top-24 ${
                            isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/70 border-slate-800 shadow-md'
                        }`}>
                            <div className='flex items-center justify-between mb-4'>
                                <div className='flex items-center gap-2'>
                                    <i className="ri-group-line text-xl text-blue-500"></i>
                                    <h3 className='font-bold text-base'>Team Collaborators</h3>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                    isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950 text-blue-400'
                                }`}>
                                    {collaborators.length} Total
                                </span>
                            </div>

                            <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Teammates registered across your shared AI projects.
                            </p>

                            <div className='space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar'>
                                {collaborators.length === 0 ? (
                                    <div className={`p-5 rounded-2xl border border-dashed text-center text-xs ${
                                        isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400 bg-slate-800/30'
                                    }`}>
                                        <i className="ri-user-follow-line text-2xl text-slate-400 mb-2 block"></i>
                                        No shared collaborators yet. Add collaborators inside any project room!
                                    </div>
                                ) : (
                                    collaborators.map((member) => (
                                        <div
                                            key={member._id}
                                            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                                                isLight ? 'bg-slate-50 border-slate-200/80 hover:bg-slate-100' : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className='relative flex-shrink-0'>
                                                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs'>
                                                    {(member.username || member.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full'></span>
                                            </div>
                                            <div className='min-w-0 flex-1'>
                                                <p className='font-bold text-xs truncate'>{member.username || member.email}</p>
                                                <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{member.email}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Create New Project Modal */}
            {isModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
                    <div className={`w-full max-w-lg rounded-3xl border p-7 shadow-2xl transition-all ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}>
                        <div className='flex items-center justify-between mb-6'>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl'>
                                    <i className="ri-folder-add-line"></i>
                                </div>
                                <div>
                                    <h2 className='text-xl font-bold tracking-tight'>Create New Project</h2>
                                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Launch a new AI coding workspace</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>

                        <form onSubmit={createProject} className='space-y-5'>
                            <div>
                                <label className='block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2'>
                                    Project Name
                                </label>
                                <input
                                    autoFocus
                                    type='text'
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder='e.g. Food Recipe Explorer'
                                    required
                                    className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all ${
                                        isLight 
                                            ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20' 
                                            : 'bg-slate-800/80 border-slate-700 focus:border-blue-400 focus:bg-slate-800 focus:ring-2 focus:ring-blue-400/20 text-white'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2'>
                                    Select Template Preset
                                </label>
                                <div className='grid grid-cols-2 gap-2'>
                                    {projectTemplates.map(tpl => (
                                        <button
                                            type="button"
                                            key={tpl}
                                            onClick={() => setSelectedTemplate(tpl)}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                                                selectedTemplate === tpl
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                                    : (isLight ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100' : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800')
                                            }`}
                                        >
                                            {tpl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className='pt-3 flex justify-end gap-3'>
                                <button
                                    type='button'
                                    onClick={() => setIsModalOpen(false)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                        isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all'
                                >
                                    Create & Launch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home