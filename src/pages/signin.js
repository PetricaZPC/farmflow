import React, { useState } from "react";
import { useRouter } from "next/router";

function SignIn({
  toggleForm,
  emailOrUsername,
  setEmailOrUsername,
  password,
  setPassword,
  handleSignIn,
  error,
  message,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="section-title">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">Welcome back to FarmFlow</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="emailOrUsername"
                className="form-label"
              >
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                className="form-input"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="form-label"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}

          <div>
            <button type="submit" className="btn-primary w-full">
              Sign in
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={toggleForm}
              className="text-green-600 hover:text-green-500 font-medium"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function SignUp({
  toggleForm,
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleSignUp,
  error,
  message,
}) {
  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="card max-w-md w-full space-y-8 p-8">
          <div className="max-w-md mx-auto my-10">
            <div className="text-center">
              <h1 className="my-3 text-3xl font-semibold text-gray-700 ">
                Sign up
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Create your account
              </p>
            </div>
            <div className="m-7">
              <form onSubmit={handleSignUp}>
                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm text-gray-600 "
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 placeholder-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="username"
                    className="block mb-2 text-sm text-gray-600 "
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="Your username"
                    className="w-full px-3 py-2 placeholder-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 "
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    maxLength={30}
                  />
                </div>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="text-sm text-gray-600 "
                    >
                      Password
                    </label>
                  </div>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Your Password"
                    className="w-full px-3 py-2 placeholder-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label
                      htmlFor="confirm-password"
                      className="text-sm text-gray-600 "
                    >
                      Confirm password
                    </label>
                  </div>
                  <input
                    type="password"
                    name="confirm-password"
                    id="confirm-password"
                    placeholder="Enter your password again"
                    className="w-full px-3 py-2 placeholder-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                {message && <p className="text-green-500">{message}</p>}
                <div className="mb-6">
                  <button
                    type="submit"
                    className="btn-primary w-full"
                  >
                    Sign up
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <a
                    href="#!"
                    onClick={toggleForm}
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Sign in
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const toggleForm = () => {
    setIsSignIn(!isSignIn);
    setError("");
    setMessage("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError("");
        router.push("/map");
      } else {
        setError(data.error);
        setMessage("");
      }
    } catch (error) {
      setError("An error occurred while signing in");
      setMessage("");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Account created successfully! Please sign in.");
        setError("");

        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setIsSignIn(true);
        }, 1500);
      } else {
        setError(data.error);
        setMessage("");
      }
    } catch (error) {
      setError("An error occurred while signing up");
      setMessage("");
    }
  };

  return (
    <div>
      {isSignIn ? (
        <SignIn
          toggleForm={toggleForm}
          emailOrUsername={emailOrUsername}
          setEmailOrUsername={setEmailOrUsername}
          password={password}
          setPassword={setPassword}
          handleSignIn={handleSignIn}
          error={error}
          message={message}
        />
      ) : (
        <SignUp
          toggleForm={toggleForm}
          email={email}
          setEmail={setEmail}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          handleSignUp={handleSignUp}
          error={error}
          message={message}
        />
      )}
    </div>
  );
}
