import fetch from "node-fetch";
export default async function handler(req,res){
  try{
    const q = (req.query.q || req.query.fid || "").toString();
    if(!q) return res.status(400).json({error:'missing q'});
    // fallback: return placeholder avatar using dicebear
    const avatar = `https://api.dicebear.com/8.x/pixel-art/png?seed=farcaster-${q}`;
    return res.status(200).json({ fid: q, displayName: `farcaster-${q}`, pfp_url: avatar });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
