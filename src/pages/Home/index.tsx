import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout'
import { LoginModal } from './LoginModal'
import { RegisterModal } from './RegisterModal'
import { useAuth } from '@/contexts/AuthContext'
import { buildWhatsAppUrl } from '@/utils/formatters'
import { cursosService } from '@/services/cursosService'
import { slugify } from '@/utils/courseDataMap'

const WA = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '5522998588802'
const WA_DEFAULT = buildWhatsAppUrl(WA, 'Olá, seja bem vindo(a) a ELEVA, sua escola de Treinamentos! Como posso te ajudar?')

// ── Dados dos cursos ─────────────────────────────────────────────────────────
type CourseCategory = 'operacional' | 'desenvolvimento' | 'nr'

interface Course {
  title: string
  hours: string
  description: string
  norms: string
  image: string
  category: CourseCategory
}

const COURSES: Course[] = [
  // Operacional
  { category: 'operacional', title: 'Operador de Empilhadeira', hours: '20h', image: '/assets/img/empilhadeira.jpg', norms: 'NR-06, NR-11, NR-12, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Empilhadeiras para aplicação em diversas áreas: offshore, engenharia, construtoras, plataformas, portos, etc. O treinamento é ministrado por técnico devidamente registrado, inclui módulos teóricos e práticos onde o aluno opera a empilhadeira simulando situações de trabalho e de risco.' },
  { category: 'operacional', title: 'Operador de Guindaste', hours: '120h', image: '/assets/img/guindaste.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-34', description: 'Visa qualificar e aperfeiçoar Operadores de Guindastes fixos e móveis para aplicação em diversas áreas: offshore, engenharia, construtoras, plataformas, portos, etc. Inclui módulos teóricos e práticos onde o aluno opera o guindaste simulando situações de trabalho e de risco.' },
  { category: 'operacional', title: 'Operador de Guindauto', hours: '20h', image: '/assets/img/guindauto.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Guindauto para aplicação em diversas áreas. O treinamento inclui módulos teóricos e práticos com emissão de ART (Anotação de Responsabilidade Técnica).' },
  { category: 'operacional', title: 'Operador de PEMT', hours: '20h', image: '/assets/img/pemt.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-18', description: 'Visa qualificar e aperfeiçoar Operadores de Plataformas Elevatória Móvel de Trabalho (tesoura ou articulada) para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Escavadeira Hidráulica', hours: '20h', image: '/assets/img/escavadeira.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Escavadeira Hidráulica para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Pá Carregadeira', hours: '20h', image: '/assets/img/pa-carregadeira.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Pá Carregadeira para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Retro Escavadeira', hours: '20h', image: '/assets/img/retro-escavadeira.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Retroescavadeiras para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Trator', hours: '20h', image: '/assets/img/trator.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Trator para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Mini Escavadeira', hours: '20h', image: '/assets/img/mini-escavadeira.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Mini Escavadeira Hidráulica para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Ponte Rolante', hours: '20h', image: '/assets/img/ponte-rolante.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-34', description: 'Visa qualificar e aperfeiçoar Operadores de Pontes Rolantes para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Manipulador Telescópico', hours: '20h', image: '/assets/img/manipulador-telescopico.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Manipulador Telescópico para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  { category: 'operacional', title: 'Operador de Jumbo', hours: '20h', image: '/assets/img/jumbo.jpg', norms: 'NR-06, NR-11, NR-17', description: 'Visa qualificar e aperfeiçoar Operadores de Jumbo para aplicação em diversas áreas. Inclui módulos teóricos e práticos.' },
  // Desenvolvimento
  { category: 'desenvolvimento', title: 'NR-11 Movimentação de Cargas', hours: '16h', image: '/assets/img/nr11-movimentacao.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-34', description: 'Visa qualificar e aperfeiçoar Riggers Sinaleiros e Amarradores de Cargas para aplicação em diversas áreas: offshore, engenharia, construtoras, plataformas, portos, etc.' },
  { category: 'desenvolvimento', title: 'Rigger Sinaleiro', hours: '16h', image: '/assets/img/rigger-sinaleiro.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-34', description: 'Visa qualificar e aperfeiçoar Riggers Sinaleiros e Amarradores de Cargas para aplicação em diversas áreas: offshore, engenharia, construtoras, plataformas, portos, etc.' },
  { category: 'desenvolvimento', title: 'Inspeção de Acessórios', hours: '16h', image: '/assets/img/inspecao-acessorios.jpg', norms: 'NR-06, NR-10, NR-11, NR-17, NR-34', description: 'Visa qualificar e aperfeiçoar profissionais em Inspeção de Acessórios de Movimentação de Cargas, com emissão de ART.' },
  { category: 'desenvolvimento', title: 'Carreira Profissional', hours: '8h', image: '/assets/img/carreira-profissional.jpg', norms: '-', description: 'Foco na carreira profissional, visando o comportamento no ambiente de trabalho, visão de crescimento dentro da organização. Trabalho com entrevistas e testes práticos.' },
  // NRs
  { category: 'nr', title: 'NR-05 Formação de Membros de CIPA', hours: '16h', image: '/assets/img/nr05-cipa.jpg', norms: 'NR-05', description: 'Visa capacitar funcionários eleitos e indicados para participação da CIPA na empresa. Inclui regulamentações do MTE, legislações trabalhistas, organização da CIPA, riscos ambientais, mapa de risco, EPIs, EPCs, prevenção de acidentes e primeiros socorros.' },
  { category: 'nr', title: 'NR-06 EPI - Equipamentos de Proteção Individual', hours: '8h', image: '/assets/img/nr06-epi.jpg', norms: 'NR-06', description: 'Uso correto dos EPIs, importância quanto à utilização, preservação, cuidados, normas e responsabilidades. Exemplos de acidentes provocados pelo não uso.' },
  { category: 'nr', title: 'NR-10 Segurança em Instalações e Serviços com Eletricidade', hours: '40h', image: '/assets/img/nr10-eletricidade.jpg', norms: 'NR-10', description: 'Visa capacitar os participantes para uma atuação segura e efetiva, prevenindo acidentes nas atividades de operação e manutenção de instalações elétricas e serviços com eletricidade.' },
  { category: 'nr', title: 'NR-12 Segurança na Operação de Máquinas e Equipamentos', hours: '16h', image: '/assets/img/nr12-maquinas.jpg', norms: 'NR-12', description: 'Capacitação para operação segura de máquinas, abrangendo etapas teórica e prática para habilitação adequada do operador.' },
  { category: 'nr', title: 'NR-20 Líquidos Inflamáveis', hours: '8h', image: '/assets/img/nr20-inflamaveis.jpg', norms: 'NR-20', description: 'Destinado a profissionais que trabalham em instalações de classe I, II e III com inflamáveis e líquidos combustíveis.' },
  { category: 'nr', title: 'NR-33 Espaços Confinados', hours: '16h', image: '/assets/img/nr33-confinados.jpg', norms: 'NR-33', description: 'Visa estabelecer os requisitos mínimos para identificação de espaços confinados e o reconhecimento, avaliação, monitoramento e controle dos riscos existentes.' },
  { category: 'nr', title: 'NR-34 Construção e Reparação Naval', hours: '6-20h', image: '/assets/img/nr34-naval.jpg', norms: 'NR-34', description: 'Diversos cursos que atendem às exigências de qualificação profissional da indústria da construção e reparação naval.' },
  { category: 'nr', title: 'NR-35 Trabalho em Altura', hours: '8h', image: '/assets/img/nr35-altura.jpg', norms: 'NR-35', description: 'Visa estabelecer os requisitos mínimos e as medidas de proteção para o trabalho em altura, envolvendo planejamento, organização e execução.' },
]

const BADGE: Record<CourseCategory, string> = {
  operacional: 'bg-navy-100 text-navy-700',
  desenvolvimento: 'bg-red-100 text-brand-red',
  nr: 'bg-steel-100 text-steel-700',
}
const BADGE_LABEL: Record<CourseCategory, string> = {
  operacional: 'Operacional',
  desenvolvimento: 'Desenvolvimento',
  nr: 'NR',
}

type Tab = 'all' | CourseCategory

// ── Componente ApoioModal ─────────────────────────────────────────────────────
function ApoioModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-navy-700 to-navy-800 rounded-t-2xl p-6">
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center shadow-md transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-28 h-28 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm overflow-hidden">
              <img src="/assets/img/logoNexform.png" alt="NEXFORM Logo" className="max-w-[130px] max-h-[130px] w-auto h-auto object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-white">NEXFORM</h2>
              <p className="text-steel-300 text-sm">Transformação Digital</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-800">Quem Somos</h3>
            </div>
            <p className="text-steel-600 text-sm leading-relaxed">
              A <strong className="text-navy-700">NEXFORM - Transformação Digital</strong> é uma empresa especializada em{' '}
              <strong className="text-brand-red">soluções tecnológicas inovadoras</strong>, atuando no desenvolvimento de sites, sistemas,
              automação de processos e consultoria em transformação digital. Com uma equipe altamente qualificada,
              entregamos projetos que combinam <strong>design moderno, performance e usabilidade</strong>.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-800">Nossos Serviços</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', label: 'Desenvolvimento Web' },
                { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Sistemas Personalizados' },
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Automação de Processos' },
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Segurança da Informação' },
                { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Consultoria Digital' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 p-3 bg-steel-50 rounded-lg">
                  <svg className="w-5 h-5 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon}/></svg>
                  <span className="text-sm text-steel-700">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-800">Contato</h3>
            </div>
            <div className="space-y-3">
              <a href="mailto:contato@nexform.com.br" className="flex items-center gap-3 text-steel-600 hover:text-brand-red transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                contato@nexform.com.br
              </a>
              <a href="https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-steel-600 hover:text-brand-red transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn NEXFORM
              </a>
            </div>
          </div>

          <div className="border-t border-steel-200 pt-4">
            <p className="text-center text-xs text-steel-400">
              Este site foi desenvolvido com ❤️ pela <strong className="text-navy-600">NEXFORM - Transformação Digital</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente CourseModal ────────────────────────────────────────────────────
function CourseModal({ course, courseId, onClose }: { course: Course; courseId?: string; onClose: () => void }) {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const waUrl = buildWhatsAppUrl(WA, `Olá! Tenho interesse no curso: ${course.title}`)

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative rounded-t-2xl overflow-hidden h-44">
          <img src={course.image} alt={course.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/assets/img/empilhadeira.jpg' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center shadow-md transition-colors backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="font-heading font-bold text-xl text-white leading-tight">{course.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[course.category]} bg-white/90`}>{BADGE_LABEL[course.category]}</span>
              <span className="text-white/80 text-sm">{course.hours}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-navy-800 mb-2">Sobre o curso</h3>
            <p className="text-steel-600 text-sm leading-relaxed">{course.description}</p>
          </div>

          {course.norms && course.norms !== '-' && (
            <div>
              <h3 className="font-semibold text-navy-800 mb-2">Normas abrangidas</h3>
              <div className="flex flex-wrap gap-2">
                {course.norms.split(',').map(n => (
                  <span key={n.trim()} className="text-xs font-medium bg-steel-100 text-steel-700 px-2.5 py-1 rounded-full">{n.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {courseId && (
              <button
                onClick={() => { onClose(); navigate(`/cursos/${courseId}`) }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
              >
                Ver detalhes do curso
              </button>
            )}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Tenho interesse
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export function HomePage() {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [apoioOpen, setApoioOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<{ course: Course; courseId?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [cursoIdMap, setCursoIdMap] = useState<Record<string, string>>({})

  useEffect(() => {
    cursosService.getAtivos().then(cursos => {
      const map: Record<string, string> = {}
      cursos.forEach(c => { map[slugify(c.titulo)] = c.id })
      setCursoIdMap(map)
    }).catch(() => {})
  }, [])
  const [showBackTop, setShowBackTop] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', course: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const revealRefs = useRef<HTMLElement[]>([])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    revealRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Back to top
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const addReveal = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  const filteredCourses = activeTab === 'all' ? COURSES : COURSES.filter(c => c.category === activeTab)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { name, email, phone, course } = contactForm
    if (!name || !email || !phone || !course) { setContactStatus('error'); return }
    const msg = `Olá! Tenho interesse em saber mais sobre os cursos.\n\nNome: ${name}\nE-mail: ${email}\nTelefone: ${phone}\nCurso: ${course}${contactForm.message ? `\nMensagem: ${contactForm.message}` : ''}`
    window.open(buildWhatsAppUrl(WA, msg), '_blank')
    setContactStatus('success')
    setContactForm({ name: '', email: '', phone: '', course: '', message: '' })
  }

  return (
    <>
      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        onRegisterClick={() => setRegisterOpen(true)}
        onApoioClick={() => setApoioOpen(true)}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true) }} />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true) }} />
      {apoioOpen && <ApoioModal onClose={() => setApoioOpen(false)} />}
      {selectedCourse && <CourseModal course={selectedCourse.course} courseId={selectedCourse.courseId} onClose={() => setSelectedCourse(null)} />}

      <main id="main-content">

        {/* ── HERO ── */}
        <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          </div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/90 font-medium">Matrículas Abertas</span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
              Um novo conceito em<br />
              <span className="text-gradient">qualificação profissional</span>
            </h1>

            <p className="text-lg sm:text-xl text-steel-300 max-w-2xl mx-auto mb-10">
              Capacitando profissionais para um futuro melhor.
              Formação, capacitação, certificação e desenvolvimento de pessoas e empresas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/painel" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-heading font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-red/25 hover:-translate-y-0.5">
                  Acessar Painel
                </Link>
              ) : (
                <a href="#cursos" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-heading font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-red/25 hover:-translate-y-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  Conheça Nossos Cursos
                </a>
              )}
              <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-xl border border-white/20 transition-all duration-200 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Faça sua Matrícula
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-white/10">
              {[
                { value: '24', label: 'Cursos Disponíveis' },
                { value: '10', label: 'Anos de Experiência' },
                { value: '200+', label: 'Alunos Formados' },
                { value: '8', label: 'NRs Atendidas' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <span className="block font-heading font-bold text-3xl sm:text-4xl text-white">{stat.value}</span>
                  <span className="text-sm text-steel-400 mt-1 block">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
          </div>
        </section>

        {/* ── SOBRE ── */}
        <section id="sobre" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 scroll-reveal" ref={addReveal}>
              <span className="inline-block text-brand-red font-semibold text-sm uppercase tracking-widest mb-3">Quem Somos</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-navy-800 mb-4">Sobre Nós</h2>
              <div className="w-20 h-1 bg-brand-red mx-auto rounded-full" />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="scroll-reveal" ref={addReveal}>
                <p className="text-lg text-steel-600 leading-relaxed mb-6">
                  Criada com o objetivo de levar o conhecimento e oportunidades, a <strong className="text-navy-700">ELEVA BRASIL TREINAMENTOS</strong> tem por missão a <strong className="text-navy-700">FORMAÇÃO, CAPACITAÇÃO, CERTIFICAÇÃO E DESENVOLVIMENTO</strong> de pessoas e empresas.
                </p>
                <p className="text-lg text-steel-600 leading-relaxed mb-8">
                  Nosso foco está na ministração de treinamentos com qualidade através de uma equipe qualificada e experiente.
                </p>
                <ul className="space-y-4">
                  {[
                    'Formação e reciclagem para operadores',
                    'Aplicação de Normas Regulamentadoras (NRs)',
                    'Equipamentos de movimentação de cargas',
                    'Segurança Operacional e Inspeção de equipamentos',
                    'Desenvolvimento de carreira profissional',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-brand-red/10 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3.5 h-3.5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      </span>
                      <span className="text-steel-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-lg text-navy-600 font-medium italic border-l-4 border-brand-red pl-4">
                  "Seja você pessoa ou empresa, temos o treinamento certo que vai fazer toda diferença!"
                </p>
              </div>

              <div className="space-y-6 scroll-reveal" ref={addReveal}>
                {[
                  {
                    color: 'bg-navy-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Missão',
                    bg: 'from-navy-50 to-white border-navy-100',
                    items: ['Ser referência na formação, capacitação e certificação.', 'Atender às necessidades do cliente.', 'Levar conhecimento e oportunidades a todos de forma clara e consistente.'],
                  },
                  {
                    color: 'bg-brand-red', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', title: 'Visão',
                    bg: 'from-red-50/50 to-white border-red-100',
                    items: ['Alcançar a excelência e referência no mercado.', 'Entender e buscar soluções para agregar aos nossos clientes.', 'Oferecer um diferencial para empresas e pessoas.'],
                  },
                  {
                    color: 'bg-steel-700', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Valores',
                    bg: 'from-steel-50 to-white border-steel-200',
                    items: ['Integridade - própria e com nossos clientes.', 'Responsabilidade - com nosso compromisso e nossas ações.', 'Excelência - dedicação em fazer a coisa certa.'],
                  },
                ].map(card => (
                  <div key={card.title} className={`bg-gradient-to-br ${card.bg} border rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon}/></svg>
                      </div>
                      <h3 className="font-heading font-bold text-xl text-navy-800">{card.title}</h3>
                    </div>
                    <ul className="space-y-2 text-steel-600">
                      {card.items.map(i => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVIÇOS BANNER ── */}
        <section className="py-16 bg-navy-800 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {[
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Pessoas e Empresas', sub: 'Atendimento personalizado' },
                { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Online e Presencial', sub: 'Flexibilidade total' },
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Certificação', sub: 'Certificados reconhecidos' },
                { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', title: 'Consultorias', sub: 'Soluções sob medida' },
              ].map(item => (
                <div key={item.title} className="scroll-reveal" ref={addReveal}>
                  <svg className="w-10 h-10 mx-auto mb-3 text-brand-red-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg>
                  <h3 className="font-heading font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-steel-300 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CURSOS ── */}
        <section id="cursos" className="py-20 lg:py-28 bg-steel-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 scroll-reveal" ref={addReveal}>
              <span className="inline-block text-brand-red font-semibold text-sm uppercase tracking-widest mb-3">Nosso Portfólio</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-navy-800 mb-4">Conheça Nossos Cursos</h2>
              <p className="text-steel-500 max-w-2xl mx-auto text-lg">24 treinamentos especializados para sua qualificação profissional</p>
              <div className="w-20 h-1 bg-brand-red mx-auto rounded-full mt-4" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {([['all', 'Todos'], ['operacional', 'Operacional'], ['desenvolvimento', 'Desenvolvimento'], ['nr', 'Normas Regulamentadoras']] as [Tab, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`course-tab${activeTab === key ? ' active' : ''}`}>{label}</button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCourses.map(course => {
                const courseId = cursoIdMap[slugify(course.title)]
                return (
                <article key={course.title} className="course-card scroll-reveal cursor-pointer" ref={addReveal} onClick={() => setSelectedCourse({ course, courseId })}>
                  <div className="course-img-wrapper">
                    <img src={course.image} alt={course.title} className="course-img" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = '/assets/img/empilhadeira.jpg' }} />
                  </div>
                  <div className="course-card-body">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <span className={`course-badge ${BADGE[course.category]}`}>{BADGE_LABEL[course.category]}</span>
                      <span className="course-hours">{course.hours}</span>
                    </div>
                  </div>
                </article>
                )
              })}
            </div>

            <div className="text-center mt-12 scroll-reveal" ref={addReveal}>
              <a href={buildWhatsAppUrl(WA, 'Olá! Gostaria de saber mais sobre os cursos!')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-heading font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-red/25">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Faça sua Matrícula Agora
              </a>
            </div>
          </div>
        </section>

        {/* ── DESENVOLVIMENTO / EQUIPE ── */}
        <section id="desenvolvimento" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 scroll-reveal" ref={addReveal}>
              <span className="inline-block text-brand-red font-semibold text-sm uppercase tracking-widest mb-3">Nossa Equipe</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-navy-800 mb-4">Nossos Colaboradores</h2>
              <div className="w-20 h-1 bg-brand-red mx-auto rounded-full mb-6" />
              <p className="text-lg text-steel-600 max-w-3xl mx-auto">
                A ELEVA BRASIL TREINAMENTOS conta com instrutores formados e com mais de <strong className="text-navy-700">10 anos de experiência</strong> no mercado de trabalho, aumentando a qualidade do ensino na parte teórica e prática.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { color: 'bg-navy-500', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', title: 'Óleo e Gás', sub: 'Experiência em plataformas e refinarias' },
                { color: 'bg-brand-red', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', title: 'Movimentação de Cargas', sub: 'Içamento, transporte e posicionamento' },
                { color: 'bg-steel-700', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', title: 'Instrução em Equipamentos', sub: 'Treinamento prático especializado' },
                { color: 'bg-navy-500', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', title: 'Montagem de Equipamentos', sub: 'Montagem e desmontagem segura' },
                { color: 'bg-brand-red', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Inspeção de Acessórios', sub: 'Dimensionamento e uso seguro' },
                { color: 'bg-steel-700', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5', title: 'Operações Portuárias', sub: 'Logística e operação em portos' },
              ].map((card, i) => (
                <div key={card.title} className="group bg-gradient-to-br from-navy-50 to-white border border-navy-100 rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 scroll-reveal" ref={addReveal} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-16 h-16 ${card.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon}/></svg>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-navy-800 mb-2">{card.title}</h3>
                  <p className="text-steel-500 text-sm">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTATO ── */}
        <section id="contato" className="py-20 lg:py-28 bg-steel-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 scroll-reveal" ref={addReveal}>
              <span className="inline-block text-brand-red font-semibold text-sm uppercase tracking-widest mb-3">Fale Conosco</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-navy-800 mb-4">Entre em Contato</h2>
              <div className="w-20 h-1 bg-brand-red mx-auto rounded-full" />
            </div>

            <div className="grid lg:grid-cols-5 gap-10">
              {/* Info */}
              <div className="lg:col-span-2 space-y-6 scroll-reveal" ref={addReveal}>
                {[
                  { bg: 'bg-green-100', icon: 'text-green-600', path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', title: 'Telefone / WhatsApp', content: <p className="text-steel-600 text-lg font-medium">(22) 99858-8802</p> },
                  { bg: 'bg-blue-100', icon: 'text-blue-600', path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'E-mail', content: <a href="mailto:elevabrtreinamentos@gmail.com" className="text-steel-600 hover:text-brand-red transition-colors">elevabrtreinamentos@gmail.com</a> },
                  { bg: 'bg-red-100', icon: 'text-brand-red', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', title: 'Endereço', content: <><p className="text-steel-600">Av. Liberdade, 43 - Grussaí</p><p className="text-steel-600">São João da Barra, RJ</p></> },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-steel-200 hover:shadow-lg transition-shadow duration-300">
                    <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <svg className={`w-6 h-6 ${item.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path}/></svg>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-navy-800 mb-1">{item.title}</h3>
                      {item.content}
                    </div>
                  </div>
                ))}

                {/* Redes sociais */}
                <div className="flex gap-3 pt-2">
                  <a href="https://www.instagram.com/elevabrtreinamentos" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-12 h-12 bg-white border border-steel-200 rounded-xl flex items-center justify-center hover:bg-pink-50 hover:border-pink-300 transition-all duration-200">
                    <svg className="w-5 h-5 text-steel-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://linkedin.com/in/eleva-brasil-treinamentos-e-consultorias-04793829b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-12 h-12 bg-white border border-steel-200 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                    <svg className="w-5 h-5 text-steel-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="mailto:elevabrtreinamentos@gmail.com" aria-label="E-mail" className="w-12 h-12 bg-white border border-steel-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all duration-200">
                    <svg className="w-5 h-5 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </a>
                </div>
              </div>

              {/* Formulário */}
              <div className="lg:col-span-3 scroll-reveal" ref={addReveal}>
                <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-steel-200 shadow-sm" noValidate>
                  <h3 className="font-heading font-bold text-xl text-navy-800 mb-6">Preencha o formulário para mais informações</h3>
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="lbl">Nome <span className="text-brand-red">*</span></label>
                      <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} className="inp" placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <label className="lbl">E-mail <span className="text-brand-red">*</span></label>
                      <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} className="inp" placeholder="seu@email.com" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="lbl">Telefone <span className="text-brand-red">*</span></label>
                      <input type="tel" required value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} className="inp" placeholder="(22) 99999-9999" />
                    </div>
                    <div>
                      <label className="lbl">Curso de Interesse <span className="text-brand-red">*</span></label>
                      <select required value={contactForm.course} onChange={e => setContactForm(p => ({ ...p, course: e.target.value }))} className="inp bg-white">
                        <option value="" disabled>Selecione um curso</option>
                        <optgroup label="Operacional">
                          {COURSES.filter(c => c.category === 'operacional').map(c => <option key={c.title}>{c.title}</option>)}
                        </optgroup>
                        <optgroup label="Desenvolvimento">
                          {COURSES.filter(c => c.category === 'desenvolvimento').map(c => <option key={c.title}>{c.title}</option>)}
                        </optgroup>
                        <optgroup label="Normas Regulamentadoras">
                          {COURSES.filter(c => c.category === 'nr').map(c => <option key={c.title}>{c.title}</option>)}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="lbl">Mensagem</label>
                    <textarea rows={4} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} className="inp resize-y" placeholder="Escreva sua mensagem aqui..." />
                  </div>
                  <button type="submit" className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-heading font-bold text-lg px-6 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-red/25">
                    Enviar Mensagem
                  </button>
                  {contactStatus === 'success' && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                      Mensagem enviada! Você será redirecionado ao WhatsApp.
                    </div>
                  )}
                  {contactStatus === 'error' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                      Por favor, preencha todos os campos obrigatórios.
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Mapa */}
            <div className="mt-12 rounded-2xl overflow-hidden border border-steel-200 shadow-sm scroll-reveal" ref={addReveal}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14800!2d-41.0441976!3d-21.7043911!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbdd6b6d8e10bd9%3A0x89bda4d4a8f0f5e0!2sGrussa%C3%AD%2C%20S%C3%A3o%20Jo%C3%A3o%20da%20Barra%20-%20RJ!5e0!3m2!1spt-BR!2sbr!4v1680000000000"
                width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da Eleva Brasil Treinamentos"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                </div>
                <div>
                  <span className="block font-heading font-bold text-lg leading-tight">Eleva Brasil</span>
                  <span className="block text-xs text-steel-400 tracking-wider">Treinamentos e Consultorias</span>
                </div>
              </div>
              <p className="text-steel-400 text-sm leading-relaxed italic">Capacitando profissionais para um futuro melhor!</p>
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Contato</h3>
              <ul className="space-y-3 text-steel-400 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  (22) 99858-8802
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <a href="mailto:elevabrtreinamentos@gmail.com" className="hover:text-white transition-colors">elevabrtreinamentos@gmail.com</a>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>Av. Liberdade, 43 - Grussaí<br />São João da Barra, RJ</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Serviços</h3>
              <ul className="space-y-2 text-steel-400 text-sm">
                {['Pessoas e Empresas', 'Treinamentos e Cursos', 'Online e Presencial', 'Consultorias', 'Formação e Capacitação', 'Certificação e Desenvolvimento', 'Equipamentos e Acessórios', 'Normas Regulamentadoras'].map(s => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Siga-nos</h3>
              <div className="flex gap-3 mb-6">
                <a href="https://www.instagram.com/elevabrtreinamentos" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-pink-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://linkedin.com/in/eleva-brasil-treinamentos-e-consultorias-04793829b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="mailto:elevabrtreinamentos@gmail.com" aria-label="E-mail" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </a>
              </div>
              <a href={buildWhatsAppUrl(WA, 'Olá! Gostaria de fazer minha matrícula!')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Faça sua Matrícula!
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-steel-500 text-sm text-center sm:text-left">
              &copy; {new Date().getFullYear()} Eleva Brasil Treinamentos e Consultorias. Todos os direitos reservados.{' '}
              Site desenvolvido por{' '}
              <a href="https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/" target="_blank" rel="noopener noreferrer" className="text-steel-400 hover:text-white transition-colors">
                NEXFORM - Transformação Digital
              </a>.
            </p>
            <Link to="/politica-de-privacidade" className="text-steel-500 text-sm hover:text-white transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp flutuante ── */}
      <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:scale-110 group">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        <span className="absolute right-full mr-3 bg-white text-steel-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Fale Conosco
        </span>
      </a>

      {/* ── Back to top ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
        className={`fixed bottom-6 left-6 z-50 w-12 h-12 bg-navy-700 hover:bg-navy-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${showBackTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
      </button>
    </>
  )
}
