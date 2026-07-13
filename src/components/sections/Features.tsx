'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <motion.div 
      className="bg-white p-4 sm:p-6 lg:p-8 text-center rounded-tl-[50px] sm:rounded-tl-[100px] rounded-tr-[50px] sm:rounded-tr-[100px] rounded-br-[5px] sm:rounded-br-[10px] rounded-bl-[5px] sm:rounded-bl-[10px] opacity-100 border-2 border-[#9ECAD6] h-64 sm:h-72 lg:h-80 flex flex-col justify-between"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <motion.div 
        className="flex justify-center mb-3 sm:mb-4 lg:mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32">
          {icon}
        </div>
      </motion.div>
      <div className="grow flex flex-col justify-center">
        <motion.h3 
          className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 leading-tight text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-lg sm:text-xl text-gray-600 leading-relaxed text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};

interface FeaturesProps {
  className?: string;
}

const Features: React.FC<FeaturesProps> = ({ className = '' }) => {
  const features = [
    {
      icon: (
        <Image 
          src="/image/icon/tinggi-berat-badan.svg" 
          alt="Tinggi Berat Badan Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Mengukur tinggi dan berat badan anak otomatis dari kamera",
      description: ""
    },
    {
      icon: (
        <Image 
          src="/image/icon/status-gizi.svg" 
          alt="Status Gizi Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Memberikan status gizi dan potensi risiko stunting secara real-time",
      description: ""
    },
    {
      icon: (
        <Image 
          src="/image/icon/data-pertumbuhan.svg" 
          alt="Data Pertumbuhan Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Menyimpan data pertumbuhan anak secara digital dan aman",
      description: ""
    },
    {
      icon: (
        <Image 
          src="/image/icon/pertumbuhan-gizi.svg" 
          alt="Pertumbuhan Gizi Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Memberikan rekomendasi gizi dan pola makan sesuai kebutuhan",
      description: ""
    }
  ];

  return (
    <motion.section 
      className={`py-2 sm:py-12 lg:py-20 px-6 lg:px-12 bg-white ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#9ECAD6] mb-3 sm:mb-4 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Deteksi Cepat & Akurat dengan CompViT
          </motion.h2>
          <motion.p 
            className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Dengan teknologi Computer Vision dan IoT, CompViT mampu:
          </motion.p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Features;
