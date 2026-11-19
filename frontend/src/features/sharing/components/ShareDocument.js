
"use client";

import { useState } from "react";
import { shareDocument } from "../sharingService";

const ShareDocument = ({ documentId }) => {
    const [userId, setUserId] = useState("");
    const [permission, setPermission] = useState("viewer");
    const [isSharing, setIsSharing] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleShare = async (event) => {
        event.preventDefault();

        if (!userId.trim()) {
            setError("Please enter a user ID.");
            return;
        }

        try {
            setIsSharing(true);
            setError("");
            setMessage("");

            await shareDocument({
                documentId,
                sharedWithUserId: userId.trim(),
                permission,
            });

            setMessage("Document shared successfully.");
            setUserId("");
            setPermission("viewer");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to share document."
            );
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Share Document
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Give another registered user access to this document.
                </p>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
                <div>
                    <label
                        htmlFor="shared-user-id"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        User ID
                    </label>

                    <input
                        id="shared-user-id"
                        type="text"
                        value={userId}
                        onChange={(event) => setUserId(event.target.value)}
                        placeholder="Enter recipient's user ID"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="share-permission"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Permission
                    </label>

                    <select
                        id="share-permission"
                        value={permission}
                        onChange={(event) => setPermission(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                    >
                        <option value="viewer">
                            Viewer — Can read the document
                        </option>

                        <option value="editor">
                            Editor — Can read and edit the document
                        </option>
                    </select>
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

                <button
                    type="submit"
                    disabled={isSharing}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSharing ? "Sharing..." : "Share Document"}
                </button>
            </form>
        </section>
    );
};

export default ShareDocument;
