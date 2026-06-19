require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const Response  = require('./server/model');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ── MongoDB ────────────────────────────────────────────────── */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => { console.error('❌  MongoDB connection error:', err.message); process.exit(1); });

/* ══════════════════════════════════════════════════════════════
   SURVEY ROUTES
══════════════════════════════════════════════════════════════ */

/* POST /api/submit  — save a new response */
app.post('/api/submit', async (req, res) => {
  try {
    const doc = new Response(req.body);
    await doc.save();
    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ ok: false, error: 'Failed to save response' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ADMIN ROUTES
══════════════════════════════════════════════════════════════ */

/* GET /api/admin/responses  — paginated list for individual browser */
app.get('/api/admin/responses', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Response.find().sort({ submitted_at: -1 }).skip(skip).limit(limit).lean(),
      Response.countDocuments(),
    ]);

    res.json({ ok: true, total, page, pages: Math.ceil(total / limit), data: docs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET /api/admin/aggregate  — chart data across all responses */
app.get('/api/admin/aggregate', async (req, res) => {
  try {
    const total = await Response.countDocuments();
    if (total === 0) return res.json({ ok: true, total: 0 });

    const all = await Response.find().lean();

    /* Helper: count values in an array field */
    function countField(field) {
      const map = {};
      all.forEach(doc => {
        const val = doc[field];
        if (!val) return;
        if (Array.isArray(val)) val.forEach(v => { map[v] = (map[v] || 0) + 1; });
        else map[val] = (map[val] || 0) + 1;
      });
      return Object.entries(map)
        .sort((a,b) => b[1]-a[1])
        .map(([label, count]) => ({ label, count, pct: Math.round(count / total * 100) }));
    }

    /* Rating averages */
    const ratingOrder  = ['SA','A','N','D','SD'];
    const ratingScores = { SA: 5, A: 4, N: 3, D: 2, SD: 1 };
    const ratingAgg    = {};
    all.forEach(doc => {
      (doc.ratings || []).forEach(r => {
        if (!ratingAgg[r.stmt]) ratingAgg[r.stmt] = { sum: 0, count: 0, buckets: { SA:0,A:0,N:0,D:0,SD:0 } };
        if (r.key && ratingScores[r.key] !== undefined) {
          ratingAgg[r.stmt].sum   += ratingScores[r.key];
          ratingAgg[r.stmt].count += 1;
          ratingAgg[r.stmt].buckets[r.key] += 1;
        }
      });
    });
    const ratings = Object.entries(ratingAgg).map(([stmt, v]) => ({
      stmt,
      avg: v.count ? +(v.sum / v.count).toFixed(2) : 0,
      buckets: v.buckets,
    })).sort((a,b) => b.avg - a.avg);

    /* Feature ranking averages */
    const rankMap = {};
    all.forEach(doc => {
      (doc.ranking || []).forEach((item, i) => {
        if (!rankMap[item]) rankMap[item] = { sum: 0, count: 0 };
        rankMap[item].sum   += (i + 1);
        rankMap[item].count += 1;
      });
    });
    const ranking = Object.entries(rankMap)
      .map(([item, v]) => ({ item, avgRank: v.count ? +(v.sum / v.count).toFixed(2) : 99 }))
      .sort((a,b) => a.avgRank - b.avgRank);

    /* Department breakdown */
    const deptMap = {};
    all.forEach(doc => {
      const d = doc.dept || 'Not specified';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const departments = Object.entries(deptMap)
      .sort((a,b) => b[1]-a[1])
      .map(([label,count]) => ({ label, count, pct: Math.round(count/total*100) }));

    /* Location breakdown */
    const locMap = {};
    all.forEach(doc => {
      const l = doc.location || 'Not specified';
      locMap[l] = (locMap[l] || 0) + 1;
    });
    const locations = Object.entries(locMap)
      .sort((a,b) => b[1]-a[1])
      .map(([label,count]) => ({ label, count, pct: Math.round(count/total*100) }));

    /* Responses over time (by day) */
    const timeMap = {};
    all.forEach(doc => {
      const day = new Date(doc.submitted_at).toISOString().slice(0,10);
      timeMap[day] = (timeMap[day] || 0) + 1;
    });
    const timeline = Object.entries(timeMap)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date,count]) => ({ date, count }));

    res.json({
      ok: true, total,
      q1:  countField('q1'),
      q2:  countField('q2'),
      q4:  countField('q4'),
      q7:  countField('q7'),
      q10: countField('q10'),
      q12: countField('q12'),
      ratings, ranking, departments, locations, timeline,
    });
  } catch (err) {
    console.error('Aggregate error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET /api/admin/responses/:id  — single response detail */
app.get('/api/admin/responses/:id', async (req, res) => {
  try {
    const doc = await Response.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE /api/admin/responses/:id */
app.delete('/api/admin/responses/:id', async (req, res) => {
  try {
    await Response.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── Serve admin SPA for any /admin* route ──────────────────── */
app.get(['/admin', '/admin/*path'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

/* ── Serve survey at root ───────────────────────────────────── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀  Server running at http://localhost:${PORT}`);
  console.log(`    Survey  → http://localhost:${PORT}/`);
  console.log(`    Admin   → http://localhost:${PORT}/admin`);
});
