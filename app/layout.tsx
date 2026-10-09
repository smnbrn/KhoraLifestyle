import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/brand";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/layout/theme-provider";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";
import "./globals.css";

// Font: Helvetica Neue (font di sistema Apple, nessun download) con ripiego su
// Helvetica/Arial altrove. Tema: scuro (predefinito) o chiaro, scelto con il bottone in alto e salvato nel browser.
// Vedi globals.css per --font-sans e per come aggiungere i file del font.

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#191919",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
