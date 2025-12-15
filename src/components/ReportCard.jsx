import { Calendar, Clock, Tag, User, AlertTriangle, Zap, Database } from 'lucide-react'
import { CATEGORY_COLORS } from '../constants'
import { tokens } from '../styles/theme'
import Button from './UI/Button'
import Card from './UI/Card'
import { formatDate, getCategoryName } from '../utils/reportHelpers'

const gradientByCategory = (category) => CATEGORY_COLORS[category] || 'from-white/10 to-white/5'

const dataSourceLabels = {
  api: 'API',
  fallback: 'Fallback',
  cache: 'Cache'
}

const ReportCard = ({ report, onReadMore, onPrefetch }) => {
  const handleHover = () => {
    if (onPrefetch) onPrefetch(report)
  }

  const handleClick = () => {
    console.info('[analytics] abrir relatorio', { slug: report.slug })
    onReadMore(report)
  }

  return (
    <Card
      className={`h-full flex flex-col ${tokens.card.hover}`}
      onMouseEnter={handleHover}
      aria-label={`Relatório ${report.title}`}
    >
      <div
        className={`h-48 rounded-lg mb-4 overflow-hidden bg-gradient-to-br ${gradientByCategory(report.category)} flex items-center justify-center`}
      >
        {report.thumbnail ? (
          <img
            src={report.thumbnail}
            alt={report.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl" aria-hidden>
            📄
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className={`${tokens.badge.base} bg-cyan-luminous/10 text-cyan-luminous`}>
          <Zap className="w-3 h-3" />
          <span>{getCategoryName(report.category)}</span>
        </span>
        {report.isNew && (
          <span className={`${tokens.badge.base} bg-neon-green/15 text-neon-green`}>
            🆕 <span>Novo</span>
          </span>
        )}
        {report.isFallback && (
          <span className={`${tokens.badge.base} bg-amber-500/15 text-amber-200`}>
            <AlertTriangle className="w-3 h-3" />
            <span>via fallback</span>
          </span>
        )}
        {report.dataSource && (
          <span className={`${tokens.badge.base} bg-white/10 text-blue-gray`}>
            <Database className="w-3 h-3" />
            <span>{dataSourceLabels[report.dataSource] || report.dataSource}</span>
          </span>
        )}
      </div>

      <h2 className="text-xl font-bold text-mist-gray mb-2 line-clamp-2">{report.title}</h2>
      <p className="text-blue-gray text-sm mb-4 flex-grow line-clamp-3">{report.excerpt}</p>

      {report.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4" aria-label="Tags do relatório">
          {report.tags.slice(0, 3).map((tag, idx) => (
            <span key={`${report.id}-tag-${idx}`} className="px-2 py-1 bg-white/5 text-blue-gray text-xs rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-blue-gray pt-4 border-t border-white/10">
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(report.date)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span className="capitalize">{getCategoryName(report.category)}</span>
        </span>
        {report.readTime && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{report.readTime} min</span>
          </span>
        )}
        {report.author && (
          <span className="inline-flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{report.author}</span>
          </span>
        )}
      </div>

      <div className="mt-4">
        <Button variant="outline" size="sm" className="w-full" onClick={handleClick} aria-label={`Ver relatório ${report.title}`}>
          Ver relatório
        </Button>
      </div>
    </Card>
  )
}

export default ReportCard
