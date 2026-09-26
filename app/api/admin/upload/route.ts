import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminRequest } from "@/lib/admin";

export async function POST(req: Request) {
    if (!(await isAdminRequest(req))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as HandleUploadBody;
    try {
        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async () => ({
                addRandomSuffix: true, // filename collisions can't overwrite
                tokenPayload: JSON.stringify({}),
            }),
        });
        return NextResponse.json(jsonResponse);
    } catch {
        return NextResponse.json({ error: "Upload not allowed" }, { status: 401 });
    }
}