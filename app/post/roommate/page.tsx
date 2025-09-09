import RoommateForm from '../../../components/post/RoommateForm';
import Footer from '../../../components/common/Footer';

export const metadata = { title: "Đăng tin tìm người ở ghép" };

export default function RoommatePostPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Đăng tin tìm người ở ghép
          </h1>
          <p className="text-lg text-gray-600">
            Tìm người ở ghép với phòng hiện tại của bạn
          </p>
        </div>
        
        <RoommateForm />
      </div>
      
      <Footer />
    </div>
  );
}
