import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { PreviewMessageType } from '@webcontainer/api'
import { getWebContainer } from '../config/webContainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const navigate = useNavigate()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const [ collaboratorSearch, setCollaboratorSearch ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ isLoadingAi, setIsLoadingAi ] = useState(false)

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)
    const [ runStatus, setRunStatus ] = useState('')

    const [ runProcess, setRunProcess ] = useState(null)
    const activeListenersRef = useRef([])

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    const send = () => {
        if (!message || !message.trim()) return;

        if (message.includes('@ai')) {
            setIsLoadingAi(true)
        }

        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ]) // Update messages state
        setMessage("")

    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {

        initializeSocket(project._id)

        receiveMessage('project-message', data => {

            console.log(data)
            
            if (data.sender._id == 'ai') {
                let message = data.message

                if (typeof message === 'string') {
                    try {
                        message = JSON.parse(message)
                    } catch (err) {
                        message = { text: data.message }
                    }
                }

                console.log(message)

                const normalizedTree = message.fileTree ? normalizeFileEntries(message.fileTree) : null

                if (webContainer && message.fileTree) {
                    writeFilesToContainer(webContainer, normalizedTree, projectMountPoint).catch(() => {})
                }

                if (message.fileTree && normalizedTree) {
                    setFileTree(normalizedTree)
                }
                setIsLoadingAi(false)
                setMessages(prevMessages => [ ...prevMessages, { ...data, message } ]) // Update messages state
            } else {


                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            }
        })


        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(normalizeFileEntries(res.data.project.fileTree || {}))
        })

        axios.get('/users/all', {
            params: { search: collaboratorSearch }
        }).then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [collaboratorSearch])

    function parsePackageJson(tree) {
        try {
            const packageEntry = tree['package.json']
            if (!packageEntry) return null
            if (typeof packageEntry === 'string') return JSON.parse(packageEntry)
            const contents = packageEntry?.file?.contents || packageEntry?.contents
            if (typeof contents === 'string') {
                return JSON.parse(contents)
            }
            return null
        } catch (error) {
            console.error('Invalid package.json contents', error)
            return null
        }
    }

    function determineRunCommand(tree) {
        const pkg = parsePackageJson(tree)

        if (pkg?.scripts) {
            if (pkg.scripts.dev) {
                return { command: 'npm', args: ['run', 'dev', '--', '--host', '0.0.0.0'] }
            }
            if (pkg.scripts.start) {
                return { command: 'npm', args: ['start'] }
            }
            if (pkg.scripts.serve) {
                return { command: 'npm', args: ['run', 'serve', '--', '--host', '0.0.0.0'] }
            }
        }

        const isVite = isViteProject(tree) || pkg?.scripts?.dev?.includes('vite') || pkg?.scripts?.start?.includes('vite')
        if (isVite) {
            return { command: 'npx', args: ['vite', '--host', '0.0.0.0'] }
        }

        if (tree['server.js']) {
            return { command: 'node', args: ['server.js'] }
        }
        if (tree['index.js']) {
            return { command: 'node', args: ['index.js'] }
        }
        if (tree['app.js']) {
            return { command: 'node', args: ['app.js'] }
        }
        if (tree['main.js']) {
            return { command: 'node', args: ['main.js'] }
        }

        return { command: 'node', args: ['server.js'] }
    }

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    function normalizeFileEntries(tree) {
        if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
            return {}
        }

        const normalizedEntries = {}

        const walk = (node, pathParts = []) => {
            if (!node || typeof node !== 'object' || Array.isArray(node)) {
                return
            }

            if (node.file && typeof node.file === 'object') {
                normalizedEntries[pathParts.join('/')] = node
                return
            }

            if (node.directory && typeof node.directory === 'object') {
                Object.entries(node.directory).forEach(([name, child]) => {
                    walk(child, [...pathParts, name])
                })
                return
            }

            if (typeof node.contents === 'string') {
                normalizedEntries[pathParts.join('/')] = { file: { contents: node.contents } }
                return
            }

            Object.entries(node).forEach(([name, child]) => {
                if (name === 'file' || name === 'directory') {
                    return
                }
                walk(child, [...pathParts, name])
            })
        }

        Object.entries(tree).forEach(([name, node]) => {
            walk(node, [name])
        })

        return normalizedEntries
    }

    function toWebContainerTree(entries) {
        const tree = {}

        Object.entries(entries).forEach(([filePath, node]) => {
            const parts = filePath.split('/').filter(Boolean)
            if (parts.length === 0) {
                return
            }

            let current = tree
            parts.slice(0, -1).forEach((part) => {
                if (!current[part]) {
                    current[part] = { directory: {} }
                }
                current = current[part].directory
            })

            const fileName = parts[parts.length - 1]
            current[fileName] = node
        })

        return tree
    }

    function isViteProject(tree) {
        const pkg = parsePackageJson(tree)
        if (!pkg) return false

        const hasViteDependency = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {})
        ].some(dep => dep === 'vite' || dep.startsWith('@vitejs/') || dep === 'react' || dep === 'react-dom')

        const hasViteScript = pkg.scripts && (pkg.scripts.dev || pkg.scripts.start?.includes('vite') || pkg.scripts.serve)
        return hasViteDependency && hasViteScript
    }

    function createDefaultViteIndexHtml(tree) {
        const pkg = parsePackageJson(tree)
        const isReact = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {})
        ].some(dep => dep === 'react' || dep === 'react-dom' || dep.startsWith('react-'))

        const appMount = isReact ? '<div id="root"></div>' : '<div id="app"></div>'
        const scriptSrc = isReact ? 'src/main.jsx' : 'src/main.js'

        return {
            file: {
                contents: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Project Preview</title>\n  </head>\n  <body>\n    ${appMount}\n    <script type="module" src="/${scriptSrc}"></script>\n  </body>\n</html>`
            }
        }
    }

    const projectMountPoint = '/project'

    async function writeFilesToContainer(container, entries, baseDir = projectMountPoint) {
        for (const [filePath, fileNode] of Object.entries(entries)) {
            if (!filePath) continue;
            const cleanPath = filePath.replace(/\\/g, '/');
            const fullPath = `${baseDir}/${cleanPath}`.replace(/\/+/g, '/');
            const lastSlash = fullPath.lastIndexOf('/');
            if (lastSlash > 0) {
                const dir = fullPath.substring(0, lastSlash);
                await container.fs.mkdir(dir, { recursive: true }).catch(() => {});
            }
            let contents = '';
            if (typeof fileNode === 'string') {
                contents = fileNode;
            } else if (fileNode?.file?.contents !== undefined) {
                contents = fileNode.file.contents;
            } else if (fileNode?.contents !== undefined) {
                contents = fileNode.contents;
            }
            await container.fs.writeFile(fullPath, contents);
        }
    }

    async function ensureRunnableProject(container, currentTree) {
        const normalizedEntries = normalizeFileEntries(currentTree || {})
        const packageJson = parsePackageJson(normalizedEntries)

        try {
            await container.fs.mkdir(projectMountPoint, { recursive: true })
        } catch (err) {
            // ignore if the folder already exists
        }

        if (!packageJson) {
            const starterFiles = {
                'package.json': {
                    file: {
                        contents: JSON.stringify({
                            name: 'starter-app',
                            version: '1.0.0',
                            private: true,
                            scripts: {
                                start: 'node server.js'
                            }
                        }, null, 2)
                    }
                },
                'server.js': {
                    file: {
                        contents: `const http = require('http');\nconst fs = require('fs');\nconst path = require('path');\n\nconst port = process.env.PORT || 3000;\nconst root = process.cwd();\n\nconst server = http.createServer((req, res) => {\n  let requestedPath = req.url === '/' ? '/index.html' : req.url;\n  const filePath = path.join(root, requestedPath);\n\n  fs.readFile(filePath, (err, data) => {\n    if (err) {\n      res.writeHead(404, { 'Content-Type': 'text/plain' });\n      res.end('Not found');\n      return;\n    }\n\n    const ext = path.extname(filePath);\n    const contentType = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : 'application/javascript';\n    res.writeHead(200, { 'Content-Type': contentType });\n    res.end(data);\n  });\n});\n\nserver.listen(port, () => {\n  console.log('Server running at http://127.0.0.1:' + port);\n});\n`
                    }
                },
                'index.html': {
                    file: {
                        contents: `<!doctype html>\n<html>\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Starter Preview</title>\n    <style>body{font-family:Arial,sans-serif;background:#0f172a;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;} .card{padding:2rem;border-radius:16px;background:#111827;border:1px solid #334155;} </style>\n  </head>\n  <body>\n    <div class="card">\n      <h1>Preview is ready</h1>\n      <p>Your project is running successfully.</p>\n    </div>\n  </body>\n</html>`
                    }
                }
            }

            Object.entries(starterFiles).forEach(([name, fileDef]) => {
                normalizedEntries[name] = fileDef
            })
        } else {
            let modifiedPkg = false
            const deps = packageJson.dependencies || {}
            const devDeps = packageJson.devDependencies || {}
            const scripts = packageJson.scripts || {}

            const usesVite = Object.values(scripts).some(s => typeof s === 'string' && s.includes('vite')) ||
                             normalizedEntries['vite.config.js'] ||
                             normalizedEntries['vite.config.ts'] ||
                             isViteProject(normalizedEntries)

            if (usesVite) {
                if (!deps.vite && !devDeps.vite) {
                    packageJson.devDependencies = { ...(packageJson.devDependencies || {}), vite: '^5.4.11' }
                    modifiedPkg = true
                }
                const hasReact = deps.react || devDeps.react || Object.keys(normalizedEntries).some(f => f.endsWith('.jsx') || f.endsWith('.tsx'))
                if (hasReact && !deps['@vitejs/plugin-react'] && !devDeps['@vitejs/plugin-react']) {
                    packageJson.devDependencies = {
                        ...(packageJson.devDependencies || {}),
                        '@vitejs/plugin-react': '^4.3.4'
                    }
                    modifiedPkg = true
                }
            }

            if (modifiedPkg) {
                normalizedEntries['package.json'] = {
                    file: {
                        contents: JSON.stringify(packageJson, null, 2)
                    }
                }
            }

            if (isViteProject(normalizedEntries) && !normalizedEntries['index.html']) {
                normalizedEntries['index.html'] = createDefaultViteIndexHtml(normalizedEntries)
            }
        }

        setFileTree(normalizedEntries)
        if (!normalizedEntries['index.html']) {
            setCurrentFile(Object.keys(normalizedEntries)[0] || 'index.html')
        } else {
            setCurrentFile('index.html')
        }
        setOpenFiles((prev) => [ ...new Set([ ...prev, 'index.html' ]) ])
        await writeFilesToContainer(container, normalizedEntries, projectMountPoint)
        return normalizedEntries
    }


    // Removed appendIncomingMessage and appendOutgoingMessage functions

    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoadingAi])

    return (
        <main className='h-screen w-screen flex flex-col bg-[#0B1120] text-white font-sans overflow-hidden'>
            {/* Top Navigation Bar */}
            <header className="h-14 bg-[#0B1120] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-30 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/10"
                    >
                        <i className="ri-arrow-left-line text-sm"></i>
                        Dashboard
                    </button>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
                            <i className="ri-sparkling-fill"></i>
                        </div>
                        <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent truncate max-w-xs">{project?.name || 'Workspace Project'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Room
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all"
                    >
                        <i className="ri-user-add-line text-sm"></i>
                        Add Collaborators
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors relative"
                        title="View Room Teammates"
                    >
                        <i className="ri-group-line text-lg"></i>
                        {(project.users?.length || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white font-bold flex items-center justify-center">
                                {project.users.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex flex-grow h-[calc(100vh-3.5rem)] overflow-hidden">
                <section className="left relative flex flex-col h-full min-w-96 max-w-96 border-r border-white/10 bg-slate-900/60">
                    <header className='flex justify-between items-center p-3.5 px-4 w-full bg-slate-900/90 border-b border-white/10 absolute z-10 top-0 backdrop-blur-md'>
                        <div className="flex items-center gap-2">
                            <i className="ri-chat-voice-line text-blue-400"></i>
                            <span className="font-bold text-sm text-gray-200">AI & Teammate Room</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                            @ai helper
                        </span>
                    </header>
                    <div className="conversation-area pt-16 pb-20 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-4 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => {
                            const isAi = msg.sender._id === 'ai';
                            const isMe = msg.sender._id === user._id.toString();
                            const messageKey = msg._id || `${msg.sender?._id || 'sender'}-${msg.message || 'message'}-${index}`;
                            return (
                                <div key={messageKey} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
                                    <small className='text-xs text-gray-400 mb-1 ml-1'>{msg.sender.username || msg.sender.email}</small>
                                    <div className={`p-4 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : isAi ? 'bg-gray-900 text-gray-100 rounded-bl-sm border border-white/5' : 'bg-gray-700 text-gray-100 rounded-bl-sm'} shadow-lg shadow-black/20`}>
                                        <div className='text-sm leading-relaxed'>
                                            {isAi ?
                                                WriteAiMessage(msg.message)
                                                : <p>{msg.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {isLoadingAi && (
                            <div className="flex flex-col items-start max-w-[85%]">
                                <small className='text-xs text-gray-400 mb-1 ml-1'>ai</small>
                                <div className="p-4 rounded-2xl bg-gray-900 text-gray-100 rounded-bl-sm border border-white/5 shadow-lg shadow-black/20 flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm">AI is thinking...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 p-4 bg-gray-800/90 backdrop-blur-md border-t border-white/10">
                        <div className="flex w-full bg-gray-900 border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-transparent transition-all">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                                className='p-3 px-4 bg-transparent border-none outline-none flex-grow text-white placeholder-gray-500' type="text" placeholder='Type a message...' />
                            <button
                                onClick={send}
                                className='px-5 bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center'><i className="ri-send-plane-fill text-lg"></i></button>
                        </div>
                    </div>
                </div>
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-gray-900 border-r border-white/10 absolute transition-transform duration-300 ease-in-out z-20 ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center p-4 bg-gray-900 border-b border-white/10'>

                        <h1 className='font-semibold text-lg text-white'>Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors'>
                            <i className="ri-close-line text-xl"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-1 p-2">

                        {project.users && project.users.map(user => {

                            return (
                                <div key={user._id} className="user cursor-pointer hover:bg-white/5 p-3 rounded-lg flex gap-3 items-center transition-colors">
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center text-white bg-blue-500/20 text-blue-400'>
                                        <i className="ri-user-smile-line text-lg"></i>
                                    </div>
                                    <h1 className='font-medium text-gray-200'>{user.username || user.email}</h1>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="right bg-gray-900 flex-grow h-full flex overflow-hidden">

                <div className="explorer h-full max-w-64 min-w-56 bg-gray-800 border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</div>
                    <div className="file-tree w-full flex-grow overflow-auto py-2">
                        {
                            Object.keys(fileTree).map((file) => (
                                <button
                                    key={file}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                    }}
                                    className={`tree-element cursor-pointer p-2 px-4 flex items-center gap-2 w-full text-left transition-colors ${currentFile === file ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500' : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}>
                                    <i className="ri-file-code-line"></i>
                                    <p className='text-sm truncate'>{file}</p>
                                </button>))

                        }
                    </div>

                </div>

                <div className="code-editor flex flex-col flex-grow h-full shrink">

                    <div className="top flex items-center justify-between w-full bg-gray-900 border-b border-white/10 overflow-x-auto">

                        <div className="files flex">
                            {
                                openFiles.map((file) => (
                                    <div key={file} className={`open-file cursor-pointer p-3 px-4 flex items-center gap-3 border-r border-white/10 transition-colors ${currentFile === file ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                                        <button onClick={() => setCurrentFile(file)} className="flex items-center gap-2 text-sm font-medium">
                                            <i className="ri-file-code-line"></i>
                                            {file}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setOpenFiles(openFiles.filter(f => f !== file)); if(currentFile === file) setCurrentFile(null); }} className="text-gray-500 hover:text-gray-300 ml-1 rounded-full p-0.5 hover:bg-white/10"><i className="ri-close-line"></i></button>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="actions flex gap-2 p-2">
                            <button
                                onClick={async () => {
                                    try {
                                        setRunStatus('Starting preview...')
                                        setIframeUrl(null)

                                        const container = webContainer || await getWebContainer();
                                        if (!webContainer) {
                                            setWebContainer(container)
                                        }

                                        const filesToMount = await ensureRunnableProject(container, fileTree)
                                        saveFileTree(filesToMount)

                                        if (runProcess) {
                                            try {
                                                runProcess.kill()
                                                await Promise.race([
                                                    runProcess.exit,
                                                    new Promise(res => setTimeout(res, 800))
                                                ])
                                            } catch (killError) {
                                                console.warn('Failed to kill previous run process', killError)
                                            }
                                            setRunProcess(null)
                                        }

                                        if (activeListenersRef.current && activeListenersRef.current.length > 0) {
                                            activeListenersRef.current.forEach(unsub => {
                                                if (typeof unsub === 'function') unsub()
                                            })
                                            activeListenersRef.current = []
                                        }

                                        const cwdPath = projectMountPoint

                                        // Check if npm install is needed
                                        const pkgJson = parsePackageJson(filesToMount)
                                        const hasDeps = pkgJson && (
                                            (pkgJson.dependencies && Object.keys(pkgJson.dependencies).length > 0) ||
                                            (pkgJson.devDependencies && Object.keys(pkgJson.devDependencies).length > 0)
                                        )

                                        let needsInstall = false
                                        if (hasDeps) {
                                            try {
                                                const mountedFiles = await container.fs.readdir(cwdPath)
                                                if (!mountedFiles.includes('node_modules')) {
                                                    needsInstall = true
                                                } else {
                                                    const nmContents = await container.fs.readdir(`${cwdPath}/node_modules`)
                                                    if (!nmContents || nmContents.length === 0) {
                                                        needsInstall = true
                                                    } else {
                                                        const hasViteScript = pkgJson?.scripts && Object.values(pkgJson.scripts).some(s => typeof s === 'string' && s.includes('vite'))
                                                        if (hasViteScript && !nmContents.includes('vite')) {
                                                            needsInstall = true
                                                        }
                                                    }
                                                }
                                            } catch (fsErr) {
                                                needsInstall = true
                                            }
                                        }

                                        if (needsInstall) {
                                            setRunStatus('Installing dependencies (this may take a moment)...')
                                            const installProcess = await container.spawn('npm', ['install'], { cwd: cwdPath, output: true, stdout: true, stderr: true })
                                            
                                            const reader = installProcess.output.getReader()
                                            ;(async () => {
                                                try {
                                                    while (true) {
                                                        const { done, value } = await reader.read()
                                                        if (done) break
                                                        if (value) {
                                                            const lastLine = value.trim().split('\n').pop()
                                                            if (lastLine) {
                                                                setRunStatus(`[Installing]: ${lastLine.slice(-80)}`)
                                                            }
                                                        }
                                                    }
                                                } catch (e) {}
                                            })()

                                            const installExitCode = await installProcess.exit
                                            if (installExitCode !== 0) {
                                                throw new Error(`npm install failed with exit code ${installExitCode}`)
                                            }
                                        }

                                        setRunStatus('Starting application...')

                                        let resolvedUrl = null
                                        const previewReady = new Promise((resolve) => {
                                            const finish = (port, url) => {
                                                console.log('[WebContainer] server-ready', { port, url })
                                                const targetUrl = url || (port ? `http://localhost:${port}` : null)
                                                if (targetUrl && !resolvedUrl) {
                                                    resolvedUrl = targetUrl
                                                    setIframeUrl(targetUrl)
                                                    setRunStatus(`Preview running at ${targetUrl}`)
                                                    resolve(targetUrl)
                                                }
                                            }

                                            const unSubServer = container.on('server-ready', (port, url) => finish(port, url))
                                            const unSubPort = container.on('port', (port, type, url) => {
                                                console.log('[WebContainer] port event', { port, type, url })
                                                if (type === 'open' && url) {
                                                    finish(port, url)
                                                } else if (type === 'open' && port) {
                                                    finish(port, `http://localhost:${port}`)
                                                }
                                            })
                                            const unSubPreview = container.on('preview-message', (message) => {
                                                console.log('[WebContainer] preview-message', message)
                                                if (message.type === PreviewMessageType.ConsoleError || message.type === PreviewMessageType.UncaughtException || message.type === PreviewMessageType.UnhandledRejection) {
                                                    setRunStatus(`Preview error: ${message.message}`)
                                                }
                                            })

                                            activeListenersRef.current = [unSubServer, unSubPort, unSubPreview]

                                            setTimeout(() => {
                                                if (!resolvedUrl) {
                                                    resolve(null)
                                                }
                                            }, 25000)
                                        })

                                        const runCommand = determineRunCommand(filesToMount)
                                        console.log('[WebContainer] running command', runCommand, 'cwd', cwdPath)
                                        const tempRunProcess = await container.spawn(runCommand.command, runCommand.args, { cwd: cwdPath, output: true, stdout: true, stderr: true })
                                        setRunProcess(tempRunProcess)

                                        let processOutput = []
                                        ;(async () => {
                                            try {
                                                const reader = tempRunProcess.output.getReader()
                                                while (true) {
                                                    const { done, value } = await reader.read()
                                                    if (done) break
                                                    console.log('[WebContainer run output]', value)
                                                    if (value) {
                                                        processOutput.push(value)
                                                        const lastLine = value.trim().split('\n').pop()
                                                        if (lastLine && !resolvedUrl) {
                                                            setRunStatus(`Output: ${lastLine}`)
                                                        }
                                                        const match = value.match(/https?:\/\/(localhost|127\.0\.0\.1):\d+/i)
                                                        if (match && !resolvedUrl) {
                                                            const foundUrl = match[0].replace('127.0.0.1', 'localhost')
                                                            resolvedUrl = foundUrl
                                                            setIframeUrl(foundUrl)
                                                            setRunStatus(`Preview running at ${foundUrl}`)
                                                        }
                                                    }
                                                }
                                            } catch (streamError) {
                                                console.warn('Failed to read run output', streamError)
                                            }
                                        })()

                                        tempRunProcess.exit.then((exitCode) => {
                                            console.log('[WebContainer process exit code]', exitCode)
                                            if (exitCode !== 0 && !resolvedUrl) {
                                                const logSnippet = processOutput.join('').trim()
                                                setRunStatus(`App failed to start (exit code ${exitCode}): ${logSnippet.slice(-150)}`)
                                            }
                                        })

                                        const previewUrl = await previewReady
                                        if (!previewUrl && !resolvedUrl) {
                                            setRunStatus('Preview is starting, but the preview URL could not be detected yet. Please wait a few seconds or check your browser console for WebContainer logs.')
                                        }

                                    } catch (error) {
                                        console.error(error)
                                        const detail = error?.message || 'Unable to start preview'
                                        setRunStatus(detail)
                                    }
                                }}
                                className='px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2 text-sm font-medium transition-colors'
                            >
                                <i className="ri-play-fill text-lg"></i> Run
                            </button>
                        </div>
                    </div>
                    {runStatus && (
                        <div className="border-b border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-gray-300">
                            {runStatus}
                        </div>
                    )}
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto bg-gray-900">
                        {
                            fileTree[ currentFile ] ? (
                                <div className="code-editor-area h-full w-full overflow-auto text-sm bg-[#2e3440]">
                                    <pre
                                        className="hljs h-full p-4 w-full">
                                        <code
                                            className="hljs h-full outline-none w-full block font-mono"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            ) : (
                                <div className="flex-grow flex items-center justify-center text-gray-600 bg-gray-900 h-full">
                                    <div className="text-center">
                                        <i className="ri-code-box-line text-5xl mb-3 block opacity-50"></i>
                                        <p>Select a file from the explorer to view code</p>
                                    </div>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="flex min-w-[24rem] max-w-md flex-col h-full border-l border-white/10 bg-white">
                        <div className="address-bar flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-300">
                            <div className="flex gap-1 pl-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="flex-grow p-1.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 outline-none focus:border-blue-400 ml-2" />
                            <button onClick={() => setIframeUrl(null)} className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-200"><i className="ri-close-line text-lg"></i></button>
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full bg-white"></iframe>
                    </div>)
                }

            </section>
        </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl w-96 max-w-full border border-white/10 relative transform transition-all">
                        <header className='flex justify-between items-center mb-6'>
                            <h2 className='text-xl font-bold text-white tracking-tight'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors'>
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </header>
                        <div className="mb-4">
                            <input
                                value={collaboratorSearch}
                                onChange={(e) => setCollaboratorSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                placeholder="Search by username or email"
                            />
                        </div>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-72 overflow-auto pr-2 custom-scrollbar">
                            {users.map(user => {
                                const isSelected = Array.from(selectedUserId).indexOf(user._id) != -1;
                                return (
                                <div key={user._id} className={`user cursor-pointer rounded-xl p-3 flex gap-3 items-center transition-all ${isSelected ? 'bg-blue-500/20 border border-blue-500/50' : 'hover:bg-white/5 border border-transparent'}`} onClick={() => handleUserClick(user._id)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${isSelected ? 'bg-blue-500' : 'bg-gray-700'} transition-colors`}>
                                        <i className="ri-user-smile-line text-lg"></i>
                                    </div>
                                    <h1 className={`font-medium ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>{user.username || user.email}</h1>
                                </div>
                            )})}
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center">
                            <button
                                onClick={addCollaborators}
                                className='w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-colors'>
                                Add Collaborators
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project