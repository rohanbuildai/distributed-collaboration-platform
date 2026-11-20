
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDocuments } from "@/features/documents/documentService";
import { getSharedDocuments } from "@/features/sharing/sharingService";

const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getDocumentId = (document) => {
    return document.id || document.document_id;
};

const Dashboard = () => {
    const [documents, setDocuments] = useState([]);
    const [sharedDocuments, setSharedDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const [documentsResult, sharedResult] = await Promise.all([
                getDocuments({ limit: 20 }),
                getSharedDocuments({ limit: 10 }),
            ]);

            setDocuments(
                Array.isArray(documentsResult.data)
                    ? documentsResult.data
                    : []
            );

            setSharedDocuments(
                Array.isArray(sharedResult.data)
                    ? sharedResult.data
                    : []
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
        fetchDashboardData();
    }, [fetchDashboardData]);

    const recentDocuments = [...documents]
        .sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0);
            const dateB = new Date(b.updated_at || b.created_at || 0);

            return dateB - dateA;
        })
        .slice(0, 5);

    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage your documents and workspace.
                    </p>
                </div>

                <Link
                    href="/dashboard/documents"
                    className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                    + Create Document
                </Link>
            </div>

            {error && (
                <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-red-700">{error}</p>

                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        className="w-fit text-sm font-semibold text-red-700 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        My Documents
                    </p>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                        {isLoading ? "—" : documents.length}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Documents loaded on this page
                    </p>

                    <Link
                        href="/dashboard/documents"
                        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                        View documents →
                    </Link>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Shared With Me
                    </p>

                    <p className="mt-3 text-3xl font-bold text-gray-900">
                        {isLoading ? "—" : sharedDocuments.length}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Shared documents loaded on this page
                    </p>

                    <Link
                        href="/dashboard/shared"
                        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                        View shared documents →
                    </Link>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Recent Documents
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Your recently updated documents.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/documents"
                        className="text-sm font-medium text-blue-600 hover:underline"
                    >
                        View all →
                    </Link>
                </div>

                {isLoading ? (
                    <p className="p-6 text-sm text-gray-500">
                        Loading recent documents...
                    </p>
                ) : recentDocuments.length === 0 ? (
                    <div className="p-8 text-center">
                        <h3 className="font-medium text-gray-900">
                            No documents yet
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                            Create your first document to get started.
                        </p>

                        <Link
                            href="/dashboard/documents"
                            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                        >
                            Go to documents →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentDocuments.map((document) => (
                            <Link
                                key={getDocumentId(document)}
                                href={`/dashboard/documents/${getDocumentId(document)}`}
                                className="flex flex-col gap-2 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <h3 className="truncate font-medium text-gray-900">
                                        {document.title || "Untitled document"}
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Last updated:{" "}
                                        {formatDate(
                                            document.updated_at ||
                                            document.created_at
                                        )}
                                    </p>
                                </div>

                                <span className="text-sm font-medium text-blue-600">
                                    Open →
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link
                        href="/dashboard/documents"
                        className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
                    >
                        <p className="font-medium text-gray-900">
                            Browse Documents
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            View and manage your documents.
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/shared"
                        className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 hover:bg-blue-50"
                    >
                        <p className="font-medium text-gray-900">
                            Shared Workspace
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Access documents shared with you.
                        </p>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
