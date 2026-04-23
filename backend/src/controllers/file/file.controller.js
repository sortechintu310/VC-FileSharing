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
    const outputFileName = String(req.body?.outputFileName || "reconstructed_file").trim();
    const safeOutputFileName = outputFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const inputFileId = req.body?.fileId ? String(req.body.fileId).trim() : null;

    let shareCids = req.body?.shareCids || [];

    if (!aesKey) {
      return handleResponse(res, 400, "aesKey is required");
    }

    if (!Array.isArray(shareCids)) {
      return handleResponse(res, 400, "shareCids must be an array");
    }

    shareCids = shareCids
      .map((cid) => String(cid || "").trim())
      .filter(Boolean);

    if (shareCids.length < 2 && inputFileId) {
      const file = await File.findOne({
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

      if (!file) {
        return handleResponse(res, 404, "File not found");
      }

      shareCids = (file.shares || [])
        .slice()
        .sort((a, b) => a.shareIndex - b.shareIndex)
        .map((share) => share.cid);
    }

    if (shareCids.length < 2) {
      return handleResponse(
        res,
        400,
        "At least 2 share CIDs are required, or provide a valid fileId owned by you"
      );
    }

    const reconstructedBuffer = await reconstructFileFromShares({
      aesKey,
      shareCids,
    });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeOutputFileName || "reconstructed_file"}\"`);

    return res.status(200).send(reconstructedBuffer);
  } catch (err) {
    next(err);
  }
};
