import lighthouse from "@lighthouse-web3/sdk";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const API_KEY = process.env.LIGHTHOUSE_API_KEY;

async function downloadToTemp(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url} - ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, filename);
  fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer));
  return tmpPath;
}

async function checkPublicGateway(cid, filename) {
  const url = `https://ipfs.io/ipfs/${cid}/${filename}`;
  try {
    const resp = await fetch(url, { method: "HEAD", timeout: 8000 });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

function pickRarity() {
  const r = Math.random();
  if (r < 0.005) return "Mythic";
  if (r < 0.025) return "Legendary";
  if (r < 0.075) return "Epic";
  if (r < 0.175) return "Rare";
  return "Common";
}

function pickMood() {
  const moods = ["Calm", "Happy", "Neutral", "Serious", "Playful"];
  return moods[Math.floor(Math.random() * moods.length)];
}

export default async function handler(req, res) {
  try {
    const { imageUrl, fid, displayName, rarity: clientRarity, mood: clientMood } = req.body;
    if (!imageUrl || !fid) return res.status(400).json({ error: "missing imageUrl or fid" });

    const imageFilename = `ghost-${fid}.png`;
    const imagePath = await downloadToTemp(imageUrl, imageFilename);

    const uploadImageResp = await lighthouse.upload(imagePath, API_KEY);
    const imageCid = uploadImageResp?.data?.cid || uploadImageResp?.data?.Hash || uploadImageResp?.cid || uploadImageResp?.Hash;
    if (!imageCid) {
      try { fs.unlinkSync(imagePath); } catch (e) {}
      throw new Error("Failed to obtain image CID from Lighthouse response");
    }

    const name = `Fid Ghost #${fid}`;
    const description = `Fid Ghost for Farcaster ${fid}`;
    const rarity = clientRarity || pickRarity();
    const mood = clientMood || pickMood();

    const imageIpfsUri = `ipfs://${imageCid}/${imageFilename}`;
    const lighthouseImageGateway = `https://gateway.lighthouse.storage/ipfs/${imageCid}/${imageFilename}`;
    const imagePublicOk = await checkPublicGateway(imageCid, imageFilename);
    const imageGatewayToUse = imagePublicOk ? `https://ipfs.io/ipfs/${imageCid}/${imageFilename}` : lighthouseImageGateway;

    const metadata = {
      name,
      description,
      image: imageIpfsUri,
      attributes: [
        { trait_type: "FID", value: String(fid) },
        { trait_type: "Style", value: "Ghost" },
        { trait_type: "Rarity", value: rarity },
        { trait_type: "Mood", value: mood }
      ]
    };

    const metaFilename = `metadata-${fid}.json`;
    const metaPath = path.join(process.cwd(), "tmp", metaFilename);
    fs.writeFileSync(metaPath, JSON.stringify(metadata));

    const uploadMetaResp = await lighthouse.upload(metaPath, API_KEY);
    const metaCid = uploadMetaResp?.data?.cid || uploadMetaResp?.data?.Hash || uploadMetaResp?.cid || uploadMetaResp?.Hash;
    if (!metaCid) {
      try { fs.unlinkSync(imagePath); } catch (e) {}
      try { fs.unlinkSync(metaPath); } catch (e) {}
      throw new Error("Failed to obtain metadata CID from Lighthouse response");
    }

    const metadataIpfs = `ipfs://${metaCid}/${metaFilename}`;
    const lighthouseMetaGateway = `https://gateway.lighthouse.storage/ipfs/${metaCid}/${metaFilename}`;
    const metaPublicOk = await checkPublicGateway(metaCid, metaFilename);
    const metadataGatewayToUse = metaPublicOk ? `https://ipfs.io/ipfs/${metaCid}/${metaFilename}` : lighthouseMetaGateway;

    try { fs.unlinkSync(imagePath); } catch (e) {}
    try { fs.unlinkSync(metaPath); } catch (e) {}

    return res.status(200).json({
      metadataUrl: metadataIpfs,
      metadataGateway: metadataGatewayToUse,
      imageIpfs: imageIpfsUri,
      imageGateway: imageGatewayToUse
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
