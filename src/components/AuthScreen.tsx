import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "../firebase";
import { Shield, Sparkles, Brain, Lock, Mail, User, Eye, EyeOff, BarChart3, AlertCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  darkMode: boolean;
}

export default function AuthScreen({ onAuthSuccess, darkMode }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage for remembered email
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleAuthError = (err: any) => {
    console.error("Auth error details:", err);
    let msg = "An unexpected error occurred. Please try again.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "Invalid email or password combination.";
    } else if (err.code === "auth/email-already-in-use") {
      msg = "An account with this email already exists.";
    } else if (err.code === "auth/weak-password") {
      msg = "Password must be at least 6 characters long.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    } else if (err.message) {
      msg = err.message;
    }
    setError(msg);
  };

  const handleRememberMe = () => {
    if (rememberMe && email) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }
  };

  const syncUserProfile = async (user: any, displayName: string) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        return;
      }
      
      const profileData = {
        uid: user.uid,
        name: displayName || user.displayName || user.email?.split("@")[0] || "Detective",
        email: user.email || "",
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        lastLogin: Date.now()
      };

      if (!userSnap.exists()) {
        try {
          await setDoc(userDocRef, {
            ...profileData,
            createdAt: Date.now(),
            totalUploads: 0,
            totalReports: 0
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        try {
          await setDoc(userDocRef, profileData, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (err) {
      console.error("Error syncing profile with Firestore:", err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        handleRememberMe();
        await syncUserProfile(credential.user, credential.user.displayName || "");
        onAuthSuccess(credential.user);
      } else {
        // Sign Up
        if (!name) {
          setError("Please enter your name to sign up.");
          setLoading(false);
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        handleRememberMe();
        await syncUserProfile(credential.user, name);
        onAuthSuccess(credential.user);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(credential.user, credential.user.displayName || "");
      onAuthSuccess(credential.user);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setError(null);
    setInfo(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset instructions have been sent to your email!");
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${darkMode ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"}`}>
      
      {/* Left Column: SaaS Branding & Interactive Design */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-5 sm:p-8 md:p-12 text-white relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-850">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-12 translate-y-12"></div>
        
        {/* Header Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="p-2 bg-indigo-600 rounded-md shadow-lg shadow-indigo-600/10">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white font-mono">
              AI Data Detective
            </span>
            <div className="text-[8px] text-indigo-400 font-mono tracking-widest uppercase">Enterprise Cognitive Hub</div>
          </div>
        </div>

        {/* Center Illustration and Taglines */}
        <div className="my-auto py-4 sm:py-8 relative z-10 space-y-4 sm:space-y-6">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-medium text-indigo-300 uppercase tracking-wider font-mono">Next-Gen Intelligent Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
              Upload Data. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Discover Hidden Insights.
              </span>
            </h1>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Instantly transform raw CSV, Excel, or JSON files into a beautiful, secure executive dashboard with automated cleaning, statistical modeling, anomaly detection, and interactive AI chatting.
            </p>
          </div>

          {/* Visual Showcase Widgets */}
          <div className="hidden sm:space-y-2.5 max-w-sm">
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Automated SaaS Dashboard</div>
                <div className="text-[10px] text-slate-400 font-mono">Cleaned dataset summaries and Recharts visuals automatically.</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Cognitive Anomaly Scanning</div>
                <div className="text-[10px] text-slate-400 font-mono">Scan for duplicates, outliers, and anomalous rows with confidence scores.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="hidden sm:flex text-[10px] text-slate-550 relative z-10 justify-between items-center font-mono pt-2">
          <span>&copy; 2026 AI Data Detective Inc.</span>
          <span className="text-indigo-400">Secure Cloud</span>
        </div>
      </div>

      {/* Right Column: Authentication Card Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-5 sm:p-8 md:p-12">
        <div className="w-full max-w-md space-y-5 sm:space-y-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className={`text-xs mt-1.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              {isLogin ? "Ready to solve your organization's data cases?" : "Sign up in 30 seconds to begin cognitive analytics."}
            </p>
          </div>

          {/* Form Message Prompts */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium tracking-wide block text-slate-300">Your Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className={`w-full text-xs pl-8 pr-3 py-2 rounded-md border outline-none font-mono transition-colors ${
                      darkMode 
                        ? "bg-slate-900/55 border-slate-800 focus:border-indigo-500 text-white" 
                        : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium tracking-wide block text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full text-xs pl-8 pr-3 py-2 rounded-md border outline-none font-mono transition-colors ${
                    darkMode 
                      ? "bg-slate-900/55 border-slate-800 focus:border-indigo-500 text-white" 
                      : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium tracking-wide text-slate-300">Password</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-455">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full text-xs pl-8 pr-8 py-2 rounded-md border outline-none font-mono transition-colors ${
                    darkMode 
                      ? "bg-slate-900/55 border-slate-800 focus:border-indigo-500 text-white" 
                      : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between py-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 bg-slate-950"
                  />
                  <span className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Remember my email</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>{isLogin ? "Authenticate Account" : "Register Credentials"}</span>
              )}
            </button>
          </form>

          {/* Social Sign-In */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-900"></div>
            <span className={`flex-shrink mx-3 text-[9px] font-mono uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Secure Integration
            </span>
            <div className="flex-grow border-t border-slate-900"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              darkMode 
                ? "bg-slate-900/55 border-slate-800 hover:bg-slate-800 text-white" 
                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800"
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.12-.34-.19-.7-.19-1.1s.07-.76.19-1.12z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Form Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setInfo(null);
              }}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
            >
              {isLogin ? "New to AI Data Detective? Register Here" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
