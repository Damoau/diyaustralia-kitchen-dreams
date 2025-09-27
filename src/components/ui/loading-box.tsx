import { cn } from "@/lib/utils"

interface LoadingBoxProps {
  className?: string
  message?: string
}

export const LoadingBox = ({ className, message = "Packing items..." }: LoadingBoxProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Animated Box */}
      <div className="relative">
        {/* Box container */}
        <div className="w-16 h-16 border-2 border-primary rounded-lg relative bg-background shadow-lg">
          {/* Box lid */}
          <div className="absolute -top-1 left-0 right-0 h-2 bg-primary rounded-t-lg animate-pulse" />
          
          {/* Items being packed (animated dots) */}
          <div className="absolute inset-2 flex flex-wrap gap-1 justify-center items-center">
            <div 
              className="w-2 h-2 bg-primary rounded-full animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '1000ms' }}
            />
            <div 
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" 
              style={{ animationDelay: '200ms', animationDuration: '1000ms' }}
            />
            <div 
              className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" 
              style={{ animationDelay: '400ms', animationDuration: '1000ms' }}
            />
          </div>
          
          {/* Packing tape effect */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/30 transform -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary/30 transform -translate-x-1/2" />
        </div>
        
        {/* Motion lines to show packing action */}
        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-6 bg-primary/20 animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-primary/30 animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-1 h-2 bg-primary/40 animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex justify-center space-x-1 mt-2">
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className="w-2 h-2 bg-primary rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}