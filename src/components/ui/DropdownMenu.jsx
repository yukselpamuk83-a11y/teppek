import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

const DropdownMenuContext = React.createContext()

const DropdownMenu = ({ children, onOpenChange }) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = ({ children, className, ...props }) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext)
  
  return (
    <button
      className={cn("outline-none", className)}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </button>
  )
}

const DropdownMenuContent = ({ 
  children, 
  className, 
  align = "center", 
  sideOffset = 4,
  ...props 
}) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuContext)
  const contentRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const alignmentClass = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  }[align]

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95",
        alignmentClass,
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem = ({ 
  children, 
  className, 
  onClick, 
  disabled,
  ...props 
}) => {
  const { onOpenChange } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e) => {
    if (disabled) return
    onClick?.(e)
    onOpenChange(false)
  }

  return (
    <button
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const DropdownMenuLabel = ({ className, ...props }) => (
  <div
    className={cn("px-2 py-1.5 text-sm font-semibold text-gray-900", className)}
    {...props}
  />
)

const DropdownMenuSeparator = ({ className, ...props }) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}