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
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  ChevronLeft,
  ChevronRight,
  Activity,
  Puzzle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
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
  const router = useRouter()

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

  return (
    <GradientBackground isDarkMode={isDarkMode}>
      {/* Fixed Header/Navbar - PURE WHITE */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md px-6 py-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo - NO TOGGLE HERE */}
            <div className="flex items-center gap-2 ml-16"> {/* ml-16 to account for sidebar */}
              <Image 
                src={"/vizzy-logo.svg"} 
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
            <Avatar 
              src={currentUser?.profile_picture_url || undefined}
              fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'} 
              alt="User" 
              size="md" 
            />
          </div>
        </div>
      </header>

      {/* Layout Container */}
      <div className="flex pt-[72px]"> {/* Padding top for fixed header */}
        
        {/* Sidebar - PURE WHITE, COLLAPSIBLE */}
        <aside
          className={`
            fixed left-0 top-[72px] h-[calc(100vh-72px)] bg-white shadow-lg
            transition-all duration-300 ease-in-out z-40
            ${sidebarExpanded ? "w-[280px]" : "w-[60px]"}
            overflow-hidden
          `}
        >
          <div className="flex flex-col h-full">
            {/* Toggle Button - TOP OF SIDEBAR */}
            <div className="p-3 border-b border-gray-200">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="w-full hover:bg-gray-100"
              >
                {sidebarExpanded ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
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
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <User className="w-5 h-5" />
                      {sidebarExpanded && <span className="ml-3">Edit Profile</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Bell className="w-5 h-5" />
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
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Activity className="w-5 h-5" />
                      {sidebarExpanded && <span className="ml-3">Activetes</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Puzzle className="w-5 h-5" />
                      {sidebarExpanded && <span className="ml-3">Interest</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Users className="w-5 h-5" />
                      {sidebarExpanded && <span className="ml-3">Invite & win</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <CreditCard className="w-5 h-5" />
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
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <Lock className="w-5 h-5" />
                      {sidebarExpanded && <span className="ml-3">Password</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
                    >
                      <User className="w-5 h-5" />
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
                className={`w-full hover:bg-gray-100 ${sidebarExpanded ? "justify-start px-3" : "justify-center px-0"}`}
              >
                <LogOut className="w-5 h-5" />
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
                  <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-0">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <Avatar 
                          src={currentUser?.profile_picture_url || undefined}
                          fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'} 
                          alt="User" 
                          size="xl" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Mohsen'}
                            </h2>
                            <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0">
                              Pro
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">For uploading new Profile pic</p>
                          <p className="text-sm text-gray-600 mb-1">At least 800×800 px recommended</p>
                          <p className="text-sm text-gray-600">JPG or PNG is allowed</p>
                        </div>
                      </div>

                      {/* Personal Info Section */}
                      <div className="bg-white/70 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Personal info</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 bg-transparent hover:bg-white"
                            onClick={() => setIsProfileModalOpen(true)}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Name</p>
                            <p className="font-medium">
                              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Mohsen Momtaz'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <p className="font-medium">{currentUser ? currentUser.email : 'mohsn@egyspy.gov'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Phone</p>
                            <p className="font-medium">{currentUser?.phone_number || 'Not available'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Company Name</p>
                            <p className="font-medium">{companyProfile ? companyProfile.company_name : 'Not available'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Company Website</p>
                            <p className="font-medium">{companyProfile ? companyProfile.company_website_url : 'Not available'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Company Logo</p>
                            {companyProfile && companyProfile.logo_url ? (
                              <Image 
                                src={companyProfile.logo_url}
                                alt="Company Logo"
                                width={40}
                                height={40}
                              />
                            ) : (
                              <p className="font-medium">Not available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Work and My Links Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Recent Work Card */}
                    <Card className="bg-[#7FCAFE] border-0 text-white">
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
                          <div className="flex items-center justify-between mt-6">
                            <div className="flex gap-1">
                              <div className="w-8 h-1 bg-white rounded-full"></div>
                              <div className="w-8 h-1 bg-red-500 rounded-full"></div>
                              <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white text-black border-2 border-black font-bold shadow-md hover:bg-gray-100 hover:text-black"
                            >
                              See Full
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right Column Cards */}
                    <div className="space-y-4">
                      {/* My Links Card */}
                      <Card className="bg-[#4248FF] border-0 text-white">
                        <CardContent className="p-6">
                          <h3 className="font-bold mb-2" style={{ fontWeight: 700, fontSize: 50, textAlign: 'center' }}>My Links</h3>
                          <p className="text-sm text-white/80 mb-4">
                            This links to your accounts will be used as reference for tone of voice and visual direction, to
                            influence future generated visuals if needed.
                          </p>
                          <div className="flex gap-3">
                            <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 border-0">
                              <Globe className="w-4 h-4 text-white" />
                            </Button>
                            <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 border-0">
                              <Facebook className="w-4 h-4 text-white" />
                            </Button>
                            <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 border-0">
                              <Instagram className="w-4 h-4 text-white" />
                            </Button>
                            <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 border-0">
                              <Linkedin className="w-4 h-4 text-white" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Invite & Win Card */}
                      <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 
                                className="font-bold" 
                                style={{ fontWeight: 700, fontSize: 45, lineHeight: '100%', letterSpacing: 0 }}
                              >Invite</h3>
                              <h3 
                                className="font-bold" 
                                style={{ fontWeight: 700, fontSize: 45, lineHeight: '100%', letterSpacing: 0 }}
                              >& WIN !!</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white text-orange-500 hover:bg-gray-100 border-0"
                              >
                                Know More
                              </Button>
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
                  <Card className="bg-gradient-to-br from-yellow-200 to-yellow-300 border-0">
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-purple-600 mb-4">Credits</h3>
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="75, 100"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-blue-600">75%</span>
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">
                          You have <span className="font-bold">2,500</span> credits remaining
                        </p>
                        <p className="text-sm text-gray-600">Upgrade now to unlock more generations</p>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Assets Card */}
                  <Card className="border-0 bg-white">
                    <CardHeader>
                      <h3 className="text-xl font-bold text-gray-900">Assets</h3>
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
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser)
          // Company profile will be updated by the Modal itself via localStorage
          // Just refresh our local state from updated localStorage
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