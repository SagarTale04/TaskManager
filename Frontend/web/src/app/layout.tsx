import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { TaskInteractionProvider } from "@/src/context/TaskInteractionContext";

export const metadata: Metadata = {
  title: "SyncSprint — Modern Sprint & Project Workspace",
  description: "Next-generation agile sprint and task management platform for high-velocity software teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f7f6f2] text-stone-900 min-h-screen antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <AuthProvider>
          <TaskInteractionProvider>
            {children}
          </TaskInteractionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
