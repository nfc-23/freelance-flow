/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Client {
  id: string;
  userId: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  budget: number;
  startDate: string;
  endDate: string;
  type: 'client' | 'personal';
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  projectId?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface UserAccount {
  id: string; // uid
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'freelancer' | 'developer' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  totalProjects?: number;
  totalInvoices?: number;
  totalClients?: number;
  totalRevenue?: number;
}

export interface VisitorLogEntry {
  id: string;
  visitorId: string;
  path: string;
  device: string;
  browser: string;
  action: string;
  userId?: string;
  userEmail?: string;
  createdAt: string;
}

export interface AccountFullData {
  account: {
    uid: string;
    email: string;
    displayName?: string;
    role?: string;
    exportedAt: string;
  };
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  clients: Client[];
  expenses: Expense[];
}

export interface AuthorizedDeveloper {
  id: string; // email lowercase
  email: string;
  displayName?: string;
  role: 'owner' | 'admin' | 'analyst';
  addedBy: string;
  addedAt: string;
  notes?: string;
}

export interface SystemHealthMetrics {
  databaseStatus: 'operational' | 'degraded' | 'offline';
  latencyMs: number;
  collectionsBreakdown: {
    users: number;
    projects: number;
    invoices: number;
    clients: number;
    tasks: number;
    expenses: number;
    visitorLogs: number;
  };
  todayVisitors: number;
  activeTodayUsers: number;
  totalRevenuePaid: number;
  totalRevenuePending: number;
}
