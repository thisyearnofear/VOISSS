"use client";

import { useState, useEffect } from "react";

export default function ArkivExplorerPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    ownerAddress: "",
    content: "",
  });
  const [savedEntities, setSavedEntities] = useState<any[]>([]);

  const fetchEntities = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/arkiv/query?entityType=VoiceInsight&limit=20");
      const data = await res.json();
      if (data.success) setEntities(data.entities);
      else setError(data.error || "Failed to fetch entities");
    } catch {
      setError("Network error. API may need local env config.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntities(); }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.ownerAddress) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/arkiv/save-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `demo-${Date.now()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSavedEntities([{ ...data, explorerUrl: data.explorerUrl }, ...savedEntities]);
        setFormData({ title: "", ownerAddress: "", content: "" });
        setShowForm(false);
        fetchEntities();
      } else setError(data.error || "Save failed");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">Arkiv Explorer</h1>
        <p className="text-gray-400 mb-6">Create and explore VoiceInsight entities on Braga Testnet.</p>
        
        <div className="space-y-6">
          {showForm && (
            <div className="p-4 bg-[#1A1A1A] rounded-lg">
              <h2 className="text-xl font-bold mb-3">Create Entity</h2>
              <input className="w-full mb-2 p-2 bg-[#2A2A2A] rounded" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <input className="w-full mb-2 p-2 bg-[#2A2A2A] rounded" placeholder="Owner Address (0x...)" value={formData.ownerAddress} onChange={e => setFormData({...formData, ownerAddress: e.target.value})} />
              <textarea className="w-full mb-2 p-2 bg-[#2A2A2A] rounded" placeholder="Content" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={3} />
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">Save</button>
            </div>
          )}
          
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-gray-800 rounded">{showForm ? "Cancel" : "+ Create"}</button>
          <button onClick={fetchEntities} className="px-4 py-2 bg-gray-800 rounded">Refresh</button>

          {savedEntities.map((e: any, i) => (
            <div key={i} className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="font-mono text-sm mb-1">{e.entityKey?.slice(0, 20)}...</p>
              <a href={e.explorerUrl} target="_blank" className="text-purple-400 text-xs">Explorer →</a>
            </div>
          ))}

          {entities.map((e: any, i) => (
            <div key={i} className="p-4 bg-[#1A1A1A] rounded-lg">
              <p className="font-mono text-sm mb-1">{e.key?.slice(0, 20)}...</p>
              <p className="text-sm mb-1">{e.title}</p>
              <a href={e.explorerUrl} target="_blank" className="text-purple-400 text-xs">Explorer →</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}