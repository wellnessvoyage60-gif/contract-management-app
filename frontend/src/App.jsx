import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import contractProTheme from './theme/contractProTheme';

// ── Pages ──────────────────────────────────────────────────────────────────
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import ContractsList   from './pages/ContractsList';
import ContractDetail  from './pages/ContractDetail';
import ContractUpload  from './pages/ContractUpload';
import EditorPage      from './pages/EditorPage';
import ArchivePage     from './pages/ArchivePage';
import ReportsPage     from './pages/ReportsPage';

// ── Protected Route ────────────────────────────────────────────────────────
// Key must match AuthContext: localStorage.setItem('token', ...)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider theme={contractProTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>

            {/* ── Public ── */}
            <Route path="/login" element={<Login />} />

            {/* ── Dashboard ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            {/* ── Contracts ── */}
            <Route path="/contracts" element={
              <ProtectedRoute><ContractsList /></ProtectedRoute>
            } />
            <Route path="/contracts/upload" element={
              <ProtectedRoute><ContractUpload /></ProtectedRoute>
            } />
            {/* ✅ View single contract — this was missing! */}
            <Route path="/contracts/:id" element={
              <ProtectedRoute><ContractDetail /></ProtectedRoute>
            } />

            {/* ── OnlyOffice Editor ── */}
            <Route path="/editor/:id" element={
              <ProtectedRoute><EditorPage /></ProtectedRoute>
            } />

            {/* ── Archive / Repository ── */}
            <Route path="/archive" element={
              <ProtectedRoute><ArchivePage /></ProtectedRoute>
            } />
            {/* alias in case links use /repository */}
            <Route path="/repository" element={
              <ProtectedRoute><ArchivePage /></ProtectedRoute>
            } />

            {/* ── Reports ── */}
            <Route path="/reports" element={
              <ProtectedRoute><ReportsPage /></ProtectedRoute>
            } />

            {/* ── Default / Fallback ── */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}