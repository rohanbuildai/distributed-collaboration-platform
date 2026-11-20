
"use client";

import { useCallback, useEffect, useState } from "react";

import { getDocumentVersions } from "../versionService";

const VersionHistory = ({ documentId, onSelectVersion }) => {
    const [versions, setVersions] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const fetchVersions = useCallback(async (cursor = null) => {
        try {
            if (cursor) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            setError("");

            const response = await getDocumentVersions({
                documentId,
                limit: 10,
                cursor: cursor || undefined,
            });

            const fetchedVersions = response.data || [];
            const pagination = response.pagination || {};

            setVersions((previous) =>
                cursor
                    ? [...previous, ...fetchedVersions]
                    : fetchedVersions
            );

            setNextCursor(pagination.nextCursor || null);
            setHasNextPage(Boolean(pagination.hasNextPage));
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load version history."
            );
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [documentId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
        fetchVersions();
    }, [fetchVersions]);

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading version history...</p>;
    }

    return (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Version History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    View previous saved versions of this document.
                </p>
            </div>

            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {versions.length === 0 && !error ? (
                <p className="text-sm text-gray-500">
                    No previous versions available.
                </p>
            ) : (
                <div className="space-y-3">
                    {versions.map((version) => (
                        <div
                            key={version.id}
                            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p className="font-medium text-gray-900">
                                    Version {version.version_number}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    Edited by: {version.edited_by}
                                </p>

                                <p className="text-xs text-gray-400">
                                    {new Date(
                                        version.created_at
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onSelectVersion(version.id)}
                                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                                Preview Version
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => fetchVersions(nextCursor)}
                        disabled={isLoadingMore}
                        className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                    >
                        {isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </section>
    );
};

export default VersionHistory;
