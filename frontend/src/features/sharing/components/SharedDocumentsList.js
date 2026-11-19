
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSharedDocuments } from "../sharingService";

const SharedDocumentsList = () => {
    const router = useRouter();

    const [documents, setDocuments] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const fetchDocuments = useCallback(async (cursor = null) => {
        try {
            if (cursor) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            setError("");

            const response = await getSharedDocuments({
                limit: 10,
                cursor: cursor || undefined,
            });

            const fetchedDocuments = response.data || [];
            const pagination = response.pagination || {};

            setDocuments((previous) =>
                cursor
                    ? [...previous, ...fetchedDocuments]
                    : fetchedDocuments
            );

            setNextCursor(pagination.nextCursor || null);
            setHasNextPage(Boolean(pagination.hasNextPage));
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load shared documents."
            );
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    if (isLoading) {
        return <p className="text-gray-500">Loading shared documents...</p>;
    }

    return (
        <section className="space-y-5">
            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {documents.length === 0 && !error ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <h2 className="font-semibold text-gray-900">
                        No shared documents
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Documents shared with you will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((document) => (
                        <article
                            key={document.document_id}
                            className="rounded-xl border border-gray-200 bg-white p-5"
                        >
                            <h2 className="truncate font-semibold text-gray-900">
                                {document.title}
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Owner ID: {document.owner_id}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Permission:{" "}
                                <span className="capitalize font-medium text-gray-800">
                                    {document.permission}
                                </span>
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Shared on:{" "}
                                {new Date(
                                    document.shared_at
                                ).toLocaleDateString()}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/documents/${document.document_id}`
                                    )
                                }
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Open Document
                            </button>
                        </article>
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => fetchDocuments(nextCursor)}
                        disabled={isLoadingMore}
                        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </section>
    );
};

export default SharedDocumentsList;
