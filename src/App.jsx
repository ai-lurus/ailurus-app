import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DeveloperHome from './pages/DeveloperHome.jsx'
import Learning from './pages/Learning.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminBoard from './pages/admin/Board.jsx'
import AdminProjects from './pages/admin/AdminProjects.jsx'
import AdminTeam from './pages/admin/AdminTeam.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminReviews from './pages/admin/AdminReviews.jsx'
import AdminLearning from './pages/admin/AdminLearning.jsx'
import AdminSprints from './pages/admin/AdminSprints.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import ProjectDocuments from './pages/ProjectDocuments.jsx'
import DevProjects from './pages/DevProjects.jsx'
import Profile from './pages/Profile.jsx'
import LearningMapPage from './features/learning-battles/pages/LearningMapPage.jsx'
import BattlePage from './features/learning-battles/pages/BattlePage.jsx'

const ADMIN_ROLES = ['admin', 'ceo']
function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={ADMIN_ROLES}>{children}</ProtectedRoute>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ChatProvider>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ceo', 'admin', 'client']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={['developer', 'designer']}>
              <DeveloperHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={['developer', 'designer']}>
              <DevProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['ceo', 'admin', 'client', 'developer', 'designer']}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id/documents"
          element={
            <ProtectedRoute allowedRoles={['ceo', 'admin', 'client', 'developer', 'designer']}>
              <ProjectDocuments />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/board" replace />} />
        <Route path="/admin/board" element={<ProtectedRoute allowedRoles={['admin', 'ceo', 'developer', 'designer']}><AdminBoard /></ProtectedRoute>} />
        <Route path="/admin/sprints"  element={<AdminRoute><AdminSprints /></AdminRoute>} />
        <Route path="/admin/projects" element={<AdminRoute><AdminProjects /></AdminRoute>} />
        <Route path="/admin/team"     element={<AdminRoute><AdminTeam /></AdminRoute>} />
        <Route path="/admin/reports"  element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/reviews"  element={<AdminRoute><AdminReviews /></AdminRoute>} />
        <Route path="/admin/learning" element={<AdminRoute><AdminLearning /></AdminRoute>} />

        <Route
          path="/learning"
          element={
            <ProtectedRoute allowedRoles={['developer', 'designer']}>
              <Learning />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learning/battles"
          element={
            <ProtectedRoute allowedRoles={['developer', 'designer']}>
              <LearningMapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learning/battles/:topicId"
          element={
            <ProtectedRoute allowedRoles={['developer', 'designer']}>
              <BattlePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['ceo', 'admin', 'developer', 'designer', 'client']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
