import { Transaction } from "@mysten/sui/dist/cjs/transactions";
import { Request, Response, RequestHandler } from "express";
import {
  ADMIN,
  client,
  HUE_PACKAGE_ID,
  PUBLISHER_ENDPOINT,
} from "../constants";
import { walrusPublish } from "./walrusPublish";
import { bcs } from "@mysten/sui/dist/cjs/bcs";

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
    //await walrus response
    let arr = await walrusPublish(fileBuffer, payload.metadata.mimeType);
    let objectId: string = arr[0];
    let blobId: string = arr[1];

    //new track object on blockchain
    const tx = new Transaction();
    tx.moveCall({
      package: HUE_PACKAGE_ID,
      module: "track",
      function: "create_track",
      /* title: String,
         blob_id: ID,
         cover_url: String,
         publish_date: String,
         cost_per_stream: u64, */
      arguments: [
        tx.pure.string(payload.title),
        tx.pure.id(objectId),
        tx.pure.string("COVER URL YAY"),
        tx.pure.u64(1_000_000_000),
      ],
    });
    tx.setSender(ADMIN.toSuiAddress());
    const bytes = await tx.build();
    const serializedSignature = (await ADMIN.signTransaction(bytes)).signature;
    let response = client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });
    let trackObjectId = (await response).objectChanges?.objectId;

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
