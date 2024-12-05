import { Request, Response, RequestHandler } from "express";
import { AGGREGATOR_ENDPOINT } from "../constants";


// Express backend handler
export const handleStream: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { trackId, blobId } = req.query;
      
      const response = await fetch(`${AGGREGATOR_ENDPOINT}/v1/${blobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audio data');
      }
      // Get the binary data
      const arrayBuffer = await response.arrayBuffer();
      
      // Set headers
      res.setHeader('Content-Type', 'audio/mpeg');  // or whatever your audio type is
      res.setHeader('Content-Length', arrayBuffer.byteLength);
      
      // Send the binary data
      res.send(Buffer.from(arrayBuffer));
  
    } catch (error) {
      console.error('Streaming error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to stream track' 
      });
    }
  };