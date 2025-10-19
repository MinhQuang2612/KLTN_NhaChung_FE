"use client";
import SearchDetails from "../common/SearchDetails";

export default function HeroSection() {

  return (
    <section className="relative min-h-[500px] flex items-center">
      {/* Background with video and gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://res.cloudinary.com/dsbf5zlyv/video/upload/v1757788258/videopanel_j9xnwm.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-2">
            "Tìm chỗ ở,
          </h1>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            tìm người bạn chung nhà"
          </h1>
        </div>

        {/* Search card - sử dụng SearchDetails component */}
        <div className="w-full max-w-4xl mx-auto mb-12">
          <SearchDetails hideWrapper={true} hideTitles={true} hideRecentSearches={true} simplifiedChips={true} />
        </div>
      </div>
    </section>
  );
}
