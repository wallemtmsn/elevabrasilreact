import { Link } from 'react-router-dom'

export function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-steel-50">
      {/* Header */}
      <header className="bg-navy-500 text-white px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="font-montserrat font-bold text-lg">Política de Privacidade</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-2xl border border-steel-200 p-8 prose prose-steel max-w-none">
          <h1 className="font-montserrat text-2xl font-bold text-navy-500 mb-2">Política de Privacidade</h1>
          <p className="text-steel-400 text-sm mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">1. Quem somos</h2>
            <p className="text-steel-600">
              A <strong>Eleva Brasil Treinamentos e Consultorias</strong> é responsável pelo tratamento dos dados pessoais coletados em nossa plataforma, localizada em São João da Barra – RJ.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">2. Dados coletados</h2>
            <p className="text-steel-600 mb-3">Coletamos os seguintes dados para prestação dos nossos serviços:</p>
            <ul className="list-disc list-inside text-steel-600 space-y-1">
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone</li>
              <li>Empresa e cargo (opcionais)</li>
              <li>Foto de perfil (opcional)</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">3. Finalidade</h2>
            <p className="text-steel-600">
              Os dados são utilizados exclusivamente para identificação do aluno, prestação dos serviços de treinamento, emissão de certificados e comunicação relacionada aos nossos cursos.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">4. Armazenamento e segurança</h2>
            <p className="text-steel-600">
              Os dados são armazenados de forma segura na plataforma Supabase, com criptografia em trânsito (TLS) e em repouso. O acesso é controlado por políticas de segurança em nível de linha (RLS).
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">5. Compartilhamento</h2>
            <p className="text-steel-600">
              Não compartilhamos seus dados pessoais com terceiros, exceto quando exigido por lei ou autoridade competente.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">6. Seus direitos (LGPD)</h2>
            <p className="text-steel-600 mb-3">Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
            <ul className="list-disc list-inside text-steel-600 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados no painel do aluno</li>
              <li>Solicitar a exclusão da sua conta e dados pessoais</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-steel-800 text-lg mb-2">7. Cookies</h2>
            <p className="text-steel-600">
              Utilizamos apenas cookies essenciais para manter a sessão do usuário autenticado. Não utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-steel-800 text-lg mb-2">8. Contato</h2>
            <p className="text-steel-600">
              Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato pelo WhatsApp ou e-mail disponível em nosso site.
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
