const VC_SERVICE_URL = process.env.VC_SERVICE_URL || "http://127.0.0.1:8000";

export const splitFileIntoShares = async ({ fileBuffer, fileName, sharesCount }) => {
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), fileName);
  formData.append("n", String(sharesCount));

  const response = await fetch(`${VC_SERVICE_URL}/split/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`VC service split failed: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  const shareCids = payload?.share_cids;
  const aesKey = payload?.aes_key;

  if (!Array.isArray(shareCids) || shareCids.length < 2) {
    throw new Error("VC service returned invalid shares response");
  }

  if (!aesKey || typeof aesKey !== "string") {
    throw new Error("VC service returned invalid AES key");
  }

  return {
    shareCids,
    aesKey,
  };
};

export const reconstructFileFromShares = async ({ aesKey, shareCids }) => {
  if (!Array.isArray(shareCids) || shareCids.length < 2) {
    throw new Error("At least 2 share CIDs are required for reconstruction");
  }

  const formData = new FormData();
  formData.append("aes_key", aesKey);
  formData.append("cids", shareCids.join(","));

  const response = await fetch(`${VC_SERVICE_URL}/reconstruct/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`VC service reconstruct failed: ${response.status} ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
