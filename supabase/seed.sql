insert into public.partner_locations (id, provider, external_id, name, coarse_area, kind, metadata) values
  ('10000000-0000-0000-0000-000000000001','admin-fallback','GG-HLEDAN','G&G Hledan','Hledan Centre area','locker','{"open":"24/7","slots":24}'),
  ('10000000-0000-0000-0000-000000000002','admin-fallback','CITY-19','City Express 19th Street','Downtown Yangon','counter','{"open":"06:00-23:00"}'),
  ('10000000-0000-0000-0000-000000000003','admin-fallback','GG-TAMWE','G&G Tamwe','Tamwe Plaza area','mini_mart','{"open":"24/7"}')
on conflict (id) do nothing;

insert into public.rewards (id, partner_name, title, points_cost, stock, metadata) values
  ('20000000-0000-0000-0000-000000000001','Yangon Repair Hub','Repair café service credit',650,50,'{"operator_fallback":true}'),
  ('20000000-0000-0000-0000-000000000002','Green Cup','Local café voucher',400,100,'{"operator_fallback":true}'),
  ('20000000-0000-0000-0000-000000000003','City Mart partner','Grocery reuse discount',900,40,'{"operator_fallback":true}'),
  ('20000000-0000-0000-0000-000000000004','Bike World','Bicycle tune-up',1200,20,'{"operator_fallback":true}')
on conflict (id) do nothing;
