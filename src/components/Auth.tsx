import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Fingerprint, 
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccess(true);
        setTimeout(onSuccess, 1000);
      } else {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        const user = userCredential.user;

        // Update profile name
        await updateProfile(user, { displayName: formData.name });

        // Create user document in Firestore
        const userDoc = {
          uid: user.uid,
          name: formData.name,
          email: formData.email,
          role: 'user',
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'users', user.uid), userDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }

        setSuccess(true);
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Email does not exist. Please check your email or sign up for a new account.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-blue rounded-2xl shadow-glow-blue mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-2">ArmorClaw</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure Multi-Agent Trading Gateway</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue opacity-50" />
          
          <div className="flex p-1 bg-white/[0.03] rounded-2xl mb-8 border border-white/[0.05]">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                isLogin ? "bg-accent-blue text-white shadow-glow-blue" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                !isLogin ? "bg-accent-blue text-white shadow-glow-blue" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent-blue transition-colors" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/20 border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/5 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/20 border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/5 transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-bold text-accent-blue hover:text-accent-blue/80 transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent-blue transition-colors" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-black/20 border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/5 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
                  <p className="text-xs font-bold text-accent-red">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-2xl flex items-center gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-accent-green shrink-0" />
                  <p className="text-xs font-bold text-accent-green">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-glow-blue transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In to Vault" : "Create Secure Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-500 font-medium px-4">
            By continuing, you agree to ArmorClaw's <span className="text-slate-300 cursor-pointer hover:text-white underline underline-offset-4">Terms of Service</span> and <span className="text-slate-300 cursor-pointer hover:text-white underline underline-offset-4">Privacy Policy</span>.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-glow-green" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AES-256 Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent-blue rounded-full shadow-glow-blue" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ISO 27001 Compliant</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
