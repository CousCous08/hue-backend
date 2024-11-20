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
exports.walrusPublish = walrusPublish;
const EPOCHS = 5;
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
function walrusPublish(file, mimeType) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        //wait for publisher response
        let response = yield fetch(`${WALRUS_PUBLISHER}/v1/store?epochs=${EPOCHS}`, {
            method: "POST",
            headers: {
                "Content-Type": mimeType,
            },
            body: file,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = (yield response.json());
        //check for blobID, as thats all we care about
        if (!((_b = (_a = data === null || data === void 0 ? void 0 : data.newlyCreated) === null || _a === void 0 ? void 0 : _a.blobObject) === null || _b === void 0 ? void 0 : _b.id) ||
            !((_d = (_c = data === null || data === void 0 ? void 0 : data.newlyCreated) === null || _c === void 0 ? void 0 : _c.blobObject) === null || _d === void 0 ? void 0 : _d.id)) {
            throw new Error("No blob ID or id found in response");
        }
        let objectId = data.newlyCreated.blobObject.id;
        let blobId = data.newlyCreated.blobObject.blobId;
        console.log("blob uploded:\n", data);
        return [objectId, blobId];
    });
}
