'use client';

import React, { useState } from 'react';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <html lang="id" className="dark">
      <head>
        <title>SRJ GUARDIAN — AI WhatsApp Security & Moderator</title>
        <meta 
          name="description" 
          content="Sistem Keamanan & Community Moderator Berbasis AI untuk Paguyuban Sunda Rantau Jogja (SRJ)" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="cyber-grid-bg text-charcoal-100 min-h-screen selection:bg-srjgreen-500/30 selection:text-white relative">
        <div className="flex min-h-screen">
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          
          <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
            <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
