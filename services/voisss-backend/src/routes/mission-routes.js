const express = require('express');
const router = express.Router();
const db = require('../services/db-service');
const { asyncHandler, NotFoundError, logger } = require('../middleware');
const { validateBody, validateParams, schemas } = require('../middleware/validate');

function reviveDates(obj) {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj[key])) {
        obj[key] = new Date(obj[key]);
      } else if (typeof obj[key] === 'object') {
        obj[key] = reviveDates(obj[key]);
      }
    }
  }
  return obj;
}

router.get('/', asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT data FROM missions WHERE (data->>'isActive')::boolean = true ORDER BY created_at DESC`
  );
  const missions = result.rows.map(row => reviveDates(row.data));
  res.json(missions);
}));

router.get('/:id',
  validateParams(z => z.object({ id: z.string().min(1).max(100) })),
  asyncHandler(async (req, res) => {
    const result = await db.query(
      `SELECT data FROM missions WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Mission not found');
    }

    res.json(reviveDates(result.rows[0].data));
  })
);

router.post('/create', asyncHandler(async (req, res) => {
  const { title, description, reward, expiresAt, ...rest } = req.body;

  if (!title) {
    return res.status(400).json({
      error: 'Title is required',
      code: 'MISSING_TITLE'
    });
  }

  const id = `mission_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;

  const mission = {
    id,
    title,
    description: description || null,
    reward: reward || 0,
    expiresAt: expiresAt || null,
    ...rest,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentParticipants: 0,
    submissions: []
  };

  await db.query(
    `INSERT INTO missions (id, data) VALUES ($1, $2)`,
    [id, JSON.stringify(mission)]
  );

  logger.info({ missionId: id }, 'Mission created');
  res.status(201).json({ success: true, mission });
}));

router.post('/accept', asyncHandler(async (req, res) => {
  const { missionId, userId } = req.body;

  if (!missionId || !userId) {
    return res.status(400).json({
      error: 'Mission ID and User ID are required',
      code: 'MISSING_FIELDS'
    });
  }

  const existing = await db.query(
    `SELECT id FROM user_missions WHERE data->>'missionId' = $1 AND data->>'userId' = $2`,
    [missionId, userId]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: 'Mission already accepted',
      code: 'ALREADY_ACCEPTED'
    });
  }

  const id = `um_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
  const acceptance = {
    id,
    missionId,
    userId,
    acceptedAt: new Date().toISOString(),
    status: 'active'
  };

  await db.query(
    `INSERT INTO user_missions (id, data) VALUES ($1, $2)`,
    [id, JSON.stringify(acceptance)]
  );

  await db.query(
    `UPDATE missions SET data = jsonb_set(data, '{currentParticipants}',
     ((data->>'currentParticipants')::int + 1)::text::jsonb)
     WHERE id = $1`,
    [missionId]
  );

  logger.info({ missionId, userId }, 'Mission accepted');
  res.status(201).json({ success: true, data: acceptance });
}));

router.post('/submit', asyncHandler(async (req, res) => {
  const { missionId, userId, ...responseData } = req.body;

  if (!missionId || !userId) {
    return res.status(400).json({
      error: 'Mission ID and User ID are required',
      code: 'MISSING_FIELDS'
    });
  }

  const id = `res_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;

  const submission = {
    id,
    missionId,
    userId,
    ...responseData,
    submittedAt: new Date().toISOString(),
    status: responseData.status || 'approved'
  };

  await db.query(
    `INSERT INTO mission_responses (id, data) VALUES ($1, $2)`,
    [id, JSON.stringify(submission)]
  );

  await db.query(
    `UPDATE missions SET data = jsonb_set(data, '{submissions}',
     (data->'submissions')::jsonb || $2::jsonb)
     WHERE id = $1`,
    [missionId, JSON.stringify([id])]
  );

  logger.info({ submissionId: id, missionId, userId }, 'Mission submitted');
  res.status(201).json({ success: true, submission });
}));

router.get('/user/:address', asyncHandler(async (req, res) => {
  const address = req.params.address.toLowerCase();

  if (!schemas.ethereumAddress.safeParse(address).success) {
    return res.status(400).json({
      error: 'Invalid address format',
      code: 'INVALID_ADDRESS'
    });
  }

  const acceptedResult = await db.query(
    `SELECT m.data FROM missions m
     JOIN user_missions um ON m.id = um.data->>'missionId'
     WHERE um.data->>'userId' = $1`,
    [address]
  );

  const responsesResult = await db.query(
    `SELECT data FROM mission_responses WHERE data->>'userId' = $1`,
    [address]
  );

  res.json({
    active: acceptedResult.rows.map(row => reviveDates(row.data)),
    completed: responsesResult.rows.map(row => reviveDates(row.data))
  });
}));

module.exports = router;
