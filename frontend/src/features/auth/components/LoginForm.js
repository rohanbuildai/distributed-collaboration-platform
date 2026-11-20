
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const LoginForm = () => {
    const { login } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        try {
            setIsLoading(true);

            await login(formData);

            router.push("/dashboard");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Invalid email or password."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Log in to continue to your workspace.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                        Email address
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                        Password
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-black hover:underline">
                    Create account
                </Link>
            </p>
        </div>
    );
};

export default LoginForm;