import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { FinancialSettings } from './teacher/FinancialSettings';

export default function SettingsPage() {
  const { userRoles, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const isTeacher = userRoles.includes('TEACHER') || userRoles.includes('ADMIN');

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        
        {/* Sidebar Interna */}
        <SettingsSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isTeacher={isTeacher} 
        />

        {/* Área de Conteúdo */}
        <main className="flex-1 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-1">Perfil Público</h2>
                <p className="text-zinc-500 text-sm border-b border-zinc-800 pb-4">
                  Como os outros usuários verão você na plataforma.
                </p>
              </section>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input 
                    type="text" 
                    disabled 
                    value={user?.email || ''} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-zinc-600 italic">O gerenciamento de perfil completo será liberado em breve.</p>
              </div>
            </div>
          )}

          {activeTab === 'finance' && isTeacher && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-1">Configurações de Pagamento</h2>
                <p className="text-zinc-500 text-sm border-b border-zinc-800 pb-4">
                  Conecte sua conta bancária para receber os lucros dos seus cursos via Pagar.me.
                </p>
              </section>
              <div className="pt-6">
                <FinancialSettings />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}