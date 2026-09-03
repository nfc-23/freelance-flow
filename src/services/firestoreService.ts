import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { AccountFullData, UserAccount, VisitorLogEntry, AuthorizedDeveloper, SystemHealthMetrics } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PRIMARY_DEVELOPER_EMAIL = 'mdomaerislam@gmail.com';
let authorizedDevsCache: Set<string> = new Set([PRIMARY_DEVELOPER_EMAIL]);
try {
  const cached = localStorage.getItem('ff_authorized_dev_emails');
  if (cached) {
    const list = JSON.parse(cached);
    if (Array.isArray(list)) {
      list.forEach(e => authorizedDevsCache.add(String(e).toLowerCase().trim()));
    }
  }
} catch {}

export const firestoreService = {
  async create(collectionPath: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...data,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionPath);
    }
  },

  async update(collectionPath: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${id}`);
    }
  },

  async delete(collectionPath: string, id: string) {
    try {
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${id}`);
    }
  },

  async list(collectionPath: string) {
    try {
      const q = query(
        collection(db, collectionPath),
        where('userId', '==', auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  },

  async get(collectionPath: string, id: string) {
    try {
      const docRef = doc(db, collectionPath, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionPath}/${id}`);
    }
  },

  async getInvoiceWithDetails(id: string) {
    try {
      const invoiceRef = doc(db, 'invoices', id);
      const docSnap = await getDoc(invoiceRef);
      if (!docSnap.exists()) return null;
      
      const invoiceData = { id: docSnap.id, ...docSnap.data() } as any;

      // Fetch client
      let clientData = null;
      if (invoiceData.clientId) {
        const clientSnap = await getDoc(doc(db, 'clients', invoiceData.clientId));
        if (clientSnap.exists()) clientData = { id: clientSnap.id, ...clientSnap.data() };
      }

      // Fetch project
      let projectData = null;
      if (invoiceData.projectId) {
        const projSnap = await getDoc(doc(db, 'projects', invoiceData.projectId));
        if (projSnap.exists()) projectData = { id: projSnap.id, ...projSnap.data() };
      }

      return {
        ...invoiceData,
        client: clientData,
        project: projectData
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async getProjectForPortal(id: string) {
    try {
      const projectRef = doc(db, 'projects', id);
      const docSnap = await getDoc(projectRef);
      if (!docSnap.exists()) return null;
      
      const projectData = { id: docSnap.id, ...docSnap.data() } as any;

      // Note: We don't filter tasks by userId here because portal is for external clients.
      // Rules allow listing tasks if projectId is provided.
      
      // Fetch tasks
      const tasksQuery = query(
        collection(db, 'tasks'), 
        where('projectId', '==', id)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const tasks = tasksSnap.docs.map(t => ({ id: t.id, ...t.data() }));

      // Fetch comments (if any)
      const commentsQuery = query(
        collection(db, 'project_comments'), 
        where('projectId', '==', id)
      );
      const commentsSnap = await getDocs(commentsQuery);
      const comments = commentsSnap.docs.map(c => ({ id: c.id, ...c.data() }));
      
      return {
        ...projectData,
        tasks,
        comments
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async addPortalComment(projectId: string, text: string, username: string) {
    try {
      await addDoc(collection(db, 'project_comments'), {
        projectId,
        text,
        username,
        createdAt: serverTimestamp(),
      });
      
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      // Ensure we don't notify ourselves if we are the one commenting from inside the dashboard
      const currentUserId = auth.currentUser?.uid;
      const ownerId = projectSnap.exists() ? projectSnap.data().userId : null;
      
      if (ownerId && ownerId !== currentUserId) {
        await addDoc(collection(db, 'notifications'), {
          userId: ownerId,
          title: 'New Comment',
          message: `${username} commented on ${projectSnap.data().title || 'a project'}`,
          read: false,
          type: 'message',
          createdAt: serverTimestamp(),
          link: projectId 
        });
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  async clearCollection(collectionPath: string) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No authenticated user");
      
      console.log(`[FirestoreService] Clearing collection: ${collectionPath} for user: ${userId}`);
      
      const q = query(
        collection(db, collectionPath),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`[FirestoreService] Collection ${collectionPath} is already empty.`);
        return;
      }

      console.log(`[FirestoreService] Found ${querySnapshot.size} documents to delete in ${collectionPath}`);
      
      const deletePromises = querySnapshot.docs.map(doc => {
        console.log(`[FirestoreService] Deleting doc: ${doc.id} from ${collectionPath}`);
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      console.log(`[FirestoreService] Finished clearing ${collectionPath}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionPath);
    }
  },

  async resetAllData() {
    const collections = ['clients', 'projects', 'tasks', 'invoices', 'expenses', 'project_comments'];
    try {
      await Promise.all(collections.map(c => this.clearCollection(c)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'all-collections');
    }
  },

  async seedDemoData() {
    try {
      const demoClientId = await this.create('clients', { 
        name: 'Acme Corp', 
        company: 'Acme', 
        email: 'hello@acme.com' 
      });
      
      const demoProjectId = await this.create('projects', { 
        title: 'Website Redesign', 
        clientId: demoClientId, 
        status: 'active', 
        budget: 5000, 
        type: 'client' 
      });

      await this.create('invoices', { 
        projectId: demoProjectId,
        clientId: demoClientId, 
        amount: 2500, 
        status: 'paid', 
        invoiceNumber: 'INV-001',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: '2 Weeks',
        services: [
          { description: 'UX Research & Wireframing', amount: 1000 },
          { description: 'UI Design Phase 1', amount: 1500 }
        ]
      });

      await this.create('invoices', { 
        projectId: demoProjectId,
        clientId: demoClientId, 
        amount: 1200, 
        status: 'sent', 
        invoiceNumber: 'INV-002',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: '1 Week',
        services: [
          { description: 'Frontend Development (milestone 1)', amount: 1200 }
        ]
      });

      await this.create('tasks', { 
        projectId: demoProjectId, 
        title: 'Initial Architecture Design', 
        completed: true, 
        updatedAt: serverTimestamp() 
      });

      await this.create('tasks', { 
        projectId: demoProjectId, 
        title: 'Brand Palette Selection', 
        completed: false, 
        updatedAt: serverTimestamp() 
      });

      await this.create('expenses', {
        projectId: demoProjectId,
        description: 'Premium Fonts License',
        amount: 149,
        category: 'Assets'
      });

      await this.create('expenses', {
        projectId: demoProjectId,
        description: 'Cloud Infrastructure (Month 1)',
        amount: 45,
        category: 'Hosting'
      });

      return true;
    } catch (error) {
      console.error("Seeding failed:", error);
      return false;
    }
  },

  async getDashboardStats() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      // 1. Fetch Invoices for Earnings & Pending
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', userId));
      const invoicesSnap = await getDocs(invoicesQuery);
      const invoices = invoicesSnap.docs.map(d => d.data());

      const totalEarned = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      
      const pendingPayments = invoices
        .filter(i => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
      const expensesSnap = await getDocs(expensesQuery);
      const expenses = expensesSnap.docs.map(d => d.data());

      const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const profit = totalEarned - totalExpenses;

      // 2. Project Analytics & Lifecycle
      const allProjectsQuery = query(collection(db, 'projects'), where('userId', '==', userId));
      const allProjectsSnap = await getDocs(allProjectsQuery);
      const allProjects = allProjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const statusDistribution = {
        planned: 0,
        started: 0,
        paused: 0,
        finished: 0,
        untouched: 0,
        left: 0
      };

      allProjects.forEach(p => {
        const s = (p.status || 'untouched').toLowerCase();
        if (Object.keys(statusDistribution).includes(s)) {
          (statusDistribution as any)[s]++;
        } else {
          statusDistribution.untouched++;
        }
      });

      const activeProjectsCount = allProjects.filter(p => ['active', 'started', 'planned'].includes(p.status)).length;

      // 3. Financial Trajectory (Last 6 Months)
      const now = new Date();
      const earningsDataList = Array.from({length: 6}).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          month: d.getMonth(),
          year: d.getFullYear(),
          name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()],
          value: 0,
          income: 0,
          expenses: 0
        };
      });

      invoices.filter(i => i.status === 'paid').forEach(inv => {
        const issueDate = inv.issueDate ? new Date(inv.issueDate) : (inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date());
        const entry = earningsDataList.find(e => e.month === issueDate.getMonth() && e.year === issueDate.getFullYear());
        if (entry) {
          entry.value += Number(inv.amount || 0);
          entry.income += Number(inv.amount || 0);
        }
      });

      expenses.forEach(e => {
        const d = e.date ? new Date(e.date) : (e.createdAt?.toDate ? e.createdAt.toDate() : new Date());
        const entry = earningsDataList.find(en => en.month === d.getMonth() && en.year === d.getFullYear());
        if (entry) {
          entry.value -= Number(e.amount || 0);
          entry.expenses += Number(e.amount || 0);
        }
      });

      const earningsData = earningsDataList.map(e => ({ name: e.name, value: e.value }));
      const financialTrendData = earningsDataList.map(e => ({ name: e.name, income: e.income, expenses: e.expenses }));

      // 4. Project Distribution (by Type)
      const typeDistributionData: Record<string, number> = {};
      allProjects.forEach(p => {
        const t = p.type || 'Other';
        typeDistributionData[t] = (typeDistributionData[t] || 0) + 1;
      });

      const colors = ['#6366F1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      const projectDistribution = Object.keys(typeDistributionData).map((key, i) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeDistributionData[key],
        color: colors[i % colors.length]
      }));

      // 5. Enrich projects with deep context for AI awareness
      let totalTasks = 0;
      let completedTasks = 0;

      const fullProjects = await Promise.all(allProjects.map(async (p) => {
        const tQuery = query(
          collection(db, 'tasks'), 
          where('userId', '==', userId),
          where('projectId', '==', p.id)
        );
        const tSnap = await getDocs(tQuery);
        const tasks = tSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        
        totalTasks += tasks.length;
        completedTasks += tasks.filter(t => t.completed).length;

        const eQuery = query(
          collection(db, 'expenses'), 
          where('userId', '==', userId),
          where('projectId', '==', p.id)
        );
        const eSnap = await getDocs(eQuery);
        const projectExpenses = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return {
          ...p,
          tasks,
          expenses: projectExpenses
        };
      }));

      return {
        totalEarned,
        pendingPayments,
        totalExpenses,
        profit,
        activeProjectsCount,
        completedToday: 0, // Simplified for now
        allProjects: fullProjects,
        activeProjects: fullProjects.filter((p: any) => ['active', 'started', 'planned', 'in-progress'].includes(p.status)).slice(0, 5),
        statusDistribution,
        earningsData,
        financialTrendData,
        projectDistribution,
        totalTasks,
        completedTasks
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'dashboard-stats');
    }
  },

  // ----------------------------------------------------
  // DEVELOPER & ANALYTICS & ACCOUNT EXPORT / IMPORT
  // ----------------------------------------------------

  /**
   * Records a visitor log entry into Firestore
   */
  async recordVisitor(path: string, action: string = 'page_view', extra: Record<string, any> = {}) {
    try {
      let visitorId = '';
      try {
        visitorId = localStorage.getItem('ff_visitor_id') || '';
        if (!visitorId) {
          visitorId = 'vis_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
          localStorage.setItem('ff_visitor_id', visitorId);
        }
      } catch (e) {
        visitorId = 'vis_anon_' + Date.now();
      }

      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua);
      const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
      
      let browser = 'Unknown';
      if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') > -1) browser = 'Safari';
      else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (ua.indexOf('Edge') > -1) browser = 'Edge';

      const user = auth.currentUser;

      const logData = {
        visitorId,
        path: path || window.location.pathname + window.location.search,
        device,
        browser,
        action,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
        ...extra,
      };

      await addDoc(collection(db, 'visitor_logs'), logData);
    } catch (err) {
      // Non-blocking visitor tracking
      console.warn('Visitor tracking error:', err);
    }
  },

  /**
   * Syncs user profile upon authentication
   */
  async syncUser(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }, overrideRole?: string) {
    if (!user || !user.uid) return null;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const isDevEmail = user.email === 'mdomaerislam@gmail.com' || (user.email && user.email.endsWith('@developer.local'));
      let role = 'freelancer';
      if (isDevEmail || overrideRole === 'developer') {
        role = 'developer';
      } else if (userSnap.exists() && userSnap.data().role) {
        role = userSnap.data().role;
      }

      const payload: any = {
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        photoURL: user.photoURL || '',
        role,
        lastLoginAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        payload.createdAt = new Date().toISOString();
        await setDoc(userRef, payload);
      } else {
        await updateDoc(userRef, payload);
      }

      return {
        id: user.uid,
        ...payload,
      };
    } catch (err) {
      console.error('User sync error:', err);
      return null;
    }
  },

  /**
   * Primary root developer email constant
   */
  PRIMARY_DEVELOPER_EMAIL,

  /**
   * Checks if user has developer role or privilege.
   * Checks primary root email, cached authorized developer emails, and local storage fallback.
   */
  isDeveloper(user: { email?: string | null } | null): boolean {
    if (!user || !user.email) return false;
    const lowerEmail = user.email.toLowerCase().trim();
    if (lowerEmail === PRIMARY_DEVELOPER_EMAIL.toLowerCase()) return true;
    if (lowerEmail.endsWith('@developer.local')) return true;
    if (authorizedDevsCache.has(lowerEmail)) return true;
    return false;
  },

  /**
   * Lists all authorized developers from Firestore
   */
  async listAuthorizedDevelopers(): Promise<AuthorizedDeveloper[]> {
    try {
      const snap = await getDocs(collection(db, 'authorized_developers'));
      let devs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AuthorizedDeveloper[];
      
      // Ensure primary owner is always present
      const hasPrimary = devs.some(d => d.email.toLowerCase() === PRIMARY_DEVELOPER_EMAIL.toLowerCase());
      if (!hasPrimary) {
        const primaryDoc: AuthorizedDeveloper = {
          id: PRIMARY_DEVELOPER_EMAIL,
          email: PRIMARY_DEVELOPER_EMAIL,
          displayName: 'Lead System Developer',
          role: 'owner',
          addedBy: 'system',
          addedAt: '2026-01-01T00:00:00.000Z',
          notes: 'Root Developer & Superuser Architecture Owner'
        };
        try {
          await setDoc(doc(db, 'authorized_developers', PRIMARY_DEVELOPER_EMAIL), primaryDoc);
        } catch (e) {}
        devs = [primaryDoc, ...devs];
      }

      // Update local memory cache and storage
      authorizedDevsCache = new Set([PRIMARY_DEVELOPER_EMAIL.toLowerCase(), ...devs.map(d => d.email.toLowerCase().trim())]);
      try {
        localStorage.setItem('ff_authorized_dev_emails', JSON.stringify(Array.from(authorizedDevsCache)));
      } catch {}

      return devs;
    } catch (err) {
      console.error('Failed to list authorized developers:', err);
      return [{
        id: PRIMARY_DEVELOPER_EMAIL,
        email: PRIMARY_DEVELOPER_EMAIL,
        displayName: 'Lead System Developer',
        role: 'owner',
        addedBy: 'system',
        addedAt: new Date().toISOString(),
        notes: 'Root Developer'
      }];
    }
  },

  /**
   * Listen in real-time to authorized developers
   */
  listenAuthorizedDevelopers(callback: (devs: AuthorizedDeveloper[]) => void): () => void {
    try {
      const q = query(collection(db, 'authorized_developers'));
      return onSnapshot(q, (snap) => {
        let devs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AuthorizedDeveloper[];
        if (!devs.some(d => d.email.toLowerCase() === PRIMARY_DEVELOPER_EMAIL.toLowerCase())) {
          devs.unshift({
            id: PRIMARY_DEVELOPER_EMAIL,
            email: PRIMARY_DEVELOPER_EMAIL,
            displayName: 'Lead System Developer',
            role: 'owner',
            addedBy: 'system',
            addedAt: '2026-01-01T00:00:00.000Z',
            notes: 'Root Developer & Superuser Architecture Owner'
          });
        }
        authorizedDevsCache = new Set([PRIMARY_DEVELOPER_EMAIL.toLowerCase(), ...devs.map(d => d.email.toLowerCase().trim())]);
        try {
          localStorage.setItem('ff_authorized_dev_emails', JSON.stringify(Array.from(authorizedDevsCache)));
        } catch {}
        callback(devs);
      }, (error) => {
        console.error('Error listening to authorized developers:', error);
      });
    } catch (err) {
      console.error('Failed to attach authorized developers listener:', err);
      return () => {};
    }
  },

  /**
   * Adds an authorized developer email with role and metadata
   */
  async addAuthorizedDeveloper(data: {
    email: string;
    displayName?: string;
    role: 'owner' | 'admin' | 'analyst';
    notes?: string;
    addedBy: string;
  }): Promise<AuthorizedDeveloper> {
    const cleanEmail = data.email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please provide a valid email address.');
    }

    const newDev: AuthorizedDeveloper = {
      id: cleanEmail,
      email: cleanEmail,
      displayName: data.displayName?.trim() || cleanEmail.split('@')[0],
      role: data.role || 'admin',
      addedBy: data.addedBy,
      addedAt: new Date().toISOString(),
      notes: data.notes?.trim() || 'Authorized developer access',
    };

    // 1. Write to authorized_developers collection
    await setDoc(doc(db, 'authorized_developers', cleanEmail), newDev);

    // 2. Also promote any matching registered user account in `users`
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      for (const uDoc of snap.docs) {
        await updateDoc(doc(db, 'users', uDoc.id), { role: 'developer' });
      }
    } catch (err) {
      console.warn('Could not auto-promote matching user in users collection:', err);
    }

    // 3. Update memory cache and localStorage
    authorizedDevsCache.add(cleanEmail);
    try {
      localStorage.setItem('ff_authorized_dev_emails', JSON.stringify(Array.from(authorizedDevsCache)));
    } catch {}

    return newDev;
  },

  /**
   * Removes developer authorization from an email
   */
  async removeAuthorizedDeveloper(email: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === PRIMARY_DEVELOPER_EMAIL.toLowerCase()) {
      throw new Error(`Primary Root Developer (${PRIMARY_DEVELOPER_EMAIL}) cannot be revoked.`);
    }

    await deleteDoc(doc(db, 'authorized_developers', cleanEmail));

    // Demote matching user profile if present
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      for (const uDoc of snap.docs) {
        await updateDoc(doc(db, 'users', uDoc.id), { role: 'freelancer' });
      }
    } catch (err) {}

    authorizedDevsCache.delete(cleanEmail);
    try {
      localStorage.setItem('ff_authorized_dev_emails', JSON.stringify(Array.from(authorizedDevsCache)));
    } catch {}
  },

  /**
   * System Health Telemetry & Connection Metrics
   */
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const t0 = performance.now();
    let status: 'operational' | 'degraded' | 'offline' = 'operational';
    try {
      await getDocs(query(collection(db, 'users'), limit(1)));
    } catch (e) {
      status = 'degraded';
    }
    const latencyMs = Math.round(performance.now() - t0);

    const [usersSnap, projSnap, invSnap, clientSnap, taskSnap, expSnap, visSnap] = await Promise.all([
      getDocs(collection(db, 'users')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'projects')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'invoices')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'clients')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'tasks')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'expenses')).catch(() => ({ size: 0, docs: [] })),
      getDocs(collection(db, 'visitor_logs')).catch(() => ({ size: 0, docs: [] })),
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Active users in past 24h
    const activeTodayUsers = (usersSnap.docs as any[]).filter(d => {
      const last = d.data()?.lastLoginAt;
      return last && String(last) >= oneDayAgo;
    }).length;

    // Today's visitors
    const todayVisitors = (visSnap.docs as any[]).filter(d => {
      const c = d.data()?.timestamp || d.data()?.createdAt;
      return c && String(c) >= oneDayAgo;
    }).length;

    let totalRevenuePaid = 0;
    let totalRevenuePending = 0;
    (invSnap.docs as any[]).forEach(d => {
      const data = d.data();
      const amt = Number(data?.amount || 0);
      if (data?.status === 'paid') totalRevenuePaid += amt;
      else if (data?.status === 'pending') totalRevenuePending += amt;
    });

    return {
      databaseStatus: status,
      latencyMs,
      collectionsBreakdown: {
        users: usersSnap.size || 0,
        projects: projSnap.size || 0,
        invoices: invSnap.size || 0,
        clients: clientSnap.size || 0,
        tasks: taskSnap.size || 0,
        expenses: expSnap.size || 0,
        visitorLogs: visSnap.size || 0,
      },
      todayVisitors,
      activeTodayUsers,
      totalRevenuePaid,
      totalRevenuePending,
    };
  },

  /**
   * Prune/clear visitor logs (Developer maintenance)
   */
  async clearVisitorLogs(olderThanDays?: number): Promise<number> {
    const snap = await getDocs(collection(db, 'visitor_logs'));
    const cutoff = olderThanDays ? new Date(Date.now() - olderThanDays * 86400000).toISOString() : null;
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach(d => {
      const created = d.data().createdAt || d.data().timestamp;
      if (!cutoff || (created && String(created) < cutoff)) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
    return count;
  },

  /**
   * Delete specific record from any collection (Developer privilege)
   */
  async deleteRecord(collectionPath: string, id: string): Promise<void> {
    await deleteDoc(doc(db, collectionPath, id));
  },

  /**
   * Update specific record in any collection (Developer privilege)
   */
  async updateRecord(collectionPath: string, id: string, updates: any): Promise<void> {
    await updateDoc(doc(db, collectionPath, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Lists all documents in a collection (Developer privilege: without userId filter)
   */
  async listAll(collectionPath: string) {
    try {
      const q = query(collection(db, collectionPath));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      return [];
    }
  },

  /**
   * Lists documents in a collection filtered by a specific target userId
   */
  async listByUser(collectionPath: string, targetUserId: string) {
    try {
      const q = query(
        collection(db, collectionPath),
        where('userId', '==', targetUserId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${collectionPath}?userId=${targetUserId}`);
      return [];
    }
  },

  /**
   * Lists all users registered in the system with aggregated metrics
   */
  async listAllUsers(): Promise<UserAccount[]> {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList: any[] = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch all projects, invoices, clients to calculate per-user breakdown
      const [allProjects, allInvoices, allClients] = await Promise.all([
        getDocs(collection(db, 'projects')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'invoices')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'clients')).catch(() => ({ docs: [] })),
      ]);

      const projectsByUser: Record<string, number> = {};
      allProjects.docs.forEach((d: any) => {
        const u = d.data().userId;
        if (u) projectsByUser[u] = (projectsByUser[u] || 0) + 1;
      });

      const clientsByUser: Record<string, number> = {};
      allClients.docs.forEach((d: any) => {
        const u = d.data().userId;
        if (u) clientsByUser[u] = (clientsByUser[u] || 0) + 1;
      });

      const invoicesByUser: Record<string, number> = {};
      const revenueByUser: Record<string, number> = {};
      allInvoices.docs.forEach((d: any) => {
        const data = d.data();
        const u = data.userId;
        if (u) {
          invoicesByUser[u] = (invoicesByUser[u] || 0) + 1;
          if (data.status === 'paid') {
            revenueByUser[u] = (revenueByUser[u] || 0) + Number(data.amount || 0);
          }
        }
      });

      return usersList.map(u => ({
        ...u,
        totalProjects: projectsByUser[u.id] || 0,
        totalClients: clientsByUser[u.id] || 0,
        totalInvoices: invoicesByUser[u.id] || 0,
        totalRevenue: revenueByUser[u.id] || 0,
      }));
    } catch (error) {
      console.error('Failed to list all users:', error);
      return [];
    }
  },

  /**
   * Lists recent visitor logs
   */
  async listVisitorLogs(limitCount: number = 200): Promise<VisitorLogEntry[]> {
    try {
      const q = query(
        collection(db, 'visitor_logs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().timestamp || (d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : new Date().toISOString())
      })) as VisitorLogEntry[];
    } catch (error) {
      // Fallback without orderBy in case index is pending
      try {
        const q2 = query(collection(db, 'visitor_logs'), limit(limitCount));
        const snap2 = await getDocs(q2);
        return snap2.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().timestamp || new Date().toISOString()
        })) as VisitorLogEntry[];
      } catch (err) {
        console.error('Failed to load visitor logs:', err);
        return [];
      }
    }
  },

  /**
   * Exports all data for a specific user account
   */
  async exportAccountData(targetUserId: string): Promise<AccountFullData> {
    try {
      const [userDoc, projects, tasks, invoices, clients, expenses] = await Promise.all([
        getDoc(doc(db, 'users', targetUserId)).catch(() => null),
        getDocs(query(collection(db, 'projects'), where('userId', '==', targetUserId))),
        getDocs(query(collection(db, 'tasks'), where('userId', '==', targetUserId))),
        getDocs(query(collection(db, 'invoices'), where('userId', '==', targetUserId))),
        getDocs(query(collection(db, 'clients'), where('userId', '==', targetUserId))),
        getDocs(query(collection(db, 'expenses'), where('userId', '==', targetUserId))),
      ]);

      const userData = userDoc && userDoc.exists() ? userDoc.data() : {};

      return {
        account: {
          uid: targetUserId,
          email: userData.email || '',
          displayName: userData.displayName || '',
          role: userData.role || 'freelancer',
          exportedAt: new Date().toISOString(),
        },
        projects: projects.docs.map(d => ({ id: d.id, ...d.data() })) as any[],
        tasks: tasks.docs.map(d => ({ id: d.id, ...d.data() })) as any[],
        invoices: invoices.docs.map(d => ({ id: d.id, ...d.data() })) as any[],
        clients: clients.docs.map(d => ({ id: d.id, ...d.data() })) as any[],
        expenses: expenses.docs.map(d => ({ id: d.id, ...d.data() })) as any[],
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `exportAccountData-${targetUserId}`);
      throw error;
    }
  },

  /**
   * Imports account full data into a destination user account
   */
  async importAccountData(
    data: AccountFullData, 
    destinationUserId: string,
    options: { overwrite?: boolean } = {}
  ): Promise<{ importedCounts: { projects: number; tasks: number; invoices: number; clients: number; expenses: number } }> {
    const batch = writeBatch(db);
    let counts = { projects: 0, tasks: 0, invoices: 0, clients: 0, expenses: 0 };

    try {
      // Map old IDs to new IDs to maintain relationships between projects, clients, and invoices
      const clientIdMap: Record<string, string> = {};
      const projectIdMap: Record<string, string> = {};

      // 1. Clients
      if (Array.isArray(data.clients)) {
        for (const client of data.clients) {
          const newRef = doc(collection(db, 'clients'));
          clientIdMap[client.id] = newRef.id;
          const { id: _, ...clientFields } = client;
          batch.set(newRef, {
            ...clientFields,
            userId: destinationUserId,
            importedAt: serverTimestamp(),
            createdAt: clientFields.createdAt || new Date().toISOString(),
          });
          counts.clients++;
        }
      }

      // 2. Projects
      if (Array.isArray(data.projects)) {
        for (const project of data.projects) {
          const newRef = doc(collection(db, 'projects'));
          projectIdMap[project.id] = newRef.id;
          const { id: _, ...projectFields } = project;
          batch.set(newRef, {
            ...projectFields,
            clientId: clientIdMap[projectFields.clientId] || projectFields.clientId || '',
            userId: destinationUserId,
            importedAt: serverTimestamp(),
            createdAt: projectFields.createdAt || new Date().toISOString(),
          });
          counts.projects++;
        }
      }

      // 3. Tasks
      if (Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          const newRef = doc(collection(db, 'tasks'));
          const { id: _, ...taskFields } = task;
          batch.set(newRef, {
            ...taskFields,
            projectId: projectIdMap[taskFields.projectId] || taskFields.projectId || '',
            userId: destinationUserId,
            importedAt: serverTimestamp(),
            createdAt: taskFields.createdAt || new Date().toISOString(),
          });
          counts.tasks++;
        }
      }

      // 4. Invoices
      if (Array.isArray(data.invoices)) {
        for (const invoice of data.invoices) {
          const newRef = doc(collection(db, 'invoices'));
          const { id: _, ...invoiceFields } = invoice;
          batch.set(newRef, {
            ...invoiceFields,
            clientId: clientIdMap[invoiceFields.clientId] || invoiceFields.clientId || '',
            projectId: projectIdMap[invoiceFields.projectId] || invoiceFields.projectId || '',
            userId: destinationUserId,
            importedAt: serverTimestamp(),
            createdAt: invoiceFields.createdAt || new Date().toISOString(),
          });
          counts.invoices++;
        }
      }

      // 5. Expenses
      if (Array.isArray(data.expenses)) {
        for (const expense of data.expenses) {
          const newRef = doc(collection(db, 'expenses'));
          const { id: _, ...expenseFields } = expense;
          batch.set(newRef, {
            ...expenseFields,
            projectId: expenseFields.projectId ? (projectIdMap[expenseFields.projectId] || expenseFields.projectId) : null,
            userId: destinationUserId,
            importedAt: serverTimestamp(),
            createdAt: expenseFields.createdAt || new Date().toISOString(),
          });
          counts.expenses++;
        }
      }

      await batch.commit();
      return { importedCounts: counts };
    } catch (error) {
      console.error('Failed to import account data:', error);
      throw error;
    }
  }
};
