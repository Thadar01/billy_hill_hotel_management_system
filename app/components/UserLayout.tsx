"use client";

import { ReactNode } from "react";
import UserNavbar from "./Usernavbar";
import Footer from "./Footer";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <UserNavbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}