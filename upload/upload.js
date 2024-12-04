"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpload = void 0;
const transactions_1 = require("@mysten/sui/transactions");
const constants_1 = require("../constants");
const walrusPublish_1 = require("./walrusPublish");
const client_1 = require("@prisma/client");
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Type guard function to validate the payload
function isValidUploadPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return false;
    }
    const p = payload;
    // Check required fields and their types
    if (typeof p.audio !== "string" ||
        typeof p.title !== "string" ||
        typeof p.artist_address !== "string") {
        return false;
    }
    // Check metadata object and its fields
    if (!p.metadata || typeof p.metadata !== "object") {
        return false;
    }
    const metadata = p.metadata;
    if (typeof metadata.filename !== "string" ||
        typeof metadata.fileSize !== "number" ||
        typeof metadata.mimeType !== "string" ||
        typeof metadata.uploadedAt !== "string") {
        return false;
    }
    return true;
}
const handleUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("RECEIVED UPLOAD\n");
    try {
        if (!isValidUploadPayload(req.body)) {
            console.log("fcked up");
            res.status(400).json({
                success: false,
                message: "Invalid request payload",
            });
            return;
        }
        const payload = req.body;
        console.log("Base64 string length:", payload.audio.length);
        const fileBuffer = Buffer.from(payload.audio, "base64");
        console.log("Decoded buffer size:", fileBuffer.length);
        console.log("starting walrus");
        // WALRUS PUBLISH
        let arr = yield (0, walrusPublish_1.walrusPublish)(fileBuffer, payload.metadata.mimeType);
        let objectId = arr[0];
        let blobId = arr[1];
        console.log("walrus blobId: ", blobId);
        console.log("walrus objectId: ", objectId);
        //------------ MOVE CALL TO TRACK SMART CONTRACT ---------------
        const tx = new transactions_1.Transaction();
        tx.moveCall({
            package: constants_1.HUE_PACKAGE_ID,
            module: "track",
            function: "create_track",
            arguments: [
                tx.pure.string(payload.title),
                tx.pure.id(objectId),
                tx.pure.string(new Date().toISOString()),
                tx.pure.string("COVER URL YAY"),
                tx.pure.u64(10000000), // 0.01 SUI per stream
            ],
        });
        tx.setSender(constants_1.ADMIN.toSuiAddress());
        const bytes = yield tx.build({ client: constants_1.client });
        const serializedSignature = (yield constants_1.ADMIN.signTransaction(bytes)).signature;
        let txResponse = yield constants_1.client.executeTransactionBlock({
            transactionBlock: bytes,
            signature: serializedSignature,
        });
        let response = yield constants_1.client.waitForTransaction({
            digest: txResponse.digest,
            options: {
                showEffects: true
            }
        });
        console.log(response);
        //get objectId of created track
        if (!response.effects || !response || !response.effects.created) {
            throw new Error('Track creation event not found');
        }
        let trackObjectRef = response.effects.created[0];
        let trackId = trackObjectRef.reference.objectId;
        // Cache user data if not exists
        const user = yield prisma.user.upsert({
            where: {
                walletAddress: payload.artist_address,
            },
            update: {}, // No updates if exists
            create: {
                walletAddress: payload.artist_address,
                createdAt: new Date(),
            },
        });
        // Cache track data
        const track = yield prisma.track.create({
            data: {
                title: payload.title,
                objectId: trackId,
                blobId: blobId,
                mimeType: payload.metadata.mimeType,
                fileSize: payload.metadata.fileSize,
                uploadedAt: new Date(Date.now()),
                artistId: user.id,
                onChainObjectId: objectId,
            },
        });
        res.status(200).json({
            success: true,
            message: "File uploaded success",
            trackId: trackId,
        });
        return;
    }
    catch (error) {
        console.error("Error in handleUpload:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading file",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
    }
});
exports.handleUpload = handleUpload;
