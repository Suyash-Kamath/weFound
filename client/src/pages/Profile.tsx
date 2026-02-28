import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    await updateUser({ name, phone });
    toast({
      title: "Profile updated",
      description: "Your contact details were saved.",
    });
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="container" style={{ maxWidth: "700px" }}>
          <div className="page-card">
            <h3>Profile</h3>
            <p>Update the information used for recovery and notifications.</p>
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
