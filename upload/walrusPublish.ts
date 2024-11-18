import { buffer } from "stream/consumers";
type WalrusResponse = {
  newlyCreated: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
    encodedSize: number;
    cost: number;
  };
};

const EPOCHS = 5;
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

export async function walrusPublish(
  file: Buffer,
  mimeType: string
): Promise<string[]> {
  //wait for publisher response
  let response = await fetch(`${WALRUS_PUBLISHER}/v1/store?epochs=${EPOCHS}`, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = (await response.json()) as WalrusResponse;
  //check for blobID, as thats all we care about
  if (
    !data?.newlyCreated?.blobObject?.id ||
    !data?.newlyCreated?.blobObject?.id
  ) {
    throw new Error("No blob ID or id found in response");
  }
  let objectId = data.newlyCreated.blobObject.id;
  let blobId = data.newlyCreated.blobObject.blobId;
  console.log("blob uploded:\n", data);
  return [objectId, blobId];
}
