import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/v1/cids/search?q=termo
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    // If no query is provided, return an empty array or maybe top 10
    if (!q || typeof q !== 'string') {
      res.json([]);
      return;
    }

    const searchTerm = q.trim();
    
    let cids;
    // Check if the search term looks like a code (e.g. "A09", "J01")
    const isCodeSearch = /^[A-Za-z]\d{2}/.test(searchTerm);

    if (isCodeSearch) {
      cids = await prisma.cid.findMany({
        where: {
          code: {
            startsWith: searchTerm,
            mode: 'insensitive' // Requires PG, but helps with "a09" -> "A09"
          }
        },
        take: 20,
      });
    } else {
      // It's a description search, e.g. "Dengue"
      cids = await prisma.cid.findMany({
        where: {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        take: 20,
      });
    }

    res.json(cids);
  } catch (error) {
    console.error('[cids:search]', error);
    res.status(500).json({ error: 'Erro ao buscar CIDs' });
  }
});

// GET /api/v1/cids
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cids = await prisma.cid.findMany({
      take: 50, // Just return some defaults if loaded raw
    });
    res.json(cids);
  } catch (error) {
    console.error('[cids:list]', error);
    res.status(500).json({ error: 'Erro ao listar CIDs' });
  }
});

export default router;
