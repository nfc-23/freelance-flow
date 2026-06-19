import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, ArrowRight, Activity, Cpu, Banknote, Layers, Terminal, Users, LayoutDashboard, Rocket, Command, CheckCircle2 } from 'lucide-react';
import { auth } from '../../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-txt-primary font-sans selection:bg-primary/20 selection:text-primary">
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-surface/80 backdrop-blur-md border-b border-ui-border py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-ui-border flex items-center justify-center text-primary bg-surface shadow-sm rotate-3">
               <Layers className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-xl text-txt-primary">Freelance Flow.</span>
          </div>
          
          <button onClick={handleLogin} className="btn-primary btn-md gap-2 hidden sm:flex">
            Access Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="relative pt-32 lg:pt-48 pb-24">
        {/* Decorative subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(99, 102, 241, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center bg-surface border border-ui-border rounded-full px-4 py-1.5 mb-8 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-secondary mr-2" />
             <span className="text-[13px] font-medium text-txt-secondary">DESIGN.md Ready</span>
           </motion.div>
           
           <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-display text-txt-primary leading-[1.05] mb-6">
             Architect your <span className="text-primary">independence.</span>
           </motion.h1>
           
           <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-txt-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
             An editorial precision interface for elite professionals. Manage projects, track velocity, deploy invoices, and command your clientele.
           </motion.p>
           
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button onClick={handleLogin} className="btn-primary btn-lg w-full sm:w-auto px-8 gap-2">
               Initialize Workspace
               <ArrowRight className="w-4 h-4" />
             </button>
             <button onClick={handleLogin} className="btn-secondary btn-lg w-full sm:w-auto px-8">
               View Live Demo
             </button>
           </motion.div>
        </div>

        {/* Abstract Component Showcase */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="max-w-6xl mx-auto mt-24 px-6 relative z-10">
          <div className="genesis-card p-6 md:p-10 flex flex-col gap-8 shadow-xl shadow-black/5 bg-white/50 backdrop-blur-3xl border-white/50 ring-1 ring-black/5">
             <div className="flex items-center gap-3 border-b border-ui-border pb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1" />
                <div className="bg-surface border border-ui-border px-3 py-1 rounded-md text-xs font-mono text-txt-secondary">
                  ~/workspace/flow
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="hidden md:flex flex-col gap-3 col-span-1">
                  <div className="h-10 bg-surface border border-ui-border rounded-md" />
                  <div className="h-10 bg-primary/10 border-l-2 border-primary text-primary font-medium px-4 flex items-center rounded-r-md">Dashboard</div>
                  <div className="h-10 bg-surface border border-ui-border rounded-md" />
                </div>
                
                <div className="col-span-1 md:col-span-3 flex flex-col gap-6">
                  <div className="grid grid-cols-3 gap-6">
                     <div className="genesis-card p-5 border border-ui-border bg-surface h-32 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-primary/10 border-t border-primary/20" />
                       <span className="relative z-10 font-bold text-lg">Velocity</span>
                     </div>
                     <div className="genesis-card p-5 border border-ui-border bg-surface h-32 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute inset-x-0 bottom-0 h-3/4 bg-blue-500/10 border-t border-blue-500/20" />
                       <span className="relative z-10 font-bold text-lg">Revenue</span>
                     </div>
                     <div className="genesis-card p-5 border border-ui-border bg-surface h-32 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute inset-x-0 bottom-0 h-1/4 bg-amber-500/10 border-t border-amber-500/20" />
                       <span className="relative z-10 font-bold text-lg">Tasks</span>
                     </div>
                  </div>
                  <div className="genesis-card p-6 h-64 border border-ui-border bg-surface flex flex-col">
                     <div className="w-1/4 h-5 bg-gray-100 rounded mb-8" />
                     <div className="flex-1 flex items-end gap-3 px-2 border-b border-ui-border">
                       {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                         <div key={i} className={`flex-1 rounded-t-sm ${i === 3 ? 'bg-primary' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
                       ))}
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </main>

      <section className="py-24 bg-surface border-y border-ui-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-display text-txt-primary mb-4">Unified Intelligence Architecture</h2>
            <p className="text-txt-secondary text-lg">Stop context-switching. Freelance Flow brings your projects, finances, and analytics into a single, high-performance display.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="genesis-card p-8 md:col-span-2">
              <Activity className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-display mb-3">Command Center</h3>
              <p className="text-txt-secondary mb-6">Instantly perceive the state of your business. Our dashboard aggregates data across all active projects.</p>
              <div className="flex gap-4 border-t border-ui-border pt-6">
                <div>
                  <p className="text-xs text-neutral uppercase tracking-wider mb-1">Analytics</p>
                  <p className="font-medium text-txt-primary">Workload Distribution</p>
                </div>
                <div>
                  <p className="text-xs text-neutral uppercase tracking-wider mb-1">Tracking</p>
                  <p className="font-medium text-txt-primary">Task Velocity</p>
                </div>
              </div>
            </div>

            <div className="genesis-card p-8">
              <Cpu className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-display mb-3">AI Heuristics</h3>
              <p className="text-txt-secondary mb-8">Continuous artificial intelligence monitors your workloads and predicts bottlenecks before they become risks.</p>
              <div className="mt-auto flex flex-col gap-3">
                <div className="h-2 w-full bg-gray-100 rounded-full"><div className="h-full bg-primary rounded-full w-2/3" /></div>
                <div className="h-2 w-full bg-gray-100 rounded-full"><div className="h-full bg-primary/60 rounded-full w-1/2" /></div>
              </div>
            </div>

            <div className="genesis-card p-8">
              <Banknote className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-display mb-3">Automated Ledgers</h3>
              <p className="text-txt-secondary">Generate pristine invoices directly from milestones. Track balances and distribute secure links instantly.</p>
            </div>

            <div className="genesis-card p-8 md:col-span-2 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <Layers className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-2xl font-display mb-3">Project Structuring</h3>
                <p className="text-txt-secondary">Break massive endeavors into manageable tasks. Assign budgets, structure hourly rates, and categorize via an intuitive hierarchy.</p>
              </div>
              <div className="flex-1 w-full space-y-3">
                <div className="border border-ui-border rounded-md p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div className="h-2 bg-gray-200 rounded w-1/2"/>
                </div>
                <div className="border border-ui-border rounded-md p-3 flex items-center gap-3 opacity-60">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"/>
                  <div className="h-2 bg-gray-200 rounded w-2/3"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-5xl mx-auto px-6 text-center">
        <Command className="w-12 h-12 text-primary mx-auto mb-6" />
        <h2 className="text-4xl font-display text-txt-primary mb-6">Take Control.</h2>
        <p className="text-xl text-txt-secondary max-w-2xl mx-auto mb-10">Join the elite cadre of independent operators running their business on the ultimate operational framework.</p>
        <button onClick={handleLogin} className="btn-primary btn-lg px-10">Launch Freelance Flow Workspace</button>
      </section>

      <footer className="border-t border-ui-border py-12 bg-bg mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-display font-medium text-txt-primary text-lg">Freelance Flow.</span>
          </div>
          <p className="text-txt-secondary text-sm">© {new Date().getFullYear()} Freelance Flow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

