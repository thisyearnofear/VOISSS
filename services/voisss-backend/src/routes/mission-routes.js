const express = require('express');
const router = express.Router();
const db = require('../services/db-service');

/**
 * Utility to revive dates from JSONB storage
 */
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

/**
 * GET /api/missions
 * Fetch all active missions
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT data FROM missions WHERE (data->>'isActive')::boolean = true ORDER BY created_at DESC`
    );
    const missions = result.rows.map(row => reviveDates(row.data));
    res.json(missions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

/**
 * GET /api/missions/:id
 * Fetch a single mission
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT data FROM missions WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(reviveDates(result.rows[0].data));
  } catch (error) {
    console.error('Error fetching mission:', error);
    res.status(500).json({ error: 'Failed to fetch mission details' });
  }
});

/**
 * POST /api/missions/create
 * Create a new mission
 */
router.post('/create', async (req, res) => {
  try {
    const missionData = req.body;
    const id = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const mission = {
      ...missionData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentParticipants: 0,
      submissions: []
    };

    await db.query(
      `INSERT INTO missions (id, data) VALUES ($1, $2)`,
      [id, JSON.stringify(mission)]
    );

    res.status(201).json({ success: true, mission });
  } catch (error) {
    console.error('Error creating mission:', error);
    res.status(500).json({ error: 'Failed to create mission' });
  }
});

/**
 * POST /api/missions/accept
 * User accepts a mission
 */
router.post('/accept', async (req, res) => {
  try {
    const { missionId, userId } = req.body;

    if (!missionId || !userId) {
      return res.status(400).json({ error: 'Mission ID and User ID are required' });
    }

    // Check if already accepted
    const existing = await db.query(
      `SELECT id FROM user_missions WHERE data->>'missionId' = $1 AND data->>'userId' = $2`,
      [missionId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Mission already accepted' });
    }

    const id = `um_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

    // Update participant count in mission
    await db.query(
      `UPDATE missions SET data = jsonb_set(data, '{currentParticipants}',
       ((data->>'currentParticipants')::int + 1)::text::jsonb)
       WHERE id = $1`,
      [missionId]
    );

    res.status(201).json({ success: true, data: acceptance });
  } catch (error) {
    console.error('Error accepting mission:', error);
    res.status(500).json({ error: 'Failed to accept mission' });
  }
});

/**
 * POST /api/missions/submit
 * User submits a response
 */
router.post('/submit', async (req, res) => {
  try {
    const responseData = req.body;
    const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const submission = {
      ...responseData,
      id,
      submittedAt: new Date().toISOString(),
      status: responseData.status || 'approved'
    };

    await db.query(
      `INSERT INTO mission_responses (id, data) VALUES ($1, $2)`,
      [id, JSON.stringify(submission)]
    );

    // Add submission ID to mission's submission list
    await db.query(
      `UPDATE missions SET data = jsonb_set(data, '{submissions}',
       (data->'submissions')::jsonb || $2::jsonb)
       WHERE id = $1`,
      [responseData.missionId, JSON.stringify([id])]
    );

    res.status(201).json({ success: true, submission });
  } catch (error) {
    console.error('Error submitting mission response:', error);
    res.status(500).json({ error: 'Failed to submit mission response' });
  }
});

/**
 * GET /api/missions/user/:address
 * Get missions for a specific user
 */
router.get('/user/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();

    // Get accepted missions
    const acceptedResult = await db.query(
      `SELECT m.data FROM missions m
       JOIN user_missions um ON m.id = um.data->>'missionId'
       WHERE um.data->>'userId' = $1`,
      [address]
    );

    // Get completed responses
    const responsesResult = await db.query(
      `SELECT data FROM mission_responses WHERE data->>'userId' = $1`,
      [address]
    );

    res.json({
      active: acceptedResult.rows.map(row => reviveDates(row.data)),
      completed: responsesResult.rows.map(row => reviveDates(row.data))
    });
  } catch (error) {
    console.error('Error fetching user missions:', error);
    res.status(500).json({ error: 'Failed to fetch user missions' });
  }
});

module.exports = router;
