import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { psychologistService } from "@/services/psychologistService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Camera, X, ChevronRight, ChevronLeft, Check, Sparkles, User, Briefcase, GraduationCap, DollarSign, Globe, Heart, Loader2 } from "lucide-react"
import { ProfileIcon, BriefcaseIcon, GraduationIcon, GlobeIcon, StethoscopeIcon } from "@/components/icons/DuoTuneIcons"
const ProfileSetup = () => {
  const navigate = useNavigate()
  const { currentUser, refreshProfileStatus } = useAuth()
  const fileInputRef = useRef(null)
  
  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState('next')
  const [showWelcome, setShowWelcome] = useState(true)
  
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || "",
    title: "",
    location: "",
    experience: "",
    bio: "",
    price: "",
    languages: [],
    specialties: [],
    phone: "",
    email: currentUser?.email || "",
    education: [{ degree: "", institution: "", year: "" }],
    workExperience: [{ position: "", organization: "", duration: "", description: "" }],
    licenseNumber: "",
    profileImage: null
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState("")
  const [currentSpecialty, setCurrentSpecialty] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Steps configuration
  const steps = [
    { id: 0, title: "Basic Info", icon: User, description: "Tell us about yourself" },
    { id: 1, title: "Expertise", icon: Briefcase, description: "Your specialties & languages" },
    { id: 2, title: "Education", icon: GraduationCap, description: "Academic background" },
    { id: 3, title: "Experience", icon: Heart, description: "Work history" },
    { id: 4, title: "Pricing", icon: DollarSign, description: "Set your rates" },
  ]
  
  // Start welcome button handler
  const handleStartSetup = () => {
    setShowWelcome(false)
  }
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setDirection('next')
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 300)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsAnimating(false)
      }, 300)
    }
  }
  
  const goToStep = (step) => {
    if (step !== currentStep) {
      setDirection(step > currentStep ? 'next' : 'prev')
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(step)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const addLanguage = () => {
    if (currentLanguage.trim() && !formData.languages.includes(currentLanguage.trim())) {
      setFormData(prev => ({ ...prev, languages: [...prev.languages, currentLanguage.trim()] }))
      setCurrentLanguage("")
    }
  }

  const removeLanguage = (language) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== language) }))
  }

  const addSpecialty = () => {
    if (currentSpecialty.trim() && !formData.specialties.includes(currentSpecialty.trim())) {
      setFormData(prev => ({ ...prev, specialties: [...prev.specialties, currentSpecialty.trim()] }))
      setCurrentSpecialty("")
    }
  }

  const removeSpecialty = (specialty) => {
    setFormData(prev => ({ ...prev, specialties: prev.specialties.filter(s => s !== specialty) }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }]
    }))
  }

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { position: "", organization: "", duration: "", description: "" }]
    }))
  }

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }))
  }

  const updateWorkExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await psychologistService.createProfile(formData, currentUser.uid)
      await refreshProfileStatus()
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Failed to create profile. Please try again.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Progress calculation
  const progress = ((currentStep + 1) / steps.length) * 100
  
  // Welcome Screen Component
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-linear-to-br from-customGreen via-teal-700 to-customGreenHover flex items-center justify-center overflow-hidden">
        <div className="text-center animate-fade-in">
          {/* Animated circles background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full animate-pulse-slow animation-delay-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full animate-ping-slow" />
          </div>
          
          <div className="relative z-10">
            {/* Sparkle icon with animation */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-8 animate-bounce-slow">
              <BriefcaseIcon className="w-12 h-12 text-white animate-spin-slow" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-slide-up">
              Welcome, {currentUser?.displayName?.split(' ')[0] || 'Doctor'}!
            </h1>
            <p className="text-xl text-white/80 animate-slide-up animation-delay-200 mb-8">
              Let's set up your professional profile
            </p>
            
            {/* Get Started Button */}
            <div className="animate-slide-up animation-delay-400">
              <Button
                onClick={handleStartSetup}
                size="lg"
                className="bg-white text-customGreen hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-2"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </Button>
              <p className="text-white/60 text-sm mt-4">
                Takes only 5 minutes to complete
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-customGreen/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-customGreen/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header with progress */}
        <div className="mb-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-customGreen/10 rounded-full text-customGreen text-sm font-medium mb-4">
              <BriefcaseIcon className="w-4 h-4" />
              Complete your profile to start accepting clients
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-customGreen mb-2">
              Build Your Professional Profile
            </h1>
            <p className="text-gray-500">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].description}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="relative">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-customGreen rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 group ${
                      index <= currentStep ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={index > currentStep}
                  >
                    <div className={`
                      relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted 
                        ? 'bg-customGreen text-white scale-100' 
                        : isCurrent 
                          ? 'bg-customGreen text-white scale-110 ring-4 ring-customGreen/20' 
                          : 'bg-gray-100 text-gray-400'
                      }
                      ${index <= currentStep ? 'group-hover:scale-110' : ''}
                    `}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 animate-scale-in" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-full bg-customGreen/20 animate-ping-slow" />
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden md:block transition-colors ${
                      isCurrent ? 'text-customGreen' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step content with animation */}
          <div className={`
            transition-all duration-300 ease-out
            ${isAnimating 
              ? direction === 'next' 
                ? 'opacity-0 translate-x-8' 
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
            }
          `}>
            {currentStep === 0 && (
              <StepBasicInfo 
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                imagePreview={imagePreview}
                handleImageChange={handleImageChange}
                handleImageClick={handleImageClick}
                handleRemoveImage={handleRemoveImage}
                fileInputRef={fileInputRef}
              />
            )}
            
            {currentStep === 1 && (
              <StepExpertise
                formData={formData}
                setFormData={setFormData}
                currentSpecialty={currentSpecialty}
                setCurrentSpecialty={setCurrentSpecialty}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                addSpecialty={addSpecialty}
                removeSpecialty={removeSpecialty}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
              />
            )}
            
            {currentStep === 2 && (
              <StepEducation
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                addEducation={addEducation}
                removeEducation={removeEducation}
                updateEducation={updateEducation}
              />
            )}
            
            {currentStep === 3 && (
              <StepExperience
                formData={formData}
                addWorkExperience={addWorkExperience}
                removeWorkExperience={removeWorkExperience}
                updateWorkExperience={updateWorkExperience}
              />
            )}
            
            {currentStep === 4 && (
              <StepPricing
                formData={formData}
                handleInputChange={handleInputChange}
              />
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`gap-2 transition-all duration-300 select-none cursor-pointer ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-2 bg-customGreen hover:bg-customGreenHover transition-all duration-300 hover:gap-4 select-none cursor-pointer"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="gap-2 bg-customGreen hover:bg-customGreenHover min-w-[180px] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    Creating Profile
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 select-none cursor-pointer" />
                    Complete Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Step Components
const StepBasicInfo = ({ formData, setFormData, handleInputChange, imagePreview, handleImageChange, handleImageClick, handleRemoveImage, fileInputRef }) => (
  <Card className="shadow-none border-0 bg-white/50 backdrop-blur-sm animate-fade-in">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-customGreen/10 flex items-center justify-center">
          <ProfileIcon className="w-6 h-6 text-customGreen" />
        </div>
        <div>
          <CardTitle className="text-xl text-gray-900">Basic Information</CardTitle>
          <CardDescription className="text-gray-500">Your professional details visible to clients</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Profile Picture - Enhanced */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-lightGreen/50 rounded-2xl">
        <div className="relative group">
          <div className="w-28 h-28 rounded-2xl border-4 border-white  overflow-hidden bg-white flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <span className="text-xs text-gray-400">No photo</span>
              </div>
            )}
          </div>
          {imagePreview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">Profile Photo</h4>
          <p className="text-sm text-gray-500 mb-3">A professional photo helps build trust with clients</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleImageClick} 
            className="border-customGreen/20 hover:bg-customGreen/5 text-customGreen select-none cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            {imagePreview ? "Change Photo" : "Upload Photo"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">Full Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Dr. John Doe"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-700">Professional Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Clinical Psychologist"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+1 (555) 000-0000"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-gray-700">Location *</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="New York, USA"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-gray-700">Years of Experience *</Label>
          <Input
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            placeholder="10+ years"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-gray-700">About You *</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Tell clients about yourself, your approach to therapy, and what they can expect from working with you..."
          rows={5}
          className="border-gray-200 focus:border-customGreen focus:ring-customGreen/20 resize-none"
          required
        />
        <p className="text-xs text-gray-400">Minimum 100 characters recommended</p>
      </div>
    </CardContent>
  </Card>
)

const StepExpertise = ({ formData, setFormData, currentSpecialty, setCurrentSpecialty, currentLanguage, setCurrentLanguage, addSpecialty, removeSpecialty, addLanguage, removeLanguage }) => (
  <Card className="shadow-none border-0 bg-white/50 backdrop-blur-sm animate-fade-in">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-customGreen/10 flex items-center justify-center">
          <StethoscopeIcon className="w-6 h-6 text-customGreen" />
        </div>
        <div>
          <CardTitle className="text-xl text-gray-900 select-none">Specialties & Languages</CardTitle>
          <CardDescription className="text-gray-500 select-none">Areas of expertise and languages you speak</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Label className="text-gray-700 text-base">Specialties *</Label>
        <p className="text-sm text-gray-500">Add your areas of expertise (e.g., Anxiety, Depression, PTSD)</p>
        <div className="flex gap-2">
          <Input
            value={currentSpecialty}
            onChange={(e) => setCurrentSpecialty(e.target.value)}
            placeholder="Type a specialty and press Enter"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
          />
          <Button 
            type="button" 
            onClick={addSpecialty} 
            className="h-12 px-4 bg-customGreen hover:bg-customGreenHover"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-12 p-4 bg-gray-50 rounded-xl">
          {formData.specialties.length === 0 ? (
            <span className="text-gray-400 text-sm">No specialties added yet</span>
          ) : (
            formData.specialties.map((specialty, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 bg-customGreen/10 text-customGreen hover:bg-customGreen/20 transition-colors animate-scale-in"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => removeSpecialty(specialty)}
                  className="ml-2 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-gray-700 text-base">Languages *</Label>
        <p className="text-sm text-gray-500">Languages you can conduct sessions in</p>
        <div className="flex gap-2">
          <Input
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            placeholder="Type a language and press Enter"
            className="h-12 border-gray-200 focus:border-customGreen focus:ring-customGreen/20"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
          />
          <Button 
            type="button" 
            onClick={addLanguage} 
            className="h-12 px-4 bg-customGreen hover:bg-customGreenHover"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-12 p-4 bg-gray-50 rounded-xl">
          {formData.languages.length === 0 ? (
            <span className="text-gray-400 text-sm">No languages added yet</span>
          ) : (
            formData.languages.map((language, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors animate-scale-in"
              >
                <Globe className="w-3 h-3 mr-1" />
                {language}
                <button
                  type="button"
                  onClick={() => removeLanguage(language)}
                  className="ml-2 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

const StepEducation = ({ formData, setFormData, handleInputChange, addEducation, removeEducation, updateEducation }) => (
  <Card className="shadow-none border-0 bg-white/50 backdrop-blur-sm animate-fade-in">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-customGreen/10 flex items-center justify-center">
          <GraduationIcon className="w-6 h-6 text-customGreen" />
        </div>
        <div>
          <CardTitle className="text-xl text-gray-900 select-none">Education & Credentials</CardTitle>
          <CardDescription className="text-gray-500 select-none">Your educational background and professional credentials</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {formData.education.map((edu, index) => (
        <div 
          key={index} 
          className="p-6 border border-gray-100 rounded-2xl space-y-4 bg-gray-50 "
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-customGreen/10 flex items-center justify-center text-customGreen font-semibold text-sm">
                {index + 1}
              </div>
              <h4 className="font-medium text-gray-700">Education Entry</h4>
            </div>
            {formData.education.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(index)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-600">Degree</Label>
              <Input
                value={edu.degree}
                onChange={(e) => updateEducation(index, "degree", e.target.value)}
                placeholder="Ph.D. in Clinical Psychology"
                className="h-11 border-gray-200 focus:border-customGreen"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Institution</Label>
              <Input
                value={edu.institution}
                onChange={(e) => updateEducation(index, "institution", e.target.value)}
                placeholder="University of California"
                className="h-11 border-gray-200 focus:border-customGreen"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Year</Label>
            <Input
              value={edu.year}
              onChange={(e) => updateEducation(index, "year", e.target.value)}
              placeholder="2010 - 2015"
              className="h-11 border-gray-200 focus:border-customGreen"
            />
          </div>
        </div>
      ))}
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={addEducation} 
        className="w-full h-12 border-dashed border-2 border-gray-200 hover:border-customGreen hover:bg-customGreen/5 transition-colors cursor-pointer select-none"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Education
      </Button>

      <div className="p-6 bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl">
        <Label htmlFor="licenseNumber" className="text-gray-700 font-medium">License Number</Label>
        <p className="text-sm text-gray-500 mb-3">Your professional license number (optional)</p>
        <Input
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleInputChange}
          placeholder="License #12345"
          className="h-11 border-amber-200 focus:border-amber-400"
        />
      </div>
    </CardContent>
  </Card>
)

const StepExperience = ({ formData, addWorkExperience, removeWorkExperience, updateWorkExperience }) => (
  <Card className="shadow-none border-0 bg-white/50 backdrop-blur-sm animate-fade-in">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-customGreen/10 flex items-center justify-center">
          <BriefcaseIcon className="w-6 h-6 text-customGreen" />
        </div>
        <div>
          <CardTitle className="text-xl text-gray-900 select-none">Work Experience</CardTitle>
          <CardDescription className="text-gray-500 select-none">Your professional work history</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {formData.workExperience.map((exp, index) => (
        <div 
          key={index} 
          className="p-6 border border-gray-100 rounded-2xl space-y-4 bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-customGreen/10 flex items-center justify-center text-customGreen font-semibold text-sm">
                {index + 1}
              </div>
              <h4 className="font-medium text-gray-700">Work Experience</h4>
            </div>
            {formData.workExperience.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeWorkExperience(index)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-600">Position</Label>
              <Input
                value={exp.position}
                onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                placeholder="Senior Clinical Psychologist"
                className="h-11 border-gray-200 focus:border-customGreen"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Organization</Label>
              <Input
                value={exp.organization}
                onChange={(e) => updateWorkExperience(index, "organization", e.target.value)}
                placeholder="Mental Health Center"
                className="h-11 border-gray-200 focus:border-customGreen"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Duration</Label>
            <Input
              value={exp.duration}
              onChange={(e) => updateWorkExperience(index, "duration", e.target.value)}
              placeholder="2018 - Present"
              className="h-11 border-gray-200 focus:border-customGreen"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-600">Description</Label>
            <Textarea
              value={exp.description}
              onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
              placeholder="Describe your responsibilities and achievements..."
              rows={3}
              className="border-gray-200 focus:border-customGreen resize-none"
            />
          </div>
        </div>
      ))}
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={addWorkExperience} 
        className="w-full h-12 border-dashed border-2 border-gray-200 hover:border-customGreen hover:bg-customGreen/5 transition-colors select-none cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Experience
      </Button>
    </CardContent>
  </Card>
)

const StepPricing = ({ formData, handleInputChange }) => (
  <Card className="shadow-none border-0 bg-white/50 backdrop-blur-sm animate-fade-in">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-lightGreen/50 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-customGreen" />
        </div>
        <div>
          <CardTitle className="text-xl text-gray-900 select-none">Pricing</CardTitle>
          <CardDescription className="text-gray-500 select-none">Set your session rates</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="p-8 bg-lightGreen/50 rounded-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-customGreen/10 mb-4">
            <DollarSign className="w-8 h-8 text-customGreen" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session Price</h3>
          <p className="text-sm text-gray-500">Set your hourly rate for therapy sessions</p>
        </div>
        
        <div className="max-w-xs mx-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-customGreen">$</span>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="150"
              className="h-16 pl-10 text-2xl font-semibold text-center border-2 border-customGreen/20 focus:border-customGreen rounded-xl"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">/session</span>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">Enter amount in USD</p>
        </div>
      </div>
      
      
      
      <div className="bg-lightGreen/50 rounded-xl p-6 text-center">
        <Check className="w-12 h-12 text-customGreen mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Almost Done!</h3>
        <p className="text-gray-600">
          Click "Complete Profile" to finish setting up your account and start accepting clients.
        </p>
      </div>
    </CardContent>
  </Card>
)

export default ProfileSetup
