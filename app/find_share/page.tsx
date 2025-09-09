import SearchDetails from "../../components/common/SearchDetails";
import PropertyList from "../../components/find_share/PropertyList";
import FilterSidebar from "../../components/find_share/FilterSidebar";
import Suggestions from "../../components/common/Suggestions";
import Footer from "../../components/common/Footer";

export const metadata = { title: "Tìm phòng trọ, ở ghép" };

export default function FindSharePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SearchDetails />
      
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Property List - Left Column */}
          <div className="lg:col-span-3">
            <PropertyList />
          </div>
          
          {/* Filter Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <FilterSidebar />
          </div>
        </div>
      </div>
      
      {/* Suggestions Section */}
      <Suggestions />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
