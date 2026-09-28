import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Complaints from './pages/Complaints'
import Intelligence from './pages/Intelligence'
import Predictions from './pages/Predictions'
import GisMap from './pages/GisMap'
import Alerts from './pages/Alerts'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/map" element={<GisMap />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppStateProvider>
  )
}
