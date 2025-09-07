"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, UserIcon, Building2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { type User, updateUser } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import Image from "next/image"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  onUserUpdate: (updatedUser: User) => void
}

interface UserProfileData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  profile_picture?: File | null
}

interface CompanyProfileData {
  company_name: string
  company_website_url: string
  logo?: File | null
}

export function ProfileEditModal({ isOpen, onClose, currentUser, onUserUpdate }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Personal Info State
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profile_picture: null
  })
  
  // Company Info State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData>({
    company_name: '',
    company_website_url: '',
    logo: null
  })
  
  // File refs
  const profilePictureRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  
  // Preview URLs
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('')
  const [logoPreview, setLogoPreview] = useState<string>('')

  // Check dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    localStorage.getItem('theme') === 'dark'
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      // Set personal info
      setUserProfile({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        profile_picture: null
      })
      
      // Set profile picture preview
      if (currentUser.profile_picture_url) {
        setProfilePicturePreview(currentUser.profile_picture_url)
      }
      
      // Load company profile data
      loadCompanyProfile()
    }
  }, [isOpen, currentUser])

  // Load company profile from N8NWebhook (same as profile page)
  const loadCompanyProfile = async () => {
    try {
      const webhook = new N8NWebhook()
      let profile = webhook.getCompanyProfile()
      
      if (!profile) {
        // If not cached, fetch from API
        await webhook.refreshCompanyProfile()
        profile = webhook.getCompanyProfile()
      }
      
      if (profile) {
        setCompanyProfile({
          company_name: profile.company_name || '',
          company_website_url: profile.company_website_url || '',
          logo: null
        })
        
        if (profile.logo_url) {
          setLogoPreview(profile.logo_url)
        }
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File, type: 'profile' | 'logo') => {
    if (type === 'profile') {
      setUserProfile(prev => ({ ...prev, profile_picture: file }))
      setProfilePicturePreview(URL.createObjectURL(file))
    } else {
      setCompanyProfile(prev => ({ ...prev, logo: file }))
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Save Personal Info
  const savePersonalInfo = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      if (!token) return

      const formData = new FormData()
      formData.append('first_name', userProfile.first_name)
      formData.append('last_name', userProfile.last_name)
      formData.append('email', userProfile.email)
      formData.append('phone_number', userProfile.phone_number)
      
      if (userProfile.profile_picture) {
        formData.append('profile_picture', userProfile.profile_picture)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const responseData = await response.json()
        const updatedUser = responseData.data // Extract data from StandardResponse
        // Update localStorage using auth utility (includes cleanup)
        updateUser(updatedUser)
        // Notify parent component
        onUserUpdate(updatedUser)
        alert('Personal information updated successfully!')
      } else {
        alert('Failed to update personal information')
      }
    } catch (error) {
      console.error('Error updating personal info:', error)
      alert('Error updating personal information')
    } finally {
      setIsLoading(false)
    }
  }

  // Save Company Info
  const saveCompanyInfo = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      if (!token) return

      const formData = new FormData()
      formData.append('company_name', companyProfile.company_name)
      formData.append('company_website_url', companyProfile.company_website_url)
      
      if (companyProfile.logo) {
        console.log('Adding logo to FormData:', companyProfile.logo.name)
        formData.append('logo', companyProfile.logo)
      } else {
        console.log('No logo file selected')
      }

      console.log('Sending company profile update...')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/client/profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('API Response:', responseData)
        const updatedCompanyData = responseData.data || responseData
        
        // Update localStorage and N8NWebhook cache efficiently
        const updatedProfile = {
          company_name: updatedCompanyData.company_name || null,
          company_website_url: updatedCompanyData.company_website_url || null,
          logo_url: updatedCompanyData.logo_url || null,
        }
        
        console.log('Updated profile:', updatedProfile)
        
        const webhook = new N8NWebhook()
        webhook.updateCompanyProfileCache(updatedProfile)
        
        // Update current modal state to reflect changes
        setCompanyProfile({
          company_name: updatedProfile.company_name || '',
          company_website_url: updatedProfile.company_website_url || '',
          logo: null
        })
        
        if (updatedProfile.logo_url) {
          setLogoPreview(updatedProfile.logo_url)
        }
        
        alert('Company information updated successfully!')
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        alert('Failed to update company information')
      }
    } catch (error) {
      console.error('Error updating company info:', error)
      alert('Error updating company information')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Profile
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className={`p-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'personal'
                ? isDarkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50' 
                  : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon size={16} className="inline mr-2" />
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'company'
                ? isDarkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50' 
                  : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 size={16} className="inline mr-2" />
            Company Info
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'personal' ? (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar 
                  src={profilePicturePreview}
                  fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'}
                  alt="Profile Picture" 
                  size="lg" 
                />
                <div>
                  <Button
                    onClick={() => profilePictureRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                  >
                    <Upload size={16} className="mr-2" />
                    Change Photo
                  </Button>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
                <input
                  ref={profilePictureRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'profile')
                  }}
                />
              </div>

              {/* Personal Info Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.first_name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.last_name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={userProfile.phone_number}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Company Logo */}
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 border-dashed ${
                  logoPreview 
                    ? 'border-green-300' 
                    : isDarkMode 
                      ? 'border-gray-600' 
                      : 'border-gray-300'
                }`}>
                  {logoPreview ? (
                    <Image 
                      src={logoPreview} 
                      alt="Company Logo" 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  )}
                </div>
                <div>
                  <Button
                    onClick={() => logoRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                  >
                    <Upload size={16} className="mr-2" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    JPG, PNG or SVG (max 5MB)
                  </p>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'logo')
                  }}
                />
              </div>

              {/* Company Info Form */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyProfile.company_name}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, company_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Company Website URL
                </label>
                <input
                  type="url"
                  value={companyProfile.company_website_url}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, company_website_url: e.target.value }))}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'personal' ? savePersonalInfo : saveCompanyInfo}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={16} className="mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
