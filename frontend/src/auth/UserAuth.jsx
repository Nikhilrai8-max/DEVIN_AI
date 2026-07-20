import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const UserAuth = ({ children }) => {

    const { user } = useContext(UserContext)
    const [ loading, setLoading ] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        if (user) {
            setLoading(false)
        } else {
            const storedUser = localStorage.getItem('user')
            if (!storedUser) {
                navigate('/login')
            } else {
                setLoading(false)
            }
        }
    }, [user, token, navigate])

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0B1120] text-white">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserAuth