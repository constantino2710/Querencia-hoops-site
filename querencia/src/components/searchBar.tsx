interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Pesquisar...", 
  className = "" 
}: SearchBarProps) {
  return (
    <div className={`relative flex-1 ${className}`}>
      {/* Ícone de Lupa */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>
      
      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
      />
    </div>
  )
}