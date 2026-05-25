export function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const text =
    size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'
  return (
    <span className={`font-bold tracking-tight ${text}`}>
      <span className="text-netflix-red">Netflix</span>
      <span className="text-white"> Hub</span>
    </span>
  )
}
