import React, { useState, useMemo } from 'react';
import { useSurvey } from '../context/SurveyContext';
import { useAuth } from '../context/AuthContext';
import { schools } from '../data/schools';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

type Tab = 'dashboard' | 'registros' | 'relatorios';

export const AdminDashboard: React.FC = () => {
  const { responses, stats, isLoading, error, syncFromLocal } = useSurvey();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    const count = await syncFromLocal();
    setSyncMsg(`${count} registro(s) enviado(s) para o Supabase!`);
    setSyncing(false);
  };
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [filterSchool, setFilterSchool] = useState<number>(0);
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResponses = useMemo(() => {
    return responses.filter(r => {
      if (filterSchool && r.escola_id !== filterSchool) return false;
      if (filterAge !== 'all') {
        const age = r.idade;
        if (filterAge === '4-6' && (age < 4 || age > 6)) return false;
        if (filterAge === '7-9' && (age < 7 || age > 9)) return false;
        if (filterAge === '10-12' && (age < 10 || age > 12)) return false;
        if (filterAge === '13+' && age < 13) return false;
      }
      if (filterTime !== 'all' && r.horario !== filterTime) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const escola = r.escola_nome?.toLowerCase() || '';
        const pref = r.merenda_preferida.toLowerCase();
        const sug = r.sugestao_merenda.toLowerCase();
        if (!escola.includes(term) && !pref.includes(term) && !sug.includes(term)) return false;
      }
      return true;
    });
  }, [responses, filterSchool, filterAge, filterTime, searchTerm]);

  const calculateFilteredStats = () => {
    const total = filteredResponses.length;
    const comeCount = filteredResponses.filter(r => r.come_merenda === 'sim').length;
    const gostaCount = filteredResponses.filter(r => r.gosta_merenda === 'sim').length;

    const porEscola = filteredResponses.reduce((acc, r) => {
      const nome = r.escola_nome || schools.find(s => s.id === r.escola_id)?.nome || 'Desconhecida';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const respostasPorEscola = Object.entries(porEscola)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      respostasPorEscola,
      percentualCome: total > 0 ? (comeCount / total) * 100 : 0,
      percentualGosta: total > 0 ? (gostaCount / total) * 100 : 0,
    };
  };

  const filteredStats = calculateFilteredStats();

  const exportToExcel = () => {
    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(filteredResponses.map(r => ({
      Escola: r.escola_nome,
      Horário: r.horario === 'manha' ? 'Manhã' : 'Tarde',
      Idade: r.idade,
      'Come Merenda': r.come_merenda === 'sim' ? 'Sim' : 'Não',
      'Gosta Merenda': r.gosta_merenda === 'sim' ? 'Sim' : 'Não',
      'Merenda Preferida': r.merenda_preferida,
      Sugestão: r.sugestao_merenda,
      'Data': new Date(r.created_at).toLocaleString(),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas');
    XLSX.writeFile(workbook, 'pesquisa_merenda.xlsx');
  };

  const exportToCSV = () => {
    const headers = ['Escola,Horário,Idade,Come Merenda,Gosta Merenda,Merenda Preferida,Sugestão,Data\n'];
    const rows = filteredResponses.map(r =>
      `${r.escola_nome},${r.horario === 'manha' ? 'Manhã' : 'Tarde'},${r.idade},${r.come_merenda},${r.gosta_merenda},"${r.merenda_preferida}","${r.sugestao_merenda}",${new Date(r.created_at).toLocaleString()}\n`
    );
    const blob = new Blob([headers + rows.join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pesquisa_merenda.csv';
    a.click();
  };

  const generatePDF = (type: 'geral' | 'escola') => {
    const doc = new jsPDF();
    const title = type === 'geral' ? 'Relatório Geral - Pesquisa de Merenda' : 'Relatório por Escola - Pesquisa de Merenda';

    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Data de emissão: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    if (type === 'geral') {
      doc.setFontSize(14);
      doc.text('Estatísticas Gerais', 20, 45);
      doc.setFontSize(11);
      doc.text(`Total de participantes: ${filteredStats.total}`, 20, 55);

      doc.autoTable({
        startY: 65,
        head: [['Escola', 'Respostas']],
        body: filteredStats.respostasPorEscola.map(e => [e.nome, e.count]),
        theme: 'striped',
      });

      const topMerendas = filteredResponses.reduce((acc, r) => {
        if (r.merenda_preferida) {
          acc[r.merenda_preferida] = (acc[r.merenda_preferida] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const sortedMerendas = Object.entries(topMerendas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      doc.autoTable({
        startY: filteredStats.respostasPorEscola.length * 8 + 85,
        head: [['Merendas Preferidas', 'Quantidade']],
        body: sortedMerendas.map(([merenda, count]) => [merenda, count]),
        theme: 'striped',
      });

      const suggestions = filteredResponses
        .map(r => r.sugestao_merenda)
        .filter(s => s)
        .slice(0, 10);

      if (suggestions.length > 0) {
        doc.autoTable({
          startY: sortedMerendas.length * 8 + 105,
          head: [['Sugestões dos Alunos']],
          body: suggestions.map(s => [s]),
          theme: 'striped',
        });
      }
    }

    doc.save(`relatorio_${type}.pdf`);
  };

  const handleExport = (format: string) => {
    if (format === 'excel') {
      exportToExcel();
    } else if (format === 'csv') {
      exportToCSV();
    }
  };

  const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'registros', label: 'Registros' },
    { key: 'relatorios', label: 'Relatórios' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Sair
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 mx-6 mt-4 rounded-lg">
          <strong>Erro ao carregar dados:</strong> {error}
        </div>
      )}

      {syncMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 mx-6 mt-4 rounded-lg">
          {syncMsg}
        </div>
      )}

      <div className="border-b bg-white">
        <div className="flex px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between">
              <span className="text-gray-600">Dados salvos no Supabase</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar dados locais'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-orange-500">{filteredStats.total}</div>
                <div className="text-gray-600">Total de Respostas</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-green-500">{filteredStats.percentualCome.toFixed(1)}%</div>
                <div className="text-gray-600">Que comem merenda</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-blue-500">{filteredStats.percentualGosta.toFixed(1)}%</div>
                <div className="text-gray-600">Que gostam da merenda</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-purple-500">{responses.length}</div>
                <div className="text-gray-600">Total Geral</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filterSchool}
                  onChange={e => setFilterSchool(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={0}>Todas as Escolas</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                <select
                  value={filterAge}
                  onChange={e => setFilterAge(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todas as Idades</option>
                  <option value="4-6">4 a 6 anos</option>
                  <option value="7-9">7 a 9 anos</option>
                  <option value="10-12">10 a 12 anos</option>
                  <option value="13+">13 anos ou mais</option>
                </select>
                <select
                  value={filterTime}
                  onChange={e => setFilterTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todo o Dia</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
                <select
                  onChange={e => handleExport(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Exportar</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard title="Respostas por Escola">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredStats.respostasPorEscola as any}>
                    <CartesianGrid strokeDasharray="3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Alunos que Comem Merenda">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Sim', value: filteredStats.percentualCome },
                        { name: 'Não', value: 100 - filteredStats.percentualCome },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF6B6B" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Alunos que Gostam da Merenda">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Sim', value: filteredStats.percentualGosta },
                        { name: 'Não', value: 100 - filteredStats.percentualGosta },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF6B6B" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Faixa Etária">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.distribuicaoIdade as any}>
                    <CartesianGrid strokeDasharray="3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#A28FD0" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {activeTab === 'registros' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Todos os Registros ({filteredResponses.length})
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por escola, merenda ou sugestão..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg w-64"
                  />
                  <select
                    onChange={e => handleExport(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Exportar</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Carregando...</div>
            ) : filteredResponses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhum registro encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-medium text-gray-600">#</th>
                      <th className="text-left p-3 font-medium text-gray-600">Escola</th>
                      <th className="text-left p-3 font-medium text-gray-600">Horário</th>
                      <th className="text-left p-3 font-medium text-gray-600">Idade</th>
                      <th className="text-left p-3 font-medium text-gray-600">Come Merenda</th>
                      <th className="text-left p-3 font-medium text-gray-600">Gosta</th>
                      <th className="text-left p-3 font-medium text-gray-600">Merenda Preferida</th>
                      <th className="text-left p-3 font-medium text-gray-600">Sugestão</th>
                      <th className="text-left p-3 font-medium text-gray-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((r, index) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-500">{index + 1}</td>
                        <td className="p-3 font-medium">{r.escola_nome}</td>
                        <td className="p-3">{r.horario === 'manha' ? 'Manhã' : 'Tarde'}</td>
                        <td className="p-3">{r.idade}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.come_merenda === 'sim' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.come_merenda === 'sim' ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.gosta_merenda === 'sim' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.gosta_merenda === 'sim' ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="p-3">{r.merenda_preferida}</td>
                        <td className="p-3 max-w-xs truncate">{r.sugestao_merenda}</td>
                        <td className="p-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportar Dados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={exportToExcel}
                  className="p-6 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-colors text-center"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-semibold text-green-700">Excel (.xlsx)</div>
                  <div className="text-sm text-gray-500">Exportar dados filtrados</div>
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-6 border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-semibold text-blue-700">CSV</div>
                  <div className="text-sm text-gray-500">Exportar dados filtrados</div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Relatórios PDF</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => generatePDF('geral')}
                  className="p-6 border-2 border-dashed border-red-300 rounded-xl hover:bg-red-50 transition-colors text-center"
                >
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-semibold text-red-700">Relatório Geral</div>
                  <div className="text-sm text-gray-500">Estatísticas completas</div>
                </button>
                <button
                  onClick={() => generatePDF('escola')}
                  className="p-6 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-50 transition-colors text-center"
                >
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-semibold text-purple-700">Relatório por Escola</div>
                  <div className="text-sm text-gray-500">Dados agrupados por escola</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-500 pb-6">
        Desenvolvido pelo Departamento de Tecnologia da SME
      </div>
    </div>
  );
};
