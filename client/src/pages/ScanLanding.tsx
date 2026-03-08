import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ContactOptions } from "@/types";
import { QrCode, Phone, MessageCircle, Mail, Package, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getFinderSessionId } from "@/lib/finderSession";

interface PublicSticker {
  id: string;
  shortCode: string;
  status: "active" | "inactive" | "pending" | "closed";
}

interface PublicItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  returnInstructions?: string;
  contactOptions?: ContactOptions;
}

export default function ScanLanding() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sticker, setSticker] = useState<PublicSticker | null>(null);
  const [item, setItem] = useState<PublicItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!shortCode) return;
      try {
        setLoading(true);
        const response = await api.get(`/s/${shortCode}`);
        if (!active) return;
        setSticker(response.sticker);
        setItem(response.item);
        await api.post("/scans", {
          shortCode,
          deviceInfo: {
            browser: navigator.userAgent.includes("Chrome")
              ? "Chrome"
              : navigator.userAgent.includes("Safari")
              ? "Safari"
              : "Other",
            os: navigator.platform,
          },
        });
      } catch (error) {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [shortCode]);

  if (loading) {
    return (
      <div className="scan-page scan-page-center">
        <Card className="scan-card scan-card-center">
          <CardContent className="scan-card-body">
            <h1 className="scan-title">Loading...</h1>
            <p className="scan-subtitle">Fetching item details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !sticker || sticker.status !== "active" || !item) {
    return (
      <div className="scan-page scan-page-center">
        <Card className="scan-card scan-card-center">
          <CardContent className="scan-card-body">
            <QrCode className="scan-icon" />
            <h1 className="scan-title">Item Not Found</h1>
            <p className="scan-subtitle">This QR code is not linked to any item or has been deactivated.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contactOptions = {
    showWhatsApp: Boolean(item.contactOptions?.showWhatsApp),
    showCall: Boolean(item.contactOptions?.showCall),
    showEmail: Boolean(item.contactOptions?.showEmail),
    showInAppChat: Boolean(item.contactOptions?.showInAppChat),
    whatsAppNumber: item.contactOptions?.whatsAppNumber || "",
    phoneNumber: item.contactOptions?.phoneNumber || "",
    email: item.contactOptions?.email || "",
  };
  const templateMessage = `Hi, I found your ${item.name} (${item.category}) and I can help return it. QR code: ${sticker.shortCode}.`;
  const whatsappUrl = `https://wa.me/${contactOptions.whatsAppNumber.replace(/\D/g, "")}?text=${encodeURIComponent(templateMessage)}`;
  const emailSubject = `Found your ${item.name}`;
  const emailBody = `${templateMessage}\n\nPlease let me know how you'd like to collect it.`;

  const handleInAppChat = async () => {
    try {
      if (!shortCode) return;
      const finderSessionId = getFinderSessionId();
      const response = await api.post("/chat/start", {
        shortCode,
        finderSessionId,
      });
      navigate(
        `/chat/${response.conversation.id}?finderSessionId=${encodeURIComponent(
          finderSessionId
        )}&template=${encodeURIComponent(templateMessage)}`
      );
    } catch (_error) {
      toast({
        title: "Could not open chat",
        description: "Please try again in a few seconds.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="scan-page">
      <div className="scan-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="scan-header">
            <div className="scan-badge">
              <div className="scan-badge-dot" />
              <span>Found Item</span>
            </div>
            <h1>You Found Someone's {item.category}!</h1>
            <p>Help reunite this item with its owner</p>
          </div>

          {/* Item Card */}
          <Card className="scan-card">
            <CardContent className="scan-card-body">
              <div className="scan-item-row">
                <div className="scan-item-icon">
                  <Package className="scan-item-icon-svg" />
                </div>
                <div>
                  <h2>{item.name}</h2>
                  <p>{item.category}</p>
                </div>
              </div>
              {item.description && <p className="scan-item-desc">{item.description}</p>}
              {item.returnInstructions && (
                <div className="scan-instructions">
                  <p className="scan-instructions-title">Return Instructions</p>
                  <p>{item.returnInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card className="scan-card">
            <CardContent className="scan-card-body">
              <h3 className="scan-section-title">Contact the Owner</h3>
              <div className="scan-actions">
                {contactOptions.showWhatsApp && contactOptions.whatsAppNumber && (
                  <Button variant="outline" className="scan-button" asChild>
                    <a href={whatsappUrl} target="_blank">
                      <MessageCircle className="scan-action-icon text-green" />WhatsApp
                    </a>
                  </Button>
                )}
                {contactOptions.showCall && contactOptions.phoneNumber && (
                  <Button variant="outline" className="scan-button" asChild>
                    <a href={`tel:${contactOptions.phoneNumber}`}>
                      <Phone className="scan-action-icon text-blue" />Call Owner
                    </a>
                  </Button>
                )}
                {contactOptions.showEmail && contactOptions.email && (
                  <Button variant="outline" className="scan-button" asChild>
                    <a href={`mailto:${contactOptions.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}>
                      <Mail className="scan-action-icon text-orange" />Send Email
                    </a>
                  </Button>
                )}
                {contactOptions.showInAppChat && (
                  <Button variant="default" className="scan-button" onClick={handleInAppChat}>
                    <MessageCircle className="scan-action-icon" />Chat In-App
                  </Button>
                )}
                <Button variant="accent" className="scan-button">
                  <Truck className="scan-action-icon" />Arrange Delivery
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="scan-footer">
            Powered by <span className="font-semibold">weFound</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
