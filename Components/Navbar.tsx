'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";



export default function Navbar() {
  
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; role: string }>({username: "", role: ""});

  useEffect(() => {
  async function fetchSession() {
    try {
      const res = await fetch("/api/check-session", {
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setUser({ username: data.username, role: data.role });

    } catch {
      // retry after slight delay
      setTimeout(fetchSession, 300);
    }
  }

  fetchSession();
}, []);


  async function handleLogout() {
    await fetch(`/api/logout`, {
      method: "POST",
      headers: {
        "Application-Type": "application/json"
      }
    })

    setUser({username: "", role: ""})
    router.push('/login');
    router.refresh();
  }

  const path = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);


return (
  <nav className="bg-foreground h-15 flex justify-between items-center px-3 sm:px-5 fixed top-0 z-20 w-full shadow-md">
    {/* Mobile Menu Button - Visible on small screens */}
    <button 
      className="sm:hidden size-10 rounded-full hover:bg-gray-700 flex justify-center items-center"
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,1)">
        <path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"/>
      </svg>
    </button>

    {/* Desktop Navigation - Hidden on mobile, shown on desktop */}
    <ul className="hidden sm:flex w-auto sm:w-100 justify-between text-xl gap-4 sm:gap-0">
      <li className={`${path == "/"? "bg-background" : ""} h-15 px-3 flex items-center rounded-t-lg`}>
        <Link href="/" className="whitespace-nowrap">Commandes</Link>
      </li>
      <li className={`${path == "/stock"? "bg-background" : ""} h-15 px-3 flex items-center rounded-t-lg`}>
        <Link href="/stock" className="whitespace-nowrap">Stock</Link>
      </li>
      <li className={`${path == "/users"? "bg-background" : ""} h-15 px-3 flex items-center rounded-t-lg`}>
        <Link href="/users" className="whitespace-nowrap">Utilisateurs</Link>
      </li>
    </ul>

    {/* User Info - Always visible */}
    <div className="flex justify-between items-center gap-3 sm:w-30">
      <div className="text-right">
        <h1 className="text-sm sm:text-xl font-medium">{user.username}</h1>
        <h2 className="text-xs sm:text-sm opacity-80">{user.role}</h2>
      </div>
      <button 
        className="size-8 sm:size-10 rounded-full hover:bg-gray-700 flex justify-center items-center transition-colors"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" className="sm:w-6 sm:h-6" fill="rgba(255,255,255,1)">
          <path d="M4 18H6V20H18V4H6V6H4V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V18ZM6 11H13V13H6V16L1 12L6 8V11Z"></path>
        </svg>
      </button>
    </div>

    {/* Mobile Menu Overlay */}
    {isMenuOpen && (
      <>
        <div 
          className="fixed inset-0 bg-background bg-opacity-50 z-30 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
        <div className="fixed top-15 left-0 right-0 bg-foreground z-40 sm:hidden shadow-lg">
          <ul className="flex flex-col">
            <li className={`${path == "/"? "bg-background" : ""} border-b border-gray-700`}>
              <a href="/" className="block px-5 py-4 text-lg" onClick={() => setIsMenuOpen(false)}>
                Commandes
              </a>
            </li>
            <li className={`${path == "/stock"? "bg-background" : ""} border-b border-gray-700`}>
              <a href="/stock" className="block px-5 py-4 text-lg" onClick={() => setIsMenuOpen(false)}>
                Stock
              </a>
            </li>
            <li className={`${path == "/users"? "bg-background" : ""}`}>
              <a href="/users" className="block px-5 py-4 text-lg" onClick={() => setIsMenuOpen(false)}>
                Utilisateurs
              </a>
            </li>
          </ul>
        </div>
      </>
    )}
  </nav>
);
    
}

