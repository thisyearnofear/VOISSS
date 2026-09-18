const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../services/db-service');
const {
  asyncHandler,
  NotFoundError,
  ConflictError,
  logger,
  validateBody,
  validateParams,
  bindWalletIdentity,
  schemas,
} = require('../middleware');

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

router.get('/user/:address',
  validateParams(schemas.userAddress),
  asyncHandler(async (req, res) => {
    const address = req.params.address.toLowerCase();

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
  })
);

router.get('/:id',
  validateParams(schemas.missionId),
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

router.post('/create', bindWalletIdentity, validateBody(schemas.missionCreate), asyncHandler(async (req, res) => {
  const { title, description, reward, expiresAt } = req.body;

  // Identity binding: createdBy is derived from the authenticated wallet, not
  // trusted from the body. This replaces the old ...rest spread that let any
  // arbitrary key flow into the stored blob.
  const creator = (req.user?.address || '').toLowerCase();

  const id = `mission_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;

  const mission = {
    id,
    title,
    description: description || null,
    reward: reward || 0,
    expiresAt: expiresAt || null,
    createdBy: creator || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentParticipants: 0,
    submissions: []
  };

  await db.query(
    `INSERT INTO missions (id, data) VALUES ($1, $2)`,
    [id, JSON.stringify(mission)]
  );

  logger.info({ missionId: id, createdBy: creator }, 'Mission created');
  res.status(201).json({ success: true, mission });
}));

router.post('/accept', bindWalletIdentity, validateBody(schemas.missionAccept), asyncHandler(async (req, res) => {
  const { missionId, userId } = req.body;

  // Mission must exist before accepting
  const mission = await db.query(`SELECT id FROM missions WHERE id = $1`, [missionId]);
  if (mission.rows.length === 0) {
    throw new NotFoundError('Mission not found');
  }

  const existing = await db.query(
    `SELECT id FROM user_missions WHERE data->>'missionId' = $1 AND data->>'userId' = $2`,
    [missionId, userId]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('Mission already accepted');
  }

  const id = `um_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
  const acceptance = {
    id,
    missionId,
    userId,
    acceptedAt: new Date().toISOString(),
    status: 'active'
  };

  // Insert + participant increment in one transaction
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO user_missions (id, data) VALUES ($1, $2)`,
      [id, JSON.stringify(acceptance)]
    );
    await client.query(
      `UPDATE missions SET data = jsonb_set(data, '{currentParticipants}',
       ((data->>'currentParticipants')::int + 1)::text::jsonb)
       WHERE id = $1`,
      [missionId]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  logger.info({ missionId, userId }, 'Mission accepted');
  res.status(201).json({ success: true, data: acceptance });
}));

router.post('/submit', bindWalletIdentity, validateBody(schemas.missionSubmit), asyncHandler(async (req, res) => {
  const { missionId, userId, status, ...responseData } = req.body;

  const mission = await db.query(`SELECT id FROM missions WHERE id = $1`, [missionId]);
  if (mission.rows.length === 0) {
    throw new NotFoundError('Mission not found');
  }

  const id = `res_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;

  // Only persist known submission fields; arbitrary keys are dropped (was: ...rest spread)
  const submission = {
    id,
    missionId,
    userId,
    recordingId: responseData.recordingId || null,
    recordingIpfsHash: responseData.recordingIpfsHash || null,
    location: responseData.location || null,
    context: responseData.context || null,
    submittedAt: new Date().toISOString(),
    status: status || 'approved'
  };

  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO mission_responses (id, data) VALUES ($1, $2)`,
      [id, JSON.stringify(submission)]
    );
    await client.query(
      `UPDATE missions SET data = jsonb_set(data, '{submissions}',
       (data->'submissions')::jsonb || $2::jsonb)
       WHERE id = $1`,
      [missionId, JSON.stringify([id])]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  logger.info({ submissionId: id, missionId, userId }, 'Mission submitted');
  res.status(201).json({ success: true, submission });
}));

module.exports = router;
