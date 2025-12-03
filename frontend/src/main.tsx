import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import GamesPage from './pages/Games.tsx'
import GamePlayPage from './pages/GamePlay.tsx'
import ScannerPage from './pages/Scanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<ScannerPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/:key" element={<GamePlayPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
