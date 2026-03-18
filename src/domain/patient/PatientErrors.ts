import { AppError } from "../../application/errors/AppError";

export class PatientNotFoundError extends AppError {
  constructor(id: string) {
    super(`Patient with ID ${id} not found`, "PATIENT_NOT_FOUND");
  }
}

export class InvalidPatientDataError extends AppError {
  constructor(message: string) {
    super(`Invalid patient data: ${message}`, "INVALID_PATIENT_DATA");
  }
}
