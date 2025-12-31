import {
  CircleCheck,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-white border border-gray-200 shadow-lg rounded-xl font-[Nunito]",
          title: "text-gray-800 font-semibold text-sm",
          description: "text-gray-600 text-sm",
          success: "bg-white border-green-200",
          error: "bg-white border-red-200",
          warning: "bg-white border-yellow-200",
          info: "bg-white border-blue-200",
        },
      }}
      icons={{
        success: <CircleCheck className="size-5 text-green-500" />,
        info: <Info className="size-5 text-blue-500" />,
        warning: <AlertTriangle className="size-5 text-yellow-500" />,
        error: <XCircle className="size-5 text-red-500" />,
        loading: <Loader2 className="size-5 text-gray-500 animate-spin" />,
      }}
      style={{
        fontFamily: "'Nunito', sans-serif",
      }}
      {...props} />
  );
}

export { Toaster }
