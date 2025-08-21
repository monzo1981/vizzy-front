import * as React from "react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ type, ...props }, ref) => {
    return (
      <input
        type={type}
        className="w-full px-4 py-3 rounded-4xl border border-gray-200/50 bg-white/90 backdrop-blur-sm transition-all duration-200 shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        placeholder:text-gray-400"
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
