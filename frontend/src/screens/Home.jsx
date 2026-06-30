import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
                setProject(prev => [...prev, res.data])
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)

        }).catch(err => {
            console.log(err)
        })

    }, [])

    return (
        <main className='min-h-screen bg-gray-900 text-white p-8'>
            <div className="max-w-7xl mx-auto">
                

                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white rounded-lg shadow-lg shadow-blue-500/30 font-medium">
                        <i className="ri-add-line text-lg"></i>
                        New Project
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {project.map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="group flex flex-col gap-4 cursor-pointer p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50">
                            
                            <div className="flex justify-between items-start">
                                <h2 className='font-semibold text-xl text-gray-100 truncate w-full'>{project.name}</h2>
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <i className="ri-folder-open-line"></i>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-auto pt-4 border-t border-white/5">
                                <i className="ri-user-line"></i>
                                <span>{project.users.length} {project.users.length === 1 ? 'Collaborator' : 'Collaborators'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 transform transition-all scale-100 opacity-100">
                            <h2 className="text-2xl font-bold mb-6 text-white">Create New Project</h2>
                            <form onSubmit={createProject}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
                                    <input
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName || ''}
                                        type="text" 
                                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                        placeholder="e.g. My Awesome App"
                                        required 
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" 
                                        onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/30 transition-colors font-medium">
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