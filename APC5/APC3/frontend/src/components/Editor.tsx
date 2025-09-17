import React from 'react'

type EditorProps = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function Editor({ value, onChange, placeholder, className }: EditorProps) {
  return (
    <div className={`card p-0 ${className || ''}`}>
      <textarea
        className="w-full min-h-[260px] bg-transparent outline-none resize-y p-3 font-mono text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  )
}


