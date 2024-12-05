import { PrismaClient } from "@prisma/client";
import { Request, Response, RequestHandler } from "express";

const prisma = new PrismaClient();

export const handleLookup: RequestHandler = async (
  req: Request,
  res: Response
):Promise<void> => {
try {
  console.log("LOOKUP REQUEST");
    const tracks = await prisma.track.findMany({
      include: {
        artist: true
      }
    });
    
    res.status(200).json({ success: true, tracks });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tracks' 
    });
    }
}