
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocuments } from "../documentService";

const DocumentsList = ({ refreshKey }) => {
    const router = useRouter();

    const [documents, setDocuments] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const fetchDocuments = useCallback(async (cursor = null, append = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError("");
            }

            const response = await getDocuments({
                limit: 20,
                cursor: cursor || undefined,
            });

            const newDocuments = response.data || [];

            setDocuments((previous) =>
                append ? [...previous, ...newDocuments] : newDocuments
            );

            setNextCursor(response.pagination?.nextCursor || null);
            setHasMore(response.pagination?.hasMore || false);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load documents. Please try again."
            );
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state before refetch on refreshKey change
        setDocuments([]);
        setNextCursor(null);
        setHasMore(false);
        fetchDocuments();
    }, [fetchDocuments, refreshKey]);

    const handleLoadMore = () => {
        if (nextCursor && hasMore && !isLoadingMore) {
            fetchDocuments(nextCursor, true);
        }
    };

    if (isLoading) {
        return <p className="py-6 text-gray-500">Loading documents...</p>;
    }

    if (error && documents.length === 0) {
        return (
            <div className="py-6">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={() => fetchDocuments()}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {documents.length === 0 ? (
                <p className="py-6 text-gray-500">
                    No documents found. Create your first document!
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((document) => (
                        <button
                            key={document.id}
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/dashboard/documents/${document.id}`
                                )
                            }
                            className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-400 hover:shadow-md"
                        >
                            <h3 className="font-semibold text-gray-900">
                                {document.title}
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Last updated:{" "}
                                {new Date(document.updated_at).toLocaleString()}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {error && documents.length > 0 && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {hasMore && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}

            {!hasMore && documents.length > 0 && (
                <p className="text-center text-sm text-gray-500">
                    You have reached the end of your documents.
                </p>
            )}
        </div>
    );
};

export default DocumentsList;
