import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  function submitHandler(e) {
    e.preventDefault();
    setErrorMessage("");

    axios
      .post("/users/register", {
        username,
        email,
        password,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.error || "Unable to create account right now.");
      });
  }

  const isLight = theme === 'light';

  return (
    <div className={`relative min-h-screen transition-colors duration-500 font-sans flex flex-col justify-between overflow-hidden ${
      isLight 
        ? 'bg-gradient-to-br from-slate-50 via-sky-100/70 via-indigo-50/50 to-blue-100/60 text-slate-800' 
        : 'bg-gradient-to-br from-[#0B1120] via-[#0F172A] via-[#111827] to-[#1E1B4B] text-slate-100'
    }`}>
      {/* Dynamic Ambient Glowing Gradient Spheres */}
      <div className="absolute top-1/4 -left-20 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 -right-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 blur-[130px] pointer-events-none"></div>

      {/* Top Header Navbar */}
      <header className={`w-full h-16 border-b px-6 lg:px-12 flex items-center justify-between z-20 backdrop-blur-md ${
        isLight ? 'bg-white/90 border-slate-200/80 shadow-xs' : 'bg-[#0B1120]/90 border-slate-800'
      }`}>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <i className="ri-sparkling-fill text-lg"></i>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CodeSmith
          </span>
        </div>

        {/* Right Navigation & Theme Switcher Pill */}
        <div className="flex items-center gap-5">
          <a href="#" className={`text-xs font-semibold transition-colors hidden sm:block ${
            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}>
            Need help?
          </a>

          <div className={`flex items-center p-1 rounded-full border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-full transition-all ${
                isLight ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Light Mode"
            >
              <i className="ri-sun-line text-sm block"></i>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-full transition-all ${
                !isLight ? 'bg-slate-700 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dark Mode"
            >
              <i className="ri-moon-line text-sm block"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex-1 grid lg:grid-cols-12 gap-12 items-center w-full">
        
        {/* Left Hero & Features Section (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Your <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">AI Software</span><br />Engineer
            </h1>
            <p className={`text-base sm:text-lg max-w-lg leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              CodeSmith helps you plan, code, test, and deploy—end to end. Your tireless AI teammate.
            </p>
          </div>

          {/* Features Stack */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-lg flex-shrink-0 font-bold border border-blue-500/20">
                <i className="ri-code-s-slash-line"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm">Write & Refactor Code</h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Smarter code generation and refactoring.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-lg flex-shrink-0 font-bold border border-teal-500/20">
                <i className="ri-bug-line"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm">Test & Debug</h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Automatically find, fix and explain issues.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-lg flex-shrink-0 font-bold border border-purple-500/20">
                <i className="ri-rocket-line"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm">Deploy & Monitor</h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Deploy with confidence and monitor in real time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card (5 Columns) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className={`w-full max-w-[440px] rounded-3xl border p-8 shadow-2xl backdrop-blur-xl transition-all ${
            isLight 
              ? 'bg-white border-slate-200/90 text-slate-800 shadow-slate-200/60' 
              : 'bg-slate-900/90 border-slate-800 text-white shadow-black/40'
          }`}>
            
            {/* Card Header */}
            <div className="text-center mb-6">
              <span className="text-3xl mb-2 block">🚀</span>
              <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Get started with your free CodeSmith workspace
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submitHandler} className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Username
                </label>
                <div className="relative flex items-center">
                  <i className="ri-user-3-line absolute left-3.5 text-slate-400 text-base"></i>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="choose a username"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Email address
                </label>
                <div className="relative flex items-center">
                  <i className="ri-mail-line absolute left-3.5 text-slate-400 text-base"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Password
                </label>
                <div className="relative flex items-center">
                  <i className="ri-lock-line absolute left-3.5 text-slate-400 text-base"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-slate-800/80 border-slate-700 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 text-base"
                  >
                    {showPassword ? <i className="ri-eye-off-line"></i> : <i className="ri-eye-line"></i>}
                  </button>
                </div>
              </div>

              {/* Primary Submit CTA */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Create account <i className="ri-arrow-right-line"></i>
              </button>
            </form>

            {/* Switch to Login */}
            <p className={`mt-6 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Log in
              </Link>
            </p>

          </div>
        </div>

      </main>

      {/* Bottom Footer Bar */}
      <footer className={`w-full py-4 px-6 lg:px-12 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
        isLight ? 'bg-white/80 border-slate-200/80 text-slate-500' : 'bg-[#0B1120]/80 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <i className="ri-shield-check-line text-blue-600 text-sm"></i>
          <span>Enterprise grade security</span>
        </div>

        <div className="flex items-center gap-4 font-medium">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>

        <div>
          © {new Date().getFullYear()} CodeSmith Inc. Designed & Developed by <span className="font-semibold text-blue-500">Nikhil Rai</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Register;