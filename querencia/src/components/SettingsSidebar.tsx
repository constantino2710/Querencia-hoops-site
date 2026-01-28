import { User, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isTeacher: boolean;
}

export function SettingsSidebar({ activeTab, setActiveTab, isTeacher }: SettingsSidebarProps) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: 'Informações Pessoais', icon: <User size={18} />, show: true },
    { id: 'finance', label: 'Finanças e Recebimento', icon: <CreditCard size={18} />, show: isTeacher },
  ];

  return (
    <div className="w-64 flex flex-col gap-4">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao Painel
      </button>

      <nav className="flex flex-col gap-1">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-800 text-white font-medium shadow-sm' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}