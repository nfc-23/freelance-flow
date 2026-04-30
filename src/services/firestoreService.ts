import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

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
          value: 0
        };
      });

      invoices.filter(i => i.status === 'paid').forEach(inv => {
        const issueDate = inv.issueDate ? new Date(inv.issueDate) : (inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date());
        const entry = earningsDataList.find(e => e.month === issueDate.getMonth() && e.year === issueDate.getFullYear());
        if (entry) {
          entry.value += Number(inv.amount || 0);
        }
      });

      expenses.forEach(e => {
        const d = e.date ? new Date(e.date) : (e.createdAt?.toDate ? e.createdAt.toDate() : new Date());
        const entry = earningsDataList.find(en => en.month === d.getMonth() && en.year === d.getFullYear());
        if (entry) {
          entry.value -= Number(e.amount || 0);
        }
      });

      const earningsData = earningsDataList.map(e => ({ name: e.name, value: e.value }));

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
      const fullProjects = await Promise.all(allProjects.map(async (p) => {
        const tQuery = query(
          collection(db, 'tasks'), 
          where('userId', '==', userId),
          where('projectId', '==', p.id)
        );
        const tSnap = await getDocs(tQuery);
        const tasks = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));

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
        projectDistribution
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'dashboard-stats');
    }
  }
};
