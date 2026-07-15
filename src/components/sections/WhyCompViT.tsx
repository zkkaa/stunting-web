'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { useRouter } from 'next/navigation';

interface WhyCardProps {
  title: string;
  description: string;
}

const WhyCard: React.FC<WhyCardProps> = ({ title, description }) => {
  return (
    <motion.div
      className="bg-white p-3 sm:p-4 lg:p-6 text-center h-32 sm:h-36 lg:h-40 flex flex-col justify-center shadow-[0px_1px_3px_1px_#00000026,0px_1px_2px_0px_#0000004D] opacity-100 rounded-tl-[50px] sm:rounded-tl-[100px] rounded-tr-[50px] sm:rounded-tr-[100px] rounded-br-[5px] sm:rounded-br-[10px] rounded-bl-[5px] sm:rounded-bl-[10px]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <motion.h3
        className="text-sm sm:text-base font-bold text-gray-800 mb-1 sm:mb-2 leading-tight text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-sm text-gray-600 leading-relaxed text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

interface WhyCompViTProps {
  className?: string;
  buttonLink?: string;
  buttonText?: string;
}

const WhyCompViT: React.FC<WhyCompViTProps> = ({ className = '', buttonLink = "/scan", buttonText = "Mulai Deteksi Sekarang" }) => {
  const router = useRouter();
  const whyFeatures = [
    {
      title: "Akurat & Cepat",
      description: "Tanpa alat ukur manual yang rawan kesalahan"
    },
    {
      title: "Praktis & Hemat Waktu",
      description: "Cocok untuk posyandu, sekolah, dan rumah sakit"
    },
    {
      title: "Data Tersimpan Aman",
      description: "Mudah dipantau dari ponsel atau komputer"
    },
    {
      title: "Dukung Pencegahan Dini",
      description: "Membantu intervensi sebelum terlambat"
    }
  ];

  return (
    <motion.section
      className={`wave-background-bottom min-h-screen py-8 sm:py-12 lg:py-20 px-6 lg:px-12 relative ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Wave scallop edge at top */}
      <div className="wave-edge-top" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 60c60 0 60 60 120 60s60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60 60 60 120 60 60-60 120-60v60H0Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 pt-16 sm:pt-24 lg:pt-32">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-10 lg:mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Kenapa Harus<br />Menggunakan CompViT?
          </motion.h2>
        </motion.div>

        {/* Why Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {whyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <WhyCard
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="flex flex-col items-center space-y-4 sm:space-y-6 lg:space-y-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          {/* Image Card */}
          <motion.div
            className="w-full max-w-xs sm:max-w-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative overflow-hidden h-48 sm:h-56 lg:h-64 opacity-100 rounded-tl-[50px] sm:rounded-tl-[100px] rounded-tr-[50px] sm:rounded-tr-[100px] rounded-br-[10px] sm:rounded-br-[20px] rounded-bl-[10px] sm:rounded-bl-[20px]">
              <Image
                src="/image/icon/pengukuran-anak.jpg"
                alt="Pengukuran Anak"
                fill
                sizes="(max-width: 640px) 320px, 384px"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <motion.h3
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 leading-tight text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              Mulai Deteksi Dini, Wujudkan
            </motion.h3>
            <motion.h4
              className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              viewport={{ once: true }}
            >
              Generasi Bebas Stunting
            </motion.h4>
          </motion.div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(buttonLink)}
              className="bg-white! text-black! hover:bg-gray-100! focus:ring-white shadow-md px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold tracking-wide rounded-full"
            >
              {buttonText}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default WhyCompViT;
