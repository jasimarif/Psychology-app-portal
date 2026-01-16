import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { registerWithEmailAndPassword, signInWithGoogle } from "@/lib/firebase"

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters long")
      return
    }

    setLoading(true)

    const { user, error } = await registerWithEmailAndPassword(
      formData.email,
      formData.password,
      formData.name
    )

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      console.log("Signup successful:", user)
      navigate("/verify-email")
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    const { user, error } = await signInWithGoogle()

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      console.log("Google sign-in successful:", user)
      navigate("/profile-setup")
    }
  }

  return (
        <div className={cn("w-full min-h-screen h-screen")}>
          <div className="overflow-hidden p-0 h-full font-nunito">
            <div className="grid p-0 md:grid-cols-2 lg:grid-cols-2 h-full ">
              <form
                className={`p-6 sm:px-8 md:px-16 lg:px-32 xl:px-52 h-full flex items-center justify-center transition-all duration-1000 ease-out ${
                  isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}
                onSubmit={handleSubmit}
              >
                <FieldGroup className="gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover">Create an account</h1>
                    <p className="text-gray-500 text-balance text-base md:text-lg">
                      Register as a psychologist
                    </p>
                  </div>
                  {error && (
                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-base">
                      {error}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="name" className="text-gray-700 text-base">Full Name</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Dr. John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-12 shadow-none text-base"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email" className="text-gray-700 text-base">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-12 shadow-none text-base"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password" className="text-gray-700 text-base">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-12 shadow-none text-base"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword" className="text-gray-700 text-base">Confirm Password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-12 shadow-none text-base"
                    />
                  </Field>
                  <Field>
                    <Button type="submit" className="bg-customGreen hover:bg-customGreenHover cursor-pointer h-12 text-base" disabled={loading}>
                      {loading ? "Creating account..." : "Create account"}
                    </Button>
                  </Field>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-base">
                    Or continue with
                  </FieldSeparator>
                  <Field>
                    <Button variant="outline" type="button" className="cursor-pointer shadow-none h-12 text-base" onClick={handleGoogleSignIn} disabled={loading}>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4" />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853" />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05" />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </Button>
                  </Field>
                  <FieldDescription className="text-center text-base text-gray-500">
                    Already have an account? <Link to="/login" className="text-customGreen hover:underline font-medium">Sign in</Link>
                  </FieldDescription>

                </FieldGroup>
              </form>
              <div
                className={` relative hidden md:block transition-all duration-1000 ease-out ${
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

export default Signup
