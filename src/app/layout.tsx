import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roman Island | Haute Urban Édit & Executive Suite",
  description: "Bespoke contemporary menswear, dual boutique showrooms, and real-time inventory network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#080A11] text-slate-100 antialiased selection:bg-[#E5B869] selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}