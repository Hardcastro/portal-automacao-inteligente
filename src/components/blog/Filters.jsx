import { Filter, Search } from 'lucide-react'

const Select = ({ id, label, options, value, onChange }) => (
  <label className="flex flex-col gap-1 text-sm text-blue-gray" htmlFor={id}>
    <span className="flex items-center gap-2 font-semibold text-mist-gray">{label}</span>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-mist-gray focus:outline-none focus:ring-2 focus:ring-cyan-luminous"
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-space-blue text-mist-gray">
          {option === 'todos' ? 'Todos' : option}
        </option>
      ))}
    </select>
  </label>
)

const Filters = ({
  categories,
  authors,
  years,
  activeCategory,
  activeAuthor,
  activeYear,
  searchQuery,
  onCategoryChange,
  onAuthorChange,
  onYearChange,
  onSearchChange
}) => {
  return (
    <div className="flex flex-col gap-4" aria-label="Filtros do blog">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select id="category-filter" label="Categoria" options={categories} value={activeCategory} onChange={onCategoryChange} />
        <Select id="author-filter" label="Autor" options={authors} value={activeAuthor} onChange={onAuthorChange} />
        <Select id="year-filter" label="Ano" options={years} value={activeYear} onChange={onYearChange} />
      </div>

      <label
        className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 text-blue-gray focus-within:ring-2 focus-within:ring-cyan-luminous"
        htmlFor="search-input"
      >
        <Search className="w-4 h-4" aria-hidden />
        <input
          id="search-input"
          type="search"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por título, resumo ou tag"
          className="bg-transparent flex-1 outline-none text-sm"
          aria-label="Buscar relatórios"
        />
      </label>

      <div className="flex items-center gap-2 text-xs text-blue-gray" aria-hidden>
        <Filter className="w-4 h-4" />
        <span>Use filtros e busca para refinar os relatórios.</span>
      </div>
    </div>
  )
}

export default Filters
