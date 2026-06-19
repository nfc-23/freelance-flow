import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Briefcase, Zap, Activity, Database, Layers, Target, 
  Sparkles, Cpu, Clock, ListTodo, Wallet, LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Line, ComposedChart } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { firestoreService } from '../../services/firestoreService';
import { generateProjectInsights, type ProjectInsight } from '../../services/aiService';
import { auth } from '../../services/firebase';

const defaultEarningsData = [
  { name: 'Mon', value: 400 }, { name: 'Tue', value: 300 }, { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 }, { name: 'Fri', value: 500 }, { name: 'Sat', value: 900 }, { name: 'Sun', value: 700 },
];
const defaultProjectDistribution = [
  { name: 'Design', value: 40, color: '#10b981' }, { name: 'Dev', value: 35, color: '#6366f1' },
  { name: 'Ads', value: 15, color: '#f59e0b' }, { name: 'Ops', value: 10, color: '#8b5cf6' },
];
const taskVelocityData = [
  { name: 'Week 1', completed: 12, added: 15 }, { name: 'Week 2', completed: 18, added: 12 },
  { name: 'Week 3', completed: 25, added: 20 }, { name: 'Week 4', completed: 32, added: 25 }, { name: 'Week 5', completed: 40, added: 30 },
];

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<ProjectInsight[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await firestoreService.getDashboardStats();
    setStats(data);
    setLoading(false);
    if (data?.allProjects?.length > 0) runAiAnalysis(data.allProjects);
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

  const dynamicProjectDistribution = stats?.projectDistribution?.length > 0 ? stats.projectDistribution : defaultProjectDistribution;
  const lifecycleData = stats?.statusDistribution ? [
    { name: 'Planned', value: stats.statusDistribution.planned, color: '#8b5cf6' },
    { name: 'Started', value: stats.statusDistribution.started, color: '#3b82f6' },
    { name: 'Paused', value: stats.statusDistribution.paused, color: '#f59e0b' },
    { name: 'Finished', value: stats.statusDistribution.finished, color: '#10b981' },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full" />
    </div>
  );

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-display text-txt-primary">Project Command Center</h1>
          <p className="text-txt-secondary text-[15px]">Welcome back, {user?.displayName?.split(' ')[0] || 'Commander'}. Here is your project landscape.</p>
        </div>
        <button onClick={seedData} className="btn-secondary btn-md gap-2">
          <Database className="w-4 h-4" /> Resync Data
        </button>
      </motion.div>

      {/* Primary KPI Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <KpiCard title="Active Projects" value={stats?.activeProjects?.length || 0} icon={<Briefcase />} color="indigo" />
         <KpiCard title="Tasks Completion" value={`${stats?.statusDistribution?.finished || 0} / ${(stats?.statusDistribution?.started || 0) + (stats?.statusDistribution?.planned || 0) + (stats?.statusDistribution?.finished || 0)}`} icon={<CheckCircle2 />} color="emerald" />
         <KpiCard title="Overdue Tasks" value={stats?.statusDistribution?.paused || 0} icon={<Clock />} color="rose" />
         <KpiCard title="Est. Revenue" value={formatCurrency((stats?.profit || 0) + (stats?.pendingPayments || 0))} icon={<Wallet />} color="amber" />
      </motion.div>

      {/* AI Intelligence Section */}
      <motion.div variants={itemVariants} className="genesis-card bg-txt-primary text-white p-8 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_right,#6366f1,transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="lg:w-1/3">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-xl font-display">AI Project Analysis</h3>
                </div>
             </div>
             <p className="text-gray-400 text-sm mb-6 leading-relaxed">Our AI continuously evaluates your project load, identifying bottlenecks and optimization opportunities before they become risks.</p>
             <button onClick={() => stats?.allProjects && runAiAnalysis(stats.allProjects)} disabled={isAiLoading} className="btn-primary btn-md gap-2 w-full sm:w-auto disabled:opacity-50">
                {isAiLoading ? "Analyzing..." : "Refresh Insights"}
                <Zap className={cn("w-4 h-4", isAiLoading && "animate-spin")} />
             </button>
          </div>
          
          <div className="lg:w-2/3 w-full">
            {isAiLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-lg border border-white/10" />)}
               </div>
            ) : aiInsights.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiInsights.slice(0, 4).map((insight, idx) => (
                    <motion.div key={insight.projectId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[12px] font-mono font-medium text-gray-300 truncate pr-2">{insight.projectName}</span>
                         <span className={cn("w-2 h-2 rounded-full shrink-0", insight.status === 'optimal' ? "bg-success" : insight.status === 'warning' ? "bg-warning" : "bg-error")} />
                      </div>
                      <p className="text-[13px] text-gray-100 line-clamp-2 leading-relaxed mb-4">{insight.summary}</p>
                      <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                         <div className={cn("h-full", insight.status === 'optimal' ? "bg-success" : insight.status === 'warning' ? "bg-warning" : "bg-error")} style={{ width: `${insight.burnRate * 100}%` }} />
                      </div>
                    </motion.div>
                  ))}
               </div>
            ) : (
               <div className="p-8 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
                 <Sparkles className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                 <p className="text-gray-400 text-sm">Waiting for project sync...</p>
               </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <motion.div variants={itemVariants} className="xl:col-span-2 genesis-card p-6 flex flex-col">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h3 className="text-xl font-display mb-1">Lifecycle Pipeline</h3>
                 <p className="text-txt-secondary text-sm">Status distribution of all workloads</p>
              </div>
           </div>
           <div className="flex-1 min-h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={lifecycleData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8EC" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                 <Tooltip cursor={{ fill: '#FAFAFA' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E8E8EC', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                   {lifecycleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="genesis-card p-6 flex flex-col">
           <div className="mb-6">
              <h3 className="text-xl font-display mb-1">Taxonomy</h3>
              <p className="text-txt-secondary text-sm">Workload Allocation</p>
           </div>
           <div className="flex-1 min-h-[180px] w-full relative flex flex-col justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={dynamicProjectDistribution} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                   {dynamicProjectDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E8E8EC', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
               <span className="text-2xl font-display">{stats?.allProjects?.length || 0}</span>
               <span className="text-xs text-txt-secondary">Total</span>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-2 mt-6">
             {dynamicProjectDistribution.map(item => (
               <div key={item.name} className="flex items-center gap-2 bg-bg px-3 py-2 rounded-md border border-ui-border">
                 <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                 <div className="min-w-0">
                    <p className="text-[11px] text-txt-secondary truncate">{item.name}</p>
                    <p className="text-[13px] font-medium text-txt-primary">{item.value}</p>
                 </div>
               </div>
             ))}
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-3 genesis-card p-6 flex flex-col">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                 <h3 className="text-xl font-display mb-1">Task Velocity</h3>
                 <p className="text-txt-secondary text-sm">Creation vs Completion trajectory</p>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={taskVelocityData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8EC" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                    <Tooltip cursor={{ fill: '#FAFAFA' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E8E8EC', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="added" fill="#E8E8EC" radius={[4, 4, 0, 0]} maxBarSize={30} name="Tasks Added" />
                    <Line type="monotone" dataKey="completed" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Tasks Completed" />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-3">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display flex items-center gap-2">
                 Active Workloads
              </h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats?.activeProjects?.length > 0 ? (
                 stats.activeProjects.slice(0, 3).map((p: any) => (
                   <ProjectWorkloadCard key={p.id} project={p} />
                 ))
              ) : (
                 <div className="col-span-full py-16 text-center border border-dashed border-ui-border rounded-xl bg-bg">
                    <ListTodo className="w-8 h-8 text-neutral mx-auto mb-3" />
                    <p className="text-sm text-txt-secondary">Your pipeline is empty.</p>
                 </div>
              )}
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function KpiCard({ title, value, icon, color }: any) {
  const iconColors: Record<string, string> = {
    emerald: "text-success bg-success/10",
    indigo: "text-primary bg-primary/10",
    rose: "text-error bg-error/10",
    amber: "text-warning bg-warning/10",
  };

  return (
    <div className="genesis-card p-6 flex flex-col cursor-default">
      <div className="flex justify-between items-start mb-4">
         <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", iconColors[color])}>
           {icon}
         </div>
      </div>
      <div>
         <p className="text-sm text-txt-secondary mb-1">{title}</p>
         <h4 className="text-3xl font-display">{value}</h4>
      </div>
    </div>
  );
}

function ProjectWorkloadCard({ project }: any) {
  const progress = Math.floor(Math.random() * 60) + 20; // Simulated
  
  return (
    <div className="genesis-card p-5 cursor-pointer">
      <div className="flex items-center justify-between mb-4">
         <div className="p-2 bg-bg border border-ui-border rounded-md text-txt-secondary">
           <Layers className="w-4 h-4" />
         </div>
         <span className="chip-default bg-primary/10 text-primary uppercase font-medium">
            {project.status}
         </span>
      </div>
      
      <h4 className="text-lg font-medium text-txt-primary truncate mb-1">{project.title}</h4>
      <p className="text-sm text-txt-secondary mb-6 flex items-center gap-1.5">
         Budget: {formatCurrency(project.budget || 0)}
      </p>
      
      <div className="space-y-2">
         <div className="flex justify-between items-center text-xs text-txt-secondary">
            <span>Phase Progress</span>
            <span className="font-medium text-txt-primary">{progress}%</span>
         </div>
         <div className="h-2 w-full bg-bg rounded-full overflow-hidden border border-ui-border">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
         </div>
      </div>
    </div>
  );
}
