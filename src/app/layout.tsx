import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stunting Detection App",
  description: "Cegah stunting lebih awal dengan teknologi Computer Vision & IoT yang akurat dan terpercaya",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StuntingApp",
    startupImage: "/hero-main-placeholder.png"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#407A81"
  }
};

export function generateViewport() {
  return {
    themeColor: "#407A81",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="icon" href="/vercel.svg" />
        <link rel="apple-touch-icon" href="/hero-thumb-placeholder.png" />
        <link rel="mask-icon" href="/vercel.svg" color="#407A81" />
        <meta name="msapplication-TileImage" content="/hero-main-placeholder.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NavigationGuardProvider>
            {children}
          </NavigationGuardProvider>
        </AuthProvider>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
