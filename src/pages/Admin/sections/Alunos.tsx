import { useState, useEffect, useMemo } from 'react'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import { formatCPF, formatPhone, formatDate, sanitizeInput } from '@/utils/formatters'
import type { ProfileWithEmail } from '@/types'

export function Alunos() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [alunos, setAlunos] = useState<ProfileWithEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ProfileWithEmail | null>(null)
  const [deleting, setDeleting] = useState<ProfileWithEmail | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', empresa: '', cargo: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [roleTarget, setRoleTarget] = useState<ProfileWithEmail | null>(null)

  const load = async () => {
    try {
      const data = await profileService.getAllWithEmail()
      setAlunos(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar alunos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return alunos.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.cpf || '').includes(q) ||
      (a.empresa || '').toLowerCase().includes(q)
    )
  }, [alunos, search])

  const openEdit = (aluno: ProfileWithEmail) => {
    setEditing(aluno)
    setEditForm({ nome: aluno.nome, telefone: aluno.telefone || '', empresa: aluno.empresa || '', cargo: aluno.cargo || '' })
  }

  const handleSave = async () => {
    if (!editing || !editForm.nome.trim()) return
    setSaving(true)
    try {
      await profileService.update(editing.id, {
        nome: sanitizeInput(editForm.nome.trim()),
        telefone: editForm.telefone,
        empresa: sanitizeInput(editForm.empresa.trim()),
        cargo: sanitizeInput(editForm.cargo.trim()),
      })
      showToast('Aluno atualizado!', 'success')
      setEditing(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setConfirmDelete(false)
    try {
      await profileService.delete(deleting.id)
      showToast('Aluno excluído.', 'info')
      setDeleting(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir.', 'error')
    }
  }

  const handleRoleChange = async () => {
    if (!roleTarget) return
    const novoRole = roleTarget.role === 'admin' ? 'aluno' : 'admin'
    try {
      await profileService.updateRole(roleTarget.id, novoRole)
      showToast(
        novoRole === 'admin'
          ? `${roleTarget.nome} agora é administrador.`
          : `${roleTarget.nome} voltou a ser aluno.`,
        'success'
      )
      setRoleTarget(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao alterar função.', 'error')
    }
  }

  const exportCSV = () => {
    const BOM = '\uFEFF'
    const header = ['Nome', 'E-mail', 'CPF', 'Telefone', 'Empresa', 'Cargo', 'Cadastro']
    const rows = filtered.map(a => [
      a.nome, a.email,
      a.cpf ? formatCPF(a.cpf) : '',
      a.telefone ? formatPhone(a.telefone) : '',
      a.empresa || '', a.cargo || '',
      formatDate(a.criado_em),
    ])
    const csv = BOM + [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alunos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Alunos</h2>
          <Button size="sm" variant="secondary" onClick={exportCSV}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </Button>
        </div>

        <Input
          placeholder="Buscar por nome, e-mail, CPF ou empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="bg-white rounded-2xl border border-steel-200 p-8 text-center text-steel-400 animate-pulse">
            Carregando...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-steel-50 border-b border-steel-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap hidden md:table-cell">E-mail</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap hidden lg:table-cell">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap hidden lg:table-cell">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap hidden xl:table-cell">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap">Função</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap hidden md:table-cell">Cadastro</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-steel-400">Nenhum aluno encontrado.</td></tr>
                  ) : (
                    filtered.map(aluno => (
                      <tr key={aluno.id} className="hover:bg-steel-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-steel-700 whitespace-nowrap">{aluno.nome}</td>
                        <td className="px-4 py-3 text-steel-500 hidden md:table-cell">{aluno.email}</td>
                        <td className="px-4 py-3 text-steel-500 whitespace-nowrap hidden lg:table-cell">{aluno.cpf ? formatCPF(aluno.cpf) : '—'}</td>
                        <td className="px-4 py-3 text-steel-500 whitespace-nowrap hidden lg:table-cell">{aluno.telefone ? formatPhone(aluno.telefone) : '—'}</td>
                        <td className="px-4 py-3 text-steel-500 hidden xl:table-cell">{aluno.empresa || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                            aluno.role === 'admin'
                              ? 'bg-brand-red/10 text-brand-red'
                              : 'bg-steel-100 text-steel-500'
                          }`}>
                            {aluno.role === 'admin' ? 'Admin' : 'Aluno'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-steel-400 whitespace-nowrap hidden md:table-cell">{formatDate(aluno.criado_em)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(aluno)} className="text-navy-500 hover:text-navy-700 text-xs font-medium">Editar</button>
                            {aluno.id !== user?.id && (
                              <button
                                onClick={() => setRoleTarget(aluno)}
                                className={`text-xs font-medium ${aluno.role === 'admin' ? 'text-steel-400 hover:text-steel-600' : 'text-amber-600 hover:text-amber-800'}`}
                              >
                                {aluno.role === 'admin' ? 'Rebaixar' : 'Promover'}
                              </button>
                            )}
                            <button onClick={() => { setDeleting(aluno); setConfirmDelete(true) }} className="text-brand-red hover:text-red-700 text-xs font-medium">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-steel-100 text-xs text-steel-400">
              {filtered.length} aluno{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar aluno">
        <div className="flex flex-col gap-4">
          <Input label="Nome" value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
          <Input label="Telefone" value={editForm.telefone} onChange={e => setEditForm(p => ({ ...p, telefone: e.target.value }))} />
          <Input label="Empresa" value={editForm.empresa} onChange={e => setEditForm(p => ({ ...p, empresa: e.target.value }))} />
          <Input label="Cargo" value={editForm.cargo} onChange={e => setEditForm(p => ({ ...p, cargo: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Role change confirm modal */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title={roleTarget?.role === 'admin' ? 'Rebaixar para aluno' : 'Promover a administrador'}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          {roleTarget?.role === 'admin' ? (
            <p className="text-steel-600 text-sm">
              Tem certeza que deseja remover os privilégios de administrador de <strong>{roleTarget?.nome}</strong>?
              Ele perderá acesso ao painel admin.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-700">
                  <strong>{roleTarget?.nome}</strong> terá acesso total ao painel de administração, incluindo gerenciar alunos, cursos e matrículas.
                </p>
              </div>
              <p className="text-sm text-steel-500">Confirma a promoção?</p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancelar</Button>
            <Button
              variant={roleTarget?.role === 'admin' ? 'secondary' : 'primary' as 'secondary'}
              onClick={handleRoleChange}
            >
              {roleTarget?.role === 'admin' ? 'Rebaixar' : 'Sim, promover a admin'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Confirmar exclusão">
        <p className="text-steel-600 mb-6">
          Tem certeza que deseja excluir <strong>{deleting?.nome}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </>
  )
}
