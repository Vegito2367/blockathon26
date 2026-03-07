"use client";

import Link from 'next/link';
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export function Navbar() {
    const { totalItems } = useCart();

    return (
        <nav className="fixed w-full z-50 bg-[#f4dbd8]/90 backdrop-blur-md border-b border-[#eaccc8] transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <Link href="/" className="font-playfair text-3xl text-[#1a1a1a] tracking-tight flex flex-col items-center">
                            <span>Sweet Treat</span>
                            <span className="text-[10px] tracking-[0.2em] font-sans font-medium uppercase mt-[-4px]">Bakery</span>
                        </Link>
                    </div>
                    <div className="hidden md:flex flex-grow justify-center space-x-10 text-[#1a1a1a]">
                        <Link href="/" className="hover:text-[#8a5a54] font-medium transition-colors">Home</Link>
                        <Link href="/menu" className="hover:text-[#8a5a54] font-medium transition-colors">Menu</Link>
                    </div>
                    <div className="flex items-center space-x-6 text-[#1a1a1a]">
                        <Link href="/checkout" className="group flex items-center hover:text-[#8a5a54] transition relative">
                            <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-2 bg-[#1a1a1a] text-[#f4dbd8] text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center group-hover:bg-[#3a3a3a] transition">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
