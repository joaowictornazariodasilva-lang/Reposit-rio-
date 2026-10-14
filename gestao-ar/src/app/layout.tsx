import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Brisa · Gestão", template: "%s · Brisa Gestão" },
  description: "Ordens de serviço, agenda, equipamentos, estoque e financeiro para empresas de ar condicionado.",
  robots: { index: false, follow: false },
  applicationName: "Brisa Gestão",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1215" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            position="bottom-center"
            closeButton
            toastOptions={{
              classNames: {
                toast: "!rounded-lg !border !border-border !bg-surface !text-fg !shadow-lg !font-sans",
                description: "!text-fg-muted",
                actionButton: "!bg-primary !text-primary-fg !font-medium",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
