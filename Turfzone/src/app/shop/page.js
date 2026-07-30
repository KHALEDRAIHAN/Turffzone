"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Search, ShoppingCart, Star, X, ChevronRight, Heart } from "lucide-react";

const CATEGORIES = ["All", "Balls", "Jerseys", "Footwear", "Equipment", "Protection", "Accessories", "Training"];
const SPORTS = ["All Sports", "Football", "Futsal", "Cricket", "Badminton"];
const SORT = ["Featured", "Price: Low to High", "Price: High to Low", "Top Rated"];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sport, setSport] = useState("All Sports");
  const [sort, setSort] = useState("Featured");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || p.category === category;
      const matchSport = sport === "All Sports" || p.sport === sport || p.sport === "All";
      return matchSearch && matchCat && matchSport;
    })
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Top Rated") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const toggleWishlist = (id) => setWishlist((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">Your cart is empty</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Qty: {item.qty}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-emerald-500">৳{(item.price * item.qty).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:underline mt-0.5">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-100">
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-lg text-gray-900">৳{cartTotal.toLocaleString()}</span>
                </div>
                <Link href="/shop/checkout" className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-3 rounded-xl text-center transition">
                  Proceed to checkout <ChevronRight size={14} className="inline" />
                </Link>
                <p className="text-xs text-center text-gray-400 mt-2">bKash · Nagad · Cash on Delivery</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Sports Shop</h1>
            <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 hover:border-emerald-300 transition">
              <ShoppingCart size={16} /> Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 flex-1 min-w-[180px]">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-900 placeholder-gray-400 flex-1 outline-none" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-gray-400" /></button>}
            </div>
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white outline-none">
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white outline-none">
              {SORT.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap border transition
                  ${category === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4"><span className="font-medium text-gray-900">{filtered.length}</span> products</p>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-gray-400">No products found</p>
                <button onClick={() => { setSearch(""); setCategory("All"); setSport("All Sports"); }} className="mt-3 text-xs text-emerald-500 hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition group">
                    <div className="h-36 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl">{product.emoji}</span>
                      )}
                      {product.badge && (
                        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium
                          ${product.badge === "Sale" ? "bg-red-500 text-white"
                          : product.badge === "Hot" ? "bg-orange-500 text-white"
                          : product.badge === "New" ? "bg-blue-500 text-white"
                          : "bg-gray-800 text-white"}`}>
                          {product.badge}
                        </span>
                      )}
                      <button onClick={() => toggleWishlist(product.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition">
                        <Heart size={13} className={wishlist.includes(product.id) ? "fill-red-400 text-red-400" : "text-gray-400"} />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-emerald-500">৳{product.price?.toLocaleString()}</span>
                        {product.old_price && <span className="text-xs text-gray-400 line-through">৳{product.old_price?.toLocaleString()}</span>}
                      </div>
                      <button onClick={() => addToCart(product)}
                        className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition
                          ${addedId === product.id ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                        {addedId === product.id ? "✓ Added!" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}