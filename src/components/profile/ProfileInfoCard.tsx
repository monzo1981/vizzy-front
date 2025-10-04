"use client"

import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { type User as AuthUser } from "@/lib/auth"

interface ProfileInfoCardProps {
  isDarkMode: boolean;
  themeReady?: boolean;
  language: string;
  isRTL: boolean;
  t: (key: string) => string;
  currentUser: AuthUser | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companyProfile: any | null;
  setIsProfileModalOpen: (open: boolean) => void;
}

export function ProfileInfoCard({
  isDarkMode,
  themeReady = false,
  language,
  t,
  currentUser,
  companyProfile,
  setIsProfileModalOpen,
}: ProfileInfoCardProps) {
  const [windowWidth, setWindowWidth] = useState<number>(1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Card 
      className="border-0" 
      dir={language === 'ar' ? 'rtl' : 'ltr'} 
      style={{ 
        background: themeReady && isDarkMode
          ? 'linear-gradient(100.74deg, rgba(127, 202, 254) -2.34%, rgba(255, 255, 255) 25.59%, rgba(255, 228, 224) 63.57%, rgba(255, 255, 255) 106.88%)'
          : 'linear-gradient(100.74deg, rgba(127, 202, 254, 0.5) -2.34%, rgba(255, 255, 255, 0.5) 25.59%, rgba(255, 228, 224, 0.5) 63.57%, rgba(255, 255, 255, 0.5) 106.88%)',
        borderRadius: '36px'
      }}
      suppressHydrationWarning
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="rounded-full overflow-hidden flex-shrink-0"
            style={{ 
              width: '126px', 
              height: '126px',
              // Reduce size for mobile
              ...(windowWidth < 768 && { width: '80px', height: '80px' })
            }}
          >
            <Avatar 
              src={currentUser?.profile_picture_url || undefined}
              fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'}
              alt="User"
              className="w-full h-full"
              bgOverride="light"
              showBorder={currentUser?.subscription_type_name !== 'Trial'} // Hide border for Trial users
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 style={{
                fontWeight: 700,
                fontSize: windowWidth < 768 ? '24px' : '40px', // Adjust font size for mobile
                color: '#4248FF'
              }}>
                {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Vizzy User'}
              </h2>
              {currentUser?.subscription_type_name && currentUser.subscription_type_name !== 'Trial' && (
                <Badge 
                  className="text-white border-0"
                  style={{
                    background: currentUser.subscription_type_name === 'Grow' 
                      ? 'linear-gradient(89.95deg, #FFEB77 -5.49%, #FF4A19 20.79%, #4248FF 72.23%)'
                      : 'linear-gradient(90deg, #FF4A19 0%, #4248FF 100%)',
                    borderRadius: '18px',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fontSize: windowWidth < 768 ? '14px' : '20px', // Adjust font size for mobile
                    padding: '6px 16px'
                  }}
                >
                  {currentUser.subscription_type_name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{t('profile.uploadProfilePic')}</p>
            <p className="text-sm text-gray-600 mb-1">{t('profile.recommendedSize')}</p>
            <p className="text-sm text-gray-600">{t('profile.allowedFormats')}</p>
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
            }}>{t('profile.personalInfo')}</h3>
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
              <span style={{ color: '#000' }}>{t('profile.edit')}</span>
            </Button>
          </div>

          <div 
            className="max-h-32 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF transparent'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 4px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background-color: #9CA3AF;
                border-radius: 2px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background-color: #6B7280;
              }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* First row: Name, Business name, empty */}
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.name')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>
                  {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : t('profile.notAvailable')}
                </p>
              </div>
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.businessName')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{companyProfile ? companyProfile.company_name : t('profile.notAvailable')}</p>
              </div>
              {/* Empty div for alignment */}
              <div></div>

              {/* Second row: Job Title, Industry, About Company */}
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.jobTitle')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{companyProfile?.job_title || t('profile.notAvailable')}</p>
              </div>
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.industry')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{companyProfile?.industry || t('profile.notAvailable')}</p>
              </div>
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.aboutCompany')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>
                  {companyProfile?.about_company 
                    ? companyProfile.about_company.split(' ').slice(0, 3).join(' ') + (companyProfile.about_company.split(' ').length > 3 ? '...' : '')
                    : t('profile.notAvailable')
                  }
                </p>
              </div>

              {/* Third row: Email, Mobile, Website */}
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.email')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{currentUser ? currentUser.email : t('profile.notAvailable')}</p>
              </div>
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.mobile')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{currentUser?.phone_number || t('profile.notAvailable')}</p>
              </div>
              <div>
                <p style={{
                  color: '#4248FF',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>{t('profile.website')}</p>
                <p style={{
                  color: '#78758E',
                  fontWeight: 500,
                  fontSize: '16px'
                }}>{companyProfile?.company_website_url || t('profile.notAvailable')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}