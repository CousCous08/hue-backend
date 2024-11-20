import { Transaction } from "@mysten/sui/dist/cjs/transactions";
import { Request, Response, RequestHandler } from "express";
import {
  ADMIN,
  client,
  HUE_PACKAGE_ID,
  PUBLISHER_ENDPOINT,
  TRACK_OBJECT_TYPE,
} from "../constants";
import { walrusPublish } from "./walrusPublish";
import { Prisma } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

interface UploadPayload {
  audio: string;
  title: string;
  artist_address: string;
  metadata: {
    filename: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
}

// Type guard function to validate the payload
function isValidUploadPayload(payload: unknown): payload is UploadPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const p = payload as any;

  // Check required fields and their types
  if (
    typeof p.audio !== "string" ||
    typeof p.title !== "string" ||
    typeof p.artist_address !== "string"
  ) {
    return false;
  }

  // Check metadata object and its fields
  if (!p.metadata || typeof p.metadata !== "object") {
    return false;
  }

  const metadata = p.metadata;
  if (
    typeof metadata.filename !== "string" ||
    typeof metadata.fileSize !== "number" ||
    typeof metadata.mimeType !== "string" ||
    typeof metadata.uploadedAt !== "string"
  ) {
    return false;
  }

  return true;
}

export const handleUpload: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isValidUploadPayload(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload",
      });
    }

    const payload = req.body;
    const fileBuffer = Buffer.from(payload.audio, "base64");

    // WALRUS PUBLISH
    let arr = await walrusPublish(fileBuffer, payload.metadata.mimeType);
    let objectId: string = arr[0];
    let blobId: string = arr[1];

    //MOVE CALL TO TRACK SMART CONTRACT
    const tx = new Transaction();
    tx.moveCall({
      package: HUE_PACKAGE_ID,
      module: "track",
      function: "create_track",
      arguments: [
        tx.pure.string(payload.title),
        tx.pure.id(objectId),
        tx.pure.string("COVER URL YAY"),
        tx.pure.u64(10_000_000), // 0.01 SUI per stream
      ],
    });
    tx.setSender(ADMIN.toSuiAddress());
    const bytes = await tx.build();
    const serializedSignature = (await ADMIN.signTransaction(bytes)).signature;
    let response = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });
    if (!response.objectChanges) {
      throw new Error("error with fetching objectId from Move call.");
    }
    const trackObject = response.objectChanges.find(
      (change) =>
        change.type === "created" && change.objectType === TRACK_OBJECT_TYPE
    );

    if (!trackObject) {
      throw new Error("Track object not found in transaction response");
    }

    // Cache user data if not exists
    const user = await prisma.user.upsert({
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
    const track = await prisma.track.create({
      data: {
        title: payload.title,
        objectId: trackObject.objectId,
        blobId: blobId,
        mimeType: payload.metadata.mimeType,
        fileSize: payload.metadata.fileSize,
        uploadedAt: new Date(payload.metadata.uploadedAt),
        artistId: user.id,
        onChainObjectId: objectId,
      },
    });

    res.status(200).json({
      success: true,
      message: "File uploaded and data cached successfully",
      trackId: track.id,
    });
  } catch (error) {
    console.error("Error in handleUpload:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
