import { Transaction } from "@mysten/sui/transactions";

import { Request, Response, RequestHandler } from "express";
import {
  ADMIN,
  client,
  HUE_PACKAGE_ID,
} from "../constants";
import { walrusPublish } from "./walrusPublish";
import { Prisma, PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

interface UploadPayload {
  audio: string; // base64 encoded audio
  title: string;
  price: number;
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
    typeof p.artist_address !== "string" ||
    typeof p.price !== "number"
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
):Promise<void> => {
  console.log("RECEIVED UPLOAD\n",);
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
    let arr = await walrusPublish(fileBuffer, payload.metadata.mimeType);
    let objectId: string = arr[0];
    let blobId: string = arr[1];
    console.log("walrus blobId: ", blobId);
    console.log("walrus objectId: ", objectId);

    //------------ MOVE CALL TO TRACK SMART CONTRACT ---------------
    const tx = new Transaction();
    tx.moveCall({
      package: HUE_PACKAGE_ID,
      module: "track",
      function: "create_track",
      arguments: [
        tx.pure.string(payload.title),
        tx.pure.id(objectId),
        tx.pure.string("COVER URL YAY"),
        tx.pure.string(new Date().toISOString()),
        tx.pure.u64(payload.price * 1000000000),
      ],
    });
    tx.setSender(ADMIN.toSuiAddress());
    const bytes = await tx.build({client: client});
    const serializedSignature = (await ADMIN.signTransaction(bytes)).signature;
    let txResponse = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });
    let response = await client.waitForTransaction({
      digest: txResponse.digest,
      options: {
        showEffects: true
      }
    })
    console.log(response);
    //get objectId of created track
    if(!response.effects || !response || !response.effects.created) {
      throw new Error('Track creation event not found');
    }
    let trackObjectRef = response.effects.created[0];
    let trackId = trackObjectRef.reference.objectId;

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
        objectId: trackId,
        blobId: blobId,
        mimeType: payload.metadata.mimeType,
        fileSize: payload.metadata.fileSize,
        uploadedAt: new Date(Date.now()),
        artistId: user.id,
        onChainObjectId: objectId,
        costPerStream: payload.price
      },
    });

    res.status(200).json({
      success: true,
      message: "File uploaded success",
      trackId: trackId,
    });
    return;
  } catch (error) {
    console.error("Error in handleUpload:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
