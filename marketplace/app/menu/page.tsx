"use client";

import Image from "next/image";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart, CartItem } from "../context/CartContext";
import Link from 'next/link';
import { useEffect, useState } from "react";

const MENU_CATEGORIES = [
    {
        id: "croissants",
        name: "Croissants",
        items: [
            { id: "c1", name: "Classic Croissant", price: 4.5, image: "https://images.unsplash.com/photo-1549903072-7e6e0d234247?w=1080&q=80", description: "Flaky and buttery, baked fresh daily." },
            { id: "c2", name: "Almond Croissant", price: 5.5, image: "https://images.unsplash.com/photo-1549903072-7e6e0d234247?w=1080&q=80", description: "Filled and topped with sweet almond frangipane." },
            { id: "c3", name: "Pain au Chocolat", price: 5.0, image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=1080&q=80", description: "Classic croissant dough with dark chocolate batons." },
        ]
    },
    {
        id: "cakes",
        name: "Cakes",
        items: [
            { id: "k1", name: "Vanilla Bean Cake", price: 45.0, image: "/images/cake.jpg", description: "Light Madagascar vanilla sponge with Swiss meringue buttercream." },
            { id: "k2", name: "Strawberry Shortcake", price: 48.0, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1080&q=80", description: "Layers of vanilla sponge, fresh strawberries, and whipped cream." },
        ]
    },
    {
        id: "cupcakes",
        name: "Cupcakes",
        items: [
            { id: "cup1", name: "Strawberry Cupcake", price: 5.5, image: "/images/cupcake.jpg", description: "Soft vanilla cupcake topped with fresh strawberry frosting." },
            { id: "cup2", name: "Double Chocolate Cupcake", price: 5.5, image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1080&q=80", description: "Rich chocolate cake with fudgy chocolate buttercream." },
        ]
    },
    {
        id: "breads",
        name: "Artisan Breads",
        items: [
            { id: "b1", name: "Rustic Sourdough", price: 8.0, image: "/images/bread.jpg", description: "Naturally leavened with our 10-year-old starter." },
            { id: "b2", name: "French Baguette", price: 4.5, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&q=80", description: "Crispy crust and chewy interior, baked daily." },
        ]
    }
];

export default function MenuPage() {
    const { cart, addToCart, removeFromCart, totalPrice, totalItems } = useCart();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleAddToCart = (item: any) => {
        const cartItem: CartItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
        };
        addToCart(cartItem);
    };

    return (
        <div className="min-h-screen bg-[#fdfbfb] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Category Header Links */}
                <div className="sticky top-20 z-40 bg-[#fdfbfb]/95 backdrop-blur-md py-4 border-b border-[#eaccc8] mb-10 overflow-x-auto whitespace-nowrap">
                    <div className="flex gap-6 justify-center text-[#1a1a1a]">
                        {MENU_CATEGORIES.map(cat => (
                            <a key={cat.id} href={`#${cat.id}`} className="font-playfair text-xl hover:text-[#8a5a54] font-bold transition-colors">
                                {cat.name}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Menu Items List */}
                    <div className="lg:w-2/3">
                        {MENU_CATEGORIES.map((category) => (
                            <div key={category.id} id={category.id} className="mb-16 scroll-mt-32">
                                <h2 className="font-playfair text-4xl font-bold text-[#1a1a1a] mb-8 border-b border-[#eaccc8] pb-4">{category.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-[#f4dbd8] overflow-hidden transition-all duration-300 flex flex-col group">
                                            <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    layout="fill"
                                                    objectFit="cover"
                                                    className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
                                                />
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-playfair text-xl font-bold text-[#1a1a1a]">{item.name}</h3>
                                                    <span className="font-semibold text-[#8a5a54]">${item.price.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[#3a3a3a] text-sm mb-6 flex-grow">{item.description}</p>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f4dbd8] hover:bg-[#eaccc8] text-[#1a1a1a] font-semibold rounded-xl transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" /> Add to Order
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Sidebar */}
                    {isClient && (
                        <div className="lg:w-1/3">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#f4dbd8] sticky top-36">
                                <h3 className="font-playfair text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center justify-between">
                                    Your Order
                                    <span className="bg-[#f4dbd8] text-[#1a1a1a] text-sm py-1 px-3 rounded-full">{totalItems} items</span>
                                </h3>

                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-[#8a5a54]">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Your cart is empty.</p>
                                        <p className="text-sm mt-1">Add some sweet treats!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                                            {cart.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center group bg-[#fdfbfb] p-3 rounded-xl border border-[#f4dbd8]">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-[#1a1a1a] text-sm truncate pr-2">{item.name}</p>
                                                        <p className="text-[#8a5a54] text-xs">${item.price.toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-[#eaccc8] px-2 py-1">
                                                            <span className="text-sm font-bold text-[#1a1a1a] w-4 text-center">{item.quantity}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-[#eaccc8] pt-4 space-y-3 mb-6">
                                            <div className="flex justify-between text-[#3a3a3a]">
                                                <span>Subtotal</span>
                                                <span>${totalPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-xl text-[#1a1a1a] pt-2">
                                                <span>Total (Est.)</span>
                                                <span>${(totalPrice * 1.08).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/checkout"
                                            className="w-full py-4 bg-[#1a1a1a] hover:bg-[#3a3a3a] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            Proceed to Checkout <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
