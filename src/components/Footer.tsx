import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';


export const Footer = () => {
  return (
    <footer className="bg-[#11002E] text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Image src="/vizzy-logo-dark.svg" alt="VIZZY Logo" width={150} height={150} />
            </div>
            <p className="text-sm" style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
              Your Personal Agency
            </p>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">About Us</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#78758E', fontWeight: 400 }}>
                VIZZY, the agency-quality marketing partner who makes your brand shine 
                faster, simpler, and more affordably.
              </p>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Contact US</h4>
                <div className="flex space-x-4 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>support@vizzy.app</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>get.info@vizzy.app</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful Links & Features */}
          <div className="space-y-6">
            <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
              Helpful Links & Features
            </h4>
            <div className="space-y-3 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
              <Link href="#" className="block hover:text-white transition-colors">Soon - Competitions</Link>
              <Link href="#" className="block hover:text-white transition-colors">Soon - Testimonials</Link>
              <Link href="#" className="block hover:text-white transition-colors">Soon - Tutorials and tips</Link>
              <Link href="#" className="block hover:text-white transition-colors">Soon - Blogs</Link>
              <Link href="#" className="block hover:text-white transition-colors">Soon - Events</Link>
            </div>
          </div>

          {/* Information Center */}
          <div className="space-y-6">
            <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
              Information Center
            </h4>
            <div className="space-y-3 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
              <Link href="/terms" className="block hover:text-white transition-colors">Terms and Conditions</Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/support" className="block hover:text-white transition-colors">Support center</Link>
            </div>
            
            <div className="space-y-3">
              <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
                Keep in touch
              </h4>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/share/16SE6Ny5jB/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/facebook.svg" alt="Facebook" width={24} height={24} />
                </a>
                <a href="https://www.instagram.com/vizzy.app?igsh=NzlxMTl4eXE1MGdi" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/instagram.svg" alt="Instagram" width={24} height={24} />
                </a>
                <a href="https://www.linkedin.com/company/vizzy-app/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/linkedin.svg" alt="LinkedIn" width={24} height={24} />
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter & Top Links */}
          <div className="space-y-6">
            <div className="flex space-x-4 text-sm">
              <Link href="/" className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                HOME
              </Link>
              <Link href="/pricing" className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                Pricing
              </Link>
              <Link href="/services" className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                Services
              </Link>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold" style={{ color: '#4248FF' }}>
                Subscribe & get offers and updates
              </h4>
              <div className="space-y-3">
                <input 
                  type="email"
                  placeholder="your.email@website.com" 
                  className="w-full bg-white text-black placeholder:text-[#78758E] rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ fontWeight: 200 }}
                />
                <button className="w-full text-white rounded-lg px-4 py-2 hover:shadow-lg transition-all" style={{ background: 'linear-gradient(90deg, #4248FF 0%, #7FCAFE 98.7%)', fontWeight: 700, fontSize: '18px' }}>
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © All Copy Rights Is Reserved to vizzy app 2025 - Owned By Monzology
          </p>
        </div>
      </div>
    </footer>
  );
};