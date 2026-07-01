import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SurveyResponse, Stats } from '../types/survey';
import { schools } from '../data/schools';

interface SurveyContextType {
  responses: SurveyResponse[];
  addResponse: (response: Omit<SurveyResponse, 'id' | 'created_at' | 'escola_nome'>) => Promise<void>;
  stats: Stats;
  isLoading: boolean;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
};

export const SurveyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar respostas:', error.message);
    } else if (data) {
      setResponses(data as SurveyResponse[]);
    }
    setIsLoading(false);
  };

  const addResponse = async (response: Omit<SurveyResponse, 'id' | 'created_at' | 'escola_nome'>) => {
    const escola = schools.find(s => s.id === response.escola_id);
    const { error } = await supabase
      .from('survey_responses')
      .insert({
        escola_id: response.escola_id,
        escola_nome: escola?.nome || '',
        horario: response.horario,
        idade: response.idade,
        come_merenda: response.come_merenda,
        gosta_merenda: response.gosta_merenda,
        merenda_preferida: response.merenda_preferida,
        sugestao_merenda: response.sugestao_merenda,
      });

    if (error) {
      console.error('Erro ao salvar resposta:', error.message);
      return;
    }

    await loadResponses();
  };

  const calculateStats = useCallback((): Stats => {
    const totalRespostas = responses.length;

    const respostasPorEscolaMap = responses.reduce((acc, r) => {
      const key = r.escola_nome || schools.find(s => s.id === r.escola_id)?.nome || 'Desconhecida';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const respostasPorEscola = Object.entries(respostasPorEscolaMap)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    const comeMerendaCount = responses.filter(r => r.come_merenda === 'sim').length;
    const gostaMerendaCount = responses.filter(r => r.gosta_merenda === 'sim').length;

    const percentualCome = totalRespostas > 0 ? (comeMerendaCount / totalRespostas) * 100 : 0;
    const percentualGosta = totalRespostas > 0 ? (gostaMerendaCount / totalRespostas) * 100 : 0;

    const distribuicaoIdade = [
      { range: '4 a 6 anos', count: responses.filter(r => r.idade >= 4 && r.idade <= 6).length },
      { range: '7 a 9 anos', count: responses.filter(r => r.idade >= 7 && r.idade <= 9).length },
      { range: '10 a 12 anos', count: responses.filter(r => r.idade >= 10 && r.idade <= 12).length },
      { range: '13 anos ou mais', count: responses.filter(r => r.idade >= 13).length },
    ];

    const manhaTarde = {
      manha: responses.filter(r => r.horario === 'manha').length,
      tarde: responses.filter(r => r.horario === 'tarde').length,
    };

    return {
      totalRespostas,
      respostasPorEscola,
      percentualCome,
      percentualGosta,
      distribuicaoIdade,
      manhaTarde,
    };
  }, [responses]);

  const stats = calculateStats();

  return (
    <SurveyContext.Provider value={{ responses, addResponse, stats, isLoading }}>
      {children}
    </SurveyContext.Provider>
  );
};
