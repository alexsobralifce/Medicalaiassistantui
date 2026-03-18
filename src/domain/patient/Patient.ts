export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit?: string;
  image?: string;
  phone?: string;
  city?: string;
  state?: string;
  dob?: string;
  cpf?: string;
  reportedIssues?: string;
}
