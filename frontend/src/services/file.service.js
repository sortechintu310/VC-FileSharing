import api from "../utils/authInterceptor.util.js";

const unwrapResponse = (response) => response?.data?.data ?? response?.data;

const getHeader = (headers, name) => {
    if (!headers) return "";
    if (typeof headers.get === "function") {
        return headers.get(name) || headers.get(name.toLowerCase()) || "";
    }
    return headers[name.toLowerCase()] || headers[name] || "";
};

const decodeHeaderValue = (value) => {
    if (!value) return "";

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const getFileNameFromDisposition = (disposition) => {
    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (encodedMatch?.[1]) {
        return decodeHeaderValue(encodedMatch[1].trim());
    }

    const quotedMatch = disposition.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
        return quotedMatch[1].trim();
    }

    const plainMatch = disposition.match(/filename=([^;]+)/i);
    return plainMatch?.[1]?.trim() || "";
};

const fileService = {
    getMyFiles: async () => {
        const response = await api.get("/files/my");
        return unwrapResponse(response);
    },

    uploadFile: async ({ file, sharesCount }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sharesCount", String(sharesCount));

        const response = await api.post("/files/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return unwrapResponse(response);
    },

    grantAccess: async ({ fileId, walletAddress }) => {
        const response = await api.post(`/files/${fileId}/grant-access`, {
            walletAddress,
        });

        return unwrapResponse(response);
    },

    reconstructFile: async ({ aesKey, shareCids, outputFileName, fileId }) => {
        const payload = {
            aesKey,
            outputFileName,
            shareCids,
            fileId,
        };

        const response = await api.post("/files/reconstruct", payload, {
            responseType: "blob",
        });

        const disposition = getHeader(response.headers, "content-disposition") || "";
        const headerFileName = decodeHeaderValue(getHeader(response.headers, "x-file-name"));
        const mimeType =
            getHeader(response.headers, "x-mime-type") ||
            getHeader(response.headers, "content-type") ||
            response.data?.type ||
            "";
        const blob =
            mimeType && response.data?.slice && response.data.type !== mimeType
                ? response.data.slice(0, response.data.size, mimeType)
                : response.data;

        return {
            blob,
            fileName: headerFileName || getFileNameFromDisposition(disposition) || outputFileName || "reconstructed_file",
            mimeType,
        };
    },
};

export default fileService;
