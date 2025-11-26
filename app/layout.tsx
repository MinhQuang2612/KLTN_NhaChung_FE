import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import LayoutWrapper from "./LayoutWrapper";

export const metadata = { title: "Nhà Chung", description: "Tìm trọ, ở ghép thông minh" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
