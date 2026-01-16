import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { useAuth } from "@/context/AuthContext"
import { resendVerificationEmail, logout } from "@/lib/firebase"
import { Loader2, Mail, CheckCircle, RefreshCw, LogOut } from "lucide-react"

function VerifyEmail() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
    } else if (currentUser.emailVerified) {
      navigate("/profile-setup")
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUser) {
        await currentUser.reload()
        if (currentUser.emailVerified) {
          navigate("/profile-setup")
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [currentUser, navigate])

  const handleResendEmail = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    const { error } = await resendVerificationEmail()

    if (error) {
      setError(error)
    } else {
      setMessage("Verification email sent! Please check your inbox.")
      setCountdown(60)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleCheckVerification = async () => {
    setLoading(true)
    if (currentUser) {
      await currentUser.reload()
      if (currentUser.emailVerified) {
        navigate("/profile-setup")
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.")
      }
    }
    setLoading(false)
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className={cn("w-full min-h-screen h-screen")}>
      <div className="overflow-hidden p-0 h-full font-nunito">
        <div className="grid p-0 md:grid-cols-2 lg:grid-cols-2 h-full">
          <div
            className={`p-6 sm:px-8 md:px-16 lg:px-32 xl:px-52 h-full flex items-center justify-center transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-customGreen/10 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-customGreen" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover select-none">
                  Verify Your Email
                </h1>
                <p className="text-gray-500 font-semibold text-base md:text-lg select-none max-w-md">
                  We've sent a verification email to:
                </p>
                <p className="text-customGreen font-bold text-lg">
                  {currentUser.email}
                </p>
                <p className="text-gray-500 text-sm select-none max-w-md">
                  Click the link in the email to verify your account. If you don't see it, check your spam folder.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-base text-center">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 rounded-md bg-green-50 text-green-600 text-base text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {message}
                </div>
              )}

              <Field>
                <Button
                  onClick={handleCheckVerification}
                  className="bg-customGreen hover:bg-customGreenHover cursor-pointer shadow-none h-12 text-base w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      Checking...
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      I've Verified My Email
                    </>
                  )}
                </Button>
              </Field>

              <Field>
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  className="cursor-pointer shadow-none h-12 text-base w-full"
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? (
                    <>
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </Field>

              <FieldDescription className="text-center text-base select-none">
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-customGreen flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out and use a different email
                </button>
              </FieldDescription>
            </FieldGroup>
          </div>

          <div
            className={`relative hidden md:block transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <img
              src="./signup.png"
              alt="Email verification"
              className="absolute inset-0 h-full w-full object-cover md:object-contain lg:object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
