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
exports.handleConfirmStream = void 0;
const transactions_1 = require("@mysten/sui/transactions");
const client_1 = require("@prisma/client");
const constants_1 = require("../constants");
const prisma = new client_1.PrismaClient();
const handleConfirmStream = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.body.trackId;
        const trackId = id;
        console.log("CONFIRM-STREAM REQUEST FOR TRACK: ", trackId);
        const track = yield prisma.track.findUnique({
            where: { objectId: trackId }
        });
        if (!trackId || !track) {
            res.status(400).json({
                success: false,
                error: 'trackId is required'
            });
            return;
        }
        console.log("Confirming stream for trackId:", trackId);
        const price = track.costPerStream;
        //----SUI MOVE CALL -----
        /**
         * arg0: &mut Track,
         * arg1: 0x2::coin::Coin<0x2::sui::SUI>
         */
        const tx = new transactions_1.Transaction();
        console.log("Price: ", price, " SUI");
        let payment = tx.splitCoins(tx.gas, [price * 1000000000]);
        tx.moveCall({
            package: constants_1.HUE_PACKAGE_ID,
            module: "track",
            function: "stream_track",
            arguments: [
                tx.object(trackId),
                payment,
            ],
        });
        tx.setSender(constants_1.ADMIN.toSuiAddress());
        const bytes = yield tx.build({ client: constants_1.client });
        const serializedSignature = (yield constants_1.ADMIN.signTransaction(bytes)).signature;
        let txResponse = yield constants_1.client.executeTransactionBlock({
            transactionBlock: bytes,
            signature: serializedSignature,
        });
        if (!txResponse.digest) {
            res.status(500).json({
                success: false,
                error: 'Failed to confirm stream on blockchain'
            });
        }
        res.status(200).json({
            success: true,
            message: txResponse.digest
        });
    }
    catch (error) {
        console.error("Stream confirmation error:", error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm stream on blockchain'
        });
    }
});
exports.handleConfirmStream = handleConfirmStream;
