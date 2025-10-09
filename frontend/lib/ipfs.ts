export async function uploadToPinata(file: File) {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY!;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET!;
  if (!apiKey || !apiSecret)
    throw new Error("❌ Pinata API key/secret missing in .env.local");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("❌ Upload failed: " + res.statusText);
  const data = await res.json();
  console.log("✅ IPFS uploaded:", data);
  return data.IpfsHash;
}
