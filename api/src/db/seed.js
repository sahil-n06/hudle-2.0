const { pool } = require('./pool');
const { migrate } = require('./migrate');

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const VENUES = [
  {
    name: 'Greenfield Football Arena',
    sport: 'Football',
    location: 'Koramangala, Bengaluru',
    price: 1500,
    description:
      '5-a-side FIFA-grade artificial turf with floodlights, changing rooms and parking.',
    image: img('photo-1529900748604-07564a03e7a6'),
  },
  {
    name: 'Smash Point Badminton Club',
    sport: 'Badminton',
    location: 'Indiranagar, Bengaluru',
    price: 500,
    description:
      'Four wooden-floor indoor courts with professional lighting. Rackets available on rent.',
    image: img('photo-1626224583764-f87db24ac4ea'),
  },
  {
    name: 'Centre Court Tennis',
    sport: 'Tennis',
    location: 'Bandra West, Mumbai',
    price: 900,
    description:
      'Two synthetic hard courts, ball machine on request, coaching available on weekends.',
    image: img('photo-1595435934249-5df7ed86e1c0'),
  },
  {
    name: 'Boundary Line Cricket Nets',
    sport: 'Cricket',
    location: 'Andheri East, Mumbai',
    price: 800,
    description: 'Turf and cemented practice nets with bowling machine. Great for team practice.',
    image: img('photo-1531415074968-036ba1b575da'),
  },
  {
    name: 'Hoops Basketball Court',
    sport: 'Basketball',
    location: 'Hauz Khas, New Delhi',
    price: 700,
    description: 'Full-size outdoor court with acrylic surface and night lights.',
    image: img('photo-1546519638-68e109498ffc'),
  },
  {
    name: 'Aqua Swim Centre',
    sport: 'Swimming',
    location: 'Gachibowli, Hyderabad',
    price: 300,
    description: 'Temperature-controlled 25m pool with lifeguards on duty. Lane booking per hour.',
    image: img('photo-1576013551627-0cc20b96c2a7'),
  },
];

const DAILY = [
  ['06:00', '07:00'],
  ['07:00', '08:00'],
  ['08:00', '09:00'],
  ['17:00', '18:00'],
  ['18:00', '19:00'],
  ['19:00', '20:00'],
  ['20:00', '21:00'],
  ['21:00', '22:00'],
];

async function seed() {
  await migrate();
  await pool.query(
    'TRUNCATE bookings, date_slots, slot_templates, venues, admin_users, customer_access_codes RESTART IDENTITY CASCADE',
  );
  for (const v of VENUES) {
    const { rows } = await pool.query(
      `INSERT INTO venues (name, sport, location, description, price_per_hour, image_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [v.name, v.sport, v.location, v.description, v.price, v.image],
    );
    for (const [start, end] of DAILY) {
      await pool.query(
        'INSERT INTO slot_templates (venue_id, start_time, end_time) VALUES ($1,$2,$3)',
        [rows[0].id, start, end],
      );
    }
  }
  // Weekend-only morning slot for the football arena.
  await pool.query(
    `INSERT INTO slot_templates (venue_id, start_time, end_time, days_of_week) VALUES (1, '10:00', '11:00', '{0,6}')`,
  );
}

if (require.main === module) {
  const { ensureAdminUser } = require('../admin/service');
  seed()
    .then(async () => {
      await ensureAdminUser();
      console.log(`Seeded ${VENUES.length} venues and ${require('../config').adminEmail}`);
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { seed };
