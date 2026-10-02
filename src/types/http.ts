// Resposta padrão devolvida pelos controllers (status HTTP + corpo)
export interface ControllerResponse<T = unknown> {
  status: number;
  body: T;
}
