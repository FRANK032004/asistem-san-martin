import * as React from "react"
import { ChevronRight, Check, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// ===== INTERFACES =====
interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  inset?: boolean
  variant?: "default" | "destructive"
}

interface DropdownMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

interface DropdownMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  value: string
  checked?: boolean
}

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  inset?: boolean
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

interface DropdownMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  inset?: boolean
}

interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DropdownMenuRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

// ===== CONTEXT =====
const DropdownContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

// ===== MAIN COMPONENT =====
const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown-menu]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left" data-dropdown-menu>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

// ===== TRIGGER COMPONENT =====
const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  asChild, 
  className 
}) => {
  const context = React.useContext(DropdownContext)
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    context?.setIsOpen(!context.isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      className: cn(className, (children.props as any).className),
    })
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}

// ===== CONTENT COMPONENT =====
const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  align = 'start',
  className,
  ...props
}) => {
  const context = React.useContext(DropdownContext)
  
  if (!context?.isOpen) return null

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <div 
      className={cn(
        "absolute top-full z-50 mt-1 w-56 rounded-md border bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ===== ITEM COMPONENT =====
const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className, 
  inset,
  variant = "default",
  onClick,
  ...props 
}) => {
  const context = React.useContext(DropdownContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    context?.setIsOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 rounded-sm",
        variant === "destructive" && "text-red-600 hover:bg-red-50 focus:bg-red-50",
        inset && "pl-8",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

// ===== CHECKBOX ITEM COMPONENT =====
const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({ 
  children, 
  className,
  checked,
  onCheckedChange,
  onClick,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    onCheckedChange?.(!checked)
    onClick?.(e)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center py-1.5 pr-2 pl-8 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 rounded-sm",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

// ===== RADIO GROUP COMPONENT =====
const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = ({ 
  children, 
  value, 
  onValueChange,
  className,
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownMenuRadioItem) {
          const childProps = child.props as DropdownMenuRadioItemProps
          return React.cloneElement(child as React.ReactElement<DropdownMenuRadioItemProps>, {
            checked: childProps.value === value,
            onClick: (e: React.MouseEvent<HTMLDivElement>) => {
              childProps.onClick?.(e)
              onValueChange?.(childProps.value)
            },
          })
        }
        return child
      })}
    </div>
  )
}

// ===== RADIO ITEM COMPONENT =====
const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({ 
  children, 
  className,
  value,
  checked,
  onClick,
  ...props 
}) => {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center py-1.5 pr-2 pl-8 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 rounded-sm",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Circle className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </div>
  )
}

// ===== LABEL COMPONENT =====
const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  className, 
  inset,
  ...props 
}) => (
  <div 
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-gray-900",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

// ===== SEPARATOR COMPONENT =====
const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className,
  ...props 
}) => (
  <div 
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)} 
    {...props}
  />
)

// ===== SHORTCUT COMPONENT =====
const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ 
  children, 
  className,
  ...props 
}) => (
  <span 
    className={cn("ml-auto text-xs tracking-widest text-gray-500", className)}
    {...props}
  >
    {children}
  </span>
)

// ===== GROUP COMPONENT =====
const DropdownMenuGroup: React.FC<DropdownMenuGroupProps> = ({ 
  children, 
  className,
  ...props 
}) => (
  <div className={className} {...props}>
    {children}
  </div>
)

// ===== SUB COMPONENTS =====
const DropdownMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)

const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({ 
  children, 
  className, 
  inset,
  ...props 
}) => (
  <div 
    className={cn(
      "flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 rounded-sm",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </div>
)

const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({ 
  children, 
  className,
  ...props 
}) => (
  <div className={cn("py-1", className)} {...props}>
    {children}
  </div>
)

const DropdownMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)

// ===== EXPORTS =====
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
}
