import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Briefcase, ArrowRight, Zap, Target, PieChart as PieChartIcon, 
  ShieldCheck, Code, Sparkles, ChevronRight, LayoutDashboard, 
  CreditCard, Users, CheckCircle2, TrendingUp, Layers, 
  Terminal, Rocket, Command, Activity, Cpu, Banknote
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth } from '../../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

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
    <div className="min-h-screen bg-[#020817] text-slate-200 font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-indigo-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-teal-900/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-none",
        isScrolled ? "bg-[#020817]/80 backdrop-blur-2xl border-b border-white/5 py-4" : "py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.3)] rotate-3 transition-transform hover:rotate-6">
               <Briefcase className="w-5 h-5 font-black" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white uppercase">Flow.</span>
          </div>
          
          <button 
            onClick={handleLogin}
            className="group hidden sm:flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
          >
            Access Console
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 md:pt-48 md:pb-32 px-6 md:px-12">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-widest border border-emerald-500/20 mb-8 backdrop-blur-sm"
             >
               <Sparkles className="w-3.5 h-3.5" />
               <span>v2.0 Operating System</span>
             </motion.div>
             
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter text-white leading-[0.95] mb-8"
             >
               ARCHITECT YOUR <br className="hidden md:block"/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 flex-col sm:flex-row to-teal-200">
                 INDEPENDENCE.
               </span>
             </motion.h1>
             
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-lg md:text-2xl text-slate-400 font-medium mb-12 leading-relaxed max-w-3xl"
             >
               A unified intelligence interface for elite professionals. Manage projects, track velocity, deploy invoices, and command your clientele from a single, deeply integrated platform.
             </motion.p>
             
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
             >
               <button 
                 onClick={handleLogin}
                 className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3 active:scale-95 group"
               >
                 Initialize Workspace
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
             </motion.div>
          </div>

          {/* Abstract Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ y: yParallax }}
            className="max-w-6xl mx-auto mt-24 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl -z-10" />
            <div className="rounded-[2.5rem] bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-4 md:p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center gap-3 px-2">
                 <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                 <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                 <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                 <div className="ml-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold hidden md:block">
                   flow-os / dashboard / active-workloads
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {/* Sidebar Mock */}
                 <div className="hidden md:flex flex-col gap-3 col-span-1">
                   <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
                   <div className="h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl" />
                   <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
                   <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
                 </div>
                 {/* Main Content Mock */}
                 <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
                   <div className="flex gap-4">
                      <div className="flex-1 h-32 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex p-6 items-end">
                        <div className="w-full h-1/2 bg-indigo-500/30 rounded-t-lg" />
                      </div>
                      <div className="flex-1 h-32 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex p-6 items-end">
                         <div className="w-full h-3/4 bg-emerald-500/30 rounded-t-lg" />
                      </div>
                      <div className="flex-1 h-32 bg-amber-500/10 rounded-2xl border border-amber-500/20 hidden lg:flex p-6 items-end">
                         <div className="w-full h-1/4 bg-amber-500/30 rounded-t-lg" />
                      </div>
                   </div>
                   <div className="h-64 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col p-6">
                      <div className="w-1/4 h-6 bg-white/10 rounded-full mb-6" />
                      <div className="flex-1 border-b border-white/5 flex items-end gap-2">
                        {[40, 60, 30, 80, 50, 90, 70, 45, 65, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Deep Dive: Bento Grid */}
        <section className="py-24 px-6 md:px-12 bg-white/5 border-y border-white/5 backdrop-blur-sm relative">
           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
           <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-20">
                 <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 uppercase">Unified Intelligence Architecture</h2>
                 <p className="text-xl text-slate-400 font-medium">Stop context-switching. Flow brings your projects, finances, and analytics into a single, high-performance tactical display.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Large Bento Box */}
                <div className="md:col-span-2 bg-[#0a0f1d] rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.1),transparent_50%)]" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Command Center Dashboard</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8 flex-1">
                      Instantly perceive the state of your business. Our central dashboard aggregates data across all active projects, visualizing task velocity, lifecycle distribution, and projected revenue through interactive, real-time telemetry.
                    </p>
                    <div className="pt-6 border-t border-white/10 flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Taxonomy</p>
                        <p className="text-xl font-bold text-white">Workload Analytics</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Velocity</p>
                        <p className="text-xl font-bold text-white">Progress Tracking</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical Box */}
                <div className="bg-[#0a0f1d] rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                      <Cpu className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">AI Heuristics</h3>
                    <p className="text-slate-400 font-medium leading-relaxed mb-8">
                       Continuous artificial intelligence actively monitors your workloads, predicting bottlenecks and analyzing burn rates before they become operational risks.
                    </p>
                    <div className="mt-auto h-32 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col gap-2 p-4 justify-center">
                       <div className="h-2 w-3/4 bg-indigo-500/50 rounded-full" />
                       <div className="h-2 w-1/2 bg-indigo-400/30 rounded-full" />
                       <div className="h-2 w-5/6 bg-indigo-600/60 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Horizontal Box */}
                <div className="bg-[#0a0f1d] rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent_50%)]" />
                   <div className="relative z-10">
                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                      <Banknote className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Automated Ledgers</h3>
                    <p className="text-slate-400 font-medium leading-relaxed mb-6 lg:w-2/3">
                      Generate pristine, professional invoices directly from project milestones. Track outstanding balances, mark payments, and distribute secure public links to clients instantly.
                    </p>
                   </div>
                </div>

                <div className="md:col-span-2 bg-[#0a0f1d] rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(20,184,166,0.1),transparent_50%)]" />
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="md:w-1/2">
                        <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mb-6">
                          <Layers className="w-6 h-6 text-teal-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Project Structuring</h3>
                        <p className="text-slate-400 font-medium leading-relaxed">
                          Break massive endeavors into manageable tasks. Assign budgets, structure hourly rates, and categorize via an intuitive drag-and-drop hierarchy designed for speed.
                        </p>
                      </div>
                      <div className="md:w-1/2 w-full flex flex-col gap-3">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full border-2 border-teal-500/50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-teal-400" /></div>
                            <div className="h-3 w-1/2 bg-white/20 rounded-full" />
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 opacity-70">
                            <div className="w-8 h-8 rounded-full border-2 border-white/20" />
                            <div className="h-3 w-2/3 bg-white/10 rounded-full" />
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 opacity-40">
                            <div className="w-8 h-8 rounded-full border-2 border-white/20" />
                            <div className="h-3 w-1/3 bg-white/10 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </section>

        {/* Technical Features List */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
             <div className="lg:w-1/3">
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-6">Engineered for Velocity</h2>
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                  We stripped away the bloat of traditional project management tools. What remains is a hyper-responsive, keyboard-friendly interface that respects your time.
                </p>
             </div>
             
             <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                  <Terminal className="w-8 h-8 text-emerald-400 mb-4" />
                  <h4 className="text-lg font-bold text-white uppercase mb-2">Impenetrable Security</h4>
                  <p className="text-sm text-slate-400">Strict Google Firebase authentication protocols. Your client data and financials are encrypted and isolated.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                  <Users className="w-8 h-8 text-indigo-400 mb-4" />
                  <h4 className="text-lg font-bold text-white uppercase mb-2">CRM Integration</h4>
                  <p className="text-sm text-slate-400">Maintain a roster of your clientele seamlessly linked to specific projects and billing ledgers.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                  <LayoutDashboard className="w-8 h-8 text-amber-400 mb-4" />
                  <h4 className="text-lg font-bold text-white uppercase mb-2">Dark Mode Native</h4>
                  <p className="text-sm text-slate-400">Built from the ground up to reduce eye strain during prolonged development or design sessions.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                  <Rocket className="w-8 h-8 text-teal-400 mb-4" />
                  <h4 className="text-lg font-bold text-white uppercase mb-2">Zero Latency</h4>
                  <p className="text-sm text-slate-400">State mutations are optimistic. Experience a fluid interface that reacts instantly to every command.</p>
                </div>
             </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-12 relative overflow-hidden">
           <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-900/40 to-[#0a0f1d] border border-emerald-500/20 rounded-[3rem] p-12 md:p-24 text-center relative">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
             <div className="absolute w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
             
             <div className="relative z-10 flex flex-col items-center">
               <Command className="w-16 h-16 text-emerald-400 mb-8" />
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-6">
                 Take Control.
               </h2>
               <p className="text-xl text-emerald-100/60 font-medium max-w-2xl mx-auto mb-12">
                 Join the elite cadre of independent operators running their business on the ultimate operational framework.
               </p>
               
               <button 
                 onClick={handleLogin}
                 className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:shadow-[0_0_80px_rgba(16,185,129,0.6)] hover:-translate-y-1 active:translate-y-0"
               >
                 Launch Flow OS
               </button>
             </div>
           </div>
        </section>
      </main>
      
      <footer className="border-t border-white/5 py-12 relative z-10 bg-[#020817]">
         <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
                <Briefcase className="w-4 h-4 font-black" />
              </div>
              <span className="font-black text-white tracking-tight uppercase text-xl">Flow.</span>
            </div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              © {new Date().getFullYear()} Flow Runtime. All Systems Go.
            </div>
         </div>
      </footer>
    </div>
  );
}

