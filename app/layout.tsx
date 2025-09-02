import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import LayoutWrapper from "./LayoutWrapper";

export const metadata = { title: "Trust Stay", description: "Tìm trọ, ở ghép thông minh" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
