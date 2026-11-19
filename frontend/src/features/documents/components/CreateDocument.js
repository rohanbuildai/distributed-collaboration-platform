
"use client";

import { useState } from "react";
import { createDocument } from "../documentService";

const CreateDocument = ({ onDocumentCreated }) => {
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError("Document title is required.");
            return;
        }

        if (trimmedTitle.length > 200) {
            setError("Document title cannot exceed 200 characters.");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            await createDocument({
                title: trimmedTitle,
            });

            setTitle("");
            onDocumentCreated();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to create document. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
        >
            <div className="flex-1">
                <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter document title..."
                    maxLength={200}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                />

                {error && (
                    <p className="mt-2 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isLoading ? "Creating..." : "Create document"}
            </button>
        </form>
    );
};

export default CreateDocument;
