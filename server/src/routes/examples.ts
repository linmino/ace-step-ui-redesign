/**
 * Serves official ACE-Step prompt/parameter examples from the local
 * ACE-Step-1.5/examples folder. Read-only, no auth required.
 *
 *   GET /api/examples                   -> list of all examples with metadata
 *   GET /api/examples/random?category=  -> one random example (cheap: readdir + read 1 file)
 *   GET /api/examples/:cat/:id          -> full JSON of one example
 *
 * Whitelisted categories prevent path traversal; ids are validated as
 * alphanumeric+underscore+dash before joining into the filesystem path.
 */
import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

const router = Router();
const ALLOWED_CATEGORIES = ['simple_mode', 'text2music'] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];
const isAllowedCategory = (s: string): s is Category =>
    (ALLOWED_CATEGORIES as readonly string[]).includes(s);
const ID_PATTERN = /^[a-z0-9_\-]+$/i;

interface ExampleSummary {
    id: string;
    category: Category;
    mode: 'simple' | 'custom';
    label: string;
    blurb: string;
    language?: string;
    bpm?: number;
    duration?: number;
    instrumental?: boolean;
}

const truncate = (s: string, n: number): string =>
    s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

function buildSummary(category: Category, id: string, data: Record<string, unknown>): ExampleSummary {
    const mode: 'simple' | 'custom' = category === 'simple_mode' ? 'simple' : 'custom';
    const captionRaw =
        (data.caption as string | undefined) ||
        (data.description as string | undefined) ||
        (data.style as string | undefined) ||
        '';
    const blurb = truncate(captionRaw.replace(/\s+/g, ' '), 110);
    const num = (k: string) => (typeof data[k] === 'number' ? (data[k] as number) : undefined);
    const str = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : undefined);
    return {
        id,
        category,
        mode,
        label: `${category} · ${id}`,
        blurb,
        language: str('language') || str('vocal_language'),
        bpm: num('bpm'),
        duration: num('duration'),
        instrumental: typeof data.instrumental === 'boolean' ? data.instrumental : undefined,
    };
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const root = config.examples.dir;
        const examples: ExampleSummary[] = [];
        for (const cat of ALLOWED_CATEGORIES) {
            const dir = path.join(root, cat);
            let files: string[];
            try {
                files = await fs.readdir(dir);
            } catch {
                continue;
            }
            files.sort();
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const id = file.slice(0, -5);
                if (!ID_PATTERN.test(id)) continue;
                try {
                    const raw = await fs.readFile(path.join(dir, file), 'utf-8');
                    const data = JSON.parse(raw) as Record<string, unknown>;
                    examples.push(buildSummary(cat, id, data));
                } catch {
                    // skip malformed
                }
            }
        }
        // Cache: list rarely changes during a session.
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json({ examples, count: examples.length });
    } catch (err) {
        console.error('Failed to list examples:', err);
        res.status(500).json({ error: 'Failed to list examples' });
    }
});

// Random pick — must be declared BEFORE '/:category/:id' or Express will
// route '/random' as { category: 'random' } and the category guard rejects it.
router.get('/random', async (req: Request, res: Response): Promise<void> => {
    const category = req.query.category;
    if (typeof category !== 'string' || !isAllowedCategory(category)) {
        res.status(400).json({ error: 'Invalid or missing category' });
        return;
    }
    try {
        const dir = path.join(config.examples.dir, category);
        let files: string[];
        try {
            files = await fs.readdir(dir);
        } catch {
            res.status(404).json({ error: `Examples directory missing: ${category}` });
            return;
        }
        const ids = files
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.slice(0, -5))
            .filter((id) => ID_PATTERN.test(id));
        if (ids.length === 0) {
            res.status(404).json({ error: `No examples in ${category}` });
            return;
        }
        const id = ids[Math.floor(Math.random() * ids.length)];
        const raw = await fs.readFile(path.join(dir, `${id}.json`), 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        // Random pick is by definition not cacheable.
        res.setHeader('Cache-Control', 'no-store');
        res.json({ category, id, data });
    } catch (err) {
        console.error('Failed to pick random example:', err);
        res.status(500).json({ error: 'Failed to pick random example' });
    }
});

router.get('/:category/:id', async (req: Request, res: Response): Promise<void> => {
    const { category, id } = req.params;
    if (!isAllowedCategory(category)) {
        res.status(404).json({ error: 'Unknown category' });
        return;
    }
    if (!ID_PATTERN.test(id)) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    try {
        const filepath = path.join(config.examples.dir, category, `${id}.json`);
        const raw = await fs.readFile(filepath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.json({ category, id, data });
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            res.status(404).json({ error: 'Example not found' });
        } else {
            console.error('Failed to read example:', err);
            res.status(500).json({ error: 'Failed to read example' });
        }
    }
});

export default router;
