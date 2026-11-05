
const {
    validateRichTextDocument,
} = require("../../src/modules/documents/Validations/documentSchema");

describe("Rich Text Document Schema Validation", () => {
    test("should accept a valid document", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Hello world",
                        },
                    ],
                },
            ],
        };

        expect(validateRichTextDocument(content)).toEqual(content);
    });

    test("should reject an invalid node nesting", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "bulletList",
                        },
                    ],
                },
            ],
        };

        expect(() => validateRichTextDocument(content)).toThrow();
    });

    test("should reject an invalid root type", () => {
        const content = {
            type: "paragraph",
            content: [],
        };

        expect(() => validateRichTextDocument(content)).toThrow(
            "Document root type must be doc"
        );
    });

    test("should accept an empty document", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                },
            ],
        };

        expect(validateRichTextDocument(content)).toEqual(content);
    });

    test("should accept heading and formatted text", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: {
                        level: 2,
                    },
                    content: [
                        {
                            type: "text",
                            text: "Hello",
                            marks: [
                                { type: "bold" },
                                { type: "italic" },
                                { type: "underline" },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(validateRichTextDocument(content)).toEqual(content);
    });

    test("should accept nested bullet and ordered lists", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "bulletList",
                    content: [
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Item 1",
                                        },
                                    ],
                                },
                                {
                                    type: "orderedList",
                                    content: [
                                        {
                                            type: "listItem",
                                            content: [
                                                {
                                                    type: "paragraph",
                                                    content: [
                                                        {
                                                            type: "text",
                                                            text: "Nested item",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(validateRichTextDocument(content)).toEqual(content);
    });

    test("should reject unsupported marks", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Hello",
                            marks: [{ type: "highlight" }],
                        },
                    ],
                },
            ],
        };

        expect(() => validateRichTextDocument(content)).toThrow();
    });

    test("should reject text nodes without text", () => {
        const content = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                        },
                    ],
                },
            ],
        };

        expect(() => validateRichTextDocument(content)).toThrow();
    });
    
});
