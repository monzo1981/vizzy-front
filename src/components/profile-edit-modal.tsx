"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, UserIcon, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { type User, updateUser } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  onUserUpdate: (updatedUser: User) => void
  onToast?: (type: 'success' | 'error', message: string) => void
}

interface UserProfileData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  job_title: string
  profile_picture?: File | null
}

interface CompanyProfileData {
  company_name: string
  company_website_url: string
}

export function ProfileEditModal({ isOpen, onClose, currentUser, onUserUpdate, onToast }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Personal Info State
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    job_title: 'Software Engineer',
    profile_picture: null
  })
  
  // Company Info State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData>({
    company_name: '',
    company_website_url: ''
  })
  
  // File refs
  const profilePictureRef = useRef<HTMLInputElement>(null)
  
  // Preview URLs
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('')

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setIsDarkMode(true)
    }
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
        job_title: 'Software Engineer',
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

  // Load company profile
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
          company_website_url: profile.company_website_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setUserProfile(prev => ({ ...prev, profile_picture: file }))
    setProfilePicturePreview(URL.createObjectURL(file))
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
        const updatedUserData = responseData.data || responseData
        
        // Update localStorage user data
        const updatedUser: User = {
          ...currentUser!,
          first_name: updatedUserData.first_name,
          last_name: updatedUserData.last_name,
          phone_number: updatedUserData.phone_number,
          profile_picture_url: updatedUserData.profile_picture_url
        }
        
        updateUser(updatedUser)
        onUserUpdate(updatedUser)
        
        onToast?.('success', 'Profile updated successfully!')
        onClose()
      } else {
        const errorData = await response.text()
        console.error('Profile update failed:', response.status, errorData)
        onToast?.('error', `Failed to update profile: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      onToast?.('error', 'Error updating profile')
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/client/profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const responseData = await response.json()
        const updatedCompanyData = responseData.data || responseData
        
        // Update localStorage and N8NWebhook cache efficiently
        const updatedProfile = {
          company_name: updatedCompanyData.company_name || null,
          company_website_url: updatedCompanyData.company_website_url || null,
          logo_url: updatedCompanyData.logo_url || null,
        }
        
        const webhook = new N8NWebhook()
        webhook.updateCompanyProfileCache(updatedProfile)
        
        onToast?.('success', 'Company information updated successfully!')
        onClose()
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        onToast?.('error', 'Failed to update company information')
      }
    } catch (error) {
      console.error('Error updating company info:', error)
      onToast?.('error', 'Error updating company information')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        style={{ background: 'rgba(17,0,46,0.48)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-4xl mx-4 shadow-xl"
        style={{
          borderRadius: '56px',
          background: 'linear-gradient(180deg, #D3E6FC -4.03%, #FFFFFF 112.18%)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderTopLeftRadius: 56, borderTopRightRadius: 56, borderBottom: '1px solid #E5E7EB' }}
        >
          <h2 className="text-xl" style={{ color: '#111', fontWeight: 400 }}>
            Edit Profile
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            style={{ background: '#fff', borderRadius: '50%', padding: 4, width: 32, height: 32, minWidth: 32, minHeight: 32 }}
            className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-3 px-6 pt-4 pb-2"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <button
            onClick={() => setActiveTab('personal')}
            style={{
              borderRadius: 20,
              background: activeTab === 'personal' ? '#fff' : '#fff',
              color: '#111',
              opacity: activeTab === 'personal' ? 1 : 0.4,
              fontWeight: 400,
              padding: '12px 0',
              border: 'none',
              fontSize: 18,
              width: '100%',
              transition: 'opacity 0.2s',
            }}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('company')}
            style={{
              borderRadius: 20,
              background: activeTab === 'company' ? '#fff' : '#fff',
              color: '#111',
              opacity: activeTab === 'company' ? 1 : 0.4,
              fontWeight: 400,
              padding: '12px 0',
              border: 'none',
              fontSize: 18,
              width: '100%',
              transition: 'opacity 0.2s',
            }}
          >
            Company Info
          </button>
        </div>

        {/* Content */}
  <div className="p-6 max-h-96 overflow-y-auto scrollbar-white-thin">
          {activeTab === 'personal' ? (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar 
                  src={profilePicturePreview}
                  fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'}
                  alt="Profile Picture" 
                  size={75}
                />
                <div>
                  <Button
                    onClick={() => profilePictureRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                    style={{ border: '1.5px solid #4248FF', borderRadius: 36, color: '#4248FF', paddingLeft: 18, paddingRight: 18 }}
                  >
                    <Upload size={16} className="mr-2" color="#78758E" />
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
                    if (file) handleFileSelect(file)
                  }}
                />
              </div>

              {/* Personal Info Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.first_name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#111', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                  />
                </div>

                <div>
                  <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.last_name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#111', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  readOnly
                  disabled
                  className="w-full px-3"
                  style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#78758E', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={userProfile.phone_number}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3 focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#111', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Company Info Form */}
              <div>
                <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyProfile.company_name}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-3 focus:ring-2 focus:ring-blue-500"
                    style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#111', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                />
              </div>

              <div>
                <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                  Company Website URL
                </label>
                <input
                  type="url"
                  value={companyProfile.company_website_url}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, company_website_url: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full px-3 focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#111', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                />
              </div>

              <div>
                <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={userProfile.job_title}
                  readOnly
                  disabled
                  className="w-full px-3"
                  style={{ background: 'rgba(255,255,255,0.6)', border: 'none', color: '#78758E', paddingTop: 14, paddingBottom: 14, borderRadius: 20 }}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Job title is currently set as default
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6"
          style={{ borderTop: '1px solid #E5E7EB' }}
        >
          <Button
            onClick={onClose}
            disabled={isLoading}
            style={{ background: '#FF4A19', color: '#fff', borderRadius: 36, minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'personal' ? savePersonalInfo : saveCompanyInfo}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(271.55deg, #4248FF -1.67%, #7FCAFE 99.45%)',
              color: '#fff',
              borderRadius: 36,
              minWidth: 120
            }}
            className="gap-2"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
