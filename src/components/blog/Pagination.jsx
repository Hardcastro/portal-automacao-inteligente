import Button from '../UI/Button'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação de relatórios">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        Anterior
      </Button>

      <div className="flex items-center gap-1" role="list">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-luminous ${
              page === currentPage ? 'bg-cyan-luminous text-space-blue' : 'bg-white/5 text-mist-gray hover:bg-white/10'
            }`}
            aria-label={`Ir para página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        Próxima
      </Button>
    </nav>
  )
}

export default Pagination
