import Replicate from 'replicate';
export default async function handler(req,res){
  try{
    const { avatarUrl, fid } = req.body;
    if(!avatarUrl) return res.status(400).json({ error: 'missing avatarUrl' });
    if(!process.env.REPLICATE_API_KEY) {
      return res.status(200).json({ imageUrl: avatarUrl });
    }
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });
    const out = await replicate.run("stability-ai/stable-diffusion-xl-image-edit:latest", {
      input: { image: avatarUrl, prompt: `Convert avatar into friendly ghost character`, width: 1024, height: 1024 }
    });
    res.status(200).json({ imageUrl: out[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
