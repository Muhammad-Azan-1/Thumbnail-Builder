import { FETCH_API_METHOD } from "./client";
import type { UploadHeadshotResponse } from "@/types/upload";

export async function uploadHeadShot(file: File) {
    const form = new FormData()
    form.append("file", file)
    return await FETCH_API_METHOD<UploadHeadshotResponse>("/upload-headshot", {
        method: 'POST',
        body: form,
    })
}
