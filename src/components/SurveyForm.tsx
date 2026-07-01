import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSurvey } from '../context/SurveyContext';
import { schools } from '../data/schools';

interface SurveyFormValues {
  escola_id: number;
  horario: 'manha' | 'tarde';
  idade: number;
  come_merenda: 'sim' | 'nao';
  gosta_merenda: 'sim' | 'nao';
  merenda_preferida: string;
  sugestao_merenda: string;
}

export const SurveyForm: React.FC = () => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SurveyFormValues>();
  const { addResponse } = useSurvey();
  const [sent, setSent] = useState(false);

  const onSubmit = async (data: SurveyFormValues) => {
    await addResponse(data);
    setSent(true);
    reset();
  };

  if (sent) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesquisa enviada com sucesso!</h2>
          <p className="text-gray-600 mb-6">Obrigado por participar! Sua opinião é muito importante.</p>
          <button
            onClick={() => setSent(false)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Enviar outra resposta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2v2H3V3zm2 4h2v2H5V7zm2 4h2v2H7v-2zm2 4h2v2H9v-2zm2 4h2v2H11v-2zm-6 4h2v2H5v-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Satisfação da Merenda Escolar</h1>
          <p className="text-gray-600 mt-2">Sua opinião é importante para melhorarmos a merenda!</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Escola */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Qual escola você estuda?
            </label>
            <select
              {...register('escola_id', { required: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecione sua escola</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Qual horário você estuda?
            </label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="manha"
                  {...register('horario', { required: true })}
                  className="mr-2"
                />
                <span>De manhã</span>
              </label>
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="tarde"
                  {...register('horario', { required: true })}
                  className="mr-2"
                />
                <span>De tarde</span>
              </label>
            </div>
          </div>

          {/* Idade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Quantos anos você tem?
            </label>
            <input
              type="number"
              min="4"
              max="18"
              {...register('idade', { required: true, min: 4 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Digite sua idade"
            />
          </div>

          {/* Come merenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. Você come a merenda da escola?
            </label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="sim"
                  {...register('come_merenda', { required: true })}
                  className="mr-2"
                />
                <span>Sim</span>
              </label>
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="nao"
                  {...register('come_merenda', { required: true })}
                  className="mr-2"
                />
                <span>Não</span>
              </label>
            </div>
          </div>

          {/* Gosta da merenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              5. Você gosta da merenda da escola?
            </label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="sim"
                  {...register('gosta_merenda', { required: true })}
                  className="mr-2"
                />
                <span>Sim</span>
              </label>
              <label className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="nao"
                  {...register('gosta_merenda', { required: true })}
                  className="mr-2"
                />
                <span>Não</span>
              </label>
            </div>
          </div>

          {/* Merenda preferida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              6. Qual sua merenda preferida da escola?
            </label>
            <input
              type="text"
              {...register('merenda_preferida')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Digite sua merenda preferida"
            />
          </div>

          {/* Sugestão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              7. O que você gostaria que tivesse na merenda da escola?
            </label>
            <textarea
              {...register('sugestao_merenda')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Digite suas sugestões..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                ✅ Enviar Pesquisa
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Desenvolvido pelo Departamento de Tecnologia da SME
        </div>
      </div>
    </div>
  );
};