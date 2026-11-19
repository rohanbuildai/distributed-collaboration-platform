
"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const EMPTY_CONTENT = {
    type: "doc",
    content: [{ type: "paragraph" }],
};

const DocumentEditor = ({
    initialContent,
    onSave,
    isSaving = false,
    editable = true,
}) => {
    const content = initialContent || EMPTY_CONTENT;

    const editor = useEditor({
        extensions: [StarterKit],
        content,
        immediatelyRender: false,
        editable,
    });

    // Sync content received from other collaborators.
    useEffect(() => {
        if (!editor || !initialContent) return;

        const currentContent = JSON.stringify(editor.getJSON());
        const incomingContent = JSON.stringify(initialContent);

        if (currentContent !== incomingContent) {
            editor.commands.setContent(initialContent, {
                emitUpdate: false,
            });
        }
    }, [editor, initialContent]);

    // Enable or disable editing based on document permission.
    useEffect(() => {
        if (!editor) return;

        editor.setEditable(editable);
    }, [editor, editable]);

    if (!editor) {
        return <p>Loading editor...</p>;
    }

    const toolbarButton = (label, action, isActive = false) => (
        <button
            type="button"
            onClick={action}
            disabled={!editable}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {toolbarButton("B", () =>
                    editor.chain().focus().toggleBold().run(),
                    editor.isActive("bold")
                )}

                {toolbarButton("I", () =>
                    editor.chain().focus().toggleItalic().run(),
                    editor.isActive("italic")
                )}

                {toolbarButton("S", () =>
                    editor.chain().focus().toggleStrike().run(),
                    editor.isActive("strike")
                )}

                {toolbarButton("H1", () =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run(),
                    editor.isActive("heading", { level: 1 })
                )}

                {toolbarButton("H2", () =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run(),
                    editor.isActive("heading", { level: 2 })
                )}

                {toolbarButton("• List", () =>
                    editor.chain().focus().toggleBulletList().run(),
                    editor.isActive("bulletList")
                )}

                {toolbarButton("1. List", () =>
                    editor.chain().focus().toggleOrderedList().run(),
                    editor.isActive("orderedList")
                )}

                {toolbarButton("Quote", () =>
                    editor.chain().focus().toggleBlockquote().run(),
                    editor.isActive("blockquote")
                )}

                {toolbarButton("Undo", () =>
                    editor.chain().focus().undo().run()
                )}

                {toolbarButton("Redo", () =>
                    editor.chain().focus().redo().run()
                )}
            </div>

            <div className="min-h-[400px] rounded-lg border border-gray-300 bg-white p-5">
                <EditorContent
                    editor={editor}
                    className="min-h-[360px] outline-none"
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={isSaving || !onSave || !editable}
                    onClick={() => onSave(editor.getJSON())}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save Document"}
                </button>
            </div>
        </div>
    );
};

export default DocumentEditor;
