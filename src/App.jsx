import { Routes, Route } from 'react-router-dom'
import PublicLayout from './public/PublicLayout.jsx'
import Home from './public/Home.jsx'
import Teams from './public/Teams.jsx'
import Challenges from './public/Challenges.jsx'
import Mystery from './public/Mystery.jsx'
import Timeline from './public/Timeline.jsx'
import Ranking from './public/Ranking.jsx'
import Ceremony from './public/Ceremony.jsx'
import AdminApp from './admin/AdminApp.jsx'

export default function App() {
  return (
    <Routes>
      {/* Site public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/equipes" element={<Teams />} />
        <Route path="/epreuves" element={<Challenges />} />
        <Route path="/mystere" element={<Mystery />} />
        <Route path="/aventure" element={<Timeline />} />
        <Route path="/classement" element={<Ranking />} />
      </Route>

      {/* Ecran ceremonie (plein ecran, sans navigation) */}
      <Route path="/ceremonie" element={<Ceremony />} />

      {/* Espace admin */}
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  )
}
