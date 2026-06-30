import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/user.context";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();

    axios
      .post("/users/login", {
        email,
        password,
      })
      .then((res) => {
        console.log(res.data);

        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);

        navigate("/");
      })
      .catch((err) => {
        console.log(err.response?.data || err);
      });
  }

  return (
    <div className="relative min-h-screen bg-[#0B1120] text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 border-r border-white/10">
          <span className="w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
            🤖 AI Powered Collaboration
          </span>

          <h1 className="mt-8 text-6xl font-extrabold leading-tight">
            Build Together.
            <br />
            <span className="text-blue-400">Create Smarter.</span>
          </h1>

          <p className="mt-8 max-w-lg text-lg leading-8 text-gray-400">
            Collaborate with teammates in real time, generate code with AI,
            brainstorm ideas, manage projects, and ship faster—all in one
            intelligent workspace.
          </p>

          <div className="mt-12 flex gap-12">
            <div>
              <h2 className="text-3xl font-bold text-blue-400">50+</h2>
              <p className="text-sm text-gray-500">AI Features</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-blue-400">24/7</h2>
              <p className="text-sm text-gray-500">Real-Time Sync</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-blue-400">∞</h2>
              <p className="text-sm text-gray-500">Ideas</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl shadow-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">Welcome Back 👋</h2>
              <p className="mt-2 text-gray-400">
                Sign in to continue to your workspace
              </p>
            </div>

            <form onSubmit={submitHandler} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-[#111827] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-[#111827] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold transition duration-300 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30"
              >
                Sign In
              </button>
            </form>

            <p className="mt-8 text-center text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;