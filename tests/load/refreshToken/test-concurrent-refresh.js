
const refreshToken = "";    // provide the refreh token

const url = "http://localhost:3000/api/v1/auth/refresh";

async function refresh() {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            refreshToken
        })
    });

    return {
        status: response.status,
        body: await response.json()
    };
}

async function main() {
    const results = await Promise.all([
        refresh(),
        refresh()
    ]);

    console.dir(results, { depth: null });
}

main().catch(console.error);
