import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { psychologistService } from "@/services/psychologistService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Camera, X } from "lucide-react"

const ProfileSetup = () => {
  const navigate = useNavigate()
  const { currentUser, refreshProfileStatus } = useAuth()
  const fileInputRef = useRef(null)
  
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
    // typicalHours: "Mon - Fri: 9:00 AM - 5:00 PM",
    profileImage: null
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState("")
  const [currentSpecialty, setCurrentSpecialty] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-customGreen mb-2">Complete Your Profile</h1>
          <p className="text-gray-500">Help clients get to know you better by completing your professional profile</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className='shadow-none border border-customGreen/10'>
            <CardHeader>
              <CardTitle className="text-customGreen">Basic Information</CardTitle>
              <CardDescription className="text-gray-500">Your professional details that will be visible to clients</CardDescription>
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
                        <X className="w-3 h-3" />
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
                    placeholder="Dr. John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Clinical Psychologist"
                    required
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
                    placeholder="+1 (555) 000-0000"
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
                    placeholder="New York, USA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="10+ years"
                    required
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
                  placeholder="Tell clients about yourself, your approach to therapy, and what they can expect from working with you..."
                  rows={5}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Specialties & Languages */}
                   <Card className='shadow-none border border-customGreen/10'>

            <CardHeader>
              <CardTitle className="text-customGreen">Specialties & Languages</CardTitle>
              <CardDescription className="text-gray-500">Areas of expertise and languages you speak</CardDescription>
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
                  />
                  <Button type="button" onClick={addSpecialty} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
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
                  />
                  <Button type="button" onClick={addLanguage} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((language, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
                  <Card className='shadow-none border border-customGreen/10'>

            <CardHeader>
              <CardTitle className="text-customGreen">Education & Credentials</CardTitle>
              <CardDescription className="text-gray-500">Your educational background and professional credentials</CardDescription>
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
                      >
                        <X className="w-4 h-4" />
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        placeholder="University of California"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      value={edu.year}
                      onChange={(e) => updateEducation(index, "year", e.target.value)}
                      placeholder="2010 - 2015"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEducation} className="w-full">
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
                  placeholder="License #12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
               <Card className='shadow-none border border-customGreen/10'>

            <CardHeader>
              <CardTitle className="text-customGreen">Work Experience</CardTitle>
              <CardDescription className="text-gray-500">Your professional work history</CardDescription>
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
                      >
                        <X className="w-4 h-4" />
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Input
                        value={exp.organization}
                        onChange={(e) => updateWorkExperience(index, "organization", e.target.value)}
                        placeholder="Mental Health Center"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={exp.duration}
                      onChange={(e) => updateWorkExperience(index, "duration", e.target.value)}
                      placeholder="2018 - Present"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addWorkExperience} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Work Experience
              </Button>
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <Card className='shadow-none border border-customGreen/10'>
            <CardHeader>
              <CardTitle className="text-customGreen">Pricing </CardTitle>
              <CardDescription className="text-gray-500">Your session rates</CardDescription>
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
                    className="pl-7"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Enter amount in USD (e.g., 150 for $150)</p>
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="typicalHours">Typical Hours *</Label>
                <Input
                  id="typicalHours"
                  name="typicalHours"
                  value={formData.typicalHours}
                  onChange={handleInputChange}
                  placeholder="Mon - Fri: 9:00 AM - 5:00 PM"
                  required
                />
                <p className="text-xs text-gray-500">Example: Mon - Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 2:00 PM</p>
              </div> */}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="submit" className="bg-customGreen hover:bg-customGreenHover" disabled={loading}>
              {loading ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup
