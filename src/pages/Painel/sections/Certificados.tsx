export function Certificados() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-montserrat text-xl font-bold text-steel-800">Meus Certificados</h2>
      <div className="bg-white rounded-2xl border border-steel-200 p-10 text-center">
        <div className="w-16 h-16 bg-steel-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="font-medium text-steel-600 mb-1">Nenhum certificado ainda</p>
        <p className="text-sm text-steel-400">Complete um curso para receber seu certificado.</p>
      </div>
    </div>
  )
}
