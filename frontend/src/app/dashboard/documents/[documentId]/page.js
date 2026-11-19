
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    getDocument,
    deleteDocument,
} from "@/features/documents/documentService";

import DocumentEditor from "@/features/editor/components/DocumentEditor";
import ShareDocument from "@/features/sharing/components/ShareDocument";
import CollaboratorsList from "@/features/sharing/components/CollaboratorsList";
import VersionHistorySection from "@/features/versions/components/VersionHistorySection";

import useDocumentCollaboration from "@/features/collaboration/hooks/useDocumentCollaboration";

const DocumentPage = () => {
    const { documentId } = useParams();
    const router = useRouter();

    const [document, setDocument] = useState(null);
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        document: realtimeDocument,
        permission,
        presence,
        isConnected,
        isJoining,
        error: collaborationError,
        updateDocument: updateCollaborativeDocument,
    } = useDocumentCollaboration(documentId);

    const canEdit = permission === "owner" || permission === "editor";

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await getDocument(documentId);

                setDocument(response.data);
                setTitle(response.data.title);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load document."
                );
            } finally {
                setIsLoading(false);
            }
        };

        if (documentId) {
            fetchDocument();
        }
    }, [documentId]);

    useEffect(() => {
        if (!realtimeDocument) return;

        setDocument(realtimeDocument);
        setTitle(realtimeDocument.title);
    }, [realtimeDocument]);

    const handleSave = async (content) => {
        if (!title.trim()) {
            setError("Document title cannot be empty.");
            return;
        }

        if (!canEdit) {
            setError("You do not have permission to edit this document.");
            return;
        }

        if (!isConnected || isJoining) {
            setError("Not connected to the collaboration server.");
            return;
        }

        if (!document) return;

        try {
            setIsSaving(true);
            setError("");
            setSaveMessage("");

            const updatedDocument = await updateCollaborativeDocument({
                title: title.trim(),
                content,
                expectedRevision: document.revision,
            });

            setDocument(updatedDocument);
            setTitle(updatedDocument.title);
            setSaveMessage("Document saved successfully.");
        } catch (error) {
            if (error.statusCode === 409) {
                setError(
                    "Revision conflict: the document was updated elsewhere. The latest version has been loaded. Review it before saving again."
                );
            } else {
                setError(error.message || "Unable to save document.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {

        if (permission !== "owner") {
            setError("Only the document owner can delete this document.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this document? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setIsDeleting(true);
            setError("");

            await deleteDocument(documentId);

            router.replace("/dashboard/documents");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete document."
            );
            setIsDeleting(false);
        }
    };

    const handleDocumentRestored = (restoredDocument) => {
        setDocument(restoredDocument);
        setTitle(restoredDocument.title);
    };

    if (isLoading) {
        return <p className="p-6">Loading document...</p>;
    }

    if (error && !document) {
        return (
            <div className="p-6">
                <p className="text-red-600">{error}</p>

                <button
                    onClick={() => router.push("/dashboard/documents")}
                    className="mt-4 rounded bg-gray-200 px-4 py-2"
                >
                    Back to Documents
                </button>
            </div>
        );
    }

    if (!document) {
        return null;
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* Navigation and document actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={() => router.push("/dashboard/documents")}
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Documents
                </button>

                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                        Revision: {document.revision}
                    </p>

                    {permission === "owner" && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {isDeleting ? "Deleting..." : "Delete Document"}
                        </button>
                    )}
                </div>
            </div>

            {/* Real-time connection status */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <p>
                    Connection:{" "}
                    <span className={isConnected ? "text-green-600" : "text-red-600"}>
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </p>

                <p className="mt-1 text-gray-600">
                    {isJoining
                        ? "Joining document..."
                        : `Your permission: ${permission || "Unknown"}`}
                </p>

                {collaborationError && (
                    <p className="mt-1 text-red-600">
                        {collaborationError}
                    </p>
                )}

                <div className="mt-2">
                    <p className="font-medium text-gray-700">
                        Collaborators online: {presence.length}
                    </p>

                    {presence.length > 0 && (
                        <ul className="mt-1 list-inside list-disc text-gray-600">
                            {presence.map((userId) => (
                                <li key={userId}>{userId}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Document title */}
            <div className="space-y-2">
                <label
                    htmlFor="document-title"
                    className="block text-sm font-medium text-gray-700"
                >
                    Document Title
                </label>

                <input
                    id="document-title"
                    type="text"
                    value={title}
                    onChange={(event) => {
                        setTitle(event.target.value);
                        setSaveMessage("");
                    }}
                    maxLength={200}
                    disabled={!canEdit || !isConnected || isJoining}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-xl font-semibold outline-none focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Enter document title"
                />
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {saveMessage && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {saveMessage}
                </div>
            )}

            {/* Real-time document editor */}
            <DocumentEditor
                initialContent={document.content}
                onSave={isConnected && !isJoining ? handleSave : null}
                isSaving={isSaving}
                editable={canEdit && isConnected && !isJoining}
            />

            {/* Existing features */}
            <VersionHistorySection
                documentId={documentId}
                permission={permission}
                onDocumentRestored={handleDocumentRestored}
            />

            {permission === "owner" && (
    <>
                <ShareDocument documentId={documentId} />

                <CollaboratorsList documentId={documentId} />
            </>
        )}
        </div>
    );
};

export default DocumentPage;
