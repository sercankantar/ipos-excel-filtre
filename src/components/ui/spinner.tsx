import * as React from 'react'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${className}`} />
  )
}


