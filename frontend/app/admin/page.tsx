"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";

// ======================
// TYPES (Identiques)
// ======================
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  is_active: boolean;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  total_price: number;
  status: "en_attente" | "confirmée" | "livrée" | "annulée";
  created_at: string;
  items?: OrderItem[];
}

interface Stats {
  today_orders: number;
  today_vs_yesterday: number;
  week_orders: number;
  week_vs_last: number;
  total_revenue: number;
  top_products: Array<{
    name: string;
    category: string;
    total_quantity: number;
  }>;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  // ======================
  // STATE (Identiques)
  // ======================
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    today_orders: 0,
    today_vs_yesterday: 0,
    week_orders: 0,
    week_vs_last: 0,
    total_revenue: 0,
    top_products: [],
    pending_orders: 0,
    confirmed_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
  });
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "stats">(
    "products",
  );

  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low" | "out"
  >("all");
  const [categories, setCategories] = useState<string[]>([]);

  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    image_url: "",
    is_active: true,
  });

  // ======================
  // LOAD DATA
  // ======================
  const loadAll = async () => {
    try {
      const [p, o, s] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getStats(),
      ]);

      setProducts(p as Product[]);
      setOrders(o as Order[]);
      setStats(s as Stats);

      const uniqueCategories = [
        ...new Set(
          (p as Product[])
            .map((product: Product) => product.category)
            .filter((cat): cat is string => Boolean(cat)),
        ),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (categoryFilter && product.category !== categoryFilter) return false;
    if (stockFilter === "low" && product.stock > 10) return false;
    if (stockFilter === "low" && product.stock === 0) return false;
    if (stockFilter === "out" && product.stock > 0) return false;
    if (stockFilter === "in_stock" && product.stock === 0) return false;
    return true;
  });

  // ======================
  // LOGIQUE CRUD (Inchangée)
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, form);
      } else {
        await api.createProduct(form);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetForm();
      loadAll();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      image_url: "",
      is_active: true,
    });
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setForm(product);
    setShowProductModal(true);
  };

  const deleteProduct = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await api.deleteProduct(id);
      loadAll();
    }
  };

  const toggleProduct = async (product: Product) => {
    await api.updateProduct(product.id, { is_active: !product.is_active });
    loadAll();
  };

  const updateStatus = async (id: number, status: Order["status"]) => {
    await api.updateOrderStatus(id, status);
    loadAll();
  };

  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  // ======================
  // STYLING HELPERS
  // ======================
  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      en_attente: "bg-amber-50 text-amber-700 ring-amber-600/20",
      confirmée: "bg-blue-50 text-blue-700 ring-blue-600/20",
      livrée: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      annulée: "bg-rose-50 text-rose-700 ring-rose-600/20",
    };
    return `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`;
  };

  // ======================
  // RENDER
  // ======================
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Tableau de Bord
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Gérez vos produits, suivez vos commandes et analysez vos
              performances.
            </p>
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm ring-1 ring-slate-200">
            {(["products", "orders", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab === "products" && "📦 Produits"}
                {tab === "orders" && "🛒 Commandes"}
                {tab === "stats" && "📊 Stats"}
              </button>
            ))}
          </div>
        </header>

        {/* ================= PRODUCTS TAB ================= */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border-slate-200 bg-white text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none p-2"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="rounded-lg border-slate-200 bg-white text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none p-2"
                >
                  <option value="all">Tout le stock</option>
                  <option value="in_stock">En stock</option>
                  <option value="low">Stock critique (≤10)</option>
                  <option value="out">Rupture</option>
                </select>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">+</span> Nouveau Produit
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Produit
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Catégorie
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Prix
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden ring-1 ring-slate-200">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xl">
                                  📷
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {product.price.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.stock === 0
                                ? "bg-rose-100 text-rose-700"
                                : product.stock <= 10
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {product.stock} en stock
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`h-2 w-2 rounded-full inline-block mr-2 ${product.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                          />
                          <span className="text-sm text-slate-600">
                            {product.is_active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editProduct(product)}
                              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-blue-600 transition-all"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => toggleProduct(product)}
                              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-600 transition-all"
                              title="Toggle"
                            >
                              🔁
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-rose-600 transition-all"
                              title="Supprimer"
                            >
                              ❌
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-400 font-medium">
                    Aucun produit ne correspond à vos critères.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ORDERS TAB ================= */}
        {activeTab === "orders" && (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:ring-blue-200 transition-all group"
              >
                <div className="flex gap-5 items-start">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                    #{order.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900">
                        {order.customer_name}
                      </h3>
                      <span className={getStatusBadge(order.status)}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span>📞 {order.customer_phone || "N/A"}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>
                        📅 {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <span className="text-lg font-black text-slate-900">
                    {order.total_price.toLocaleString()} FCFA
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as any)
                      }
                      className="text-xs font-semibold rounded-lg border-slate-200 bg-slate-50 p-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en_attente">En attente</option>
                      <option value="confirmée">Confirmée</option>
                      <option value="livrée">Livrée</option>
                      <option value="annulée">Annulée</option>
                    </select>
                    <button
                      onClick={() => viewOrderDetail(order)}
                      className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="bg-white rounded-2xl py-20 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400">
                  Aucune commande reçue pour le moment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= STATS TAB ================= */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Aujourd'hui",
                  val: stats.today_orders,
                  trend: stats.today_vs_yesterday,
                  color: "from-blue-600 to-indigo-600",
                },
                {
                  label: "Cette Semaine",
                  val: stats.week_orders,
                  trend: stats.week_vs_last,
                  color: "from-emerald-600 to-teal-600",
                },
                {
                  label: "Chiffre d'Affaires",
                  val: `${stats.total_revenue.toLocaleString()} FCFA`,
                  trend: null,
                  color: "from-violet-600 to-purple-600",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden bg-gradient-to-br ${card.color} p-6 rounded-2xl shadow-lg text-white`}
                >
                  <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <h2 className="text-3xl font-black mt-2 tracking-tight">
                    {card.val}
                  </h2>
                  {card.trend !== null && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                      {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend)}% vs
                      période précédente
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Products */}
              <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  🏆{" "}
                  <span className="underline decoration-blue-500/30 underline-offset-4">
                    Top Produits
                  </span>
                </h3>
                <div className="space-y-4">
                  {stats.top_products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold opacity-30">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-600">
                          {product.total_quantity}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Vendus
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  📊 Récapitulatif
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "En attente",
                      val: stats.pending_orders,
                      color: "amber",
                    },
                    {
                      label: "Confirmées",
                      val: stats.confirmed_orders,
                      color: "blue",
                    },
                    {
                      label: "Livrées",
                      val: stats.delivered_orders,
                      color: "emerald",
                    },
                    {
                      label: "Annulées",
                      val: stats.cancelled_orders,
                      color: "rose",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border border-${s.color}-100 bg-${s.color}-50/30`}
                    >
                      <p
                        className={`text-xs font-bold text-${s.color}-700 uppercase mb-1`}
                      >
                        {s.label}
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {s.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODALS (Styled) ================= */}
        {showProductModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900">
                  {editingProduct ? "Modifier" : "Ajouter un produit"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 gap-5 text-sm font-semibold">
                  <div className="space-y-2">
                    <label className="text-slate-700">Nom du produit *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-700">Description</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-700">Prix (FCFA)</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            price: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-700">Stock</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-700">Catégorie</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-700">URL de l'image</label>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) =>
                        setForm({ ...form, image_url: e.target.value })
                      }
                      className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                      className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">
                      Afficher sur la boutique
                    </span>
                  </label>
                </div>
              </div>
              <div className="p-8 border-t border-slate-100 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      {/* ================= MODAL DÉTAILS COMMANDE ================= */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header du Modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Commande #{selectedOrder.id}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Effectuée le{" "}
                  {new Date(selectedOrder.created_at).toLocaleDateString(
                    "fr-FR",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowOrderDetailModal(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-all shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Contenu du Modal */}
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Infos Client */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">
                    Client
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-900 text-lg">
                      {selectedOrder.customer_name}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                      <span>
                        📞 {selectedOrder.customer_phone || "Non renseigné"}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <span>
                        ✉️ {selectedOrder.customer_email || "Pas d'email"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Infos Livraison */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">
                    Livraison
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      {selectedOrder.shipping_address ||
                        "Retrait en magasin / Adresse non spécifiée"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Liste des Produits */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">
                  Articles commandés
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">
                          Qté
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-800">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                              {item.unit_price.toLocaleString()} FCFA / unité
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center font-black text-slate-700">
                            x{item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-slate-900">
                            {(item.quantity * item.unit_price).toLocaleString()}{" "}
                            FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer / Total */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">
                  Total de la commande
                </p>
                <p className="text-3xl font-black">
                  {selectedOrder.total_price.toLocaleString()}{" "}
                  <span className="text-sm text-slate-400">FCFA</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                >
                  🖨️ Imprimer
                </button>
                <button
                  onClick={() => setShowOrderDetailModal(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
