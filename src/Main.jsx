import {useState} from 'react';
import axios from 'axios';
import FarcasterSignIn from './components/FarcasterSignIn';
import { ethers } from 'ethers';
import ABI from '../artifacts/contracts/FIDGhost.json';

export default function Main(){
  const [profile,setProfile]=useState(null);
  const [fid,setFid]=useState('');
  const [img,setImg]=useState(null);
  const [meta,setMeta]=useState(null);

  function onProfile(p){ setProfile(p); setFid(String(p.fid)); }

  async function generate(){
    if(!profile) return alert('Sign in first');
    const r = await axios.post('/api/generate',{ avatarUrl: profile.pfp_url || profile.pfp, fid, displayName: profile.displayName || profile.name });
    setImg(r.data.imageUrl);
  }

  async function upload(){
    if(!img) return alert('Generate first');
    const r = await axios.post('/api/upload',{ imageUrl: img, fid, displayName: profile.displayName || profile.name });
    setMeta(r.data);
  }

  async function mint(){
    if(!meta || !meta.metadataUrl) return alert('Upload metadata first');
    if(!window.ethereum) return alert('Install MetaMask');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, ABI.abi, signer);
    const value = ethers.parseEther('0.0002');
    const tx = await contract.mint(parseInt(fid), meta.metadataUrl, { value });
    await tx.wait();
    alert('Mint success: ' + tx.hash);
  }

  return (
    <div style={{padding:20,color:'#fff',background:'#0b1220',minHeight:'100vh'}}>
      <h1>FID Ghost — Farcaster Login</h1>
      <FarcasterSignIn onProfile={onProfile} />
      {profile && <p>FID: {fid} — {profile.displayName}</p>}
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={generate}>Generate</button>
        <button onClick={upload}>Upload</button>
        <button onClick={mint}>Mint (0.0002 ETH)</button>
      </div>
      {img && <div style={{marginTop:12}}><img src={img} width={320} alt="generated"/></div>}
      {meta && <pre style={{background:'#111',padding:12}}>{JSON.stringify(meta,null,2)}</pre>}
    </div>
  )
}
