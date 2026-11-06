-- Sample content for "Kestrel & Vale", a fictional interior design studio.
insert into public.site_settings
  (id, company_name, tagline, email, phone, address, socials, logo_path, about, mission, vision, active_template)
values (
  1,
  'Kestrel & Vale',
  'Interiors designed around the way you actually live.',
  'hello@kestrelvale.example',
  '+63 2 8123 4567',
  '118 Alder Lane, Poblacion, Makati City, Metro Manila',
  '{"instagram": "https://instagram.com/kestrelandvale", "facebook": "https://facebook.com/kestrelandvale", "linkedin": "https://linkedin.com/company/kestrelandvale"}'::jsonb,
  'seed/logo.png',
  E'Kestrel & Vale is a small interior design studio founded in 2016 by two friends who kept being asked the same question: how do you make a home feel finished without making it feel staged?\n\nWe design homes, apartments and small workplaces from the first floor plan to the last lamp. Every project starts with how you spend an ordinary Tuesday, then we shape light, storage, materials and furniture around it.\n\nToday we are a team of nine designers, makers and project leads, working with local carpenters, upholsterers and stone workshops we have known for years.',
  'To design rooms that make everyday life easier and calmer, using honest materials, local craft and budgets we are open about from day one.',
  'A city where good design is not a luxury, and where every home, however small, is built to be lived in well for decades.',
  'meridian'
);

insert into public.carousel_slides (image_path, heading, caption, cta_label, cta_url, sort_order, is_active) values
  ('seed/slide-1.jpg', 'Rooms that feel like you', 'Full-home interiors, from floor plan to the final lamp.', 'See our work', '#about', 1, true),
  ('seed/slide-2.jpg', 'Open plans, quiet corners', 'We shape light and storage around how your day actually runs.', 'Read the journal', '/blog', 2, true),
  ('seed/slide-3.jpg', 'Made with local craft', 'Carpentry, upholstery and stone from workshops we trust.', 'Talk to us', '#contact', 3, true);

insert into public.posts (title, slug, excerpt, cover_image_path, content_json, content_html, status, published_at) values
(
  'Designing a living room that works at every hour',
  'living-room-every-hour',
  'Morning coffee, afternoon calls, a film at night. How we plan one room for three very different moods.',
  'seed/post-1.jpg',
  null,
  $html$<p>Most living rooms are designed for one moment: the photo. We design for the whole day instead, because that is how the room is actually used.</p><h2>Start with light, not furniture</h2><p>Before we choose a single sofa, we map where the sun falls at <strong>8 AM, 2 PM and 7 PM</strong>. Seating follows the morning light; the screen goes where the afternoon glare cannot reach it.</p><blockquote><p>A room that works at every hour needs at least three light sources at three different heights.</p></blockquote><h2>Our three-layer rule</h2><ul><li><p><strong>Ceiling:</strong> soft, even light for cleaning and busy evenings.</p></li><li><p><strong>Eye level:</strong> floor and table lamps for reading and conversation.</p></li><li><p><strong>Low:</strong> a warm glow near the floor for films and late nights.</p></li></ul><p><em>Small change, big difference:</em> put every lamp on a dimmer and the same room becomes three rooms.</p>$html$,
  'published',
  '2026-10-28 09:00:00+08'
),
(
  'Bringing plants into the bedroom without the clutter',
  'plants-in-the-bedroom',
  'Plants make a bedroom feel alive. Too many make it feel like a greenhouse. Here is where we draw the line.',
  'seed/post-2.jpg',
  null,
  $html$<p>Plants are the quickest way to make a bedroom feel calmer. The trick is choosing <strong>a few that earn their place</strong> instead of filling every shelf.</p><h2>Pick by light, then by size</h2><p>North-facing rooms suit pothos and snake plants. Bright rooms can take a fiddle-leaf fig, but only if it has a corner of its own.</p><h2>Keep surfaces clear</h2><p>We hang trailing plants from the ceiling or mount them on the wall, so bedside tables stay free for a lamp, a book and a glass of water.</p><blockquote><p>One large plant reads as design. Ten small ones read as a to-do list.</p></blockquote><p>Finish with a single, simple planter colour across the room and the plants will look like they were always part of the plan.</p>$html$,
  'published',
  '2026-10-14 09:00:00+08'
),
(
  'The kitchen island, rethought',
  'kitchen-island-rethought',
  'An island is not just extra counter space. Done well, it becomes the room''s meeting point.',
  'seed/post-3.jpg',
  null,
  $html$<p>Clients often ask for an island because it looks good. We ask a different question first: <em>who will stand here, and what will they be doing?</em></p><h2>Three jobs, one island</h2><ol><li><p>A prep zone with a deep drawer for knives and boards.</p></li><li><p>A seating edge with at least 30 cm of knee space.</p></li><li><p>A landing spot for bags, mail and keys, so the rest of the kitchen stays clear.</p></li></ol><h2>Leave room to move</h2><p>We keep <strong>at least 100 cm</strong> between the island and the counters on every side. Less than that and the island becomes something to squeeze past.</p><p>Get those three things right and the island stops being furniture and starts being where the family actually gathers.</p>$html$,
  'published',
  '2026-09-30 09:00:00+08'
),
(
  'Stairs as sculpture',
  'stairs-as-sculpture',
  'Draft: why we treat a staircase as the main design piece in a two-storey home.',
  'seed/post-4.jpg',
  null,
  $html$<p>A staircase is the one element every visitor walks past. This draft covers how we choose treads, railings and lighting so it becomes the centrepiece of the home.</p>$html$,
  'draft',
  null
);
