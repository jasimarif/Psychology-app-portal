import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { psychologistService } from "@/services/psychologistService"
import { logout } from "@/lib/firebase"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Upload, Camera, Trash2 } from "lucide-react"
import { CloseIcon, ProfileIcon, BriefcaseIcon, GraduationIcon, GlobeIcon, StethoscopeIcon, TimeIcon } from "@/components/icons/DuoTuneIcons"

const ProfileEdit = () => {
  const navigate = useNavigate()
  const { currentUser, refreshProfileStatus } = useAuth()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    location: "",
    experience: "",
    bio: "",
    price: "",
    languages: [],
    specialties: [],
    phone: "",
    email: "",
    education: [{ degree: "", institution: "", year: "" }],
    workExperience: [{ position: "", organization: "", duration: "", description: "" }],
    licenseNumber: "",
    // typicalHours: "Mon - Fri: 9:00 AM - 5:00 PM",
    profileImage: null
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState("")
  const [currentSpecialty, setCurrentSpecialty] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [fetchingProfile, setFetchingProfile] = useState(true)

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await psychologistService.getProfile(currentUser.uid)
        if (result.success && result.data) {
          const profile = result.data
          setFormData({
            name: profile.name,
            title: profile.title,
            location: profile.location,
            experience: profile.experience,
            bio: profile.bio,
            price: profile.price,
            languages: profile.languages || [],
            specialties: profile.specialties || [],
            phone: profile.phone || "",
            email: profile.email,
            education: profile.education || [{ degree: "", institution: "", year: "" }],
            workExperience: profile.workExperience || [{ position: "", organization: "", duration: "", description: "" }],
            licenseNumber: profile.licenseNumber || "",
            // typicalHours: profile.typicalHours,
            profileImage: null
          })
          if (profile.profileImage) {
            setImagePreview(profile.profileImage)
          }
        }
      } catch (err) {
        setError("Failed to load profile data")
        console.error(err)
      } finally {
        setFetchingProfile(false)
      }
    }

    if (currentUser?.uid) {
      fetchProfile()
    }
  }, [currentUser])

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
      await psychologistService.updateProfile(formData, currentUser.uid)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCancel = () => {
    navigate("/dashboard")
  }

  const handleDeleteProfile = async () => {
    setDeleting(true)
    setError("")

    try {
      await psychologistService.deleteProfile(currentUser.uid)
      await logout()
      navigate("/login")
    } catch (err) {
      setError(err.message || "Failed to delete profile. Please try again.")
      setDeleting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (fetchingProfile) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-6 w-96 mb-6" />
            <Card className="rounded-2xl border-none shadow-none">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white animate-in fade-in duration-300">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 bg-white min-h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ProfileIcon className="w-8 h-8 text-customGreenHover" />
                  <h1 className="text-3xl md:text-4xl font-bold text-customGreenHover">
                    Edit Your Profile
                  </h1>
                </div>
                <p className="text-gray-500 text-lg">
                  Update your professional information
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-customGreen/10 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-customGreen">
                <ProfileIcon className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Your professional details that will be visible to clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-2 border-customGreen/20 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" onClick={handleImageClick} className="border-customGreen/20 hover:bg-customGreen/5 text-customGreen">
                        <Upload className="w-4 h-4 mr-2" />
                        {imagePreview ? "Change Photo" : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-gray-500">JPG, PNG or GIF (max. 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      className="focus-visible:ring-customGreen"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={5}
                    required
                    className="focus-visible:ring-customGreen"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Specialties & Languages */}
            <Card className="border-customGreen/10 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-customGreen">
                  <StethoscopeIcon className="w-5 h-5" />
                  Specialties & Languages
                </CardTitle>
                <CardDescription>Areas of expertise and languages you speak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialties *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="specialty"
                      value={currentSpecialty}
                      onChange={(e) => setCurrentSpecialty(e.target.value)}
                      placeholder="e.g., Anxiety, Depression, PTSD"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                      className="focus-visible:ring-customGreen"
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline" className="border-customGreen/20 hover:bg-customGreen/5 text-customGreen">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 bg-customGreen/10 text-customGreen hover:bg-customGreen/20">
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-2 hover:text-red-500"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Languages *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="language"
                      value={currentLanguage}
                      onChange={(e) => setCurrentLanguage(e.target.value)}
                      placeholder="e.g., English, Spanish"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                      className="focus-visible:ring-customGreen"
                    />
                    <Button type="button" onClick={addLanguage} variant="outline" className="border-customGreen/20 hover:bg-customGreen/5 text-customGreen">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.languages.map((language, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 bg-customGreen/10 text-customGreen hover:bg-customGreen/20">
                        {language}
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="ml-2 hover:text-red-500"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="border-customGreen/10 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-customGreen">
                  <GraduationIcon className="w-5 h-5" />
                  Education & Credentials
                </CardTitle>
                <CardDescription>Your educational background and professional credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div key={index} className="p-4 border border-customGreen/10 rounded-lg space-y-4 bg-customGreen/5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">Education {index + 1}</h4>
                      {formData.education.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                          className="hover:bg-red-50"
                        >
                          <CloseIcon className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                          placeholder="Ph.D. in Clinical Psychology"
                          className="bg-white focus-visible:ring-customGreen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                          placeholder="University of California"
                          className="bg-white focus-visible:ring-customGreen"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) => updateEducation(index, "year", e.target.value)}
                        placeholder="2010 - 2015"
                        className="bg-white focus-visible:ring-customGreen"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addEducation} className="w-full border-dashed border-2 hover:border-customGreen hover:text-customGreen">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="focus-visible:ring-customGreen"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="border-customGreen/10 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-customGreen">
                  <BriefcaseIcon className="w-5 h-5" />
                  Work Experience
                </CardTitle>
                <CardDescription>Your professional work history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.workExperience.map((exp, index) => (
                  <div key={index} className="p-4 border border-customGreen/10 rounded-lg space-y-4 bg-customGreen/5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">Experience {index + 1}</h4>
                      {formData.workExperience.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkExperience(index)}
                          className="hover:bg-red-50"
                        >
                          <CloseIcon className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                          placeholder="Senior Clinical Psychologist"
                          className="bg-white focus-visible:ring-customGreen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Organization</Label>
                        <Input
                          value={exp.organization}
                          onChange={(e) => updateWorkExperience(index, "organization", e.target.value)}
                          placeholder="Mental Health Center"
                          className="bg-white focus-visible:ring-customGreen"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={exp.duration}
                        onChange={(e) => updateWorkExperience(index, "duration", e.target.value)}
                        placeholder="2018 - Present"
                        className="bg-white focus-visible:ring-customGreen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                        placeholder="Describe your responsibilities and achievements..."
                        rows={3}
                        className="bg-white focus-visible:ring-customGreen"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addWorkExperience} className="w-full border-dashed border-2 hover:border-customGreen hover:text-customGreen">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Work Experience
                </Button>
              </CardContent>
            </Card>

            {/* Pricing & Availability */}
            <Card className="border-customGreen/10 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-customGreen">
                  <TimeIcon className="w-5 h-5" />
                  Pricing 
                </CardTitle>
                <CardDescription>Your session rates </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Session Price (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="150"
                      className="pl-7 focus-visible:ring-customGreen"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter amount in USD (e.g., 150 for $150)</p>
                </div>
              
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 shadow-none border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions for your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                  <div>
                    <h4 className="font-medium text-gray-700">Delete Profile</h4>
                    <p className="text-sm text-gray-500">Once you delete your profile, there is no going back. All your data will be permanently removed.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="ml-4 cursor-pointer" disabled={deleting}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleting ? "Deleting..." : "Delete Profile"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your psychologist profile and remove all your data including bookings, availability settings, and client information from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteProfile}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete my profile
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading || deleting} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-customGreen hover:bg-customGreenHover cursor-pointer" disabled={loading || deleting}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default ProfileEdit
