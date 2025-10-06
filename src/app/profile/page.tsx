"use client"

export const dynamic = 'force-dynamic' 

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { Input } from "@/components/ui/input"
import { isAuthenticated, getUser, type User as AuthUser } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { GradientBackground } from "@/components/gradient-background"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { RecentWorkModal } from "@/components/profile/RecentWorkModal"
import { RecentWorkCard } from "@/components/profile/RecentWorkCard"
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard"
import { Footer } from "@/components/Footer"

export default function ProfilePage() {
  const { toasts, toast, removeToast } = useToast()
  const { t, isRTL, language, createLocalizedPath } = useLanguage()
  const { isDarkMode, mounted } = useTheme()

  const [isRecentWorkModalOpen, setIsRecentWorkModalOpen] = useState(false)

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companyProfile, setCompanyProfile] = useState<any | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [recentWork, setRecentWork] = useState<Array<{
    id: string;
    content_url: string;
    created_at: string;
    ai_chat_session_id?: string;
  }>>([])
  // UserLimits type is extended in n8n-webhook.ts to include credits system
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [remainingCredits, setRemainingCredits] = useState<number | string>('-');
  const [totalCredits, setTotalCredits] = useState<number | string>('-');
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [subscriptionType, setSubscriptionType] = useState<string>('Trial');
  const [uploadedAssets, setUploadedAssets] = useState<Record<string, {file_id: string | null, file_url: string | null}>>({
    brand_manual: { file_id: null, file_url: null },
    company_profile: { file_id: null, file_url: null },
    document: { file_id: null, file_url: null }
  });
  const [isUploadingBrandManual, setIsUploadingBrandManual] = useState(false);
  const [isUploadingCompanyProfile, setIsUploadingCompanyProfile] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState<number>(1024);

  // Helper function to get loading state for a field
  const getIsUploading = (field: string) => {
    if (field === 'brand_manual') return isUploadingBrandManual;
    if (field === 'company_profile') return isUploadingCompanyProfile;
    if (field === 'document') return isUploadingDocument;
    return false;
  };

  // Helper function to set loading state for a field
  const setIsUploading = (field: string, value: boolean) => {
    if (field === 'brand_manual') setIsUploadingBrandManual(value);
    else if (field === 'company_profile') setIsUploadingCompanyProfile(value);
    else if (field === 'document') setIsUploadingDocument(value);
  };
  // Fetch user limits and calculate progress
  useEffect(() => {
    async function fetchLimits() {
      console.log('Starting to fetch user limits...');
      const webhook = new N8NWebhook();
      // Call getUserLimits method properly
      const limits = await webhook.getUserLimits();
      console.log('Received limits:', limits);
      
      if (limits) {
        // New credits system
        const remaining = limits.remaining_credits;
        const total = limits.total_credits;
        const unlimited = limits.is_unlimited ?? false;
        const subType = limits.subscription_type || 'Trial';
        
        console.log('Credits data:', { remaining, total, unlimited, subType });
        
        // Update state
        setSubscriptionType(subType);
        setIsUnlimited(unlimited);
        
        if (unlimited) {
          // Unlimited subscription
          setRemainingCredits('∞');
          setTotalCredits('∞');
          setProgressPercent(100); // Always full for unlimited
        } else if (remaining !== null && remaining !== undefined) {
          // Limited credits
          setRemainingCredits(remaining);
          setTotalCredits(total || 0);
          
          // Calculate progress percentage
          let percent = 0;
          if (total && total > 0) {
            percent = Math.round((remaining / total) * 100);
          }
          
          console.log('Calculated progress:', { remaining, total, percent });
          
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
          // No credits data available
          console.warn('No credits data available');
          setRemainingCredits(0);
          setTotalCredits(0);
          setProgressPercent(0);
        }
      } else {
        console.error('Failed to get user limits');
      }
    }
    fetchLimits();
  }, []);

  // Fetch recent work
  useEffect(() => {
    async function fetchRecentWork() {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return

        // Fetch limited data for carousel (5 items)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recent-work/?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setRecentWork(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching recent work:', error)
      }
    }

    if (isAuthenticated()) {
      fetchRecentWork()
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
        // Update uploaded assets from cached profile
        setUploadedAssets({
          brand_manual: profile.brand_manual || { file_id: null, file_url: null },
          company_profile: profile.company_profile_file || { file_id: null, file_url: null },
          document: profile.document || { file_id: null, file_url: null }
        })
      } else {
        webhook.refreshCompanyProfile().then(() => {
          const updatedProfile = webhook.getCompanyProfile()
          if (updatedProfile) {
            setCompanyProfile(updatedProfile)
            // Update uploaded assets from refreshed profile
            setUploadedAssets({
              brand_manual: updatedProfile.brand_manual || { file_id: null, file_url: null },
              company_profile: updatedProfile.company_profile_file || { file_id: null, file_url: null },
              document: updatedProfile.document || { file_id: null, file_url: null }
            })
          }
        })
      }
    }
  }, [router])

  // Set window width for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error(t('profile.loginAgain'))
        return
      }

      const formData = new FormData()
      formData.append('logo', file)
      
      // إرسال company_name و industry (required fields)
      if (companyProfile?.company_name) {
        formData.append('company_name', companyProfile.company_name)
      } else {
        // إذا لم يكن موجود، استخدم قيمة افتراضية
        formData.append('company_name', 'Default Company')
      }
      
      // إرسال industry (required field)
      if (companyProfile?.industry) {
        formData.append('industry', companyProfile.industry)
      } else {
        // إذا لم يكن موجود، استخدم قيمة افتراضية
        formData.append('industry', 'Other')
      }
      
      // إرسال باقي الحقول الاختيارية
      if (companyProfile?.company_website_url) {
        formData.append('company_website_url', companyProfile.company_website_url)
      }
      
      if (companyProfile?.about_company) {
        formData.append('about_company', companyProfile.about_company)
      }
      
      if (companyProfile?.job_title) {
        formData.append('job_title', companyProfile.job_title)
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
          about_company: updatedCompanyData.about_company || companyProfile?.about_company || null,
          logo_url: updatedCompanyData.logo_url || null,
          industry: updatedCompanyData.industry || companyProfile?.industry || null,
          job_title: updatedCompanyData.job_title || companyProfile?.job_title || null,
          visual_guide: companyProfile?.visual_guide || null,
          logotype: companyProfile?.logotype || null,
          logo_mode: companyProfile?.logo_mode || null,
          // Keep existing asset files
          brand_manual: companyProfile?.brand_manual || null,
          company_profile_file: companyProfile?.company_profile_file || null,
          document: companyProfile?.document || null,
        }
        
        const webhook = new N8NWebhook()
        webhook.updateCompanyProfileCache(updatedProfile)
        
        // Update local state
        setCompanyProfile(updatedProfile)
        
        toast.success(t('profile.logoUpdated'))
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        toast.error(t('profile.logoUpdateFailed'))
      }
    } catch (error) {
      console.error('Error updating logo:', error)
      toast.error(t('profile.logoUpdateError'))
    } finally {
      setIsUploadingLogo(false);
    }
  }

  // Get asset label from field name
  const getAssetLabel = (field: string) => {
    const assets = [
      { icon: '/manual.svg', label: t('profile.brandManual'), field: 'brand_manual' },
      { icon: '/profile.svg', label: t('profile.companyProfile'), field: 'company_profile' },
      { icon: '/document.svg', label: t('profile.document'), field: 'document' },
    ];
    return assets.find(asset => asset.field === field)?.label || field;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast.error(t('profile.noFileSelected'));
      return;
    }

    // Set loading state when file is selected
    setIsUploading(field, true);

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_name', field);

    try {
      const token = localStorage.getItem('access_token'); // استخدام access_token بدلاً من token
      if (!token) {
        toast.error(t('profile.loginAgain'));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/client/files/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error(t('profile.fileUploadFailed'));
        return;
      }

      const data = await response.json();
      toast.success(`${getAssetLabel(field)} ${t('profile.fileUploadSuccess')}`);
      
      // Update uploaded assets state with the new file info
      if (data && data.data) {
        setUploadedAssets((prev) => ({
          ...prev,
          [field]: {
            file_id: data.data.file_id,
            file_url: data.data.public_url
          }
        }));
        
        // Also refresh the N8N cache
        const webhook = new N8NWebhook();
        webhook.refreshCompanyProfile();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('profile.fileUploadError'));
    } finally {
      // Reset loading state
      setIsUploading(field, false);
    }
  };

  const handleRemoveFile = async (field: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error(t('profile.loginAgain'));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/client/files/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field_name: field }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error(t('profile.fileRemovalFailed'));
        return;
      }

      toast.success(`${getAssetLabel(field)} ${t('profile.fileRemovalSuccess')}`);
      
      // Update uploaded assets state
      setUploadedAssets((prev) => ({
        ...prev,
        [field]: { file_id: null, file_url: null }
      }));
      
      // Also refresh the N8N cache
      const webhook = new N8NWebhook();
      webhook.refreshCompanyProfile();
      
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error(t('profile.fileRemovalError'));
    }
  };

  return (
    <GradientBackground>
      {/* Fixed Header/Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 shadow-md px-6 py-4 z-50 ${
          mounted && isDarkMode ? 'bg-[#0E0E10]' : 'bg-white'
        }`}
        suppressHydrationWarning
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 ml-16 cursor-pointer" 
              onClick={() => router.push(createLocalizedPath('chat'))}
              title="Go to Chat"
              suppressHydrationWarning
            >
              <Image 
                src={mounted && isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg"} 
                alt="Vizzy Logo" 
                width={150}
                height={100}
                suppressHydrationWarning
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
      <div className="flex pt-[92px]">
        {/* Main Content - CENTERED */}
        <main className="flex-1">
          <div className="flex justify-center px-6 py-6">
            <div className="w-full max-w-[1400px]">
              <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isRTL ? 'lg:grid-flow-col-reverse' : ''}`}>
                
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-2">
                  {/* Profile Card */}
                  <ProfileInfoCard
                    isDarkMode={isDarkMode}
                    themeReady={mounted}
                    language={language}
                    isRTL={isRTL}
                    t={t}
                    currentUser={currentUser}
                    companyProfile={companyProfile}
                    setIsProfileModalOpen={setIsProfileModalOpen}
                  />

                  {/* Recent Work and My Links Row */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                    {/* Recent Work Card */}
                    <RecentWorkCard
                      isDarkMode={isDarkMode}
                      language={language}
                      isRTL={isRTL}
                      t={t}
                      createLocalizedPath={createLocalizedPath}
                      recentWork={recentWork}
                      setIsRecentWorkModalOpen={setIsRecentWorkModalOpen}
                    />

                    {/* Right Column Cards */}
                    <div className="space-y-10 md:col-span-2">
                      {/* My Links Card */}
                      <Card 
                        className="border-0 text-white"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
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
                              fontSize: '30px',
                              textAlign: 'center',
                              marginBottom: '12px',
                            }}
                          >{t('profile.myLinks')}</h3>
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
                            {t('profile.linksDescription')}
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
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        style={{
                          background: '#FF4A19',
                          borderRadius: '36px',
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 flex flex-col items-center text-center">
                              <h3
                                style={{
                                  fontFamily: 'Inter',
                                  fontWeight: 700,
                                  fontSize: '30px',
                                  lineHeight: '100%',
                                  letterSpacing: 0,
                                  marginBottom: '16px',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                }}
                              >{t('profile.yourLogo')}</h3>
                              <Button
                                type="button"
                                className="flex items-center justify-center border-0"
                                style={{
                                  background: '#FFEB77',
                                  borderRadius: '50px',
                                  color: '#111',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  padding: '12px 32px',
                                  width: 'fit-content',
                                }}
                                onClick={() => document.getElementById('logo-upload-input')?.click()}
                                disabled={isUploadingLogo}
                              >
                                {isUploadingLogo ? t('profile.uploading') : t('profile.upload')}
                              </Button>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              {companyProfile && companyProfile.logo_url ? (
                                <Image 
                                  src={companyProfile.logo_url}
                                  alt="Company Logo"
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover rounded-lg max-w-[100px] max-h-[100px]"
                                />
                              ) : (
                                <Image 
                                  src="/logo-upload.svg"
                                  alt="Upload Logo"
                                  width={70}
                                  height={70}
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
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    style={{ 
                      background: 'linear-gradient(143.41deg, #FFEB77 -4.53%, #FFE4E0 103.15%)', 
                      borderRadius: '36px' 
                    }}
                  >
                    <CardContent className="p-8" style={{ minHeight: 420 }}>
                      <h3
                        style={{
                          background: 'linear-gradient(94.41deg, #4248FF -4.88%, #FF4A19 119.67%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 700,
                          fontSize: '30px',
                          textAlign: 'center',
                          marginBottom: 0,
                        }}
                      >
                        {t('profile.credits')}
                      </h3>
                      <div className="relative mx-auto mb-6" style={{ width: 150, height: 150 }}>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 150 150">
                          <circle
                            cx="75" cy="75" r="65"
                            fill="none"
                            stroke="#FF4A19"
                            strokeWidth="8"
                          />
                          <circle
                            cx="75" cy="75" r="65"
                            fill="none"
                            stroke="#7FCAFE"
                            strokeWidth="12"
                            strokeDasharray={`${(progressPercent / 100) * 2 * Math.PI * 65},${2 * Math.PI * 65}`}
                            strokeDashoffset={0}
                            style={{ transition: 'stroke-dasharray 0.5s' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span style={{ color: '#4248FF', fontWeight: 900, fontSize: '28px' }}>{progressPercent}%</span>
                        </div>
                      </div>
                      <div className="text-center mb-6">
                        <p style={{ color: '#11002E', fontWeight: 400, fontSize: '16px' }}>
                          {isUnlimited ? (
                            <>
                              {language === 'ar' ? 'نقاط غير محدودة' : 'Unlimited Credits'} 
                              <span style={{ fontWeight: 700, color: '#4248FF' }}> ∞</span>
                            </>
                          ) : (
                            <>
                              {t('profile.creditsRemaining')} <span style={{ fontWeight: 700, color: '#4248FF' }}>{remainingCredits}</span> {t('profile.creditsRemainingEnd')}
                            </>
                          )}
                        </p>
                        <p style={{ color: '#11002E', fontWeight: 400, fontSize: '16px' }}>{t('profile.upgradeMessage')}</p>
                      </div>
                      <Button 
                        className="cursor-pointer w-full"
                        style={{
                          background: '#4248FF',
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '20px',
                          borderRadius: '18px',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                        }}
                        onClick={() => router.push(createLocalizedPath('pricing'))}
                      >
                        {t('profile.upgradeNow')}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Assets Card */}
                  <Card 
                    className="border-0"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    style={{
                      background: 'linear-gradient(208.72deg, #D3E6FC -5%, #FFFFFF 46.16%, #D3E6FC 109.84%)',
                      borderRadius: '36px',
                    }}
                  >
                    <CardHeader>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '30px',
                          textAlign: 'center',
                          color: '#4248FF',
                          marginBottom: 0,
                        }}
                      >
                        {t('profile.assets')}
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Asset Items */}
                      {[
                        { icon: '/manual.svg', label: t('profile.brandManual'), field: 'brand_manual' },
                        { icon: '/profile.svg', label: t('profile.companyProfile'), field: 'company_profile' },
                        { icon: '/document.svg', label: t('profile.document'), field: 'document' },
                      ].map((asset, i) => (
                        <div key={i} className="flex items-center justify-between p-3" style={{ background: '#D3E6FC', borderRadius: 20 }}>
                          <div className="flex items-center gap-2 md:gap-3">
                            <div
                              className="bg-white flex items-center justify-center"
                              style={{
                                width: windowWidth < 768 ? 48 : 64,
                                height: windowWidth < 768 ? 48 : 64,
                                padding: 8,
                                borderRadius: 12,
                                boxShadow: '0 0 2px 0 rgba(0, 0, 0, 0.25)',
                              }}
                            >
                              <Image
                                src={asset.icon}
                                alt="Asset Icon"
                                width={windowWidth < 768 ? 32 : 48}
                                height={windowWidth < 768 ? 32 : 48}
                                style={{ 
                                  filter: uploadedAssets[asset.field]?.file_id 
                                    ? 'invert(47%) sepia(88%) saturate(6151%) hue-rotate(11deg) brightness(95%) contrast(102%)' // #FF4A19 filter
                                    : 'brightness(0) saturate(100%) invert(85%) sepia(1%) saturate(0%) hue-rotate(314deg) brightness(91%) contrast(88%)' // #D9D9D9 filter
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className="font-medium"
                                style={{
                                  color: uploadedAssets[asset.field]?.file_id ? '#000000' : '#B4B3BE',
                                  fontSize: 16,
                                  fontWeight: 600,
                                }}
                              >
                                {asset.label}
                              </p>
                              <div>
                                <p className="text-xs text-gray-500" style={{ fontWeight: 200 }}>Description:</p>
                                <p className="text-xs text-gray-500" style={{ fontWeight: 200 }}>Logo - Stock images ..</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-1 md:ml-2">
                            <div className="flex items-center gap-1 md:gap-2">
                              {uploadedAssets[asset.field]?.file_id ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="text-white text-xs px-2 md:px-4"
                                    style={{ background: '#7FCAFE', borderRadius: 36, fontWeight: 600, fontSize: windowWidth < 768 ? '10px' : '12px' }}
                                    onClick={() => handleRemoveFile(asset.field)}
                                  >
                                    {t('profile.remove')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-white text-xs px-2 md:px-4"
                                    style={{ background: '#7FCAFE', borderRadius: 36, fontWeight: 600, fontSize: windowWidth < 768 ? '10px' : '12px' }}
                                    onClick={() => document.getElementById(`${asset.field}-upload`)?.click()}
                                    disabled={getIsUploading(asset.field)}
                                  >
                                    {getIsUploading(asset.field) ? t('profile.uploading') : t('profile.update')}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  className="text-white text-xs px-4 md:px-6"
                                  style={{ background: '#FF4A19', borderRadius: 36, fontWeight: 600, minWidth: '60px', fontSize: windowWidth < 768 ? '10px' : '12px' }}
                                  onClick={() => document.getElementById(`${asset.field}-upload`)?.click()}
                                  disabled={getIsUploading(asset.field)}
                                >
                                  {getIsUploading(asset.field) ? t('profile.uploading') : t('profile.assetsUpload')}
                                </Button>
                              )}
                            </div>
                            <input
                              type="file"
                              id={`${asset.field}-upload`}
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileUpload(e, asset.field)}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer - Full Width Outside Container */}
      <div className="mt-16">
        <Footer />
      </div>
      
      {/* Hidden file input for logo upload */}
      <input
        id="logo-upload-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleLogoUpload(file)
          }
        }}
      />
      
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
        onToast={(type, message) => {
          if (type === 'success') {
            toast.success(message)
          } else {
            toast.error(message)
          }
        }}
      />

      {/* Recent Work Modal */}
      <RecentWorkModal
        isOpen={isRecentWorkModalOpen}
        onClose={() => setIsRecentWorkModalOpen(false)}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </GradientBackground>
  )
}