/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { CheckCircle2, Landmark, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

const inputBase = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-text-primary outline-none transition focus:ring-2 focus:ring-orange-500/35 placeholder:text-text-secondary/70'
const labelBase = 'text-xs font-semibold tracking-wide text-text-secondary'

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className={labelBase}>{label}</span>
      {error ? <span className="text-[11px] font-medium text-red-500 animate-in fade-in">{error}</span> : null}
    </div>
    {children}
  </div>
)

const onlyDigits = (v: string) => v.replace(/\D/g, '')

const formatCpfCnpj = (value: string) => {
  const v = onlyDigits(value)
  if (v.length <= 11) return v.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4').slice(0, 14)
  return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4').replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5').slice(0, 18)
}

export const FinancialSettings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const storageKey = useMemo(() => `financial-draft:${user?.id}`, [user?.id])
  const [formData, setFormData] = useState({ fullName: '', document: '', bankCode: '', branchNumber: '', accountNumber: '', accountDigit: '' })

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (raw) setFormData(JSON.parse(raw))
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
  }, [formData, storageKey])

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setErrorMessage(null)
  }

  const errors = useMemo(() => {
    const e: any = {}
    const doc = onlyDigits(formData.document)
    if (!formData.fullName.trim()) e.fullName = 'Obrigatório'
    if (doc && doc.length !== 11 && doc.length !== 14) e.document = 'Inválido'
    if (!formData.bankCode) e.bankCode = 'Obrigatório'
    return e
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data, error: funcError } = await supabase.functions.invoke('create-pagarme-recipient', {
        body: { bankData: { ...formData, document: onlyDigits(formData.document), email: user?.email } }
      })

      if (funcError || data?.error) {
        const errorDetail = data?.error?.message || "Verifique os dados bancários."
        setErrorMessage(errorDetail)
        return
      }

      if (!user?.id) throw new Error('User ID not found')
      const { error: dbError } = await supabase.from('users').update({ pagarme_recipient_id: data.id, ...formData, document: onlyDigits(formData.document) }).eq('id', user.id)
      if (dbError) throw dbError

      setSuccess(true)
      localStorage.removeItem(storageKey)
    } catch (err: any) {
      setErrorMessage("Erro ao salvar no banco de dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-background/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Landmark size={22} className="text-orange-500" /> Dados Financeiros
          </h2>
          <p className="text-sm text-text-secondary">Conecte sua conta para receber repasses automáticos.</p>
        </div>
        {success && <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20"><CheckCircle2 size={14}/> Conectado</span>}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-500 text-sm">
            <AlertCircle size={18} className="shrink-0" /> {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome Completo do Titular" error={errors.fullName}>
            <input className={inputBase} value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="Ex: João Silva" />
          </Field>
          <Field label="CPF ou CNPJ" error={errors.document}>
            <input className={inputBase} value={formData.document} onChange={e => handleChange('document', formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" />
          </Field>
          <Field label="Código do Banco (3 dígitos)">
            <input className={inputBase} value={formData.bankCode} onChange={e => handleChange('bankCode', onlyDigits(e.target.value).slice(0,3))} placeholder="Ex: 260" />
          </Field>
          <Field label="Agência">
            <input className={inputBase} value={formData.branchNumber} onChange={e => handleChange('branchNumber', onlyDigits(e.target.value))} placeholder="Ex: 0001" />
          </Field>
          <div className="md:col-span-2 grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <Field label="Número da Conta">
                <input className={inputBase} value={formData.accountNumber} onChange={e => handleChange('accountNumber', onlyDigits(e.target.value))} placeholder="Ex: 123456" />
              </Field>
            </div>
            <Field label="Dígito">
              <input className={inputBase} value={formData.accountDigit} onChange={e => handleChange('accountDigit', onlyDigits(e.target.value).slice(0,2))} placeholder="0" />
            </Field>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button type="submit" disabled={loading || success} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : success ? 'Configuração Salva' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}