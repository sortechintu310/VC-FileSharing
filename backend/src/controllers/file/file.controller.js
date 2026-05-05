import crypto from "crypto";
import db from "../../models/index.js";
import handleResponse from "../../utils/handleResponse.util.js";
import {
  reconstructFileFromShares,
  splitFileIntoShares,
} from "../../services/vc.service.js";
import {
  grantFileAccessOnChain,
  uploadFileOnChain,
} from "../../services/blockchain.service.js";

const { File, FileShare } = db;

const isValidEthAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value);

const GENERIC_RECONSTRUCT_NAMES = new Set(["reconstructed_file", "reconstructed_file.bin"]);

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

const sanitizeFileName = (value, fallback = "reconstructed_file") => {
  const baseName = String(value || "")
    .split(/[\\/]/)
    .pop()
    .trim();

  const safeName = baseName
    .replace(/[\r\n"]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .trim();

  return safeName || fallback;
};

const isGenericReconstructName = (value) =>
  GENERIC_RECONSTRUCT_NAMES.has(String(value || "").trim().toLowerCase());

const getContentDisposition = (fileName) => {
  const asciiFileName = sanitizeFileName(fileName).replace(/[^\x20-\x7E]/g, "_");
  return `inline; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};

const inferMimeType = (fileName, buffer) => {
  const extension = String(fileName || "").toLowerCase().split(".").pop();

  if (MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  if (buffer?.subarray) {
    const header = buffer.subarray(0, 12);
    if (header.subarray(0, 4).toString() === "%PDF") return "application/pdf";
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image/jpeg";
    if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return "image/png";
    }
    if (header.subarray(0, 6).toString() === "GIF87a" || header.subarray(0, 6).toString() === "GIF89a") {
      return "image/gif";
    }
    if (header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP") {
      return "image/webp";
    }
  }

  return "application/octet-stream";
};

const formatFile = (file, includeShares = false) => {
  const payload = {
    id: file.id,
    fileId: file.fileId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: Number(file.size),
    originalFileHash: file.originalFileHash,
    shareCount: file.shareCount,
    status: file.status,
    failureReason: file.failureReason,
    blockchainTxHash: file.blockchainTxHash,
    blockchainBlockNumber: file.blockchainBlockNumber
      ? Number(file.blockchainBlockNumber)
      : null,
    contractAddress: file.contractAddress,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };

  if (includeShares) {
    payload.shares =
      file.shares?.map((share) => ({
        shareIndex: share.shareIndex,
        cid: share.cid,
      })) || [];
  }

  return payload;
};

export const uploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    const sharesCountRaw = req.body?.sharesCount || "2";
    const sharesCount = Number.parseInt(sharesCountRaw, 10);

    if (!file) {
      return handleResponse(res, 400, "File is required");
    }

    if (!Number.isInteger(sharesCount) || sharesCount < 2 || sharesCount > 10) {
      return handleResponse(res, 400, "sharesCount must be an integer between 2 and 10");
    }

    const fileId = crypto.randomUUID();
    const originalFileHash = crypto.createHash("sha256").update(file.buffer).digest("hex");

    const { shareCids, aesKey } = await splitFileIntoShares({
      fileBuffer: file.buffer,
      fileName: file.originalname,
      sharesCount,
    });

    const savedFile = await db.sequelize.transaction(async (transaction) => {
      const newFile = await File.create(
        {
          fileId,
          ownerId: req.user.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          originalFileHash,
          shareCount: shareCids.length,
          status: "pending",
          contractAddress: process.env.CONTRACT_ADDRESS || null,
        },
        { transaction }
      );

      await FileShare.bulkCreate(
        shareCids.map((cid, index) => ({
          fileRecordId: newFile.id,
          shareIndex: index + 1,
          cid,
        })),
        { transaction }
      );

      return newFile;
    });

    try {
      const chainResult = await uploadFileOnChain({
        fileId,
        fileName: file.originalname,
        size: BigInt(file.size),
        originalFileHash,
        shareHashes: shareCids,
      });

      await savedFile.update({
        status: "uploaded",
        failureReason: null,
        blockchainTxHash: chainResult.txHash,
        blockchainBlockNumber: chainResult.blockNumber,
      });

      return handleResponse(res, 201, "File uploaded and registered on blockchain", {
        fileId,
        fileName: file.originalname,
        size: file.size,
        originalFileHash,
        shares: {
          count: shareCids.length,
          cids: shareCids,
          aesKey,
        },
        blockchain: {
          txHash: chainResult.txHash,
          blockNumber: chainResult.blockNumber,
          contractAddress: process.env.CONTRACT_ADDRESS || null,
        },
      });
    } catch (chainError) {
      await savedFile.update({
        status: "failed",
        failureReason: chainError.message?.slice(0, 2000) || "Unknown blockchain error",
      });
      throw chainError;
    }
  } catch (err) {
    next(err);
  }
};

export const getMyFiles = async (req, res, next) => {
  try {
    const files = await File.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: FileShare,
          as: "shares",
          attributes: ["shareIndex", "cid"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return handleResponse(
      res,
      200,
      "Files fetched successfully",
      files.map((file) => formatFile(file, true))
    );
  } catch (err) {
    next(err);
  }
};

export const getFileById = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: {
        fileId,
        ownerId: req.user.id,
      },
      include: [
        {
          model: FileShare,
          as: "shares",
          attributes: ["shareIndex", "cid"],
          required: false,
        },
      ],
    });

    if (!file) {
      return handleResponse(res, 404, "File not found");
    }

    return handleResponse(res, 200, "File fetched successfully", formatFile(file, true));
  } catch (err) {
    next(err);
  }
};

export const getFileShares = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: {
        fileId,
        ownerId: req.user.id,
      },
      include: [
        {
          model: FileShare,
          as: "shares",
          attributes: ["shareIndex", "cid"],
          required: false,
        },
      ],
    });

    if (!file) {
      return handleResponse(res, 404, "File not found");
    }

    return handleResponse(res, 200, "File shares fetched successfully", {
      fileId: file.fileId,
      shares: (file.shares || [])
        .slice()
        .sort((a, b) => a.shareIndex - b.shareIndex)
        .map((share) => ({
          shareIndex: share.shareIndex,
          cid: share.cid,
        })),
    });
  } catch (err) {
    next(err);
  }
};

export const grantAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress || !isValidEthAddress(walletAddress)) {
      return handleResponse(res, 400, "A valid walletAddress is required");
    }

    const file = await File.findOne({
      where: {
        fileId,
        ownerId: req.user.id,
      },
    });

    if (!file) {
      return handleResponse(res, 404, "File not found");
    }

    if (file.status !== "uploaded") {
      return handleResponse(res, 409, "File is not yet uploaded on blockchain");
    }

    const chainResult = await grantFileAccessOnChain({
      fileId: file.fileId,
      userWalletAddress: walletAddress,
    });

    return handleResponse(res, 200, "Blockchain access granted", {
      fileId: file.fileId,
      walletAddress,
      txHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
    });
  } catch (err) {
    next(err);
  }
};

export const reconstructFile = async (req, res, next) => {
  try {
    const aesKey = String(req.body?.aesKey || "").trim();
    const requestedOutputFileName = String(req.body?.outputFileName || "").trim();
    const inputFileId = req.body?.fileId ? String(req.body.fileId).trim() : null;

    let shareCids = req.body?.shareCids || [];
    let selectedFile = null;

    if (!aesKey) {
      return handleResponse(res, 400, "aesKey is required");
    }

    if (!/^[a-fA-F0-9]{64}$/.test(aesKey)) {
      return handleResponse(res, 400, "aesKey must be a 64-character hex AES-256 key");
    }

    if (!Array.isArray(shareCids)) {
      return handleResponse(res, 400, "shareCids must be an array");
    }

    shareCids = shareCids
      .map((cid) => String(cid || "").trim())
      .filter(Boolean);

    if (inputFileId) {
      selectedFile = await File.findOne({
        where: {
          fileId: inputFileId,
          ownerId: req.user.id,
        },
        include: [
          {
            model: FileShare,
            as: "shares",
            attributes: ["shareIndex", "cid"],
            required: false,
          },
        ],
      });

      if (!selectedFile) {
        return handleResponse(res, 404, "File not found");
      }

      if (shareCids.length < 2) {
        shareCids = (selectedFile.shares || [])
          .slice()
          .sort((a, b) => a.shareIndex - b.shareIndex)
          .map((share) => share.cid);
      }
    }

    if (shareCids.length < 2) {
      return handleResponse(
        res,
        400,
        "Provide at least 2 manual share CIDs, or select a saved file so all saved shares can be used"
      );
    }

    if (selectedFile && shareCids.length !== Number(selectedFile.shareCount)) {
      return handleResponse(
        res,
        400,
        `Selected file requires all ${selectedFile.shareCount} shares for reconstruction; received ${shareCids.length}`
      );
    }

    const reconstructedBuffer = await reconstructFileFromShares({
      aesKey,
      shareCids,
    });

    if (selectedFile?.originalFileHash) {
      const reconstructedHash = crypto.createHash("sha256").update(reconstructedBuffer).digest("hex");

      if (reconstructedHash !== selectedFile.originalFileHash) {
        return handleResponse(
          res,
          422,
          "Reconstructed bytes do not match the selected file. Check the AES key and share CIDs."
        );
      }
    }

    const responseFileName = sanitizeFileName(
      (!requestedOutputFileName || isGenericReconstructName(requestedOutputFileName)) && selectedFile?.fileName
        ? selectedFile.fileName
        : requestedOutputFileName || selectedFile?.fileName || "reconstructed_file"
    );
    const storedMimeType =
      selectedFile?.mimeType && selectedFile.mimeType !== "application/octet-stream"
        ? selectedFile.mimeType
        : "";
    const mimeType = storedMimeType || inferMimeType(responseFileName, reconstructedBuffer);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", String(reconstructedBuffer.length));
    res.setHeader("Content-Disposition", getContentDisposition(responseFileName));
    res.setHeader("X-File-Name", encodeURIComponent(responseFileName));
    res.setHeader("X-Mime-Type", mimeType);

    return res.status(200).send(reconstructedBuffer);
  } catch (err) {
    next(err);
  }
};
