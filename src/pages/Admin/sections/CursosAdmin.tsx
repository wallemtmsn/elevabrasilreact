import { useState, useEffect, useMemo } from 'react'
import { cursosService } from '@/services/cursosService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Curso } from '@/types'

type CursoForm = {
  titulo: string
  descricao: string
  carga_horaria: string
  valor: string
  video_url: string
  nr_referencia: string
  exige_pratico: boolean
  validade_meses: string
  ativo: boolean
}

const emptyForm: CursoForm = {
  titulo: '', descricao: '', carga_horaria: '', valor: '', video_url: '',
  nr_referencia: '', exige_pratico: true, validade_meses: '12', ativo: true,
}

export function CursosAdmin() {
  const { showToast } = useToast()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Curso | null>(null)
  const [form, setForm] = useState<CursoForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Curso | null>(null)

  const load = async () => {
    try {
      const data = await cursosService.getAll()
      setCursos(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar cursos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cursos.filter(c => c.titulo.toLowerCase().includes(q) || (c.descricao || '').toLowerCase().includes(q))
  }, [cursos, search])

  const set = (field: keyof CursoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal('create') }
  const openEdit = (c: Curso) => {
    setEditing(c)
    setForm({
      titulo: c.titulo,
      descricao: c.descricao || '',
      carga_horaria: c.carga_horaria?.toString() || '',
      valor: c.valor?.toString() || '',
      video_url: c.video_url || '',
      nr_referencia: c.nr_referencia || '',
      exige_pratico: c.exige_pratico,
      validade_meses: c.validade_meses?.toString() || '12',
      ativo: c.ativo,
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) { showToast('Título obrigatório.', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        carga_horaria: form.carga_horaria ? parseInt(form.carga_horaria) : null,
        valor: form.valor ? parseFloat(form.valor) : null,
        video_url: form.video_url.trim() || null,
        nr_referencia: form.nr_referencia.trim() || null,
        exige_pratico: form.exige_pratico,
        validade_meses: form.validade_meses ? parseInt(form.validade_meses) : 12,
        ativo: form.ativo,
      }
      if (modal === 'edit' && editing) {
        await cursosService.update(editing.id, payload)
        showToast('Curso atualizado!', 'success')
      } else {
        await cursosService.create(payload as Parameters<typeof cursosService.create>[0])
        showToast('Curso criado!', 'success')
      }
      setModal(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await cursosService.delete(deleting.id)
      showToast('Curso excluído.', 'info')
      setDeleting(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir.', 'error')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Cursos</h2>
          <Button size="sm" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo curso
          </Button>
        </div>

        <Input placeholder="Buscar curso..." value={search} onChange={e => setSearch(e.target.value)} />

        {loading ? (
          <div className="bg-white rounded-2xl border border-steel-200 p-8 text-center animate-pulse text-steel-400">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-steel-200 p-8 text-center text-steel-400">Nenhum curso encontrado.</div>
            ) : (
              filtered.map(curso => (
                <div key={curso.id} className="bg-white rounded-2xl border border-steel-200 p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-steel-800 leading-snug flex-1">{curso.titulo}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${curso.ativo ? 'bg-green-100 text-green-700' : 'bg-steel-100 text-steel-500'}`}>
                      {curso.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {curso.descricao && <p className="text-xs text-steel-500 line-clamp-2">{curso.descricao}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    {curso.nr_referencia && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                        {curso.nr_referencia}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${curso.exige_pratico ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                      {curso.exige_pratico ? 'Com prático' : 'Só teórico'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-steel-400 pt-1 border-t border-steel-100">
                    {curso.carga_horaria && <span>{curso.carga_horaria}h</span>}
                    <span>{formatCurrency(curso.valor)}</span>
                    <span className="ml-auto">{formatDate(curso.criado_em)}</span>
                  </div>
                  {curso.video_url && (
                    <p className="text-xs text-navy-500 truncate">🎬 {curso.video_url}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" fullWidth onClick={() => openEdit(curso)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(curso)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar curso' : 'Novo curso'}
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">
          <Input label="Título *" value={form.titulo} onChange={set('titulo')} placeholder="Nome do curso" />
          <div className="flex flex-col gap-1">
            <label className="lbl">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={set('descricao')}
              rows={3}
              className="inp resize-none"
              placeholder="Descrição do curso..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Carga horária (h)" type="number" min="1" value={form.carga_horaria} onChange={set('carga_horaria')} placeholder="40" />
            <Input label="Valor (R$)" type="number" min="0" step="0.01" value={form.valor} onChange={set('valor')} placeholder="0" helpText="Deixe vazio para 'Consulte'" />
          </div>
          <Input
            label="URL do vídeo (Vimeo)"
            value={form.video_url}
            onChange={set('video_url')}
            placeholder="https://player.vimeo.com/video/..."
            helpText="Use a URL do player embed do Vimeo (Share → Embed)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="NR de referência"
              value={form.nr_referencia}
              onChange={set('nr_referencia')}
              placeholder="Ex: NR-11, NR-12"
              helpText="Norma regulamentadora do treinamento"
            />
            <Input
              label="Validade (meses)"
              type="number"
              min="1"
              value={form.validade_meses}
              onChange={set('validade_meses')}
              placeholder="12"
              helpText="Validade do certificado emitido"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.exige_pratico}
                onChange={e => setForm(p => ({ ...p, exige_pratico: e.target.checked }))}
                className="w-4 h-4 accent-navy-500"
              />
              <span className="text-sm text-steel-700">Exige teste prático para certificado</span>
            </label>
            {!form.exige_pratico && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                O certificado será emitido automaticamente ao concluir o teórico.
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
              className="w-4 h-4 accent-navy-500"
            />
            <span className="text-sm text-steel-700">Curso ativo (visível para alunos)</span>
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>
              {modal === 'edit' ? 'Salvar' : 'Criar curso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Excluir curso">
        <p className="text-steel-600 mb-6">
          Tem certeza que deseja excluir <strong>{deleting?.titulo}</strong>?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </>
  )
}
