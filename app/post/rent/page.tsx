import PostForm from '../../../components/post/PostForm';
import Footer from '../../../components/common/Footer';

export default function RentPostPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Đăng tin cho thuê phòng
          </h1>
          <p className="text-lg text-gray-600">
            Chia sẻ thông tin phòng trọ để cho thuê
          </p>
        </div>
        
        <PostForm />
      </div>
      
      <Footer />
    </div>
  );
}
