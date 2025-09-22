"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { useLanguage } from "../contexts/LanguageContext"

// Custom styles for consistent focus
const inputStyles = {
  background: 'rgba(255,255,255,0.6)', 
  border: '2px solid transparent', 
  color: '#111', 
  paddingTop: 14, 
  paddingBottom: 14, 
  paddingLeft: 12,
  paddingRight: 12,
  borderRadius: 20,
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out',
  width: '100%'
}

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #fff;
    border-radius: 10px;
    margin: 8px 0;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #bdbdbd;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #bdbdbd #fff;
  }
`

// Industry options for dropdown
const INDUSTRY_OPTIONS = [
  { value: "", label: { en: "Select Industry", ar: "اختر المجال" } },
  { value: "Food and Beverage", label: { en: "Food and Beverage", ar: "الأغذية والمشروبات" } },
  { value: "Fashion", label: { en: "Fashion", ar: "الموضة والأزياء" } },
  { value: "Beauty and Personal Care", label: { en: "Beauty and Personal Care", ar: "التجميل والعناية الشخصية" } },
  { value: "Health and Wellness", label: { en: "Health and Wellness", ar: "الصحة" } },
  { value: "Education", label: { en: "Education", ar: "التعليم" } },
  { value: "Technology and Software", label: { en: "Technology and Software", ar: "التكنولوجيا والبرمجيات" } },
  { value: "Home and Décor", label: { en: "Home and Décor", ar: "المنزل والديكور" } },
  { value: "Automotive and Transportation", label: { en: "Automotive and Transportation", ar: "السيارات والنقل" } },
  { value: "Sports and Fitness", label: { en: "Sports and Fitness", ar: "الرياضة واللياقة البدنية" } },
  { value: "Travel and Tourism", label: { en: "Travel and Tourism", ar: "السفر والسياحة" } },
  { value: "Finance Services", label: { en: "Finance Services", ar: "الخدمات المالية" } },
  { value: "Real Estate", label: { en: "Real Estate", ar: "العقارات" } },
  { value: "Entertainment", label: { en: "Entertainment", ar: "الترفيه" } },
  { value: "Media & Publishing", label: { en: "Media & Publishing", ar: "الإعلام والنشر" } },
  { value: "Government & NGOs", label: { en: "Government & NGOs", ar: "الحكومة والمنظمات غير الحكومية" } },
  { value: "Energy & Utilities", label: { en: "Energy & Utilities", ar: "الطاقة والمرافق" } },
  { value: "Retail & E-Commerce", label: { en: "Retail & E-Commerce", ar: "التجزئة والتجارة الإلكترونية" } },
  { value: "Hospitality", label: { en: "Hospitality", ar: "الضيافة" } },
  { value: "Pharmaceuticals & Medical Devices", label: { en: "Pharmaceuticals & Medical Devices", ar: "الأدوية والمستلزمات الطبية" } },
  { value: "Gaming & Esports", label: { en: "Gaming & Esports", ar: "الألعاب والرياضات الإلكترونية" } },
  { value: "Agriculture & Food Tech", label: { en: "Agriculture & Food Tech", ar: "الزراعة والتكنولوجيا الغذائية" } },
  { value: "Legal Services", label: { en: "Legal Services", ar: "الخدمات القانونية" } },
  { value: "Construction & Architecture", label: { en: "Construction & Architecture", ar: "البناء والعمارة" } },
  { value: "Luxury Goods", label: { en: "Luxury Goods", ar: "السلع الفاخرة" } },
  { value: "Pet Industry", label: { en: "Pet Industry", ar: "الحيوانات الأليفة ومستلزماتها" } }
]

interface CompanyInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onToast?: (type: 'success' | 'error', message: string) => void
}

interface CompanyData {
  company_name: string
  industry: string
}

export function CompanyInfoModal({ isOpen, onClose, onSuccess, onToast }: CompanyInfoModalProps) {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false)
  const industryDropdownRef = useRef<HTMLDivElement>(null)
  const industryButtonRef = useRef<HTMLButtonElement>(null)

  // Helper function to get industry label
  const getIndustryLabel = (industry: string) => {
    if (!industry) {
      return language === 'ar' ? 'اختر المجال' : 'Select Industry'
    }
    const option = INDUSTRY_OPTIONS.find(opt => opt.value === industry)
    return option ? option.label[language as 'en' | 'ar'] : industry
  }
  
  // Company Info State
  const [companyData, setCompanyData] = useState<CompanyData>({
    company_name: '',
    industry: ''
  })

  // Close industry dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node) &&
          industryButtonRef.current && !industryButtonRef.current.contains(event.target as Node)) {
        setIsIndustryDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isIndustryDropdownOpen])

  // Save Company Info
  const saveCompanyInfo = async () => {
    if (!companyData.company_name.trim()) {
      onToast?.('error', 'Company name is required')
      return
    }
    if (!companyData.industry) {
      onToast?.('error', 'Please select an industry')
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      if (!token) return

      const formData = new FormData()
      formData.append('company_name', companyData.company_name)
      formData.append('industry', companyData.industry)

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
          industry: updatedCompanyData.industry || null,
          job_title: updatedCompanyData.job_title || null,
          // Include required asset files from existing profile or set to null
          brand_manual: updatedCompanyData.brand_manual || null,
          company_profile_file: updatedCompanyData.company_profile_file || null,
          document: updatedCompanyData.document || null,
        }
        
        const webhook = new N8NWebhook()
        webhook.updateCompanyProfileCache(updatedProfile)
        
        onToast?.('success', 'Company information saved successfully!')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        onToast?.('error', 'Failed to save company information')
      }
    } catch (error) {
      console.error('Error saving company info:', error)
      onToast?.('error', 'Error saving company information')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{scrollbarStyles}</style>
      {/* Backdrop with smooth fade-in */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="fixed inset-0" 
          style={{ background: 'rgba(17,0,46,0.48)' }}
        />
        
        {/* Modal with smooth slide-in and scale animation */}
        <div
          className={`relative w-full max-w-2xl mx-4 shadow-xl transform transition-all duration-300 ${
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
          }`}
          style={{
            borderRadius: '56px',
            background: 'linear-gradient(180deg, #D3E6FC -4.03%, #FFFFFF 112.18%)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-center p-6"
            style={{ borderTopLeftRadius: 56, borderTopRightRadius: 56, borderBottom: '1px solid #E5E7EB' }}
          >
            <h2 className="text-xl" style={{ color: '#111', fontWeight: 400 }}>
              Complete Your Company Profile
            </h2>
          </div>

          {/* Subtitle */}
          <div className="px-6 pt-2 pb-4">
            <p className="text-sm text-gray-600">
              Please provide your company information to get personalized AI services and better recommendations.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Company Name */}
            <div>
              <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={companyData.company_name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Enter your company name"
                style={inputStyles}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            {/* Industry */}
            <div>
              <label style={{ color: '#78758E', fontWeight: 400 }} className="block text-sm mb-2">
                Industry *
              </label>
              <div className="relative">
                {/* Custom Dropdown Button */}
                <button
                  ref={industryButtonRef}
                  type="button"
                  onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                  className="flex items-center justify-between"
                  style={inputStyles}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = 'transparent'}
                >
                  <span style={{ color: companyData.industry ? '#111' : '#999' }}>
                    {getIndustryLabel(companyData.industry)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Custom Dropdown Menu - Using relative positioning */}
                {isIndustryDropdownOpen && (
                  <div 
                    className="absolute bg-white z-50 w-full mt-1"
                    style={{ 
                      borderRadius: 20,
                      maxHeight: '200px',
                      overflow: 'hidden',
                      boxShadow: 'rgba(17, 0, 46, 0.1) 0px 0px 20px 2px, rgba(66, 72, 255, 0.1) 0px 1.5px 6px',
                      top: '100%',
                      left: 0
                    }}
                    ref={industryDropdownRef}
                  >
                    <div 
                      className="custom-scrollbar overflow-y-auto" 
                      style={{ 
                        maxHeight: '200px',
                      }}
                    >
                      {INDUSTRY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCompanyData(prev => ({ ...prev, industry: option.value }))
                            setIsIndustryDropdownOpen(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm transition-all duration-200"
                          style={{
                            background: companyData.industry === option.value ? 'linear-gradient(272deg, #FFF -1.67%, #7FCAFE 99.45%)' : 'transparent',
                            color: '#111',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => {
                            if (companyData.industry !== option.value) {
                              e.currentTarget.style.background = 'rgba(127, 202, 254, 0.2)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (companyData.industry !== option.value) {
                              e.currentTarget.style.background = 'transparent'
                            }
                            e.currentTarget.style.color = '#111'
                          }}
                        >
                          {option.label[language as 'en' | 'ar']}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end p-6"
            style={{ borderTop: '1px solid #E5E7EB' }}
          >
            <Button
              onClick={saveCompanyInfo}
              disabled={isLoading || !companyData.company_name.trim() || !companyData.industry}
              style={{
                background: 'linear-gradient(271.55deg, #4248FF -1.67%, #7FCAFE 99.45%)',
                color: '#fff',
                borderRadius: 36,
                minWidth: 120,
                opacity: (!companyData.company_name.trim() || !companyData.industry) ? 0.6 : 1
              }}
              className="gap-2"
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}