'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProcessCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  borderClass: string;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ icon, title, subtitle, description, borderClass }) => {
  return (
    <motion.div 
      className={`p-4 sm:p-6 lg:p-8 text-center bg-linear-to-br from-[rgba(158,202,214,0.7)] via-[rgba(255,255,255,0.7)] to-[rgba(158,202,214,0.7)] opacity-100 shadow-[0px_1px_3px_1px_#00000026,0px_1px_2px_0px_#0000004D] h-72 sm:h-80 lg:h-96 flex flex-col justify-between ${borderClass}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -10 }}
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
          className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
        <motion.h4 
          className="text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {subtitle}
        </motion.h4>
        <motion.p 
          className="text-sm sm:text-base text-gray-600 leading-relaxed text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};

interface ProcessProps {
  className?: string;
}

const Process: React.FC<ProcessProps> = ({ className = '' }) => {
  const processes = [
    {
      icon: (
        <Image 
          src="/image/icon/ambil-gambar-anak.svg" 
          alt="Ambil Gambar Anak Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Ambil Gambar Anak",
      subtitle: "Sistem mengenali tubuh dengan sensor Computer Vision",
      description: "",
      borderClass: "rounded-tl-[10px] sm:rounded-tl-[20px] rounded-tr-[50px] sm:rounded-tr-[100px] rounded-br-[10px] sm:rounded-br-[20px] rounded-bl-[50px] sm:rounded-bl-[100px]"
    },
    {
      icon: (
        <Image 
          src="/image/icon/pengolahan-otomatis.svg" 
          alt="Pengolahan Otomatis Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Pengolahan Otomatis",
      subtitle: "Data tinggi & berat dihitung secara akurat",
      description: "",
      borderClass: "rounded-[10px] sm:rounded-[20px]"
    },
    {
      icon: (
        <Image 
          src="/image/icon/lihat-hasil-rekomendasi.svg" 
          alt="Lihat Hasil Rekomendasi Icon" 
          width={128} 
          height={128}
          className="w-32 h-32"
        />
      ),
      title: "Lihat Hasil & Rekomendasi",
      subtitle: "Status gizi langsung ditampilkan",
      description: "",
      borderClass: "rounded-tl-[50px] sm:rounded-tl-[100px] rounded-tr-[10px] sm:rounded-tr-[20px] rounded-br-[50px] sm:rounded-br-[100px] rounded-bl-[10px] sm:rounded-bl-[20px]"
    }
  ];

  return (
    <motion.section 
      className={`py-8 sm:py-12 lg:py-20 px-6 lg:px-12 bg-white ${className}`}
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
            Cara Kerja dalam 3 Langkah Mudah
          </motion.h2>
        </motion.div>

        {/* Process Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {processes.map((process, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <ProcessCard
                icon={process.icon}
                title={process.title}
                subtitle={process.subtitle}
                description={process.description}
                borderClass={process.borderClass}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Process;
