
"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { getDocumentVersion } from "../versionService";

const VersionPreview = ({ documentId, versionId, onClose }) => {
    const [version, setVersion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const editor = useEditor({
        extensions: [StarterKit],
        content: {
            type: "doc",
            content: [{ type: "paragraph" }],
        },
        editable: false,
        immediatelyRender: false,
    });

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await getDocumentVersion({
                    documentId,
                    versionId,
                });

                setVersion(response.data);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load this version."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersion();
    }, [documentId, versionId]);

    useEffect(() => {
        if (editor && version?.content) {
            editor.commands.setContent(version.content);
        }
    }, [editor, version]);

    return (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Version Preview
                </h2>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                    Close
                </button>
            </div>

            {isLoading && (
                <p className="text-sm text-gray-500">
                    Loading version...
                </p>
            )}

            {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {version && !isLoading && (
                <>
                    <div className="border-b border-gray-200 pb-3">
                        <h3 className="font-medium text-gray-900">
                            {version.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Version {version.version_number}
                        </p>
                    </div>

                    <div className="prose max-w-none rounded-lg border border-gray-200 p-4">
                        <EditorContent editor={editor} />
                    </div>
                </>
            )}
        </section>
    );
};

export default VersionPreview;
