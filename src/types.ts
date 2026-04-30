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
