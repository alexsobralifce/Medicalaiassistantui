import { Patient } from "../domain/patient/Patient";

export const PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Feminino',
    lastVisit: '2 meses atrás',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 45,
    gender: 'Masculino',
    lastVisit: '1 semana atrás',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: '3',
    name: 'Emma Davis',
    age: 28,
    gender: 'Feminino',
    lastVisit: 'Primeira consulta',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: '4',
    name: 'James Wilson',
    age: 62,
    gender: 'Masculino',
    lastVisit: '3 meses atrás',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
  }
];

export const RECENT_REPORTS = [
  { id: 1, title: 'Análise de Sangue - M. Chen', date: 'Hoje, 09:30', status: 'Concluído' },
  { id: 2, title: 'Encaminhamento Cardiológico - S. Johnson', date: 'Ontem', status: 'Pendente' },
  { id: 3, title: 'Checkup Anual - J. Wilson', date: 'Seg, 24 Out', status: 'Concluído' },
];
