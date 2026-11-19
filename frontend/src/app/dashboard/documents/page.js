
"use client";

import { useState } from "react";

import DocumentsList from "@/features/documents/components/DocumentsList";
import CreateDocument from "@/features/documents/components/CreateDocument";

const DocumentsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDocumentCreated = () => {
        setRefreshKey((previousKey) => previousKey + 1);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    My Documents
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Manage and access all your documents.
                </p>
            </div>

            <div className="mb-8">
                <CreateDocument
                    onDocumentCreated={handleDocumentCreated}
                />
            </div>

            <DocumentsList refreshKey={refreshKey} />
        </div>
    );
};

export default DocumentsPage;
