import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function uploadFile(string _fileId,string _fileName,uint256 _size,string _originalFileHash,string[] _shareHashes)",
  "function grantAccess(string _fileId,address _user)",
];

const getConfig = () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not set in environment");
  }

  if (!privateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not set in environment");
  }

  return { rpcUrl, privateKey, contractAddress };
};

const getContract = () => {
  const { rpcUrl, privateKey, contractAddress } = getConfig();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
};

export const uploadFileOnChain = async ({
  fileId,
  fileName,
  size,
  originalFileHash,
  shareHashes,
}) => {
  const contract = getContract();
  const tx = await contract.uploadFile(fileId, fileName, size, originalFileHash, shareHashes);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber || null,
  };
};

export const grantFileAccessOnChain = async ({ fileId, userWalletAddress }) => {
  const contract = getContract();
  const tx = await contract.grantAccess(fileId, userWalletAddress);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber || null,
  };
};
