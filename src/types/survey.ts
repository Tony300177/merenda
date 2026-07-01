export interface SurveyResponse {
  id: number;
  escola_id: number;
  horario: "manha" | "tarde";
  idade: number;
  come_merenda: "sim" | "nao";
  gosta_merenda: "sim" | "nao";
  merenda_preferida: string;
  sugestao_merenda: string;
  created_at: string;
  escola_nome?: string;
}

export interface School {
  id: number;
  nome: string;
}

export interface Stats {
  totalRespostas: number;
  respostasPorEscola: { nome: string; count: number }[];
  percentualCome: number;
  percentualGosta: number;
  distribuicaoIdade: { range: string; count: number }[];
  manhaTarde: { manha: number; tarde: number };
}