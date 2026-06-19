import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, CircleDot, MessageSquare, Send, Globe } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { cn } from '../../lib/utils';

export function ClientPortalView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => { loadPortalData(); }, [projectId]);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getProjectForPortal(projectId);
      if (data) setProject(data);
      else setError('Project not found');
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
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-ui-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mb-6">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-display text-txt-primary mb-2">{error || 'Project not available'}</h2>
        <p className="text-txt-secondary text-sm max-w-sm">This portal link may have expired or the project is unavailable.</p>
      </div>
    );
  }

  const completedTasks = project.tasks.filter((t: any) => t.completed);
  const pendingTasks = project.tasks.filter((t: any) => !t.completed);
  const progressPercent = project.tasks.length > 0 
    ? Math.round((completedTasks.length / project.tasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-bg py-12 px-4 font-sans text-txt-primary">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="genesis-card bg-txt-primary text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
            <div className="w-64 h-64 bg-primary rounded-full" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                 </div>
                 <span className={cn(
                    "chip-default border-0 uppercase font-bold",
                    project.status === 'finished' ? "bg-success/20 text-success" : 
                    project.status === 'started' ? "bg-primary/20 text-primary-200" : 
                    project.status === 'paused' ? "bg-warning/20 text-warning" : 
                    project.status === 'planned' ? "bg-indigo-500/20 text-indigo-300" : 
                    "bg-white/10 text-white"
                  )}>
                    {project.status || 'Active'}
                 </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-display text-white mb-2">{project.title}</h1>
              <p className="text-gray-400 font-medium">Public Status View</p>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center min-w-[160px] shrink-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Total Progress</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display text-white">{progressPercent}</span>
                <span className="text-xl font-bold text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Section */}
            <div className="genesis-card p-8">
               <h2 className="text-xl font-display text-txt-primary mb-6">Task Breakdown</h2>
               
               <div className="space-y-8">
                 <div>
                   <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-success" /> Completed ({completedTasks.length})
                   </h3>
                   {completedTasks.length === 0 && <p className="text-sm text-txt-secondary italic">No tasks completed yet.</p>}
                   <div className="space-y-2">
                     {completedTasks.map((t: any) => (
                       <div key={t.id} className="p-4 bg-surface border border-ui-border rounded-lg flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-success shrink-0 opacity-50" />
                         <span className="font-medium text-txt-secondary line-through">{t.title}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                  <div>
                    <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CircleDot className="w-4 h-4 text-primary" /> Upcoming ({pendingTasks.length})
                    </h3>
                    {pendingTasks.length === 0 && <p className="text-sm text-txt-secondary italic">No pending tasks.</p>}
                    <div className="space-y-2">
                      {pendingTasks.map((t: any) => (
                        <div key={t.id} className="p-4 bg-surface border border-ui-border rounded-lg flex items-center gap-3 shadow-sm">
                          <div className="w-4 h-4 rounded-full border-2 border-txt-secondary/30 shrink-0" />
                          <span className="font-medium text-txt-primary">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Comments Section */}
            <div className="genesis-card p-6 sm:p-8 flex flex-col h-[600px]">
               <h2 className="text-xl font-display text-txt-primary mb-6 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-primary" /> Discussion
               </h2>
               
               <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                 {(!project.comments || project.comments.length === 0) ? (
                   <div className="h-full flex flex-col items-center justify-center text-txt-secondary">
                     <MessageSquare className="w-8 h-8 mb-4 opacity-20" />
                     <p className="text-sm font-medium">No comments yet.</p>
                   </div>
                 ) : (
                   project.comments.sort((a: any, b: any) => {
                     const t1 = a.createdAt?.seconds || 0;
                     const t2 = b.createdAt?.seconds || 0;
                     return t1 - t2;
                   }).map((c: any, idx: number) => (
                     <div key={idx} className="bg-surface border border-ui-border p-4 rounded-xl relative">
                       <p className="text-xs font-bold text-txt-secondary mb-1">{c.username}</p>
                       <p className="text-sm font-medium text-txt-primary leading-relaxed">{c.text}</p>
                     </div>
                   ))
                 )}
               </div>

               <form onSubmit={handlePostComment} className="pt-4 border-t border-ui-border shrink-0 space-y-3">
                 <input
                   type="text" value={commentName} onChange={e => setCommentName(e.target.value)}
                   placeholder="Your Name" required
                   className="input-default"
                 />
                 <div className="relative">
                   <input
                     type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                     placeholder="Type a message..." required
                     className="input-default pr-12"
                   />
                   <button 
                     type="submit" disabled={sendingMessage}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors disabled:opacity-50"
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
