
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const RegisterForm = () => {
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        setSuccess("");

        const { name, email, password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8 || password.length > 72) {
            setError("Password must be between 8 and 72 characters.");
            return;
        }

        try {
            setIsLoading(true);

            await register({
                name: name.trim(),
                email: email.trim(),
                password,
            });

            setSuccess("Account created successfully. You can now log in.");

            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Registration failed. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Create your account
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Sign up to start collaborating on documents.
                </p>
            </div>

            {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                        Full name
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Enter your full name"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

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
                        maxLength={255}
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
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                        Confirm password
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-black hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
};

export default RegisterForm;
