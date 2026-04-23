import api from "../utils/authInterceptor.util.js";

const unwrapResponse = (response) => response?.data?.data ?? response?.data;

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

        const disposition = response.headers?.["content-disposition"] || "";
        const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);

        return {
            blob: response.data,
            fileName: fileNameMatch?.[1] || outputFileName || "reconstructed_file",
        };
    },
};

export default fileService;
