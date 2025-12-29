import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { resetPassword } from "@/lib/firebase"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className={cn("w-full min-h-screen h-screen")}>
      <div className="overflow-hidden p-0 h-full font-nunito">
        <div className="grid p-0 md:grid-cols-2 lg:grid-cols-2 h-full">
          <form
            className={`p-6 sm:px-8 md:px-16 lg:px-32 xl:px-52 h-full flex items-center justify-center transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
            onSubmit={handleSubmit}
          >
            <FieldGroup className="gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover">Reset Password</h1>
                <p className="text-gray-500 text-balance text-base md:text-lg">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-base">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-base">
                  Password reset email sent! Check your inbox for further instructions.
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email" className="text-gray-700 text-base">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 shadow-none text-base"
                />
              </Field>
              <Field>
                <Button type="submit" className="bg-customGreen hover:bg-customGreenHover cursor-pointer shadow-none h-12 text-base mt-5" disabled={loading}>
                  {loading ? (
                    <>
                      Sending reset link
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </Field>
              <FieldDescription className="text-center text-base text-gray-500">
                Remember your password? <Link to="/login" className="text-customGreen hover:underline font-medium">Back to login</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div
            className={`relative hidden md:block transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <img
              src="./signup.png"
              alt="Psychologist portal"
              className="absolute inset-0 h-full w-full object-cover md:object-contain lg:object-cover dark:brightness-[0.2] dark:grayscale" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
