import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface ProjectInsight {
  projectId: string;
  projectName: string;
  status: 'optimal' | 'warning' | 'critical';
  summary: string;
  recommendation: string;
  burnRate: number; // 0 to 1
}

export async function generateProjectInsights(projects: any[]): Promise<ProjectInsight[]> {
  const ai = getAI();
  const projectData = projects.map(p => ({
    id: p.id,
    name: p.title,
    status: p.status,
    budget: p.budget,
    expenses: p.expenses || [],
    tasks: p.tasks || [],
    deadline: p.deadline
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: JSON.stringify(projectData),
    config: {
      systemInstruction: "You are a Senior Project Management Intelligence. Analyze project data and return a JSON array of insights. Each insight should follow the structure: { projectId, projectName, status, summary, recommendation, burnRate }.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            projectId: { type: Type.STRING },
            projectName: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['optimal', 'warning', 'critical'] },
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            burnRate: { type: Type.NUMBER }
          },
          required: ["projectId", "projectName", "status", "summary", "recommendation", "burnRate"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function suggestTasks(projectTitle: string): Promise<string[]> {
  const ai = getAI();
  const prompt = `Act as an expert project manager. Provide 5-7 specific, actionable tasks for a project titled: "${projectTitle}". Return only a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
       responseMimeType: "application/json",
       responseSchema: {
         type: Type.ARRAY,
         items: { type: Type.STRING }
       }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function parseCommand(input: string) {
  const cmd = input.toLowerCase().trim();
  if (cmd.includes('new project') || cmd === 'np') return { action: 'NAVIGATE', target: 'projects', modal: 'new' };
  if (cmd.includes('new client') || cmd === 'nc') return { action: 'NAVIGATE', target: 'clients', modal: 'new' };
  if (cmd.includes('dashboard') || cmd === 'dash') return { action: 'NAVIGATE', target: 'dashboard' };
  if (cmd.includes('invoices') || cmd === 'inv') return { action: 'NAVIGATE', target: 'invoices' };
  return null;
}
