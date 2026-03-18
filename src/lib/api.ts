import { Patient } from '../App';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Generic fetcher ─────────────────────────────────────────────────────────

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('medassist_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patientsApi = {
  list: (): Promise<Patient[]> =>
    fetcher<Patient[]>('/patients'),

  get: (id: string): Promise<Patient> =>
    fetcher<Patient>(`/patients/${id}`),

  create: (data: Omit<Patient, 'id'>): Promise<Patient> =>
    fetcher<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Patient>): Promise<Patient> =>
    fetcher<Patient>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string): Promise<void> =>
    fetcher<void>(`/patients/${id}`, { method: 'DELETE' }),
};

// ─── Consultations ────────────────────────────────────────────────────────────

export interface ConsultationData {
  id: string;
  patientId: string;
  transcript: string[];
  transcriptClean?: string;
  anamnesisJson?: Record<string, any>;
  anamnesisMarkdown?: string;
  notes?: string;
  diagnosis?: string;
  status: 'DRAFT' | 'REVIEW' | 'COMPLETED';
  signedAt?: string;
  signedByDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export const consultationsApi = {
  list: (): Promise<ConsultationData[]> =>
    fetcher<ConsultationData[]>('/consultations'),

  get: (id: string): Promise<ConsultationData> =>
    fetcher<ConsultationData>(`/consultations/${id}`),

  create: (data: Pick<ConsultationData, 'patientId' | 'transcript' | 'notes' | 'diagnosis'>): Promise<ConsultationData> =>
    fetcher<ConsultationData>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ConsultationData>): Promise<ConsultationData> =>
    fetcher<ConsultationData>(`/consultations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listByPatient: (patientId: string): Promise<ConsultationData[]> =>
    fetcher<ConsultationData[]>(`/consultations/patient/${patientId}`),

  remove: (id: string): Promise<void> =>
    fetcher<void>(`/consultations/${id}`, { method: 'DELETE' }),

  sign: (id: string): Promise<ConsultationData> =>
    fetcher<ConsultationData>(`/consultations/${id}/sign`, { method: 'POST' }),
};

// ─── AI Integration ──────────────────────────────────────────────────────────

export const aiApi = {
  transcribe: async (audioBlob: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const token = localStorage.getItem('medassist_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // We can't use the generic fetcher here because it forces Content-Type: application/json
    const response = await fetch(`${API_URL}/ai/transcribe`, {
      method: 'POST',
      body: formData,
      headers,
      // Browser sets multipart/form-data boundary automatically when using FormData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro ao transcrever áudio' }));
      throw new Error(error.error ?? `HTTP ${response.status}`);
    }

    return response.json();
  },

  analyze: (transcript: string): Promise<any> =>
    fetcher<any>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    }),

  anamnese: (transcricao_bruta: string): Promise<{
    transcricao_limpa: string;
    anamnesis_json: Record<string, any>;
    anamnesis_markdown: string;
  }> =>
    fetcher('/ai/anamnese', {
      method: 'POST',
      body: JSON.stringify({ transcricao_bruta }),
    }),

  pharmacist: (reportedIssues: string): Promise<any> =>
    fetcher<any>('/ai/pharmacist', {
      method: 'POST',
      body: JSON.stringify({ reportedIssues }),
    })
};

// ─── CIDs ────────────────────────────────────────────────────────────────────

export interface Cid {
  code: string;
  description: string;
}

export const cidsApi = {
  search: (q: string): Promise<Cid[]> => 
    fetcher<Cid[]>(`/cids/search?q=${encodeURIComponent(q)}`),
};

// ─── Auth & Users ────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  crm?: string;
  role: 'ADMIN' | 'DOCTOR';
}

export const authApi = {
  login: (data: { email: string; password: string }): Promise<{ token: string; user: AuthenticatedUser }> =>
    fetcher('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: (): Promise<AuthenticatedUser> =>
    fetcher('/auth/me'),
};

export const usersApi = {
  list: (): Promise<AuthenticatedUser[]> => fetcher('/users'),
  create: (data: any): Promise<AuthenticatedUser> => fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<AuthenticatedUser> => fetcher(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string): Promise<void> => fetcher(`/users/${id}`, { method: 'DELETE' }),
};
