import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'


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

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }


        receiveMessage('project-message', data => {

            console.log(data)
            
            if (data.sender._id == 'ai') {


                const message = JSON.parse(data.message)

                console.log(message)

                webContainer?.mount(message.fileTree)

                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
                setIsLoadingAi(false)
                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            } else {


                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            }
        })


        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all', {
            params: { search: collaboratorSearch }
        }).then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [collaboratorSearch])

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

    async function ensureRunnableProject(container, currentTree) {
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
        };

        const normalizedTree = { ...currentTree };
        Object.entries(starterFiles).forEach(([name, fileDef]) => {
            if (!normalizedTree[name]) {
                normalizedTree[name] = fileDef;
            }
        });

        if (!normalizedTree['index.html']) {
            normalizedTree['index.html'] = starterFiles['index.html'];
        }

        setFileTree(normalizedTree);
        setCurrentFile('index.html');
        setOpenFiles((prev) => [ ...new Set([ ...prev, 'index.html' ]) ]);
        await container.mount(normalizedTree);
        return normalizedTree;
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
        <main className='h-screen w-screen flex bg-gray-900 text-white font-sans'>
            <section className="left relative flex flex-col h-screen min-w-96 max-w-96 border-r border-white/10 bg-gray-800">
                <header className='flex justify-between items-center p-4 w-full bg-gray-900 border-b border-white/10 absolute z-10 top-0 shadow-md'>
                    <button className='flex gap-2 items-center text-gray-300 hover:text-white transition-colors' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-line text-lg"></i>
                        <span className="font-medium">Add collaborator</span>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5'>
                        <i className="ri-group-line text-xl"></i>
                    </button>
                </header>
                <div className="conversation-area pt-20 pb-20 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-4 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => {
                            const isAi = msg.sender._id === 'ai';
                            const isMe = msg.sender._id === user._id.toString();
                            return (
                                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
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
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
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
                                openFiles.map((file, index) => (
                                    <div key={index} className={`open-file cursor-pointer p-3 px-4 flex items-center gap-3 border-r border-white/10 transition-colors ${currentFile === file ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
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

                                        const container = webContainer || await getWebContainer();
                                        if (!webContainer) {
                                            setWebContainer(container)
                                        }

                                        const filesToMount = await ensureRunnableProject(container, fileTree)
                                        saveFileTree(filesToMount)

                                        if (runProcess) {
                                            runProcess.kill()
                                        }

                                        const installProcess = await container.spawn('npm', [ 'install' ])
                                        await installProcess.exit

                                        const tempRunProcess = await container.spawn('npm', [ 'start' ])
                                        setRunProcess(tempRunProcess)
                                        setRunStatus('Preview running')

                                        container.on('server-ready', (port, url) => {
                                            setIframeUrl(url)
                                        })
                                    } catch (error) {
                                        console.error(error)
                                        setRunStatus(error.message || 'Unable to start preview')
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