insert into public.puppies (nome,  cor,     preco,  created_at, name,  color,   price_cents, gender)
values
  ('Lulu 01','laranja', 8900.00, now(), 'Lulu 01','orange', 890000, 'female'),
  ('Lulu 02','preto',   9500.00, now(), 'Lulu 02','black',  950000, 'male');

insert into public.leads
  (first_name, last_name, phone,  source, utm_source, utm_campaign, created_at,          first_responded_at)
values
  ('Maria', 'Silva',  '+55 11 99999-0001','site','meta',  'camp1',  now() - interval '1 hour',  now() - interval '55 minutes'),
  ('Joao',  'Souza',  '+55 11 99999-0002','site','google','camp2',  now() - interval '3 hours', null),
  ('Ana',   'Pereira','+55 21 99999-0003','whatsapp','direct',null, now() - interval '1 day',   null),
  ('Leo',   'Costa',  '+55 31 99999-0004','site','meta',  'camp1',  now() - interval '2 days',  null),
  ('Bruna', 'Lima',   '+55 41 99999-0005','site','tt',    'camp3',  now(),                       null);

insert into public.contracts
  (puppy_id, customer_id, lead_id, signed_at, total_price_cents)
values
  (
    (select id from public.puppies order by created_at desc limit 1),
    null,
    (select id from public.leads   order by created_at desc limit 1),
    now(), 890000
  );
