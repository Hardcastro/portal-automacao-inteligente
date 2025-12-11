import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import PageContainer from './components/Layout/PageContainer'

import Home from './pages/Home'
import Automacao from './pages/Automacao'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Dashboard from './pages/Dashboard'
import ComoAutomatizamos from './pages/ComoAutomatizamos'
import Sobre from './pages/Sobre'
import Contato from './pages/Contato'
import Cliente from './pages/Cliente'

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<PageContainer><Home /></PageContainer>} />
            <Route path="/automacao" element={<PageContainer><Automacao /></PageContainer>} />
            <Route path="/blog" element={<PageContainer><Blog /></PageContainer>} />
            <Route path="/blog/:slug" element={<PageContainer><BlogPost /></PageContainer>} />
            <Route path="/dashboard" element={<PageContainer><Dashboard /></PageContainer>} />
            <Route path="/como-automatizamos" element={<PageContainer><ComoAutomatizamos /></PageContainer>} />
            <Route path="/sobre" element={<PageContainer><Sobre /></PageContainer>} />
            <Route path="/contato" element={<PageContainer><Contato /></PageContainer>} />
            <Route path="/cliente" element={<PageContainer><Cliente /></PageContainer>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

