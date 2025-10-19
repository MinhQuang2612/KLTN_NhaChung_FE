import SearchDetails from "../../components/common/SearchDetails";
import PropertyList from "../../components/find_share/PropertyList";
import Suggestions from "../../components/common/Suggestions";
import Footer from "../../components/common/Footer";

export const metadata = { title: "Tìm phòng trọ, ở ghép" };

export default function FindSharePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SearchDetails hideTitles={true} simplifiedChips={false} />
      
      {/* Main Content - Layout 4x4 */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <PropertyList />
      </div>
      
      {/* Suggestions Section */}
      <Suggestions />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
