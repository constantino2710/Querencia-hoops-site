import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getTeacherBalance, type TeacherBalance } from '../../services/financeService';
import {StatCard} from './components/StatCard';
import { Wallet, Clock, CheckCircle } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<TeacherBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinancialData() {
      if (user?.id) {
        const data = await getTeacherBalance(user.id);
        setBalance(data);
      }
      setLoading(false);
    }
    loadFinancialData();
  }, [user]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Painel do Instrutor</h1>
        <p className="text-gray-500">Gerencie seus cursos e acompanhe seus rendimentos.</p>
      </div>

      {/* Seção Financeira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Saldo Disponível"
          value={loading ? "Carregando..." : formatCurrency(balance?.available || 0)}
          icon={<Wallet className="text-green-500" />}
          description="Pronto para saque"
        />
        <StatCard
          title="A Receber"
          value={loading ? "Carregando..." : formatCurrency(balance?.waiting_funds || 0)}
          icon={<Clock className="text-blue-500" />}
          description="Vendas processando"
        />
        <StatCard
          title="Total Sacado"
          value={loading ? "Carregando..." : formatCurrency(balance?.transferred || 0)}
          icon={<CheckCircle className="text-purple-500" />}
          description="Enviado para sua conta"
        />
      </div>

      {/* Botão de Saque - Integração com POST /transfers da Pagar.me */}
      <div className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Solicitar Transferência</h3>
          <p className="text-sm text-gray-500">O valor disponível será enviado para sua conta bancária cadastrada.</p>
        </div>
        <button 
          disabled={!balance || balance.available <= 0}
          className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          Sacar Agora
        </button>
      </div>
      
      {/* Aqui continuariam seus componentes de lista de cursos */}
    </div>
  );
};

export default TeacherDashboard;