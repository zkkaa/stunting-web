'use client';

import { Layout, Hero, Statistics, Features, Process, WhyCompViT } from '@/components';
import ConsultationBtn from '@/components/ui/ConsultationButton';

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
      <WhyCompViT onStartDetection={handleStartDetection} />
      {/* <ConsultationBtn /> */}
    </Layout>
  );
}
