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
exports.handleStream = void 0;
const constants_1 = require("../constants");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Express backend handler
const handleStream = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { trackId } = req.query;
        console.log("STREAMING TRACK: ", trackId);
        const id = trackId;
        const track = yield prisma.track.findUnique({
            where: { objectId: id }
        });
        let blobId = track === null || track === void 0 ? void 0 : track.blobId;
        console.log("blobId: ", blobId);
        const response = yield fetch(`${constants_1.AGGREGATOR_ENDPOINT}/v1/${blobId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch audio data');
        }
        // Get the binary data
        const arrayBuffer = yield response.arrayBuffer();
        // Set headers
        res.setHeader('Content-Type', 'audio/mpeg'); // or whatever your audio type is
        res.setHeader('Content-Length', arrayBuffer.byteLength);
        // Send the binary data
        res.send(Buffer.from(arrayBuffer));
    }
    catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stream track'
        });
    }
});
exports.handleStream = handleStream;
