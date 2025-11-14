import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || '')

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Solo pasar props específicas a componentes conocidos
          if (child.type === SelectTrigger || (child.type as any)?.displayName === 'SelectTrigger') {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              setIsOpen,
              selectedValue,
            })
          } else if (child.type === SelectContent || (child.type as any)?.displayName === 'SelectContent') {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              setIsOpen,
              handleValueChange,
            })
          }
          return child
        }
        return child
      })}
    </div>
  )
}

const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const SelectValue: React.FC<SelectValueProps & { selectedValue?: string }> = ({ 
  placeholder, 
  selectedValue 
}) => {
  return <span>{selectedValue || placeholder}</span>
}

const SelectTrigger: React.FC<SelectTriggerProps & { 
  isOpen?: boolean; 
  setIsOpen?: (open: boolean) => void;
  selectedValue?: string;
}> = ({ 
  className, 
  children, 
  isOpen, 
  setIsOpen,
  selectedValue,
  ...props 
}) => {
  // Solo pasar props válidas para el elemento button
  const validButtonProps: any = {};
  Object.keys(props).forEach(key => {
    // Filtrar props específicas que no deben ir al DOM
    if (!['handleValueChange', 'onValueChange', 'defaultValue', 'value'].includes(key)) {
      validButtonProps[key] = (props as any)[key];
    }
  });
  
  // Si children es un elemento React (no SelectValue), renderizarlo directamente
  const hasCustomContent = React.Children.toArray(children).some(
    child => React.isValidElement(child) && child.type !== SelectValue
  );
  
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen?.(!isOpen)}
      {...validButtonProps}
    >
      {hasCustomContent ? children : (selectedValue || children)}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectContent: React.FC<SelectContentProps & { 
  isOpen?: boolean;
  handleValueChange?: (value: string) => void;
}> = ({ 
  children, 
  isOpen,
  handleValueChange,
}) => {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden rounded-md border bg-white shadow-md">
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              handleValueChange,
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

const SelectLabel: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
)

const SelectItem: React.FC<SelectItemProps & { 
  handleValueChange?: (value: string) => void;
}> = ({ 
  value,
  children, 
  handleValueChange,
}) => (
  <div
    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
    onClick={() => handleValueChange?.(value)}
  >
    {children}
  </div>
)

const SelectSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
