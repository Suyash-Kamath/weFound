export function serializeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    plan: user.plan || "none",
    stickerCreditsRemaining: user.stickerCreditsRemaining || 0,
    stickerCreditsUsed: user.stickerCreditsUsed || 0,
    unlimitedStickers: Boolean(user.unlimitedStickers),
  };
}

// Only send the contact details the owner chose to show on the public scan page.
export function serializePublicContactOptions(contactOptions = {}) {
  const showWhatsApp = Boolean(contactOptions.showWhatsApp);
  const showCall = Boolean(contactOptions.showCall);
  const showSms = Boolean(contactOptions.showSms);
  const showEmail = Boolean(contactOptions.showEmail);
  return {
    showWhatsApp,
    showCall,
    showSms,
    showEmail,
    showInAppChat: Boolean(contactOptions.showInAppChat),
    whatsAppNumber: showWhatsApp ? contactOptions.whatsAppNumber || "" : "",
    phoneNumber: showCall || showSms ? contactOptions.phoneNumber || "" : "",
    email: showEmail ? contactOptions.email || "" : "",
  };
}
