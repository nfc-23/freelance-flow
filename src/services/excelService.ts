import * as XLSX from 'xlsx';
import type { AccountFullData, UserAccount, VisitorLogEntry } from '../types';

export const excelService = {
  /**
   * Generates a multi-sheet Excel Workbook for an entire account and triggers a download.
   */
  exportAccountToExcel(data: AccountFullData, filenamePrefix: string = 'FreelanceFlow_Account') {
    const wb = XLSX.utils.book_new();

    // 1. Account Summary Sheet
    const overviewRows = [
      { Parameter: 'Account UID', Value: data.account.uid },
      { Parameter: 'User Email', Value: data.account.email || 'N/A' },
      { Parameter: 'User Name', Value: data.account.displayName || 'N/A' },
      { Parameter: 'Account Role', Value: data.account.role || 'freelancer' },
      { Parameter: 'Export Timestamp', Value: data.account.exportedAt || new Date().toISOString() },
      { Parameter: 'Total Projects', Value: data.projects?.length || 0 },
      { Parameter: 'Total Tasks', Value: data.tasks?.length || 0 },
      { Parameter: 'Total Invoices', Value: data.invoices?.length || 0 },
      { Parameter: 'Total Clients', Value: data.clients?.length || 0 },
      { Parameter: 'Total Expenses', Value: data.expenses?.length || 0 },
      {
        Parameter: 'Total Invoiced Amount ($)',
        Value: (data.invoices || []).reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
      },
      {
        Parameter: 'Total Expenses Amount ($)',
        Value: (data.expenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // 2. Projects Sheet
    const projectRows = (data.projects || []).map(p => ({
      ID: p.id,
      Title: p.title,
      Status: p.status,
      Type: p.type || 'client',
      'Budget ($)': Number(p.budget || 0),
      'Client ID': p.clientId || '',
      'Start Date': p.startDate || '',
      'End Date': p.endDate || '',
      Description: p.description || '',
      'Created At': p.createdAt || '',
    }));
    const wsProjects = XLSX.utils.json_to_sheet(projectRows.length > 0 ? projectRows : [{ Note: 'No projects found' }]);
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');

    // 3. Tasks Sheet
    const taskRows = (data.tasks || []).map(t => ({
      ID: t.id,
      'Project ID': t.projectId || '',
      Title: t.title,
      Completed: t.completed ? 'YES' : 'NO',
      Priority: t.priority || 'medium',
      'Due Date': t.dueDate || '',
      'Created At': t.createdAt || '',
    }));
    const wsTasks = XLSX.utils.json_to_sheet(taskRows.length > 0 ? taskRows : [{ Note: 'No tasks found' }]);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');

    // 4. Invoices Sheet
    const invoiceRows = (data.invoices || []).map(inv => ({
      ID: inv.id,
      'Invoice #': inv.invoiceNumber || '',
      'Client ID': inv.clientId || '',
      'Project ID': inv.projectId || '',
      'Amount ($)': Number(inv.amount || 0),
      Status: inv.status || 'draft',
      'Due Date': inv.dueDate || '',
      'Items Count': Array.isArray(inv.items) ? inv.items.length : 0,
      'Items Summary': Array.isArray(inv.items) 
        ? inv.items.map(i => `${i.description} (${i.quantity}x$${i.rate})`).join('; ')
        : '',
      'Created At': inv.createdAt || '',
    }));
    const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows.length > 0 ? invoiceRows : [{ Note: 'No invoices found' }]);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

    // 5. Clients Sheet
    const clientRows = (data.clients || []).map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Company: c.company || '',
      Phone: c.phone || '',
      Address: c.address || '',
      'Created At': c.createdAt || '',
    }));
    const wsClients = XLSX.utils.json_to_sheet(clientRows.length > 0 ? clientRows : [{ Note: 'No clients found' }]);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');

    // 6. Expenses Sheet
    const expenseRows = (data.expenses || []).map(e => ({
      ID: e.id,
      Description: e.description,
      'Amount ($)': Number(e.amount || 0),
      Category: e.category || 'General',
      Date: e.date || '',
      'Project ID': e.projectId || '',
      'Created At': e.createdAt || '',
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows.length > 0 ? expenseRows : [{ Note: 'No expenses found' }]);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    // Download workbook
    const safeName = (data.account.email || data.account.uid || 'account').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filenamePrefix}_${safeName}_${dateStr}.xlsx`);
  },

  /**
   * Export all users/accounts overview table to Excel
   */
  exportUsersSummaryToExcel(users: UserAccount[]) {
    const rows = users.map(u => ({
      UID: u.id,
      Email: u.email,
      Name: u.displayName || '',
      Role: u.role,
      'Total Projects': u.totalProjects || 0,
      'Total Clients': u.totalClients || 0,
      'Total Invoices': u.totalInvoices || 0,
      'Total Revenue ($)': u.totalRevenue || 0,
      'Last Login': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A',
      'Created At': u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Users & Accounts');
    XLSX.writeFile(wb, `FreelanceFlow_All_Users_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Export visitor logs to Excel
   */
  exportVisitorsToExcel(visitors: VisitorLogEntry[]) {
    const rows = visitors.map(v => ({
      'Log ID': v.id,
      'Visitor ID': v.visitorId,
      Path: v.path,
      Device: v.device,
      Browser: v.browser,
      Action: v.action,
      'User Email': v.userEmail || 'Guest / Unauthenticated',
      'User ID': v.userId || 'N/A',
      Timestamp: v.createdAt ? new Date(v.createdAt).toLocaleString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitor Analytics');
    XLSX.writeFile(wb, `FreelanceFlow_Visitor_Traffic_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Parses an uploaded .xlsx or .json file into AccountFullData
   */
  async parseAccountFile(file: File): Promise<AccountFullData> {
    const isJson = file.name.endsWith('.json');
    if (isJson) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.projects && !parsed.clients && !parsed.invoices) {
        throw new Error('Invalid JSON backup file: missing account collections.');
      }
      return {
        account: parsed.account || {
          uid: 'imported_' + Date.now(),
          email: file.name.replace('.json', ''),
          displayName: 'Imported Account',
          role: 'freelancer',
          exportedAt: new Date().toISOString()
        },
        projects: parsed.projects || [],
        tasks: parsed.tasks || [],
        invoices: parsed.invoices || [],
        clients: parsed.clients || [],
        expenses: parsed.expenses || [],
      };
    }

    // Process as Excel (.xlsx / .xls / .csv)
    const dataBuffer = await file.arrayBuffer();
    const wb = XLSX.read(dataBuffer, { type: 'array' });

    let accountMeta: any = {
      uid: 'imported_excel_' + Date.now(),
      email: file.name.replace(/\.[^/.]+$/, ''),
      displayName: 'Imported from Excel',
      role: 'freelancer',
      exportedAt: new Date().toISOString(),
    };

    // Check for Overview sheet
    if (wb.SheetNames.includes('Overview')) {
      const overviewRaw: any[] = XLSX.utils.sheet_to_json(wb.Sheets['Overview']);
      overviewRaw.forEach(row => {
        if (row.Parameter === 'Account UID') accountMeta.uid = String(row.Value);
        if (row.Parameter === 'User Email') accountMeta.email = String(row.Value);
        if (row.Parameter === 'User Name') accountMeta.displayName = String(row.Value);
        if (row.Parameter === 'Account Role') accountMeta.role = String(row.Value);
      });
    }

    const projects: any[] = [];
    if (wb.SheetNames.includes('Projects')) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets['Projects']);
      raw.forEach((r: any) => {
        if (r.Title && !r.Note) {
          projects.push({
            id: r.ID || 'proj_' + Math.random().toString(36).substring(2, 9),
            title: r.Title,
            status: (r.Status || 'active').toLowerCase(),
            type: (r.Type || 'client').toLowerCase(),
            budget: Number(r['Budget ($)'] || r.Budget || 0),
            clientId: r['Client ID'] || r.ClientId || '',
            startDate: r['Start Date'] || '',
            endDate: r['End Date'] || '',
            description: r.Description || '',
            createdAt: r['Created At'] || new Date().toISOString(),
          });
        }
      });
    }

    const tasks: any[] = [];
    if (wb.SheetNames.includes('Tasks')) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets['Tasks']);
      raw.forEach((r: any) => {
        if (r.Title && !r.Note) {
          tasks.push({
            id: r.ID || 'task_' + Math.random().toString(36).substring(2, 9),
            projectId: r['Project ID'] || r.ProjectId || '',
            title: r.Title,
            completed: String(r.Completed).toUpperCase() === 'YES' || r.Completed === true,
            priority: (r.Priority || 'medium').toLowerCase(),
            dueDate: r['Due Date'] || '',
            createdAt: r['Created At'] || new Date().toISOString(),
          });
        }
      });
    }

    const invoices: any[] = [];
    if (wb.SheetNames.includes('Invoices')) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets['Invoices']);
      raw.forEach((r: any) => {
        if ((r['Invoice #'] || r.InvoiceNumber || r['Amount ($)']) && !r.Note) {
          invoices.push({
            id: r.ID || 'inv_' + Math.random().toString(36).substring(2, 9),
            invoiceNumber: r['Invoice #'] || r.InvoiceNumber || 'INV-001',
            clientId: r['Client ID'] || r.ClientId || '',
            projectId: r['Project ID'] || r.ProjectId || '',
            amount: Number(r['Amount ($)'] || r.Amount || 0),
            status: (r.Status || 'sent').toLowerCase(),
            dueDate: r['Due Date'] || '',
            items: [],
            createdAt: r['Created At'] || new Date().toISOString(),
          });
        }
      });
    }

    const clients: any[] = [];
    if (wb.SheetNames.includes('Clients')) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets['Clients']);
      raw.forEach((r: any) => {
        if (r.Name && !r.Note) {
          clients.push({
            id: r.ID || 'cli_' + Math.random().toString(36).substring(2, 9),
            name: r.Name,
            email: r.Email || '',
            company: r.Company || '',
            phone: r.Phone || '',
            address: r.Address || '',
            createdAt: r['Created At'] || new Date().toISOString(),
          });
        }
      });
    }

    const expenses: any[] = [];
    if (wb.SheetNames.includes('Expenses')) {
      const raw = XLSX.utils.sheet_to_json(wb.Sheets['Expenses']);
      raw.forEach((r: any) => {
        if (r.Description && !r.Note) {
          expenses.push({
            id: r.ID || 'exp_' + Math.random().toString(36).substring(2, 9),
            description: r.Description,
            amount: Number(r['Amount ($)'] || r.Amount || 0),
            category: r.Category || 'General',
            date: r.Date || new Date().toISOString().split('T')[0],
            projectId: r['Project ID'] || '',
            createdAt: r['Created At'] || new Date().toISOString(),
          });
        }
      });
    }

    return {
      account: accountMeta,
      projects,
      tasks,
      invoices,
      clients,
      expenses,
    };
  },

  /**
   * Generates a Full System Master Backup Excel file (Developer Superuser)
   */
  exportSystemMasterBackup(payload: {
    users: UserAccount[];
    developers: any[];
    projects: any[];
    invoices: any[];
    clients: any[];
    tasks: any[];
    expenses: any[];
    visitors: VisitorLogEntry[];
    metrics?: any;
  }) {
    const wb = XLSX.utils.book_new();

    // 1. System Overview Sheet
    const overviewRows = [
      { Metric: 'Backup Type', Value: 'Full System Master Snapshot' },
      { Metric: 'Generated At', Value: new Date().toISOString() },
      { Metric: 'Total Registered Users', Value: payload.users.length },
      { Metric: 'Authorized Developers', Value: payload.developers.length },
      { Metric: 'Total Projects', Value: payload.projects.length },
      { Metric: 'Total Invoices', Value: payload.invoices.length },
      { Metric: 'Total Clients', Value: payload.clients.length },
      { Metric: 'Total Tasks', Value: payload.tasks.length },
      { Metric: 'Total Expenses', Value: payload.expenses.length },
      { Metric: 'Visitor Hits Tracked', Value: payload.visitors.length },
      {
        Metric: 'Gross Paid Revenue ($)',
        Value: payload.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0)
      },
      {
        Metric: 'Pending Revenue ($)',
        Value: payload.invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount || 0), 0)
      }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewRows), 'System Overview');

    // 2. Authorized Developers Sheet
    const devRows = payload.developers.map(d => ({
      Email: d.email,
      'Display Name': d.displayName || 'N/A',
      Role: d.role,
      'Added By': d.addedBy || 'N/A',
      'Added At': d.addedAt || 'N/A',
      Notes: d.notes || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(devRows.length ? devRows : [{ Note: 'No custom developers' }]), 'Authorized Devs');

    // 3. Users Sheet
    const userRows = payload.users.map(u => ({
      UID: u.id,
      Email: u.email,
      Name: u.displayName || 'N/A',
      Role: u.role,
      'Created At': u.createdAt,
      'Last Login': u.lastLoginAt,
      Projects: u.totalProjects || 0,
      Clients: u.totalClients || 0,
      Invoices: u.totalInvoices || 0,
      'Revenue ($)': u.totalRevenue || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userRows.length ? userRows : [{ Note: 'No users' }]), 'Users Directory');

    // 4. Projects Sheet
    const projRows = payload.projects.map(p => ({
      ID: p.id,
      'Owner UID': p.userId,
      Title: p.title,
      Status: p.status,
      Type: p.type,
      'Budget ($)': p.budget || 0,
      'Client ID': p.clientId,
      'Created At': p.createdAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows.length ? projRows : [{ Note: 'No projects' }]), 'Projects');

    // 5. Invoices Sheet
    const invRows = payload.invoices.map(i => ({
      ID: i.id,
      'Owner UID': i.userId,
      Number: i.invoiceNumber,
      Status: i.status,
      'Amount ($)': i.amount,
      'Client ID': i.clientId,
      'Due Date': i.dueDate,
      'Created At': i.createdAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows.length ? invRows : [{ Note: 'No invoices' }]), 'Invoices');

    // 6. Clients Sheet
    const clientRows = payload.clients.map(c => ({
      ID: c.id,
      'Owner UID': c.userId,
      Name: c.name,
      Company: c.company || '',
      Email: c.email || '',
      Phone: c.phone || '',
      'Created At': c.createdAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ Note: 'No clients' }]), 'Clients');

    // 7. Visitor Traffic Sheet
    const visRows = payload.visitors.slice(0, 1000).map(v => ({
      ID: v.id,
      'Visitor Hash': v.visitorId,
      Path: v.path,
      Device: v.device,
      Browser: v.browser,
      Action: v.action,
      'User Email': v.userEmail || 'Anonymous',
      Timestamp: v.createdAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(visRows.length ? visRows : [{ Note: 'No traffic logs' }]), 'Traffic Telemetry');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `FreelanceFlow_Master_System_Backup_${dateStr}.xlsx`);
  }
};
