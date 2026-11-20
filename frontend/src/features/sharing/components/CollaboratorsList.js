
"use client";

import { useCallback, useEffect, useState } from "react";

import {
    getDocumentShares,
    updateSharePermission,
    revokeDocumentAccess,
} from "../sharingService";

const CollaboratorsList = ({ documentId }) => {
    const [collaborators, setCollaborators] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [activeUserId, setActiveUserId] = useState(null);

    const fetchCollaborators = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const response = await getDocumentShares(documentId);
            const shares = response.data || [];

            setCollaborators(shares);

            const permissionMap = {};

            shares.forEach((share) => {
                permissionMap[share.shared_with_user_id] =
                    share.permission;
            });

            setPermissions(permissionMap);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load collaborators."
            );
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
        fetchCollaborators();
    }, [fetchCollaborators]);

    const handlePermissionUpdate = async (userId) => {
        try {
            setActiveUserId(userId);
            setError("");
            setMessage("");

            await updateSharePermission({
                documentId,
                userId,
                permission: permissions[userId],
            });

            setMessage("Collaborator permission updated.");
            await fetchCollaborators();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to update permission."
            );
        } finally {
            setActiveUserId(null);
        }
    };

    const handleRevoke = async (userId) => {
        const confirmed = window.confirm(
            "Are you sure you want to revoke this user's access?"
        );

        if (!confirmed) return;

        try {
            setActiveUserId(userId);
            setError("");
            setMessage("");

            await revokeDocumentAccess({
                documentId,
                userId,
            });

            setMessage("Collaborator access revoked.");
            await fetchCollaborators();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to revoke access."
            );
        } finally {
            setActiveUserId(null);
        }
    };

    if (isLoading) {
        return <p className="text-sm text-gray-500">Loading collaborators...</p>;
    }

    return (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Manage Collaborators
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Manage access and permissions for this document.
                </p>
            </div>

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

            {collaborators.length === 0 ? (
                <p className="text-sm text-gray-500">
                    No collaborators yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {collaborators.map((collaborator) => {
                        const userId = collaborator.shared_with_user_id;
                        const isActive = activeUserId === userId;

                        return (
                            <div
                                key={collaborator.id}
                                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        User ID: {userId}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        Shared on:{" "}
                                        {new Date(
                                            collaborator.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={
                                            permissions[userId] || "viewer"
                                        }
                                        disabled={isActive}
                                        onChange={(event) =>
                                            setPermissions((previous) => ({
                                                ...previous,
                                                [userId]: event.target.value,
                                            }))
                                        }
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                    </select>

                                    <button
                                        type="button"
                                        disabled={isActive}
                                        onClick={() =>
                                            handlePermissionUpdate(userId)
                                        }
                                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                                    >
                                        Update
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isActive}
                                        onClick={() => handleRevoke(userId)}
                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default CollaboratorsList;
