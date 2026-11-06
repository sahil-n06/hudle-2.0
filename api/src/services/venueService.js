const db = require('../db/pool');
const { notFound } = require('../lib/errors');

const COLUMNS = `id, name, sport, location, description, price_per_hour AS "pricePerHour",
  image_url AS "imageUrl", is_active AS "isActive", created_at AS "createdAt"`;

async function list({ sport, location, city, q } = {}, { includeInactive = false } = {}) {
  const where = includeInactive ? ['deleted_at IS NULL'] : ['is_active', 'deleted_at IS NULL'];
  const params = [];
  const param = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  if (sport) where.push(`lower(sport) = lower(${param(sport)})`);
  if (location) where.push(`location ILIKE ${param(`%${location}%`)}`);
  if (city) where.push(`location ILIKE ${param(`%${city}%`)}`);
  if (q) {
    const p = param(`%${q}%`);
    where.push(`(name ILIKE ${p} OR sport ILIKE ${p} OR location ILIKE ${p})`);
  }
  const sql = `SELECT ${COLUMNS} FROM venues ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name`;
  return (await db.query(sql, params)).rows;
}

async function get(id, { includeInactive = false } = {}) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM venues WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rows[0] || (!includeInactive && !rows[0].isActive)) throw notFound('Venue not found');
  return rows[0];
}

/** Distinct sports and cities (last part of location) for filter dropdowns. */
async function filters() {
  const { rows } = await db.query(
    `SELECT array_agg(DISTINCT sport ORDER BY sport) AS sports,
            array_agg(DISTINCT trim(split_part(location, ',', -1)) ORDER BY trim(split_part(location, ',', -1))) AS cities
       FROM venues WHERE is_active`,
  );
  return { sports: rows[0].sports || [], cities: rows[0].cities || [] };
}

async function create(v) {
  const { rows } = await db.query(
    `INSERT INTO venues (name, sport, location, description, price_per_hour, image_url, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${COLUMNS}`,
    [v.name, v.sport, v.location, v.description, v.pricePerHour, v.imageUrl, v.isActive],
  );
  return rows[0];
}

async function update(id, v) {
  const { rows } = await db.query(
    `UPDATE venues SET name=$2, sport=$3, location=$4, description=$5, price_per_hour=$6,
       image_url=$7, is_active=$8, updated_at=now()
     WHERE id=$1 AND deleted_at IS NULL RETURNING ${COLUMNS}`,
    [id, v.name, v.sport, v.location, v.description, v.pricePerHour, v.imageUrl, v.isActive],
  );
  if (!rows[0]) throw notFound('Venue not found');
  return rows[0];
}

async function setActive(id, isActive) {
  const {
    rows: [venue],
  } = await db.query(
    'UPDATE venues SET is_active=$2, updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING is_active',
    [id, isActive],
  );
  if (!venue) throw notFound('Venue not found');
  return get(id, { includeInactive: true });
}

async function softDelete(id) {
  const { rowCount } = await db.query(
    'UPDATE venues SET deleted_at=now(), is_active=false, updated_at=now() WHERE id=$1 AND deleted_at IS NULL',
    [id],
  );
  if (!rowCount) throw notFound('Venue not found');
}

module.exports = { list, get, filters, create, update, setActive, softDelete };
