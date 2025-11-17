import { useEffect, useState } from "react";
import ConnectKit from "@farcaster/connect-kit";

export default function FarcasterSignIn({ onProfile }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function tryAuto() {
      if (!ConnectKit || !ConnectKit.getProfile) return;
      try {
        const p = await ConnectKit.getProfile();
        if (p) {
          handleProfile(p);
          setConnected(true);
        }
      } catch (e) {
        // ignore
      }
    }
    tryAuto();
  }, []);

  function normalize(profile) {
    const fid =
      profile?.fid ||
      profile?.user?.fid ||
      profile?.id ||
      profile?.data?.fid ||
      (typeof profile === "string" ? profile : undefined);

    const displayName =
      profile?.displayName ||
      profile?.username ||
      profile?.user?.displayName ||
      profile?.user?.username ||
      "";

    const pfp_url =
      profile?.pfp_url ||
      profile?.avatarUrl ||
      profile?.user?.pfp_url ||
      profile?.user?.avatarUrl ||
      "";

    return { fid: fid ? String(fid) : undefined, displayName, pfp_url };
  }

  async function handleProfile(raw) {
    const p = normalize(raw);
    if (!p.fid) return;
    onProfile({ fid: p.fid, displayName: p.displayName, pfp_url: p.pfp_url });
  }

  async function handleSignIn() {
    setLoading(true);
    try {
      if (!ConnectKit || !ConnectKit.signIn) {
        alert("Farcaster ConnectKit tidak tersedia. Gunakan Paste FID.");
        setLoading(false);
        return;
      }
      const profile = await ConnectKit.signIn();
      if (!profile) {
        alert("Login gagal atau dibatalkan.");
        setLoading(false);
        return;
      }
      await handleProfile(profile);
      setConnected(true);
    } catch (e) {
      console.error("Farcaster sign-in error:", e);
      alert("Gagal login Farcaster: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleManual() {
    const fid = prompt("Masukkan FID Farcaster (angka):");
    if (!fid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/farcaster-profile?q=${encodeURIComponent(fid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.fid) {
          onProfile({ fid: String(data.fid), displayName: data.displayName || "", pfp_url: data.pfp_url || "" });
          setConnected(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
    onProfile({ fid: String(fid), displayName: "", pfp_url: "" });
    setConnected(true);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={handleSignIn} disabled={loading} style={{ padding: "8px 12px", background: "#6d28d9", color: "#fff", borderRadius: 8, border: "none" }}>
        {loading ? "Menghubungkan..." : connected ? "Connected (Farcaster)" : "Sign in with Farcaster"}
      </button>
      <button onClick={handleManual} style={{ padding: "8px 10px", background: "#111", color: "#fff", borderRadius: 6, border: "none" }}>
        Paste FID / Lookup
      </button>
    </div>
  );
}
