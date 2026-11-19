
"use client";

import SharedDocumentsList from "@/features/sharing/components/SharedDocumentsList";

const SharedDocumentsPage = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Shared With Me
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Documents other users have shared with you.
                </p>
            </div>

            <SharedDocumentsList />
        </div>
    );
};

export default SharedDocumentsPage;
