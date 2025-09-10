"use client"

export const dynamic = 'force-dynamic' 

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  Bell,
  User,
  Edit,
  Lock,
  CreditCard,
  Users,
  LogOut,
  Trash2,
  
  Menu,
  ChevronLeft,
  Activity,
  Puzzle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { isAuthenticated, getUser, type User as AuthUser } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { GradientBackground } from "@/components/gradient-background"
import { ProfileEditModal } from "@/components/profile-edit-modal"

export default function ProfilePage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companyProfile, setCompanyProfile] = useState<any | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // UserLimits type is extended in n8n-webhook.ts to include max_images, max_videos
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [remainingCredits, setRemainingCredits] = useState<number | string>('-');
  const router = useRouter();
  // Fetch user limits and calculate progress
  useEffect(() => {
    async function fetchLimits() {
      console.log('Starting to fetch user limits...');
      const webhook = new N8NWebhook();
      // Call getUserLimits method properly
      const limits = await webhook.getUserLimits();
      console.log('Received limits:', limits);
      
      if (limits) {
        // Use type assertion to access possible backend fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const l: any = limits;
        const maxImages = Number.isFinite(l.max_images) ? l.max_images : 0;
        const maxVideos = Number.isFinite(l.max_videos) ? l.max_videos : 0;
        const remImages = Number.isFinite(l.remaining_images) ? l.remaining_images : 0;
        const remVideos = Number.isFinite(l.remaining_videos) ? l.remaining_videos : 0;
        
        console.log('Parsed values:', { maxImages, maxVideos, remImages, remVideos });
        
        const total = maxImages + maxVideos;
        const remaining = remImages + remVideos;
        let percent = 0;
        if (total > 0) {
          // Progress based on remaining (100% = full limits, 0% = no limits left)
          percent = Math.round((remaining / total) * 100);
        }
        
        // Update remaining credits display
        setRemainingCredits(remaining);
        
        console.log('Calculated progress:', { total, remaining, percent });
        
        // Animate from 0 to percent
        let current = 0;
        const step = percent > 0 ? Math.max(1, Math.round(percent / 20)) : 1;
        const interval = setInterval(() => {
          current += step;
          if (current >= percent) {
            setProgressPercent(percent);
            clearInterval(interval);
          } else {
            setProgressPercent(current);
          }
        }, 20);
      } else {
        console.error('Failed to get user limits');
      }
    }
    fetchLimits();
  }, []);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setIsDarkMode(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
    } else {
      const user = getUser()
      setCurrentUser(user)

      const webhook = new N8NWebhook()
      const profile = webhook.getCompanyProfile()
      if (profile) {
        setCompanyProfile(profile)
      } else {
        webhook.refreshCompanyProfile().then(() => {
          setCompanyProfile(webhook.getCompanyProfile())
        })
      }
    }
  }, [router])

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Please login again')
        return
      }

      const formData = new FormData()
      formData.append('logo', file)
      
      // إرسال company_name و company_website_url إذا كانوا موجودين
      if (companyProfile?.company_name) {
        formData.append('company_name', companyProfile.company_name)
      } else {
        // إذا لم يكن موجود، استخدم قيمة افتراضية
        formData.append('company_name', 'Default Company')
      }
      
      if (companyProfile?.company_website_url) {
        formData.append('company_website_url', companyProfile.company_website_url)
      }

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
          company_name: updatedCompanyData.company_name || companyProfile?.company_name || null,
          company_website_url: updatedCompanyData.company_website_url || companyProfile?.company_website_url || null,
          logo_url: updatedCompanyData.logo_url || null,
        }
        
        const webhook = new N8NWebhook()
        webhook.updateCompanyProfileCache(updatedProfile)
        
        // Update local state
        setCompanyProfile(updatedProfile)
        
        alert('Logo updated successfully!')
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        alert('Failed to update logo')
      }
    } catch (error) {
      console.error('Error updating logo:', error)
      alert('Error updating logo')
    }
  }

  return (
    <GradientBackground isDarkMode={isDarkMode}>
      {/* Fixed Header/Navbar - PURE WHITE */}
  <header className={`fixed top-0 left-0 right-0 shadow-md px-6 py-4 z-50 ${isDarkMode ? 'bg-[#0E0E10]' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo - NO TOGGLE HERE */}
            <div 
              className="flex items-center gap-2 ml-16 cursor-pointer" 
              onClick={() => router.push('/chat')}
              title="Go to Chat"
            >
              <Image 
                src={isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg"} 
                alt="Vizzy Logo" 
                width={150}
                height={100}
              />
            </div>
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search" 
                className="pl-10 py-3 w-96 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full" 
              />
            </div>
          </div>
          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-orange-500" />
            <AvatarDropdown 
              currentUser={currentUser}
              isDarkMode={isDarkMode}
              onUserUpdate={setCurrentUser}
            />
          </div>
        </div>
      </header>

      {/* Layout Container */}
  <div className="flex pt-[92px]"> {/* Padding top for fixed header, increased for larger avatar */}
        
        {/* Sidebar - PURE WHITE, COLLAPSIBLE */}
        <aside
          className={`
            fixed left-0 top-[72px] h-[calc(100vh-72px)] shadow-lg
            transition-all duration-300 ease-in-out z-40
            ${sidebarExpanded ? "w-[280px]" : "w-[60px]"}
            overflow-hidden
            ${isDarkMode ? 'bg-[#0E0E10]' : 'bg-white'}
          `}
        >
          <div className="flex flex-col h-full pt-4">
            {/* Toggle Button - TOP OF SIDEBAR */}
            <div className={`p-3 border-b ${isDarkMode ? 'border-[#23232A]' : 'border-gray-200'}`}> 
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                {sidebarExpanded ? (
                  <ChevronLeft className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                ) : (
                  <Menu className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                )}
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-6">
                {/* Profile Section */}
                <div>
                  {sidebarExpanded && (
                    <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">Profile</h3>
                  )}
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <User className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Edit Profile</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Bell className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Notification</span>}
                    </Button>
                  </div>
                </div>

                {/* Subscription Section */}
                <div>
                  {sidebarExpanded && (
                    <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">Subscription</h3>
                  )}
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Activity className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Activetes</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Puzzle className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Interest</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Users className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Invite & win</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <CreditCard className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Payment</span>}
                    </Button>
                  </div>
                </div>

                {/* Secure Section */}
                <div>
                  {sidebarExpanded && (
                    <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">Secure</h3>
                  )}
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Lock className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Password</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <User className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                      {sidebarExpanded && <span className="ml-3">Access</span>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-gray-200 p-3 space-y-1">
              <Button 
                variant="ghost" 
                className={`w-full ${isDarkMode ? 'hover:bg-[#23232A] text-white' : 'hover:bg-gray-100 text-gray-700'} ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
              >
                <LogOut className="w-5 h-5" color={isDarkMode ? 'white' : undefined} />
                {sidebarExpanded && <span className="ml-3">Log out</span>}
              </Button>
              <Button 
                variant="ghost" 
                className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
              >
                <Trash2 className="w-5 h-5" />
                {sidebarExpanded && <span className="ml-3">Delete Account</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content - CENTERED */}
        <main className={`flex-1 transition-all duration-300 ${sidebarExpanded ? "ml-[280px]" : "ml-[60px]"}`}>
          <div className="flex justify-center px-6 py-6">
            <div className="w-full max-w-[1400px]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-2">
                  {/* Profile Card */}
                  <Card className="border-0" style={{ 
                    background: isDarkMode
                      ? 'linear-gradient(100.74deg, rgba(127, 202, 254) -2.34%, rgba(255, 255, 255) 25.59%, rgba(255, 228, 224) 63.57%, rgba(255, 255, 255) 106.88%)'
                      : 'linear-gradient(100.74deg, rgba(127, 202, 254, 0.5) -2.34%, rgba(255, 255, 255, 0.5) 25.59%, rgba(255, 228, 224, 0.5) 63.57%, rgba(255, 255, 255, 0.5) 106.88%)',
                    borderRadius: '36px'
                  }}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div 
                          className="rounded-full overflow-hidden flex-shrink-0"
                          style={{ 
                            width: '126px', 
                            height: '126px'
                          }}
                        >
                          <Avatar 
                            src={currentUser?.profile_picture_url || undefined}
                            fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'} 
                            alt="User" 
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 style={{
                              fontWeight: 700,
                              fontSize: '40px',
                              color: '#4248FF'
                            }}>
                              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Mohsen'}
                            </h2>
                            <Badge 
                              className="text-white border-0"
                              style={{
                                background: 'linear-gradient(90deg, #FF4A19 0%, #4248FF 100%)',
                                borderRadius: '18px',
                                fontWeight: 900,
                                fontStyle: 'italic',
                                fontSize: '20px',
                                padding: '6px 16px'
                              }}
                            >
                              Pro
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">For uploading new Profile pic</p>
                          <p className="text-sm text-gray-600 mb-1">At least 800×800 px recommended</p>
                          <p className="text-sm text-gray-600">JPG or PNG is allowed</p>
                        </div>
                      </div>

                      {/* Personal Info Section */}
                      <div 
                        style={{
                          background: '#FFFFFF4A',
                          borderRadius: '36px',
                          padding: '1rem'
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 style={{
                            fontWeight: 600,
                            fontSize: '20px',
                            color: '#11002E'
                          }}>Personal info</h3>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            style={{
                              border: '1px solid rgba(66, 72, 255, 0.5)',
                              borderRadius: '40px',
                              background: 'none',
                              fontWeight: 600
                            }}
                            onClick={() => setIsProfileModalOpen(true)}
                          >
                            <Edit className="w-3 h-3" style={{ color: '#78758E' }} />
                            <span style={{ color: '#000' }}>Edit</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Name</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>
                              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Mohsen Momtaz'}
                            </p>
                          </div>
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Email</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>{currentUser ? currentUser.email : 'mohsn@egyspy.gov'}</p>
                          </div>
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Mobile</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>{currentUser?.phone_number || 'Not available'}</p>
                          </div>
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Business name</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>{companyProfile?.company_name || 'Not available'}</p>
                          </div>
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Website</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>{companyProfile?.company_website_url || 'Not available'}</p>
                          </div>
                          <div>
                            <p style={{
                              color: '#4248FF',
                              fontWeight: 500,
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>Job Title</p>
                            <p style={{
                              color: '#78758E',
                              fontWeight: 500,
                              fontSize: '16px'
                            }}>Software Engineer</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Work and My Links Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Recent Work Card */}
                    <Card 
                      className="border-0 text-white"
                      style={{
                        background: '#7FCAFE',
                        borderRadius: '36px',
                      }}
                    >
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-4" style={{ fontWeight: 700, fontSize: 64, fontFamily: 'Inter', textAlign: 'center' }}>Recent work</h3>
                        <div className="flex flex-col h-full min-h-[220px]">
                          <div className="flex-1 flex items-center justify-center">
                            <Image
                              src="/recent-work.png"
                              alt="Recent Work"
                              width={400}
                              height={220}
                              className="rounded-lg object-cover w-full max-w-[400px] h-[180px]"
                            />
                          </div>
                          {/* Navigation Bars */}
                          <div className="flex flex-col gap-2 mt-6">
                            <div className="flex justify-center w-full gap-2">
                              {/* 5 bars, center one orange, others blue, all width = 20% */}
                              <div style={{ width: '20%', height: '8px', background: '#D3E6FC', borderRadius: '8px', opacity: 1 }}></div>
                              <div style={{ width: '20%', height: '8px', background: '#D3E6FC', borderRadius: '8px', opacity: 1 }}></div>
                              <div style={{ width: '20%', height: '10px', background: '#FF4A19', borderRadius: '8px', opacity: 1 }}></div>
                              <div style={{ width: '20%', height: '8px', background: '#D3E6FC', borderRadius: '8px', opacity: 1 }}></div>
                              <div style={{ width: '20%', height: '8px', background: '#D3E6FC', borderRadius: '8px', opacity: 1 }}></div>
                            </div>
                            <div className="flex justify-end w-full mt-2">
                              <Button
                                type="button"
                                className="shadow-md font-bold"
                                style={{
                                  background: 'white',
                                  color: '#000',
                                  borderRadius: '50px',
                                  border: 'none',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  padding: '12px 40px',
                                  marginRight: 0,
                                  fontFamily: 'inherit',
                                }}
                              >
                                See Full
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right Column Cards */}
                    <div className="space-y-4">
                      {/* My Links Card */}
                      <Card 
                        className="border-0 text-white"
                        style={{
                          background: '#4248FF',
                          borderRadius: '36px',
                        }}
                      >
                        <CardContent className="p-6">
                          <h3 
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: 700,
                              fontSize: '50px',
                              textAlign: 'center',
                              marginBottom: '12px',
                            }}
                          >My Links</h3>
                          <p 
                            style={{
                              fontWeight: 400,
                              fontStyle: 'italic',
                              fontSize: '12px',
                              textAlign: 'center',
                              marginBottom: '24px',
                              color: 'white',
                              opacity: 0.8,
                            }}
                          >
                            This links to your accounts will be used as reference for tone of voice and visual direction, to influence future generated visuals if needed.
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Image src="/web.svg" alt="Website" width={40} height={40} />
                            <Image src="/facebook.svg" alt="Facebook" width={40} height={40} />
                            <Image src="/instagram.svg" alt="Instagram" width={40} height={40} />
                            <Image src="/linkedin.svg" alt="LinkedIn" width={40} height={40} />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Your Logo Card */}
                      <Card 
                        className="border-0 text-white"
                        style={{
                          background: '#FF4A19',
                          borderRadius: '36px',
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-row items-center gap-6">
                            <div className="flex flex-col gap-2 flex-1">
                              <h3
                                style={{
                                  fontFamily: 'Inter',
                                  fontWeight: 700,
                                  fontSize: '36px',
                                  lineHeight: '100%',
                                  letterSpacing: 0,
                                  marginBottom: 0,
                                  textAlign: 'left',
                                }}
                              >Your</h3>
                              <h3
                                style={{
                                  fontFamily: 'Inter',
                                  fontWeight: 700,
                                  fontSize: '34px', 
                                  lineHeight: '100%',
                                  letterSpacing: 0,
                                  textAlign: 'left',
                                }}
                              >Logo !</h3>
                              <Button
                                type="button"
                                className="flex items-center justify-center border-0 mt-4"
                                style={{
                                  background: '#FFEB77',
                                  borderRadius: '50px',
                                  color: '#4248FF',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  padding: '12px 32px',
                                  width: 'fit-content',
                                }}
                                onClick={() => document.getElementById('logo-upload-input')?.click()}
                              >
                                Upload
                              </Button>
                              <input
                                id="logo-upload-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(file)
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-center w-32 h-32 rounded-lg">
                              {companyProfile && companyProfile.logo_url ? (
                                <Image 
                                  src={companyProfile.logo_url}
                                  alt="Company Logo"
                                  width={128}
                                  height={128}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Image 
                                  src="/logo-upload.svg"
                                  alt="Upload Logo"
                                  width={72}
                                  height={72}
                                  className="opacity-80"
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Right Column - Credits and Assets */}
                <div className="space-y-6">
                  {/* Credits Card */}
                  <Card 
                    className="border-0" 
                    style={{ 
                      background: 'linear-gradient(143.41deg, #FFEB77 -4.53%, #FFE4E0 103.15%)', 
                      borderRadius: '36px' 
                    }}
                  >
                    <CardContent className="p-8">
                      <h3
                        style={{
                          background: 'linear-gradient(94.41deg, #4248FF -4.88%, #FF4A19 119.67%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 700,
                          fontSize: '64px',
                          textAlign: 'center',
                          marginBottom: '32px',
                        }}
                      >
                        Credits
                      </h3>
                      <div className="relative mx-auto mb-6" style={{ width: 220, height: 220 }}>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
                          <circle
                            cx="110" cy="110" r="100"
                            fill="none"
                            stroke="#FF4A19"
                            strokeWidth="12"
                          />
                          <circle
                            cx="110" cy="110" r="100"
                            fill="none"
                            stroke="#7FCAFE"
                            strokeWidth="18"
                            strokeDasharray={`${(progressPercent / 100) * 2 * Math.PI * 100},${2 * Math.PI * 100}`}
                            strokeDashoffset={0}
                            style={{ transition: 'stroke-dasharray 0.5s' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span style={{ color: '#4248FF', fontWeight: 900, fontSize: '50px' }}>{progressPercent}%</span>
                        </div>
                      </div>
                      <div className="text-center mb-6">
                        <p style={{ color: '#11002E', fontWeight: 400, fontSize: '16px' }}>
                          You have <span style={{ fontWeight: 700 }}>{remainingCredits}</span> credits remaining
                        </p>
                        <p style={{ color: '#11002E', fontWeight: 400, fontSize: '16px' }}>Upgrade now to unlock more generations</p>
                      </div>
                      <Button 
                        className="w-full"
                        style={{
                          background: '#4248FF',
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '28px',
                          borderRadius: '18px',
                          paddingTop: '28px',
                          paddingBottom: '28px',
                        }}
                      >
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Assets Card */}
                  <Card 
                    className="border-0"
                    style={{
                      background: 'linear-gradient(208.72deg, #D3E6FC -5%, #FFFFFF 46.16%, #D3E6FC 109.84%)',
                      borderRadius: '36px',
                    }}
                  >
                    <CardHeader>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '40px',
                          textAlign: 'center',
                          color: '#4248FF',
                          marginBottom: 0,
                        }}
                      >
                        Assets
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Asset Item 1 */}
                      <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold">ND</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Noi Du Caire</p>
                            <p className="text-xs text-gray-500">1 logo • Blog designs</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                          See Details
                        </Button>
                      </div>

                      {/* Asset Item 2 */}
                      <div className="flex items-center justify-between p-3 bg-pink-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-white">D</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Deriskly Logo</p>
                            <p className="text-xs text-gray-500">1 logo • Blog designs</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs bg-transparent hover:bg-pink-50"
                        >
                          See Details
                        </Button>
                      </div>

                      {/* Asset Item 3 */}
                      <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold">BS</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Bo2loz Shoes</p>
                            <p className="text-xs text-gray-500">1 logo • Blog designs</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                          See Details
                        </Button>
                      </div>

                      {/* Asset Item 4 */}
                      <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold">ND</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Noi Du Caire</p>
                            <p className="text-xs text-gray-500">1 logo • Blog designs</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs bg-transparent hover:bg-green-50"
                        >
                          See Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
                  <a href="#" className="hover:text-gray-700">Privacy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700">Terms</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700">Advertising</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700">Ad Choices</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700">Cookies</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700">More</a>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(updatedUser: AuthUser) => {
          setCurrentUser(updatedUser)
          // Refresh company profile data after any modal updates
          const webhook = new N8NWebhook()
          const updatedCompanyProfile = webhook.getCompanyProfile()
          if (updatedCompanyProfile) {
            setCompanyProfile(updatedCompanyProfile)
          }
        }}
      />
    </GradientBackground>
  )
}