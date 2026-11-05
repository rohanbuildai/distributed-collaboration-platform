const { getSchema } = require("@tiptap/core");
const starterKitModule = require("@tiptap/starter-kit");
const { Node } = require("@tiptap/pm/model");

const StarterKit =
    starterKitModule.default ||
    starterKitModule.StarterKit ||
    starterKitModule;

const schema = getSchema([StarterKit]);

const validateRichTextDocument = (content) => {
   
    if (
        typeof content !== "object" ||
        content === null ||
        Array.isArray(content)
    ) {
        throw new Error("Content must be a valid document object");
    }

    if (content.type !== "doc") {
        throw new Error("Document root type must be doc");
    }

    const document = Node.fromJSON(schema, content);

    document.check();

    return content;
};

module.exports = {
    validateRichTextDocument,
};
