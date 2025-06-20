
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

const APP_NAME = "Sistema Moranguinho"; // Updated PWA App Name
const APP_DESCRIPTION = "Sistema Moranguinho - App de calculadoras temáticas";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json", // Assumes manifest.json will handle PWA icons
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME, // Updated Apple Web App title
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: "/favicon.ico", // Remains placeholder, cannot use TSX as favicon image
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }], // Updated to standard path
  },
};

export const viewport: Viewport = {
  themeColor: "#FAD2E1", // Soft Light Pink
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
