"use client";

import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/home/HeroSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FeaturedAreas from "@/components/home/FeaturedAreas";
import CommunityStory from "@/components/home/CommunityStory";
import FindRoommate from "@/components/home/FindRoommate";
import Suggestions from "@/components/common/Suggestions";
import LatestNews from "@/components/home/LatestNews";
import Testimonials from "@/components/home/Testimonials";
import LandlordSection from "@/components/home/LandlordSection";
import Footer from "@/components/common/Footer";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <HeroSection />
      <WhyChooseUs />
      <FeaturedAreas />
      <CommunityStory />
      {user && <FindRoommate />}
      {user &&  <Suggestions />}    
      <LatestNews />
      <Testimonials />
      <LandlordSection />
      <Footer />
    </>
  );
}
