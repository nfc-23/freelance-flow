import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, Clock, CircleDot, MessageSquare, Send, Globe } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { cn } from '../../lib/utils';

export function ClientPortalView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, [projectId]);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getProjectForPortal(projectId);
      if (data) {
        setProject(data);
      } else {
        setError('Project not found');
      }
    } catch(err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !commentName) return;

    try {
      setSendingMessage(true);
      const success = await firestoreService.addPortalComment(projectId, commentText, commentName);
      if (success) {
        setCommentText('');
        // Optimistically update
        setProject({
          ...project,
          comments: [
            ...project.comments,
            { text: commentText, username: commentName, createdAt: new Date() }
          ]
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Globe className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error || 'Project not available'}</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">This portal link may have expired or the project is unavailable.</p>
      </div>
    );
  }

  const completedTasks = project.tasks.filter((t: any) => t.completed);
  const pendingTasks = project.tasks.filter((t: any) => !t.completed);
  const progressPercent = project.tasks.length > 0 
    ? Math.round((completedTasks.length / project.tasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-bg py-8 px-4 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200 dark:border-dark-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                 </div>
                 <span className={cn(
                    "text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest",
                    project.status === 'finished' ? "bg-emerald-500/10 text-emerald-600" : 
                    project.status === 'started' ? "bg-brand-500/10 text-brand-500" : 
                    project.status === 'paused' ? "bg-amber-500/10 text-amber-500" : 
                    project.status === 'planned' ? "bg-indigo-500/10 text-indigo-500" : 
                    project.status === 'left' ? "bg-rose-500/10 text-rose-500" : 
                    "bg-slate-100 text-slate-600 dark:bg-dark-bg dark:text-slate-300"
                  )}>
                    {project.status || 'Active'}
                 </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{project.title}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Client Portal Outline</p>
            </div>

            <div className="bg-slate-50 dark:bg-dark-bg/50 p-6 rounded-3xl border border-slate-100 dark:border-dark-border flex flex-col items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Progress</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-600 dark:text-brand-500">{progressPercent}</span>
                <span className="text-xl font-bold text-brand-500/50">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Section */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-dark-border">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Task Breakdown</h2>
               
               <div className="space-y-6">
                 <div>
                   <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed ({completedTasks.length})
                   </h3>
                   {completedTasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-600 italic">No tasks completed yet.</p>}
                   <div className="space-y-2">
                     {completedTasks.map((t: any) => (
                       <div key={t.id} className="p-4 bg-slate-50 dark:bg-dark-bg/50 border border-slate-100 dark:border-dark-border rounded-xl flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                         <span className="font-semibold text-slate-700 dark:text-slate-300 line-through opacity-80">{t.title}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                  <div className="pt-4">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CircleDot className="w-4 h-4 text-brand-500" /> Upcoming ({pendingTasks.length})
                    </h3>
                    {pendingTasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-600 italic">No pending tasks.</p>}
                    <div className="space-y-2">
                      {pendingTasks.map((t: any) => (
                        <div key={t.id} className="p-4 bg-white dark:bg-dark-bg/30 border border-slate-200 dark:border-dark-border rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Comments Section */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-dark-border flex flex-col h-[500px]">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-brand-500" /> Discussion
               </h2>
               
               <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                 {(!project.comments || project.comments.length === 0) ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                     <p className="text-sm">No comments yet.</p>
                   </div>
                 ) : (
                   project.comments.sort((a: any, b: any) => {
                     const t1 = a.createdAt?.seconds || 0;
                     const t2 = b.createdAt?.seconds || 0;
                     return t1 - t2;
                   }).map((c: any, idx: number) => (
                     <div key={idx} className="bg-slate-50 dark:bg-dark-bg p-4 rounded-2xl relative">
                       <p className="text-[10px] font-bold text-slate-400 mb-1">{c.username}</p>
                       <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.text}</p>
                     </div>
                   ))
                 )}
               </div>

               <form onSubmit={handlePostComment} className="pt-4 border-t border-slate-100 dark:border-dark-border shrink-0 space-y-3">
                 <input
                   type="text"
                   value={commentName}
                   onChange={e => setCommentName(e.target.value)}
                   placeholder="Your Name"
                   required
                   className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                 />
                 <div className="relative">
                   <input
                     type="text"
                     value={commentText}
                     onChange={e => setCommentText(e.target.value)}
                     placeholder="Type a message..."
                     required
                     className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                   />
                   <button 
                     type="submit"
                     disabled={sendingMessage}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
                   >
                     <Send className="w-4 h-4" />
                   </button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
