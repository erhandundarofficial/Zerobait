import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import GamesPage from './pages/Games.tsx'
import GamePlayPage from './pages/GamePlay.tsx'
import ScannerPage from './pages/Scanner.tsx'
import ProgressPage from './pages/Progress.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import LoginPage from './pages/Login.tsx'
import SignupPage from './pages/Signup.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<ScannerPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="games/:key" element={<GamePlayPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
