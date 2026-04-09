import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import { HomePage } from '@/pages/Home'
import { PainelPage } from '@/pages/Painel'
import { AdminPage } from '@/pages/Admin'
import { PrivacidadePage } from '@/pages/Privacidade'
import { CursoPlayerPage } from '@/pages/CursoPlayer'
import { CursoLandingPage } from '@/pages/CursoLanding'
import { ResetPasswordPage } from '@/pages/ResetPassword'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/politica-de-privacidade" element={<PrivacidadePage />} />
      <Route path="/cursos/:id" element={<CursoLandingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/curso/:id" element={<CursoPlayerPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
