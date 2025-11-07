'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { useRouter } from 'next/navigation';

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  heroImage?: string;
  onButtonClick?: () => void;
  className?: string;
}

const Hero: React.FC<HeroProps> = ({
  title = "Cegah Stunting Lebih Awal, Demi Generasi Sehat dan Cerdas",
  subtitle = "",
  description = "Pantau tinggi dan berat badan anak secara otomatis dengan teknologi Computer Vision & IoT yang akurat dan terpercaya.",
  buttonText = "Mulai Deteksi Sekarang",
  buttonLink = "/scan",
  className = '',
}) => {
  const router = useRouter();
  return (
  <motion.section 
    className={`hero-responsive-bg min-h-[60vh] sm:min-h-[70vh] lg:min-h-screen flex items-center pt-16 pb-20 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-40 px-6 lg:px-12 relative ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
      <div className="hero-container mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-14 items-center">
          {/* Left Content */}
          <motion.div 
            className="space-y-2 sm:space-y-4 lg:space-y-8 max-w-xl mx-auto lg:mx-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {subtitle && (
              <motion.p 
                className="text-[var(--color-primary)] font-semibold text-xl text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {subtitle}
              </motion.p>
            )}
            
            <motion.h1 
              className="text-4xl sm:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-sm text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg text-white/90 leading-relaxed text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {description}
            </motion.p>
            
            <motion.div 
              className="pt-1 sm:pt-2 flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(buttonLink)}
                className="!bg-white !text-black hover:!bg-gray-100 focus:ring-white shadow-md px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold tracking-wide"
              >
                {buttonText}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Content - Large main image with small overlay */}
          <motion.div 
            className="relative flex justify-center lg:justify-start"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Main image container with doctor measuring child's height */}
            <motion.div 
              className="relative w-full max-w-[580px] overflow-hidden bg-white rounded-tl-[50px] sm:rounded-tl-[100px] rounded-tr-[10px] sm:rounded-tr-[20px] rounded-br-[50px] sm:rounded-br-[100px] rounded-bl-[10px] sm:rounded-bl-[20px] opacity-100"
              style={{
                boxShadow: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-full h-[250px] sm:h-[320px] md:h-[380px] lg:h-[420px] bg-gray-50 flex items-center justify-center">
                <Image 
                  src="/image/icon/doctor-meausuring-child-height.jpg"
                  alt="Doctor measuring child height"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
            {/* Small overlay card showing weighing scale */}
            <motion.div 
              className="absolute -bottom-4 sm:-bottom-8 -left-2 sm:-left-4 w-32 h-24 sm:w-48 sm:h-40 overflow-hidden bg-white rounded-tl-[10px] sm:rounded-tl-[20px] rounded-tr-[25px] sm:rounded-tr-[50px] rounded-br-[10px] sm:rounded-br-[20px] rounded-bl-[25px] sm:rounded-bl-[50px] rotate-180 opacity-100"
              style={{
                boxShadow: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
              }}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs font-medium rotate-180">
                <Image 
                  src="/image/icon/baby-weigt-scale.jpg"
                  alt="Baby weighing scale"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* Wave scallop edge - Hidden on mobile */}
      <div className="hidden lg:block wave-edge" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 60c60 0 60 60 120 60s60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60v60H0Z" />
        </svg>
      </div>
    </motion.section>
  );
};

export default Hero;
