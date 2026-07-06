import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const Profile = () => {
  const { setUser } = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [projectCount, setProjectCount] = useState(0);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/users/profile').then((res) => {
      setProfile(res.data.user);
    }).catch((err) => {
      console.log(err);
    });

    axios.get('/projects/all').then((res) => {
      setProjectCount(res.data.projects?.length || 0);
    }).catch((err) => {
      console.log(err);
    });

    axios.get('/users/all').then((res) => {
      setCollaboratorCount(res.data.users?.length || 0);
    }).catch((err) => {
      console.log(err);
    });
  }, []);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  }

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(135deg,_#020617,_#111827)] p-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold">{profile.username}</h1>
            <p className="mt-2 text-gray-400">Manage your account and workspace activity.</p>
          </div>
          <button onClick={logout} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-white/20">
            Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-semibold text-white">
                {(profile.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile.username}</h2>
                <p className="text-sm text-gray-400">{profile.email}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-gray-400">Date joined</p>
                <p className="mt-2 font-semibold text-white">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-gray-400">Total projects</p>
                <p className="mt-2 font-semibold text-white">{projectCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-gray-400">Total collaborators</p>
                <p className="mt-2 font-semibold text-white">{collaboratorCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Account overview</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">Your profile is connected to your shared workspaces and project collaborations. You can update your username once the editing flow is added in a future iteration.</p>
            <div className="mt-6 rounded-2xl border border-dashed border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-200">
              Username and profile management will be expanded here soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
