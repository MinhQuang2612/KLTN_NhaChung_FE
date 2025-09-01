import Header from "@/components/common/Header";
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
  return (
    <main>
      <Header />
      <HeroSection />
      <WhyChooseUs />
      <FeaturedAreas />
      <CommunityStory />
      <FindRoommate />
      <Suggestions />
      <LatestNews />
      <Testimonials />
      <LandlordSection />
      <Footer />
    </main>
  );
}
