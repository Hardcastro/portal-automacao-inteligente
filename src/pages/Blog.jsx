import { useEffect, useState } from 'react'
import { getReports } from '../api/getReports'
import ReportCard from '../components/ReportCard'

export default function Blog() {
  const [reports, setReports] = useState([])

  useEffect(() => {
    getReports()
      .then((res) => {
        console.log('Dados do backend:', res.reports)
        setReports(res.reports ?? [])
      })
      .catch((err) => {
        console.error('Erro ao buscar relatórios:', err)
      })
  }, [])

  if (reports.length === 0) {
    return <p>Nenhum relatório disponível no momento.</p>
  }

  return (
    <div className="blog">
      <h1>Blog</h1>
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  )
}
