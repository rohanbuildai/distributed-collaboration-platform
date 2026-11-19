
import api from "./api";

const getDocuments = async ({ limit = 20, cursor } = {}) => {
    const response = await api.get("/documents", {
        params: {
            limit,
            cursor,
        },
    });

    return response.data;
};

export {
    getDocuments,
};
