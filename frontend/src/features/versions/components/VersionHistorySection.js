
"use client";

import { useState } from "react";

import VersionHistory from "./VersionHistory";
import VersionPreview from "./VersionPreview";
import { restoreDocumentVersion } from "../versionService";

const VersionHistorySection = ({
    documentId,
    permission,
    onDocumentRestored,
}) => {
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const canRestore = ["owner", "editor"].includes(permission);

    const handleRestore = async () => {
        if (!canRestore) {
            setError("You do not have permission to restore this version.");
            return;
        }

        const confirmed = window.confirm(
            "Restore this version? Your current document will be saved in version history."
        );

        if (!confirmed) return;

        try {
            setIsRestoring(true);
            setError("");
            setMessage("");

            const response = await restoreDocumentVersion({
                documentId,
                versionId: selectedVersionId,
            });

            onDocumentRestored(response.data.document);

            setMessage(
                `Version ${response.data.restoredFromVersion} restored successfully.`
            );

            setSelectedVersionId(null);
            setRefreshKey((previous) => previous + 1);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to restore this version."
            );
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <section className="space-y-5">
            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {message && (
                <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {message}
                </p>
            )}

            <VersionHistory
                key={refreshKey}
                documentId={documentId}
                onSelectVersion={setSelectedVersionId}
            />

            {selectedVersionId && (
                <div className="space-y-4">
                    <VersionPreview
                        documentId={documentId}
                        versionId={selectedVersionId}
                        onClose={() => setSelectedVersionId(null)}
                    />

                    {canRestore && (
                        <button
                            type="button"
                            onClick={handleRestore}
                            disabled={isRestoring}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isRestoring
                                ? "Restoring..."
                                : "Restore This Version"}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

export default VersionHistorySection;
