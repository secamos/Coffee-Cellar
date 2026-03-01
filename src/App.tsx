import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Calendar } from './pages/Calendar'
import { BeanLibrary } from './pages/BeanLibrary'
import { Records } from './pages/Records'
import { Outings } from './pages/Outings'
import { Cuppings } from './pages/Cuppings'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'
import { RoasterResting } from './pages/RoasterResting'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const initSampleDataIfEmpty = useStore((s) => s.initSampleDataIfEmpty)

  useEffect(() => {
    initSampleDataIfEmpty()
  }, [initSampleDataIfEmpty])

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/beans" element={<BeanLibrary />} />
          <Route path="/records" element={<Records />} />
          <Route path="/outings" element={<ErrorBoundary><Outings /></ErrorBoundary>} />
          <Route path="/cuppings" element={<Cuppings />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/roaster-resting" element={<RoasterResting />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
