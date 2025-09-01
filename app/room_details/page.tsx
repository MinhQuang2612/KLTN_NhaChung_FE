import Header from "../../components/common/Header";
import SearchDetails from "../../components/common/SearchDetails";
import PropertyInfo from "../../components/room_details/PropertyInfo";
import PropertyDetails from "../../components/room_details/PropertyDetails";
import ContactCard from "../../components/room_details/ContactCard";
import MapSection from "../../components/room_details/MapSection";
import Suggestions from "../../components/common/Suggestions";
import Footer from "../../components/common/Footer";

export default function RoomDetailsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchDetails />
      
             {/* Main Content */}
       <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyInfo />
            <PropertyDetails />
          </div>
           
           {/* Right Column - Sidebar */}
           <div className="lg:col-span-1">
             <ContactCard />
             <MapSection />
           </div>
         </div>
       </div>
       
       {/* Suggestions Section */}
       <Suggestions />
       
       <Footer />
    </div>
  );
}
