import LandlordRentalRequests from "@/components/landlord/LandlordRentalRequests";
import Footer from "@/components/common/Footer";

export default function LandlordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandlordRentalRequests />
      <Footer />
    </div>
  );
}
