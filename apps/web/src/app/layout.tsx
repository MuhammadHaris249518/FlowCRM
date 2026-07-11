import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ActiveOrganizationProvider } from "@/features/auth/provider/ActiveOrganizationProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FlowCRM AI — Close More Deals. Automate Everything.",
  description:
    "FlowCRM AI helps businesses capture leads, automate follow-ups, manage deals, and close more deals with the power of AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body>
          <QueryProvider>
            <ActiveOrganizationProvider>{children}</ActiveOrganizationProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
