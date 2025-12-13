import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import GamesPage from './pages/Games.tsx'
import GamePlayPage from './pages/GamePlay.tsx'
import PasswordPuzzlePage from './pages/PasswordPuzzle.tsx'
import DomainDetectivePage from './pages/DomainDetective.tsx'
import SpotThePhishPage from './pages/SpotThePhish.tsx'
import EssentialsPage from './pages/Essentials.tsx'
import ScannerPage from './pages/Scanner.tsx'
import ProgressPage from './pages/Progress.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import LoginPage from './pages/Login.tsx'
import SignupPage from './pages/Signup.tsx'
import HomePage from './pages/Home.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="games/essentials" element={<EssentialsPage />} />
            <Route path="games/password-puzzle" element={<PasswordPuzzlePage />} />
            <Route path="games/domain-detective" element={<DomainDetectivePage />} />
            <Route path="games/spot-the-phish" element={<SpotThePhishPage />} />
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

