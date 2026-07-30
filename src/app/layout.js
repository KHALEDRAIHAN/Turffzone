import { Geist } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "TurfZone — Book Turfs in Bangladesh",
  description: "Find and book the best futsal, football & cricket turfs. Buy sports gear. Join tournaments.",
  keywords: "turf booking, futsal dhaka, book turf bangladesh, sports",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}