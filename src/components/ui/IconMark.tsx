interface IconMarkProps {
  className?: string
}

export default function IconMark({ className }: IconMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="App mark"
      className={className}
      fill="none"
    >
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" />
      <path d="M34 16l-10 18h10l-4 14 12-20H32l2-12z" fill="currentColor" />
      <path
        d="M32 10v6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
