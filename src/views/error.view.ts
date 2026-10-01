export interface ErrorDetail {
  field: string;
  message: string;
}

// Monta o corpo padrão de erro
export function presentError(message: string, details?: ErrorDetail[]) {
  return details ? { error: message, details } : { error: message };
}
