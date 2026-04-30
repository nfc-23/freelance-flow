import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Briefcase, 
  ArrowUpRight, 
  Zap,
  Activity,
  Database,
  Layers,
  ArrowRight,
  Target,
  Sparkles,
  HelpCircle,
  Cpu,
  Clock,
  ListTodo,
  TrendingUp,
  LayoutDashboard,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { firestoreService } from '../../services/firestoreService';
import { generateProjectInsights, type ProjectInsight } from '../../services/aiService';
import { auth } from '../../services/firebase';

// --- Default Data Fallbacks ---
const defaultEarningsData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 700 },
];

const defaultProjectDistribution = [
  { name: 'Design', value: 40, color: '#10b981' },
  { name: 'Dev', value: 35, color: '#6366f1' },
  { name: 'Ads', value: 15, color: '#f59e0b' },
  { name: 'Ops', value: 10, color: '#8b5cf6' },
];

const taskVelocityData = [
  { name: 'Week 1', completed: 12, added: 15 },
  { name: 'Week 2', completed: 18, added: 12 },
  { name: 'Week 3', completed: 25, added: 20 },
  { name: 'Week 4', completed: 32, added: 25 },
  { name: 'Week 5', completed: 40, added: 30 },
];

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<ProjectInsight[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await firestoreService.getDashboardStats();
    setStats(data);
    setLoading(false);
    
    if (data?.allProjects?.length > 0) {
      runAiAnalysis(data.allProjects);
    }
  };

  const runAiAnalysis = async (projects: any[]) => {
    setIsAiLoading(true);
    try {
      const insights = await generateProjectInsights(projects);
      setAiInsights(insights);
    } catch (e) {
      console.error("AI Analysis failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    await firestoreService.seedDemoData();
    loadStats();
  };

  // --- Processed Chart Data ---
  const dynamicEarningsData = stats?.earningsData?.length > 0 
    ? stats.earningsData 
    : defaultEarningsData;
    
  const dynamicProjectDistribution = stats?.projectDistribution?.length > 0
    ? stats.projectDistribution
    : defaultProjectDistribution;

  const lifecycleData = stats?.statusDistribution ? [
    { name: 'Planned', value: stats.statusDistribution.planned, color: '#8b5cf6' },
    { name: 'Started', value: stats.statusDistribution.started, color: '#3b82f6' },
    { name: 'Paused', value: stats.statusDistribution.paused, color: '#f59e0b' },
    { name: 'Untouched', value: stats.statusDistribution.untouched, color: '#94a3b8' },
    { name: 'Finished', value: stats.statusDistribution.finished, color: '#10b981' },
    { name: 'Left', value: stats.statusDistribution.left, color: '#f43f5e' },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 border-t-emerald-500 rounded-full"
      />
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <LayoutDashboard className="w-3.5 h-3.5" /> Project Command Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Overview
          </h1>
          <p className="text-slate-500 font-medium">Welcome back, {user?.displayName?.split(' ')[0] || 'Commander'}. Here's your project landscape.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button onClick={seedData} className="w-full md:w-auto bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-sm border border-slate-200 dark:border-dark-border flex items-center justify-center gap-2 active:scale-95">
            <Database className="w-4 h-4" /> Resync Data
          </button>
        </div>
      </motion.div>

      {/* Primary KPI Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <KpiCard 
           title="Active Projects" 
           value={stats?.activeProjects?.length || 0} 
           icon={<Briefcase />} 
           trend="+12% this month"
           color="indigo"
         />
         <KpiCard 
           title="Tasks Completion" 
           value={`${stats?.statusDistribution?.finished || 0}`}
           subtitle={`/ ${(stats?.statusDistribution?.started || 0) + (stats?.statusDistribution?.planned || 0) + (stats?.statusDistribution?.finished || 0)} Total`}
           icon={<CheckCircle2 />} 
           trend="High Velocity"
           color="emerald"
         />
         <KpiCard 
           title="Overdue Tasks" 
           value={stats?.statusDistribution?.paused || 0} 
           icon={<Clock />} 
           trend="Requires Attention"
           color="rose"
         />
         <KpiCard 
           title="Est. Revenue" 
           value={formatCurrency((stats?.profit || 0) + (stats?.pendingPayments || 0))} 
           icon={<Wallet />} 
           trend="+8% from last quarter"
           color="amber"
         />
      </motion.div>

      {/* AI Intelligence Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-slate-900/20 border border-slate-800 p-8 sm:p-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="lg:w-1/3">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">AI Project Analysis</h3>
                   <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Real-time heuristics</p>
                </div>
             </div>
             <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">Our AI constantly evaluates your project load, identifying bottlenecks, burn rates, and optimization opportunities.</p>
             <button 
                onClick={() => stats?.allProjects && runAiAnalysis(stats.allProjects)}
                disabled={isAiLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isAiLoading ? "Analyzing..." : "Refresh Insights"}
                <Zap className={cn("w-4 h-4", isAiLoading && "animate-spin")} />
              </button>
          </div>
          
          <div className="lg:w-2/3 w-full">
            {isAiLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl border border-white/10" />)}
               </div>
            ) : aiInsights.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiInsights.slice(0, 4).map((insight, idx) => (
                    <motion.div 
                      key={insight.projectId}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 truncate pr-2">{insight.projectName}</span>
                         <span className={cn("w-2 h-2 rounded-full shrink-0", 
                           insight.status === 'optimal' ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : 
                           insight.status === 'warning' ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]" : 
                           "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                         )} />
                      </div>
                      <p className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug mb-4">{insight.summary}</p>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                         <div className={cn("h-full", insight.status === 'optimal' ? "bg-emerald-500" : insight.status === 'warning' ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${insight.burnRate * 100}%` }} />
                      </div>
                    </motion.div>
                  ))}
               </div>
            ) : (
               <div className="p-8 text-center border border-dashed border-white/20 rounded-[2rem] bg-white/5">
                 <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                 <p className="text-slate-400 font-medium whitespace-pre-wrap">Wait until projects are synced</p>
               </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Project Lifecycle Distribution */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white dark:bg-dark-card rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-dark-border shadow-sm">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Lifecycle Pipeline</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status distribution of all workloads</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl hidden sm:block">
                 <Target className="w-6 h-6" />
              </div>
           </div>
           
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={lifecycleData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                 <Tooltip 
                   cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                   contentStyle={{ borderRadius: '1.5rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '12px 20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                   itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}
                   labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}
                 />
                 <Bar dataKey="value" radius={[12, 12, 12, 12]} maxBarSize={60}>
                   {lifecycleData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-dark-border shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Taxonomy</h3>
              <Layers className="w-5 h-5 text-slate-400 hidden sm:block" />
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Workload Allocation</p>

           <div className="h-[220px] w-full relative flex-1 flex flex-col justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={dynamicProjectDistribution}
                   innerRadius={65}
                   outerRadius={85}
                   paddingAngle={8}
                   dataKey="value"
                   stroke="none"
                   cornerRadius={8}
                 >
                   {dynamicProjectDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ borderRadius: '1rem', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                   itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
               <span className="text-4xl font-black text-slate-900 dark:text-white">{stats?.allProjects?.length || 0}</span>
               <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Total</span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-6">
             {dynamicProjectDistribution.map(item => (
               <div key={item.name} className="flex items-center gap-3 bg-slate-50 dark:bg-dark-bg/50 p-3 rounded-xl border border-slate-100 dark:border-dark-border">
                 <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                 <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest truncate">{item.name}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                 </div>
               </div>
             ))}
           </div>
        </motion.div>

        {/* Task Velocity (Composed Chart) */}
        <motion.div variants={itemVariants} className="xl:col-span-3 bg-white dark:bg-dark-card rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-dark-border shadow-sm">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Task Velocity</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Creation vs Completion trajectory</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-dark-bg p-1.5 rounded-2xl border border-slate-100 dark:border-dark-border w-full sm:w-auto">
                 <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-100 dark:border-dark-border">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest">Completed</span>
                 </div>
                 <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Added</span>
                 </div>
              </div>
           </div>

           <div className="h-[300px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={taskVelocityData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '16px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}
                    />
                    <Bar dataKey="added" fill="#818cf8" radius={[8, 8, 8, 8]} maxBarSize={30} name="Tasks Added" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 4 }} name="Tasks Completed" />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Live Workloads List */}
        <motion.div variants={itemVariants} className="xl:col-span-3">
           <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                 <Activity className="w-6 h-6 text-emerald-500" />
                 Active Workloads
              </h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats?.activeProjects?.length > 0 ? (
                 stats.activeProjects.slice(0, 3).map((p: any) => (
                   <ProjectWorkloadCard key={p.id} project={p} />
                 ))
              ) : (
                 <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-dark-border rounded-[2.5rem] bg-slate-50 dark:bg-dark-bg/20">
                    <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-black uppercase text-slate-500 mb-1">No Active Workloads</h4>
                    <p className="text-sm font-medium text-slate-400">Your pipeline is currently empty. Create a project to start tracking.</p>
                 </div>
              )}
           </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

// --- Sub Components ---

function KpiCard({ title, value, subtitle, icon, trend, color }: any) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-[2rem] p-6 border border-slate-200 dark:border-dark-border shadow-sm flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 cursor-default">
      <div className="flex justify-between items-start mb-6 relative z-10">
         <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-500", styles[color])}>
           {icon}
         </div>
         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-dark-bg px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border">
            {trend}
         </span>
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-end">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
         <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-3xl sm:text-4xl font-mono font-black tracking-tighter text-slate-900 dark:text-white">{value}</h4>
            {subtitle && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{subtitle}</span>}
         </div>
      </div>
      <div className={cn("absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:scale-150 transition-transform duration-700 pointer-events-none", styles[color]?.split(' ')[0])} />
    </div>
  );
}

function ProjectWorkloadCard({ project }: any) {
  const progress = Math.floor(Math.random() * 60) + 20; // Simulated progress
  
  return (
    <div className="bg-white dark:bg-dark-card rounded-[2rem] p-6 lg:p-8 border border-slate-200 dark:border-dark-border shadow-sm group hover:shadow-xl hover:border-emerald-500/30 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-6">
         <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform border border-emerald-100 dark:border-emerald-500/20">
           <Layers className="w-6 h-6" />
         </div>
         <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
            {project.status}
         </span>
      </div>
      
      <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate mb-1.5 group-hover:text-emerald-600 transition-colors">{project.title}</h4>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-8 flex items-center gap-1.5">
         <Target className="w-3 h-3" /> Budget: {formatCurrency(project.budget || 0)}
      </p>
      
      <div className="space-y-3">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">Milestone Phase</span>
            <span className="text-emerald-600 dark:text-emerald-400">{progress}%</span>
         </div>
         <div className="h-2.5 w-full bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-dark-border">
            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" style={{ width: `${progress}%` }} />
         </div>
      </div>
    </div>
  );
}
