/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [status, setStatus] = useState<string>('Verificando...')

  useEffect(() => {
    // Aqui nós NÃO chamamos .from('tabela'), pois ela não existe.
    // Apenas verificamos se a variável supabase foi carregada corretamente.
    
    if (supabase) {
      console.log('Objeto Supabase:', supabase)
      setStatus('✅ Conectado! O cliente Supabase foi instanciado.')
    } else {
      setStatus('❌ Falha ao iniciar o cliente.')
    }
  }, [])

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Status do Projeto</h1>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        color: '#0d47a1'
      }}>
        {status}
      </div>
      <p>
        <small>Como não criamos tabelas, não haverá requisições de rede (fetch) no console.</small>
      </p>
    </div>
  )
}

export default App