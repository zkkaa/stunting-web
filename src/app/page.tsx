'use client';

import { Layout, Hero, Statistics, Features, Process, WhyCompViT } from '@/components';

export default function Home() {
  const handleStartDetection = () => {
    // Navigate to scan page or show modal
    console.log('Starting detection...');
  };

  return (
    <Layout>
      <Hero onButtonClick={handleStartDetection} />
      <Statistics />
      <Features />
      <Process />
      <WhyCompViT buttonLink="/scan" buttonText="Mulai Deteksi Sekarang" />
    </Layout>
  );
}
