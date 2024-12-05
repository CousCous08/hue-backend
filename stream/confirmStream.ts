import { Transaction } from "@mysten/sui/transactions";
import { PrismaClient } from "@prisma/client";
import { Request, Response, RequestHandler } from "express";
import { HUE_PACKAGE_ID, ADMIN, client } from "../constants";

const prisma = new PrismaClient();

export const handleConfirmStream: RequestHandler = async (
 req: Request,
 res: Response
):Promise<void> => {
 try {
   const { trackId } = req.body;
   console.log("CONFIRM-STREAM REQUEST FOR TRACK: ", trackId);

   if (!trackId) {
     res.status(400).json({
       success: false,
       error: 'trackId is required'
     });
     return;
   }

   console.log("Confirming stream for trackId:", trackId);

   //----SUI MOVE CALL -----
   /**
    * arg0: &mut Track, 
    * arg1: 0x2::coin::Coin<0x2::sui::SUI>
    */
   const tx = new Transaction();
   let payment = tx.splitCoins(tx.gas, [10_000_000]);
    tx.moveCall({
      package: HUE_PACKAGE_ID,
      module: "track",
      function: "stream_track",
      arguments: [
        tx.object(trackId),
        payment,
      ],
    });
    tx.setSender(ADMIN.toSuiAddress());
    const bytes = await tx.build({client: client});
    const serializedSignature = (await ADMIN.signTransaction(bytes)).signature;
    let txResponse = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });
    
    if(!txResponse.digest) {
        res.status(500).json({
            success: false,
            error: 'Failed to confirm stream on blockchain'
          });
    }

   res.status(200).json({
     success: true,
     message: txResponse.digest
   });

 } catch (error) {
   console.error("Stream confirmation error:", error);
   res.status(500).json({
     success: false,
     error: 'Failed to confirm stream on blockchain'
   });
 }
};