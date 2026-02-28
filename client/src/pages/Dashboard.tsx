import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { useItemStore } from "@/stores/itemStore";
import { Item, Sticker } from "@/types";
import {
  Plus,
  QrCode,
  Package,
  Eye,
  Edit,
  BarChart3,
  Copy,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { items, stickers, generateSticker, getScansBySticker, refreshItems, refreshStickers, loadScansForSticker } = useItemStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshItems();
    refreshStickers();
  }, [isAuthenticated, refreshItems, refreshStickers]);

  useEffect(() => {
    if (!stickers.length) return;
    Promise.all(stickers.map((sticker) => loadScansForSticker(sticker.id))).catch(() => {});
  }, [stickers.length, loadScansForSticker]);

  const userItems = items.filter((item) => item.userId === user?.id);
  const userStickers = stickers.filter((sticker) => sticker.userId === user?.id);
  const totalScans = userStickers.reduce(
    (acc, sticker) => acc + getScansBySticker(sticker.id).length,
    0
  );

  const handleGenerateSticker = async () => {
    try {
      const sticker = await generateSticker(user?.id || "");
      toast({
        title: "Sticker generated!",
        description: `Your sticker code is ${sticker.shortCode}`,
      });
    } catch (error) {
      toast({
        title: "Could not generate sticker",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const getItemForSticker = (stickerId: string): Item | undefined => {
    const sticker = stickers.find((s) => s.id === stickerId);
    if (!sticker?.itemId) return undefined;
    return items.find((i) => i.id === sticker.itemId);
  };

  const stats = [
    {
      label: "Active Items",
      value: userItems.length,
      icon: Package,
      colorClass: "icon-primary",
    },
    {
      label: "QR Stickers",
      value: userStickers.length,
      icon: QrCode,
      colorClass: "icon-amber",
    },
    {
      label: "Total Scans",
      value: totalScans,
      icon: Eye,
      colorClass: "icon-green",
    },
    {
      label: "Recovery Rate",
      value: "100%",
      icon: BarChart3,
      colorClass: "icon-purple",
    },
  ];

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-main">
        <div className="container">
          {/* Header */}
          <motion.div
            className="dashboard-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Welcome back, <span className="text-gradient">{user.name}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Manage your items and QR stickers from your dashboard.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/items/new" className="btn btn-primary">
                <Plus size={16} /> Add New Item
              </Link>
              <button onClick={handleGenerateSticker} className="btn btn-outline">
                <QrCode size={16} /> Generate Sticker
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="dashboard-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: '2rem' }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className={`feature-icon-box ${stat.colorClass}`} style={{ marginBottom: 0, width: 48, height: 48 }}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Items & Stickers Grid */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="item-card">
                <div className="item-card-header">
                  <h3 className="item-card-title">
                    <Package className="text-primary" size={20} /> Your Items
                  </h3>
                </div>
                <div className="item-card-body">
                  {userItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Package size={32} /></div>
                      <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>No items yet. Add your first item!</p>
                      <Link to="/items/new" className="btn btn-primary btn-sm">
                        <Plus size={16} /> Add Item
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {userItems.map((item) => (
                        <div key={item.id} className="item-list-row">
                          <div className="item-image-box">
                            {item.photos[0] ? (
                              <img src={item.photos[0]} alt={item.name} />
                            ) : (
                              <Package className="text-muted" size={24} />
                            )}
                          </div>
                          <div className="item-info">
                            <h4 className="item-name">{item.name}</h4>
                            <p className="item-meta">{item.category}</p>
                          </div>
                          <div className="item-actions">
                            <Link to={`/items/${item.id}/edit`} className="action-btn">
                              <Edit size={16} />
                            </Link>
                            <Link to={`/s/${stickers.find(s => s.itemId === item.id)?.shortCode || ''}`} className="action-btn">
                              <Eye size={16} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stickers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="item-card">
                <div className="item-card-header">
                  <h3 className="item-card-title">
                    <QrCode className="text-accent" size={20} /> Your QR Stickers
                  </h3>
                </div>
                <div className="item-card-body">
                  {userStickers.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><QrCode size={32} /></div>
                      <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>No stickers yet. Generate your first one!</p>
                      <button onClick={handleGenerateSticker} className="btn btn-outline btn-sm">
                        <QrCode size={16} /> Generate Sticker
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {userStickers.map((sticker) => {
                        const item = getItemForSticker(sticker.id);
                        const scanCount = getScansBySticker(sticker.id).length;

                        return (
                          <div
                            key={sticker.id}
                            onClick={() => setSelectedSticker(sticker)}
                            className="item-list-row"
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="item-image-box" style={{ background: 'white', padding: '4px' }}>
                              <QRCodeSVG value={`${window.location.origin}/s/${sticker.shortCode}`} size={100} style={{ width: '100%', height: '100%' }} />
                            </div>
                            <div className="item-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h4 className="item-name" style={{ fontFamily: 'monospace' }}>{sticker.shortCode}</h4>
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  background: sticker.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                  color: sticker.status === 'active' ? '#059669' : '#374151',
                                  fontWeight: 600
                                }}>
                                  {sticker.status}
                                </span>
                              </div>
                              <p className="item-meta">
                                {item ? item.name : "Not linked to item"}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{scanCount}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>scans</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Custom Modal for Sticker Details */}
      {selectedSticker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', position: 'relative', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setSelectedSticker(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>QR Code: {selectedSticker.shortCode}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {getItemForSticker(selectedSticker.id) ? `Linked to ${getItemForSticker(selectedSticker.id)?.name}` : "Not linked to any item"}
            </p>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
              <QRCodeSVG
                value={`${window.location.origin}/s/${selectedSticker.shortCode}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => copyToClipboard(`${window.location.origin}/s/${selectedSticker.shortCode}`)}
              >
                <Copy size={16} /> Copy Link
              </button>
              {!getItemForSticker(selectedSticker.id) && (
                <Link to={`/items/new?sticker=${selectedSticker.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                  <Plus size={16} /> Link Item
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
